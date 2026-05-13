import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import { tmdb } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import { forYouApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './styles/HomePage.scss';

interface RowState {
  movies: Movie[];
  page: number;
  totalPages: number;
  loading: boolean;
}

function makeRow(): RowState {
  return { movies: [], page: 0, totalPages: 1, loading: true };
}

type RowKey = 'trending' | 'trendingWeek' | 'topRated' | 'nowPlaying' | 'upcoming' | 'action' | 'scifi' | 'horror';

const ROW_CONFIGS: { key: RowKey; title: string }[] = [
  { key: 'trending', title: 'Trending Today' },
  { key: 'trendingWeek', title: 'Trending This Week' },
  { key: 'topRated', title: 'Top Rated' },
  { key: 'nowPlaying', title: 'Now Playing' },
  { key: 'upcoming', title: 'Coming Soon' },
  { key: 'action', title: 'Action & Adventure' },
  { key: 'scifi', title: 'Sci-Fi & Fantasy' },
  { key: 'horror', title: 'Horror & Thriller' },
];

async function fetchRow(key: RowKey, page: number) {
  switch (key) {
    case 'trending': return tmdb.trendingDay(page);
    case 'trendingWeek': return tmdb.trendingWeek(page);
    case 'topRated': return tmdb.topRated(page);
    case 'nowPlaying': return tmdb.nowPlaying(page);
    case 'upcoming': return tmdb.upcoming(page);
    case 'action': return tmdb.byGenre(28, page); // Action
    case 'scifi': return tmdb.byGenre(878, page); // Sci-Fi
    case 'horror': return tmdb.byGenre(27, page); // Horror
  }
}

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const { loggedIn } = useAuth();

  const [rows, setRows] = useState<Record<RowKey, RowState>>(() =>
    Object.fromEntries(ROW_CONFIGS.map(r => [r.key, makeRow()])) as Record<RowKey, RowState>
  );
  const [heroMovies, setHeroMovies] = useState<Movie[]>([]);
  const [forYouMovies, setForYouMovies] = useState<Movie[]>([]);
  const [forYouLoading, setForYouLoading] = useState(false);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load a single row page
  const loadRow = useCallback(async (key: RowKey, page: number) => {
    setRows(prev => ({ ...prev, [key]: { ...prev[key], loading: true } }));
    try {
      const data = await fetchRow(key, page);
      setRows(prev => ({
        ...prev,
        [key]: {
          movies: page === 1 ? data.results : [...prev[key].movies, ...data.results],
          page,
          totalPages: data.total_pages,
          loading: false,
        },
      }));
      return data;
    } catch {
      setRows(prev => ({ ...prev, [key]: { ...prev[key], loading: false } }));
      return null;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const trendingData = await loadRow('trending', 1);
      if (trendingData?.results.length) {
        // Shuffle the top 8 results and pick 5 for the hero carousel
        const pool = trendingData.results.slice(0, 8);
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        setHeroMovies(pool.slice(0, 5));
      }
      // Load remaining rows concurrently
      ROW_CONFIGS.filter(r => r.key !== 'trending').forEach(r => loadRow(r.key, 1));
    };
    init();
  }, [loadRow]);

  // For You feed — fetch when user logs in/out
  useEffect(() => {
    if (!loggedIn) { setForYouMovies([]); return; }
    setForYouLoading(true);
    forYouApi.feed(40).then(data => {
      setForYouMovies(data.results as unknown as Movie[]);
    }).catch(() => {}).finally(() => setForYouLoading(false));
  }, [loggedIn]);

  // Search
  useEffect(() => {
    if (!query) { setSearchResults([]); return; }
    setSearchLoading(true);
    let page = 1;
    const results: Movie[] = [];

    const loadAll = async () => {
      try {
        const first = await tmdb.search(query, 1);
        results.push(...first.results);
        const remaining = Math.min(first.total_pages, 10);
        for (page = 2; page <= remaining; page++) {
          const more = await tmdb.search(query, page);
          results.push(...more.results);
        }
      } catch { /* ignore */ }
      setSearchResults([...results]);
      setSearchLoading(false);
    };
    loadAll();
  }, [query]);

  const loadMore = useCallback((key: RowKey) => async () => {
    const row = rows[key];
    if (row.loading || row.page >= row.totalPages) return;
    await loadRow(key, row.page + 1);
  }, [rows, loadRow]);

  if (query) {
    return (
      <>
        <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
        <div className="home-page">
          <div className="home-page__search-results">
            <MovieRow
              title={`Results for "${query}"`}
              movies={searchResults}
              loading={searchLoading}
              onTrailer={setTrailerMovie}
            />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
      <div className="home-page">
        <HeroSection movies={heroMovies} onTrailer={setTrailerMovie} />

        <div className="home-page__rows">
          {loggedIn && (forYouLoading || forYouMovies.length > 0) && (
            <MovieRow
              title="For You ✦"
              badge="Personalised"
              movies={forYouMovies}
              loading={forYouLoading}
              onTrailer={setTrailerMovie}
            />
          )}
          {ROW_CONFIGS.map(({ key, title }) => (
            <MovieRow
              key={key}
              title={title}
              movies={rows[key].movies}
              loading={rows[key].loading}
              onTrailer={setTrailerMovie}
              onLoadMore={loadMore(key)}
              hasMore={rows[key].page < rows[key].totalPages}
            />
          ))}
        </div>
      </div>
    </>
  );
}
