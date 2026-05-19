/** REST API base URL (includes /api suffix). */
export function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
}

/** Socket.io server origin (no /api path). */
export function getWebSocketUrl(): string {
  const explicit = import.meta.env.VITE_WS_URL;
  if (explicit) return explicit.replace(/\/$/, '');

  const api = getApiBaseUrl();
  return api.replace(/\/api\/?$/, '');
}
