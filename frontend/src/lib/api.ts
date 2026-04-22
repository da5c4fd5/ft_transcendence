declare const __APP_DOMAIN__: string;
declare const __APP_HTTPS_PORT__: string;

const API_DOMAIN = __APP_DOMAIN__ || window.location.hostname;
const API_PORT = __APP_HTTPS_PORT__ && __APP_HTTPS_PORT__ !== '443'
  ? `:${__APP_HTTPS_PORT__}`
  : '';
const BASE_URL = `https://${API_DOMAIN}${API_PORT}/api`;

export type ApiError = {
  status: number;
  message: string;
};

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_TOO_LARGE_MESSAGE = 'That image is too large. Please choose an image up to 10 MB.';

export function validateImageFile(file: File): string | null {
  return file.size > MAX_IMAGE_UPLOAD_BYTES ? IMAGE_TOO_LARGE_MESSAGE : null;
}

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  const apiErr = err as Partial<ApiError>;
  if (apiErr?.status === 413) {
    return IMAGE_TOO_LARGE_MESSAGE;
  }
  if (typeof apiErr?.message === 'string' && apiErr.message.trim()) {
    return apiErr.message;
  }
  return fallback;
}

let _onUnauthorized: (() => void) | null = null;

/** Register a callback that fires on any 401 response (e.g. to trigger logout). */
export function setUnauthorizedHandler(cb: () => void) {
  _onUnauthorized = cb;
}

export function getToken(): string | null {
  return localStorage.getItem('capsul_token');
}

export function getWebSocketUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const normalizedPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
  let urlStr = `${protocol}://${API_DOMAIN}${API_PORT}${normalizedPath}`;

  if (params) {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) qs.set(key, String(val));
    }
    const qsStr = qs.toString();
    if (qsStr) urlStr += `?${qsStr}`;
  }

  return urlStr;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  let urlStr = `${BASE_URL}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null) qs.set(key, String(val));
    }
    const qsStr = qs.toString();
    if (qsStr) urlStr += `?${qsStr}`;
  }

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(urlStr, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    _onUnauthorized?.();
    throw { status: 401, message: 'Unauthorized' } satisfies ApiError;
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const json = await res.json() as { error?: string; message?: string };
      message = json.error ?? json.message ?? message;
    } catch { /* ignore parse errors */ }
    throw { status: res.status, message } satisfies ApiError;
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get<T>(path: string, params?: Record<string, string | number | boolean | undefined | null>): Promise<T> {
    return request<T>('GET', path, undefined, params);
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, body);
  },
  delete<T = void>(path: string, body?: unknown): Promise<T> {
    return request<T>('DELETE', path, body);
  },
  async upload<T>(path: string, form: FormData): Promise<T> {
    const urlStr = `${BASE_URL}${path}`;
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(urlStr, { method: 'POST', headers, body: form });
    if (res.status === 401) { _onUnauthorized?.(); throw { status: 401, message: 'Unauthorized' } satisfies ApiError; }
    if (!res.ok) {
      let message = res.statusText;
      try { const j = await res.json() as { error?: string; message?: string }; message = j.error ?? j.message ?? message; } catch { /* */ }
      throw { status: res.status, message } satisfies ApiError;
    }
    return res.json() as Promise<T>;
  },
};
