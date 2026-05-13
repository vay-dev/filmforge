const BASE = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN ?? import.meta.env.VITE_TMDB_API_ACCESS_TOKEN;

export const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
export const IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

const headers = {
  accept: 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
  adult: boolean;
  original_language: string;
}

export interface MovieDetail extends Omit<Movie, 'genre_ids'> {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
  status: string;
  budget: number;
  revenue: number;
  production_companies: { id: number; name: string; logo_path: string | null }[];
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface PagedResponse<T> {
  results: T[];
  page: number;
  total_pages: number;
  total_results: number;
}

export const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
};

export function getGenreNames(ids: number[]): string[] {
  return ids.map(id => GENRE_MAP[id]).filter(Boolean).slice(0, 3);
}

export function posterUrl(path: string | null, size: 'w500' | 'original' = 'w500') {
  if (!path) return null;
  const base = size === 'original' ? IMG_ORIGINAL : IMG_BASE;
  return `${base}${path}`;
}

export function formatRating(n: number) {
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function releaseYear(date: string) {
  return date ? new Date(date).getFullYear() : '—';
}

// ===== Endpoints ===== //

export const tmdb = {
  trendingDay: (page = 1) =>
    get<PagedResponse<Movie>>('/trending/movie/day', { page }),

  trendingWeek: (page = 1) =>
    get<PagedResponse<Movie>>('/trending/movie/week', { page }),

  popular: (page = 1) =>
    get<PagedResponse<Movie>>('/movie/popular', { page }),

  topRated: (page = 1) =>
    get<PagedResponse<Movie>>('/movie/top_rated', { page }),

  nowPlaying: (page = 1) =>
    get<PagedResponse<Movie>>('/movie/now_playing', { page }),

  upcoming: (page = 1) =>
    get<PagedResponse<Movie>>('/movie/upcoming', { page }),

  byGenre: (genreId: number, page = 1) =>
    get<PagedResponse<Movie>>('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
      page,
    }),

  search: (query: string, page = 1) =>
    get<PagedResponse<Movie>>('/search/movie', { query, page }),

  detail: (id: number) =>
    get<MovieDetail>(`/movie/${id}`),

  videos: (id: number) =>
    get<{ results: Video[] }>(`/movie/${id}/videos`),

  credits: (id: number) =>
    get<{ cast: Cast[] }>(`/movie/${id}/credits`),

  similar: (id: number, page = 1) =>
    get<PagedResponse<Movie>>(`/movie/${id}/similar`, { page }),

  recommendations: (id: number, page = 1) =>
    get<PagedResponse<Movie>>(`/movie/${id}/recommendations`, { page }),
};
