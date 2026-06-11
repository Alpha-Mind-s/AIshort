const BASE_URL = 'http://localhost:8080/api/v1';

let _getToken: (() => string | null) | null = null;
let _onLogout: (() => void) | null = null;

export function configureStudioAuth(opts: {
  getToken: () => string | null;
  onLogout: () => void;
}) {
  _getToken = opts.getToken;
  _onLogout = opts.onLogout;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ code: number; message: string; data: T; meta?: { page: number; page_size: number; total: number } | null }> {
  const url = `${BASE_URL}${endpoint}`;
  const token = _getToken?.() ?? null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    _onLogout?.();
    throw new Error('Session expired');
  }

  const json = await res.json();

  if (json.code !== 0) {
    throw new Error(json.message || 'Request failed');
  }

  return json;
}
