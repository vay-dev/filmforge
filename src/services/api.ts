/**
 * FilmFlare backend API client.
 * Base URL is set by VITE_API_BASE_URL (defaults to local dev server).
 */

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

// ── Token storage ──────────────────────────────────────────────────────────────
const tokenStore = {
  get: () => localStorage.getItem('ff_access'),
  set: (t: string) => localStorage.setItem('ff_access', t),
  clear: () => localStorage.removeItem('ff_access'),
};
const refreshStore = {
  get: () => localStorage.getItem('ff_refresh'),
  set: (t: string) => localStorage.setItem('ff_refresh', t),
  clear: () => localStorage.removeItem('ff_refresh'),
};

export function getAccessToken() { return tokenStore.get(); }
export function isLoggedIn() { return !!tokenStore.get(); }

export function saveTokens(access: string, refresh: string) {
  tokenStore.set(access);
  refreshStore.set(refresh);
}

export function clearTokens() {
  tokenStore.clear();
  refreshStore.clear();
}

// Callback so AuthContext can react to forced logouts from the interceptor
let _forceLogout: (() => void) | null = null;
export function setForceLogout(fn: () => void) { _forceLogout = fn; }

// ── Core fetch wrapper with auth + auto-refresh ────────────────────────────────
let _refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = refreshStore.get();
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokenStore.set(data.access);
    if (data.refresh) refreshStore.set(data.refresh);
    return true;
  } catch {
    return false;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && token) {
    // Deduplicate concurrent refresh attempts
    if (!_refreshPromise) {
      _refreshPromise = refreshAccessToken().finally(() => { _refreshPromise = null; });
    }
    const ok = await _refreshPromise;
    if (ok) {
      headers['Authorization'] = `Bearer ${tokenStore.get()}`;
      res = await fetch(`${BASE}${path}`, { ...init, headers });
    } else {
      clearTokens();
      _forceLogout?.();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Object.values(body).flat().join(' ') || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Auth endpoints ─────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  bio?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  user?: AuthUser;
}

export const auth = {
  register: (username: string, email: string, password: string, password2: string) =>
    apiFetch<AuthTokens & { user: AuthUser }>('/api/auth/register/', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, password2 }),
    }),

  login: (username: string, password: string) =>
    apiFetch<AuthTokens>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  me: () => apiFetch<AuthUser>('/api/auth/me/'),

  updateMe: (data: Partial<Pick<AuthUser, 'first_name' | 'last_name' | 'email'> & { bio: string }>) =>
    apiFetch<AuthUser>('/api/auth/me/', { method: 'PATCH', body: JSON.stringify(data) }),

  uploadAvatar: (file: File) => {
    const token = getAccessToken();
    const form = new FormData();
    form.append('avatar', file);
    return fetch(`${BASE}/api/auth/avatar/`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(Object.values(body).flat().join(' ') || `HTTP ${res.status}`);
      }
      return res.json() as Promise<AuthUser>;
    });
  },

  changePassword: (old_password: string, new_password: string) =>
    apiFetch<{ detail: string }>('/api/auth/change-password/', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password }),
    }),

  logout: () => {
    const refresh = refreshStore.get();
    clearTokens();
    return apiFetch('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh }),
    }).catch(() => {}); // best-effort blacklist
  },
};

// ── Movie data shape (mirrors backend model) ───────────────────────────────────
export interface MoviePayload {
  tmdb_id: number;
  title: string;
  poster_path: string;
  genre_ids: number[];
  vote_average: number;
  release_date: string;
}

// ── Watchlist endpoints ────────────────────────────────────────────────────────
export interface WatchlistItem extends MoviePayload {
  id: number;
  added_at: string;
}

export const watchlistApi = {
  list: () => apiFetch<WatchlistItem[]>('/api/watchlist/'),
  toggle: (movie: MoviePayload) =>
    apiFetch<{ action: 'added' | 'removed'; tmdb_id: number; item?: WatchlistItem }>(
      '/api/watchlist/toggle/', { method: 'POST', body: JSON.stringify(movie) }
    ),
  ids: () => apiFetch<{ ids: number[] }>('/api/watchlist/ids/'),
};

// ── Likes endpoints ────────────────────────────────────────────────────────────
export interface LikeItem extends MoviePayload {
  id: number;
  liked_at: string;
}

export const likesApi = {
  list: () => apiFetch<LikeItem[]>('/api/likes/'),
  toggle: (movie: MoviePayload) =>
    apiFetch<{ action: 'liked' | 'unliked'; tmdb_id: number; item?: LikeItem }>(
      '/api/likes/toggle/', { method: 'POST', body: JSON.stringify(movie) }
    ),
  ids: () => apiFetch<{ ids: number[] }>('/api/likes/ids/'),
};

// ── Event tracking ─────────────────────────────────────────────────────────────
export type EventType =
  | 'view' | 'trailer' | 'like' | 'unlike'
  | 'watchlist_add' | 'watchlist_remove' | 'search';

export const events = {
  track: (tmdb_id: number, event_type: EventType, genre_ids: number[] = [], release_year?: number) => {
    if (!isLoggedIn()) return Promise.resolve();
    return apiFetch('/api/events/', {
      method: 'POST',
      body: JSON.stringify({ tmdb_id, event_type, genre_ids, release_year }),
    }).catch(() => {}); // fire-and-forget, never throw
  },
};

// ── For You feed ───────────────────────────────────────────────────────────────
export const forYouApi = {
  feed: (limit = 40, fresh = false) =>
    apiFetch<{ results: Record<string, unknown>[]; count: number }>(
      `/api/foryou/?limit=${limit}${fresh ? '&fresh=1' : ''}`
    ),
};

// ── User status ────────────────────────────────────────────────────────────────
export const userStatusApi = {
  get: () => apiFetch<{ watchlist_ids: number[]; liked_ids: number[] }>('/api/me/status/'),
};
