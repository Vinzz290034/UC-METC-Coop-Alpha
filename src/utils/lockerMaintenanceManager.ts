import { getApiBaseUrl } from './apiBaseUrl';

export interface LockerMaintenanceState {
  enabled: boolean;
  title: string;
  message: string;
  eta: string;
  updatedAt: string;
}

const STORAGE_KEY = 'silms_locker_maintenance_state';

const DEFAULT_LOCKER_MAINTENANCE_STATE: LockerMaintenanceState = {
  enabled: false,
  title: 'Locker Rentals Temporarily Unavailable',
  message: 'The Locker Management team is currently finalizing locker allocations, maintenance inspections, and inventory audits. Locker applications and reservations are temporarily unavailable as of now. Please check back soon or visit the UC-METC Coop Office.',
  eta: 'Finalizing Lockers',
  updatedAt: '1970-01-01T00:00:00.000Z'
};

const getLockerStatusUrl = () => `${getApiBaseUrl()}/public/locker-status`;

export const getLockerMaintenanceState = (): LockerMaintenanceState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_LOCKER_MAINTENANCE_STATE;
    const parsed = JSON.parse(saved);
    return {
      enabled: Boolean(parsed.enabled),
      title: parsed.title || DEFAULT_LOCKER_MAINTENANCE_STATE.title,
      message: parsed.message || DEFAULT_LOCKER_MAINTENANCE_STATE.message,
      eta: parsed.eta || DEFAULT_LOCKER_MAINTENANCE_STATE.eta,
      updatedAt: parsed.updatedAt || new Date().toISOString()
    };
  } catch (err) {
    console.error('Failed to parse locker maintenance state from localStorage', err);
    return DEFAULT_LOCKER_MAINTENANCE_STATE;
  }
};

export const syncLockerMaintenanceStateFromBackend = async (): Promise<LockerMaintenanceState> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const local = getLockerMaintenanceState();
      const localTime = new Date(local.updatedAt).getTime();
      // If a local admin toggle occurred in the last 3 seconds, protect optimistic state
      if (Date.now() - localTime < 3000) {
        return local;
      }
    }
    const local = getLockerMaintenanceState();

    const res = await fetch(getLockerStatusUrl(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data && typeof data.enabled === 'boolean') {
      const newState: LockerMaintenanceState = {
        enabled: Boolean(data.enabled),
        title: data.title || DEFAULT_LOCKER_MAINTENANCE_STATE.title,
        message: data.message || DEFAULT_LOCKER_MAINTENANCE_STATE.message,
        eta: data.eta !== undefined ? data.eta : DEFAULT_LOCKER_MAINTENANCE_STATE.eta,
        updatedAt: data.updatedAt || new Date().toISOString()
      };

      if (
        local.enabled !== newState.enabled ||
        local.title !== newState.title ||
        local.message !== newState.message ||
        local.eta !== newState.eta
      ) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
        window.dispatchEvent(new CustomEvent('silms_locker_maintenance_updated', { detail: newState }));
      }
      return newState;
    }
  } catch (err) {
    console.warn('[lockerMaintenanceManager] Failed to sync locker maintenance state from backend:', err);
  }
  return getLockerMaintenanceState();
};

export const setLockerMaintenanceState = (
  enabled: boolean,
  options?: { title?: string; message?: string; eta?: string }
): LockerMaintenanceState => {
  const currentState = getLockerMaintenanceState();
  const newState: LockerMaintenanceState = {
    enabled,
    title: options?.title !== undefined ? options.title : currentState.title,
    message: options?.message !== undefined ? options.message : currentState.message,
    eta: options?.eta !== undefined ? options.eta : currentState.eta,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  } catch (e) {
    console.error('Failed to save locker maintenance state to localStorage', e);
  }

  // Notify current tab listeners immediately
  window.dispatchEvent(new CustomEvent('silms_locker_maintenance_updated', { detail: newState }));

  // Optimistic background sync with backend
  fetch(getLockerStatusUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newState)
  }).catch(err => {
    console.warn('[lockerMaintenanceManager] Backend push failed, saved locally:', err);
  });

  return newState;
};
