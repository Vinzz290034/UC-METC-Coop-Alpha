import { getApiBaseUrl } from '../utils/apiBaseUrl';

export interface MaintenanceState {
  enabled: boolean;
  message: string;
  eta: string;
  updatedAt: string;
}

const STORAGE_KEY = 'silms_maintenance_state';

const DEFAULT_STATE: MaintenanceState = {
  enabled: false,
  message: 'The UC-METC SILMS portal is currently undergoing scheduled maintenance to upgrade our system services. We apologize for any inconvenience.',
  eta: '2 hours',
  // Use a very old timestamp so the race-condition guard never blocks fresh backend syncs
  updatedAt: '1970-01-01T00:00:00.000Z'
};

const getStatusUrl = () => `${getApiBaseUrl()}/public/system-status`;

export const getMaintenanceState = (): MaintenanceState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_STATE;
    const parsed = JSON.parse(saved);
    let msg = parsed.message || DEFAULT_STATE.message;
    if (msg.includes('UC-METC Cooperative portal')) {
      msg = msg.replace('UC-METC Cooperative portal', 'UC-METC SILMS portal');
    }
    return {
      enabled: Boolean(parsed.enabled),
      message: msg,
      eta: parsed.eta || '',
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (err) {
    console.error('Failed to parse maintenance state from localStorage', err);
    return DEFAULT_STATE;
  }
};

export const syncMaintenanceStateFromBackend = async (): Promise<MaintenanceState> => {
  try {
    // Only apply race-condition guard if there is an actual saved localStorage state
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const local = getMaintenanceState();
      const localTime = new Date(local.updatedAt).getTime();
      // If a local admin toggle occurred in the last 3 seconds, protect optimistic state
      if (Date.now() - localTime < 3000) {
        return local;
      }
    }
    const local = getMaintenanceState();

    // Use raw fetch (no auth headers) since this is a public endpoint
    const res = await fetch(getStatusUrl(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && typeof data.enabled === 'boolean') {
      const newState: MaintenanceState = {
        enabled: Boolean(data.enabled),
        message: data.message || DEFAULT_STATE.message,
        eta: data.eta !== undefined ? data.eta : DEFAULT_STATE.eta,
        updatedAt: data.updatedAt || new Date().toISOString()
      };

      // Update local storage and dispatch event if state changed
      if (local.enabled !== newState.enabled || local.message !== newState.message || local.eta !== newState.eta) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('silms_maintenance_updated', { detail: newState }));
      }
      return newState;
    }
  } catch (err) {
    console.warn('[maintenanceManager] Failed to sync maintenance state from backend:', err);
  }
  return getMaintenanceState();
};

export const setMaintenanceState = (
  enabled: boolean,
  message?: string,
  eta?: string
): MaintenanceState => {
  const currentState = getMaintenanceState();
  const newState: MaintenanceState = {
    enabled,
    message: message !== undefined ? message : currentState.message,
    eta: eta !== undefined ? eta : currentState.eta,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    window.dispatchEvent(new CustomEvent('silms_maintenance_updated', { detail: newState }));
  } catch (err) {
    console.error('Failed to save maintenance state to localStorage', err);
  }

  // Push update to backend using raw fetch (no auth headers) — public endpoint
  fetch(getStatusUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newState)
  }).catch((err) => {
    console.warn('[maintenanceManager] Failed to push maintenance state to backend:', err);
  });

  return newState;
};
