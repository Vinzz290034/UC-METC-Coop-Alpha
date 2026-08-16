import { apiClient } from '../services/api';

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
  updatedAt: new Date().toISOString()
};

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
    const local = getMaintenanceState();
    const localTime = new Date(local.updatedAt).getTime();
    // If local toggle occurred in the last 3 seconds, protect optimistic state from race condition
    if (Date.now() - localTime < 3000) {
      return local;
    }

    const res = await apiClient.get('/public/system-status');
    if (res && typeof res.enabled === 'boolean') {
      const newState: MaintenanceState = {
        enabled: Boolean(res.enabled),
        message: res.message || DEFAULT_STATE.message,
        eta: res.eta !== undefined ? res.eta : DEFAULT_STATE.eta,
        updatedAt: res.updatedAt || new Date().toISOString()
      };
      
      // Only update local storage and dispatch event if state changed
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

  // Push update to backend asynchronously for global sync across all devices
  apiClient.post('/public/system-status', newState).catch((err) => {
    console.warn('[maintenanceManager] Failed to push maintenance state to backend:', err);
  });

  return newState;
};
