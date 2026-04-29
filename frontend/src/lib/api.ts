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
export const MAX_MEDIA_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_TOO_LARGE_MESSAGE = 'That image is too large. Please choose an image up to 10 MB.';
export const FILE_TOO_LARGE_MESSAGE = 'That file is too large. Please choose a file up to 10 MB.';
export const INVALID_MEDIA_TYPE_MESSAGE = 'Unsupported file format. Please choose an image or audio file.';

const SUPPORTED_MEMORY_MEDIA_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/x-m4a',
]);

const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

export function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return IMAGE_TOO_LARGE_MESSAGE;
  }
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return 'Unsupported image format. Please choose a JPG, PNG, GIF, or WebP image.';
  }
  return null;
}

export function validateMemoryMediaFile(file: File): string | null {
  if (file.size > MAX_MEDIA_UPLOAD_BYTES) {
    return FILE_TOO_LARGE_MESSAGE;
  }
  if (!SUPPORTED_MEMORY_MEDIA_TYPES.has(file.type)) {
    return INVALID_MEDIA_TYPE_MESSAGE;
  }
  return null;
}

export function getApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  const apiErr = err as Partial<ApiError>;
  if (apiErr?.status === 413) {
    return apiErr.message === FILE_TOO_LARGE_MESSAGE
      ? FILE_TOO_LARGE_MESSAGE
      : IMAGE_TOO_LARGE_MESSAGE;
  }
  if (typeof apiErr?.message === 'string' && apiErr.message.trim()) {
    return apiErr.message;
  }
  return fallback;
}

let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(cb: () => void) {
  _onUnauthorized = cb;
}

export function getToken(): string | null {
  return localStorage.getItem('capsul_token');
}

export function isAudioMediaUrl(url: string): boolean {
  return /^data:audio\//i.test(url) || /\.(mp3|wav|ogg|m4a|aac|webm|mp4)(\?.*)?$/i.test(url);
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

function getDownloadFilename(contentDisposition: string | null, fallback: string) {
  if (!contentDisposition) return fallback;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const simpleMatch = contentDisposition.match(/filename="([^"]+)"/i);
  return simpleMatch?.[1] ?? fallback;
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
  async download(
    path: string,
    options?: {
      method?: 'GET' | 'POST';
      body?: unknown;
      fallbackFilename?: string;
    },
  ): Promise<{ blob: Blob; filename: string }> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options?.body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${BASE_URL}${path}`, {
      method: options?.method ?? 'GET',
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
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

    return {
      blob: await res.blob(),
      filename: getDownloadFilename(
        res.headers.get('Content-Disposition'),
        options?.fallbackFilename ?? 'download.json',
      ),
    };
  },
  async upload<T>(
    path: string,
    form: FormData,
    options?: { onProgress?: (percent: number) => void },
  ): Promise<T> {
    const urlStr = `${BASE_URL}${path}`;
    const token = getToken();
    return await new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', urlStr);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (!options?.onProgress || !event.lengthComputable) return;
        options.onProgress(Math.round((event.loaded / event.total) * 100));
      };

      xhr.onerror = () => {
        reject({ status: 0, message: 'Network error' } satisfies ApiError);
      };

      xhr.onload = () => {
        if (xhr.status === 401) {
          _onUnauthorized?.();
          reject({ status: 401, message: 'Unauthorized' } satisfies ApiError);
          return;
        }

        if (xhr.status < 200 || xhr.status >= 300) {
          let message = xhr.statusText;
          try {
            const parsed = JSON.parse(xhr.responseText) as { error?: string; message?: string };
            message = parsed.error ?? parsed.message ?? message;
          } catch { /* ignore parse errors */ }
          reject({ status: xhr.status, message } satisfies ApiError);
          return;
        }

        if (xhr.status === 204 || !xhr.responseText.trim()) {
          resolve(undefined as T);
          return;
        }

        resolve(JSON.parse(xhr.responseText) as T);
      };

      xhr.send(form);
    });
  },
};
