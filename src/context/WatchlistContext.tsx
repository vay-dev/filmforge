import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Movie } from '../services/tmdb';
import { watchlistApi, isLoggedIn, type MoviePayload } from '../services/api';

interface WatchlistContextValue {
  watchlist: Movie[];
  isInWatchlist: (id: number) => boolean;
  toggleWatchlist: (movie: Movie) => Promise<void>;
  syncing: boolean;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const LOCAL_KEY = 'filmflare_watchlist';

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

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<Movie[]>(loadLocal);
  const [syncing, setSyncing] = useState(false);

  // When the user logs in, pull their server watchlist and merge
  useEffect(() => {
    if (!isLoggedIn()) return;
    setSyncing(true);
    watchlistApi.list()
      .then(items => {
        // Convert WatchlistItem → Movie shape
        const movies: Movie[] = items.map(i => ({
          id: i.tmdb_id,
          title: i.title,
          poster_path: i.poster_path,
          genre_ids: i.genre_ids,
          vote_average: i.vote_average,
          release_date: i.release_date,
          // fill required Movie fields with defaults
          backdrop_path: '',
          overview: '',
          popularity: 0,
          adult: false,
          original_language: '',
          original_title: i.title,
          video: false,
          vote_count: 0,
        }));
        setWatchlist(movies);
        saveLocal(movies);
      })
      .catch(() => { /* keep local state */ })
      .finally(() => setSyncing(false));
  }, []); // runs once on mount; parent ensures this mounts after auth is restored

  const isInWatchlist = useCallback((id: number) => watchlist.some(m => m.id === id), [watchlist]);

  const toggleWatchlist = useCallback(async (movie: Movie) => {
    // Optimistic local update immediately
    const alreadyIn = watchlist.some(m => m.id === movie.id);
    const next = alreadyIn ? watchlist.filter(m => m.id !== movie.id) : [movie, ...watchlist];
    setWatchlist(next);
    saveLocal(next);

    // Sync with backend if logged in
    if (isLoggedIn()) {
      try {
        await watchlistApi.toggle(toPayload(movie));
      } catch {
        // Revert on failure
        setWatchlist(watchlist);
        saveLocal(watchlist);
      }
    }
  }, [watchlist]);

  return (
    <WatchlistContext.Provider value={{ watchlist, isInWatchlist, toggleWatchlist, syncing }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within WatchlistProvider');
  return ctx;
}
