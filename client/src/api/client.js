// Small fetch wrapper: adds the JWT, parses JSON, throws readable errors.
//   import { api } from '../api/client';
//   const emergencies = await api.get('/emergencies');
//   await api.post('/help-requests', { type, emergencyId });

const BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'reliefnet_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the API — is the server running? (npm run server)');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) tokenStore.clear();
    // Vite returns an empty 500 when the Express server isn't running
    throw new Error(data.error || (res.status >= 500
      ? 'Cannot reach the API — is the server running? (npm run server)'
      : `Request failed (${res.status})`));
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path),
};
