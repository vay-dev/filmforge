import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { useLikes } from '../context/LikesContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { posterUrl, formatRating, releaseYear, getGenreNames } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './styles/movieCard.scss';

interface Props {
  movie: Movie;
  onTrailer?: (movie: Movie) => void;
  showDetails?: boolean;
  isLarge?: boolean;
}

export default function MovieCard({ movie, onTrailer }: Props) {
  const navigate = useNavigate();
  const { loggedIn } = useAuth();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isLiked, toggleLike } = useLikes();
  const [authOpen, setAuthOpen] = useState(false);
  const inList = isInWatchlist(movie.id);
  const liked = isLiked(movie.id);
  const poster = posterUrl(movie.poster_path);
  const genres = getGenreNames(movie.genre_ids);
  const primaryGenre = genres[0] ?? 'Movie';

  const requireAuth = (action: () => void) => {
    if (!loggedIn) { setAuthOpen(true); return; }
    action();
  };

  return (
    <>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <article className="movie-card" onClick={() => navigate(`/movie/${movie.id}`)}>
        <div className="movie-card__poster">
          {poster ? (
            <img src={poster} alt={movie.title} loading="lazy" />
          ) : (
            <div className="movie-card__no-poster">
              <span className="material-symbols-outlined">movie</span>
            </div>
          )}
          <div className="movie-card__overlay-glow" />
        </div>

        <div className="movie-card__panel">
          <div className="movie-card__panel-top">
            <h3 className="movie-card__title" title={movie.title}>{movie.title}</h3>
            <div className="movie-card__rating">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
              {formatRating(movie.vote_average)}
            </div>
          </div>

          <div className="movie-card__meta">
            <span>{releaseYear(movie.release_date)}</span>
            {genres.length > 0 && <><span className="movie-card__dot" /><span>{primaryGenre}</span></>}
          </div>

          <div className="movie-card__actions" onClick={e => e.stopPropagation()}>
            <button
              className={`movie-card__icon-btn${inList ? ' movie-card__icon-btn--active' : ''}`}
              onClick={() => requireAuth(() => toggleWatchlist(movie))}
              aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <span className="material-symbols-outlined" style={inList ? { fontVariationSettings: '"FILL" 1' } : {}}>
                bookmark
              </span>
            </button>
            <button
              className={`movie-card__icon-btn${liked ? ' movie-card__icon-btn--liked' : ''}`}
              onClick={() => requireAuth(() => toggleLike(movie))}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <span className="material-symbols-outlined" style={liked ? { fontVariationSettings: '"FILL" 1' } : {}}>
                favorite
              </span>
            </button>

            {onTrailer && (
              <button
                className="movie-card__trailer-btn"
                onClick={() => onTrailer(movie)}
                aria-label="Watch trailer"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                Trailer
              </button>
            )}
          </div>
        </div>

        <span className="movie-card__genre-badge">{primaryGenre.toUpperCase()}</span>
      </article>
    </>
  );
}

export { MovieCard };
