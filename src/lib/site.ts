const raw = import.meta.env.VITE_SITE_URL?.trim();

export const SITE_URL = (raw && raw.length > 0 ? raw : 'https://filmflare.vercel.app').replace(/\/+$/, '');

export const absoluteUrl = (path = '/') => `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
