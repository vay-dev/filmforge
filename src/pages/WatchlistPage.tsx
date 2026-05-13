import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import WatchlistCard from '../components/WatchlistCard';
import TrailerModal from '../components/TrailerModal';
import AuthGate from '../components/AuthGate';
import Seo from '../components/Seo';
import type { Movie } from '../services/tmdb';
import './styles/WatchlistPage.scss';

const GENRE_FILTERS = [
  { label: 'All', id: null },
  { label: 'Action', id: 28 },
  { label: 'Drama', id: 18 },
  { label: 'Sci-Fi', id: 878 },
  { label: 'Horror', id: 27 },
  { label: 'Comedy', id: 35 },
  { label: 'Thriller', id: 53 },
];

type SortKey = 'added' | 'rating' | 'title' | 'year';

export default function WatchlistPage() {
  const { watchlist } = useWatchlist();
  const [activeGenre, setActiveGenre] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('added');
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  const filtered = watchlist
    .filter(m => activeGenre === null || m.genre_ids.includes(activeGenre))
    .slice()
    .sort((a, b) => {
      switch (sort) {
        case 'rating': return b.vote_average - a.vote_average;
        case 'title': return a.title.localeCompare(b.title);
        case 'year':
          return new Date(b.release_date).getFullYear() - new Date(a.release_date).getFullYear();
        default: return 0; // added order preserved from localStorage
      }
    });

  return (
    <AuthGate icon="bookmark" title="Your watchlist awaits" subtitle="Sign in to save movies and track everything you want to watch.">
      <Seo title="My Watchlist" description="Your saved movies on FilmFlare." path="/watchlist" />
      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />

      <div className="watchlist-page">
        <div className="watchlist-page__header">
          <div>
            <p className="watchlist-page__label">Your Collection</p>
            <h1 className="watchlist-page__title">Watchlist</h1>
          </div>
          <span className="watchlist-page__count">{watchlist.length} films</span>
        </div>

        {watchlist.length === 0 ? (
          <div className="watchlist-page__empty">
            <span className="material-symbols-outlined watchlist-page__empty-icon">bookmark</span>
            <h2>Your watchlist is empty</h2>
            <p>Add movies from the Discover page to track what you want to watch.</p>
            <Link to="/" className="watchlist-page__empty-btn">Discover Movies</Link>
          </div>
        ) : (
          <>
            <div className="watchlist-page__controls">
              <div className="watchlist-page__genres">
                {GENRE_FILTERS.map(g => (
                  <button
                    key={g.label}
                    className={`watchlist-page__genre-pill${activeGenre === g.id ? ' watchlist-page__genre-pill--active' : ''}`}
                    onClick={() => setActiveGenre(g.id)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <select
                className="watchlist-page__sort"
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                aria-label="Sort by"
              >
                <option value="added">Recently Added</option>
                <option value="rating">Top Rated</option>
                <option value="title">A–Z</option>
                <option value="year">Newest First</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="watchlist-page__empty-filter">
                <p>No movies in this genre. <button onClick={() => setActiveGenre(null)}>Show all</button></p>
              </div>
            ) : (
              <div className="watchlist-page__grid">
                {filtered.map(movie => (
                  <WatchlistCard key={movie.id} movie={movie} onTrailer={setTrailerMovie} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AuthGate>
  );
}
