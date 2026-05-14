export const SITE_URL = 'https://enhanced-film-flare.vercel.app';

export function absoluteUrl(path: string): string {
  const base = import.meta.env.VITE_SITE_URL ?? SITE_URL;
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
