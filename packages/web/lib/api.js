const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';

export async function post(path, body) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API_BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

export async function get(path, token) {
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('djt_token') : null);
  const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
  const res = await fetch(API_BASE + path, { headers });
  return res.json();
}
