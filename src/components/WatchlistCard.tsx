import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { posterUrl, formatRating, releaseYear, getGenreNames } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './styles/WatchlistCard.scss';

interface Props {
  movie: Movie;
  onTrailer?: (movie: Movie) => void;
}

export default function WatchlistCard({ movie, onTrailer }: Props) {
  const navigate = useNavigate();
  const { toggleWatchlist } = useWatchlist();
  const poster = posterUrl(movie.poster_path);
  const genres = getGenreNames(movie.genre_ids);
  const primaryGenre = genres[0] ?? 'Movie';

  return (
    <article className="wl-card" onClick={() => navigate(`/movie/${movie.id}`)}>
      <div className="wl-card__poster">
        {poster ? (
          <img src={poster} alt={movie.title} loading="lazy" />
        ) : (
          <div className="wl-card__no-poster">
            <span className="material-symbols-outlined">movie</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="wl-card__overlay">
          <div className="wl-card__overlay-content">
            <h3 className="wl-card__overlay-title">{movie.title}</h3>

            <div className="wl-card__overlay-meta">
              <div className="wl-card__overlay-rating">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                {formatRating(movie.vote_average)}
              </div>
              <span className="wl-card__overlay-dot" />
              <span>{releaseYear(movie.release_date)}</span>
              {primaryGenre && <><span className="wl-card__overlay-dot" /><span>{primaryGenre}</span></>}
            </div>

            <div className="wl-card__overlay-actions" onClick={e => e.stopPropagation()}>
              {onTrailer && (
                <button
                  className="wl-card__btn wl-card__btn--trailer"
                  onClick={() => onTrailer(movie)}
                >
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                  Watch Trailer
                </button>
              )}
              <button
                className="wl-card__btn wl-card__btn--remove"
                onClick={() => toggleWatchlist(movie)}
                aria-label="Remove from watchlist"
              >
                <span className="material-symbols-outlined">delete</span>
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <span className="wl-card__genre-badge">{primaryGenre.toUpperCase()}</span>
    </article>
  );
}
