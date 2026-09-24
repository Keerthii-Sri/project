const API_BASE = 'http://localhost:3000/api/v1';

export async function api(path, options = {}) {
  const token = localStorage.getItem('greenfleet-demo-session');
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    const parsed = JSON.parse(token);
    if (parsed && parsed.access_token) headers.set('Authorization', `Bearer ${parsed.access_token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json();
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload.data;
}
