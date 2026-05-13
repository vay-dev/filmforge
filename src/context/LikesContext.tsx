import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Movie } from '../services/tmdb';
import { likesApi, isLoggedIn, type MoviePayload } from '../services/api';

interface LikesContextValue {
  liked: Movie[];
  isLiked: (id: number) => boolean;
  toggleLike: (movie: Movie) => Promise<void>;
  syncing: boolean;
}

const LikesContext = createContext<LikesContextValue | null>(null);

const LOCAL_KEY = 'filmflare_likes';

function loadLocal(): Movie[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]'); }
  catch { return []; }
}
function saveLocal(list: Movie[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
}

function toPayload(m: Movie): MoviePayload {
  return {
    tmdb_id: m.id,
    title: m.title,
    poster_path: m.poster_path ?? '',
    genre_ids: m.genre_ids ?? [],
    vote_average: m.vote_average ?? 0,
    release_date: m.release_date ?? '',
  };
}

export function LikesProvider({ children }: { children: ReactNode }) {
  const [liked, setLiked] = useState<Movie[]>(loadLocal);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    setSyncing(true);
    likesApi.list()
      .then(items => {
        const movies: Movie[] = items.map(i => ({
          id: i.tmdb_id,
          title: i.title,
          poster_path: i.poster_path,
          genre_ids: i.genre_ids,
          vote_average: i.vote_average,
          release_date: i.release_date,
          backdrop_path: '',
          overview: '',
          popularity: 0,
          adult: false,
          original_language: '',
          original_title: i.title,
          video: false,
          vote_count: 0,
        }));
        setLiked(movies);
        saveLocal(movies);
      })
      .catch(() => {})
      .finally(() => setSyncing(false));
  }, []);

  const isLiked = useCallback((id: number) => liked.some(m => m.id === id), [liked]);

  const toggleLike = useCallback(async (movie: Movie) => {
    const alreadyLiked = liked.some(m => m.id === movie.id);
    const next = alreadyLiked ? liked.filter(m => m.id !== movie.id) : [movie, ...liked];
    setLiked(next);
    saveLocal(next);

    if (isLoggedIn()) {
      try {
        await likesApi.toggle(toPayload(movie));
      } catch {
        setLiked(liked);
        saveLocal(liked);
      }
    }
  }, [liked]);

  return (
    <LikesContext.Provider value={{ liked, isLiked, toggleLike, syncing }}>
      {children}
    </LikesContext.Provider>
  );
}

export function useLikes() {
  const ctx = useContext(LikesContext);
  if (!ctx) throw new Error('useLikes must be used within LikesProvider');
  return ctx;
}
