// ─── Configuration ────────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// ─── Token management ─────────────────────────────────────────────────────────

const TOKEN_KEY = "auth_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ─── Error ────────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NotificationSettings {
  emailDigest?: boolean;
  pushEnabled?: boolean;
  reminderTime?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  notificationSettings: NotificationSettings;
  treeState: unknown;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id:          string;
  userAgent:   string;
  connectedAt: string;
  isCurrent:   boolean;
}

export interface Friend {
  id: string;
  requesterId: string;
  recipientId: string;
  status: "PENDING" | "ACCEPTED";
  createdAt: string;
  updatedAt: string;
}

export interface Media {
  id: string;
  memoryId: string;
  url: string;
  mimeType: string;
  createdAt: string;
}

export interface Contribution {
  id: string;
  memoryId: string;
  contributorId: string | null;
  guestName: string | null;
  content: string;
  createdAt: string;
}

export interface Memory {
  id: string;
  userId: string;
  content: string;
  date: string;
  mood: string | null;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
  contributions?: Contribution[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total?: number;
}

// ─── Request payloads ─────────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  password: string;
  username: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateMePayload {
  username?: string;
  displayName?: string;
  bio?: string;
}

export interface UpdatePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateEmailPayload {
  password: string;
  email: string;
}

export interface CreateMemoryPayload {
  content: string;
  date?: string;
  mood?: string;
  isOpen?: boolean;
}

export interface UpdateMemoryPayload {
  content?: string;
  mood?: string;
}

export interface CreateContributionPayload {
  content: string;
  guestName?: string;
}

// ─── Base request ─────────────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let bodyInit: BodyInit | undefined;
  if (body instanceof FormData) {
    bodyInit = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    bodyInit = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: bodyInit,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = await res.json();
      message = err.error ?? err.message ?? message;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204 || res.headers.get("Content-Length") === "0") {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    async signup(email: string, password: string, username: string): Promise<{ token: string }> {
      const data = await request<{ token: string }>("POST", "/auth/signup", { email, password, username });
      setToken(data.token);
      return data;
    },

    async login(email: string, password: string): Promise<{ token: string }> {
      const data = await request<{ token: string }>("POST", "/auth/login", { email, password });
      setToken(data.token);
      return data;
    },

    logout(): Promise<{ message: string }> {
      return request<{ message: string }>("POST", "/auth/logout").finally(clearToken);
    },

    getSessions(): Promise<Session[]> {
      return request<Session[]>("GET", "/auth/sessions");
    },
  },

  users: {
    getMe(): Promise<User> {
      return request<User>("GET", "/users/me");
    },

    getUser(id: string): Promise<User> {
      return request<User>("GET", `/users/${id}`);
    },

    updateMe(data: UpdateMePayload): Promise<User> {
      return request<User>("PATCH", "/users/me", data);
    },

    updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
      return request<{ message: string }>("PATCH", "/users/me/password", { currentPassword, newPassword });
    },

    updateEmail(password: string, email: string): Promise<User> {
      return request<User>("PATCH", "/users/me/email", { password, email });
    },

    uploadAvatar(file: File): Promise<User> {
      const form = new FormData();
      form.append("file", file);
      return request<User>("POST", "/users/me/avatar", form);
    },

    updateNotifications(data: NotificationSettings): Promise<User> {
      return request<User>("PATCH", "/users/me/notifications", data);
    },

    getTree(): Promise<unknown> {
      return request<unknown>("GET", "/users/me/tree");
    },

    updateTree(data: unknown): Promise<unknown> {
      return request<unknown>("PATCH", "/users/me/tree", data);
    },

    getStats(): Promise<{ totalCapsuls: number; shared: number; dayStreak: number; wordsWritten: number }> {
      return request<{ totalCapsuls: number; shared: number; dayStreak: number; wordsWritten: number }>("GET", "/users/me/stats");
    },

    search(q: string): Promise<User[]> {
      return request<User[]>("GET", `/users/search?q=${encodeURIComponent(q)}`);
    },
  },

  friends: {
    list(): Promise<Friend[]> {
      return request<Friend[]>("GET", "/friends/");
    },

    add(userId: string): Promise<Friend> {
      return request<Friend>("PUT", `/friends/${userId}`);
    },

    remove(userId: string): Promise<void> {
      return request<void>("DELETE", `/friends/${userId}`);
    },
  },

  memories: {
    list(page = 1, limit = 20): Promise<Paginated<Memory>> {
      return request<Paginated<Memory>>("GET", `/memories/?page=${page}&limit=${limit}`);
    },

    create(data: CreateMemoryPayload): Promise<Memory> {
      return request<Memory>("POST", "/memories/", data);
    },

    timeline(page = 1, limit = 20): Promise<Paginated<Memory>> {
      return request<Paginated<Memory>>("GET", `/memories/timeline?page=${page}&limit=${limit}`);
    },

    calendar(): Promise<{ date: string; id: string; mood: string | null }[]> {
      return request<{ date: string; id: string; mood: string | null }[]>("GET", "/memories/calendar");
    },

    get(memoryId: string): Promise<Memory> {
      return request<Memory>("GET", `/memories/${memoryId}`);
    },

    update(memoryId: string, data: UpdateMemoryPayload): Promise<Memory> {
      return request<Memory>("PATCH", `/memories/${memoryId}`, data);
    },

    delete(memoryId: string): Promise<void> {
      return request<void>("DELETE", `/memories/${memoryId}`);
    },

    uploadMedia(memoryId: string, file: File): Promise<Memory> {
      const form = new FormData();
      form.append("file", file);
      return request<Memory>("POST", `/memories/${memoryId}/media`, form);
    },

    getPrompts(): Promise<string[]> {
      return request<string[]>("GET", "/memories/prompts");
    },
  },

  contributions: {
    list(memoryId: string): Promise<Contribution[]> {
      return request<Contribution[]>("GET", `/memories/${memoryId}/contributions/`);
    },

    create(memoryId: string, data: CreateContributionPayload): Promise<Contribution> {
      return request<Contribution>("POST", `/memories/${memoryId}/contributions/`, data);
    },

    delete(memoryId: string, id: string): Promise<void> {
      return request<void>("DELETE", `/memories/${memoryId}/contributions/${id}`);
    },
  },
};
