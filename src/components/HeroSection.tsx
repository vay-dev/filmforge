import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { posterUrl, formatRating, releaseYear, getGenreNames } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './styles/HeroSection.scss';

interface Props {
  movies: Movie[];
  onTrailer: (movie: Movie) => void;
}

const INTERVAL_MS = 6000;

export default function HeroSection({ movies, onTrailer }: Props) {
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const [activeIdx, setActiveIdx] = useState(0);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (next: number) => {
    if (busyRef.current || next === activeIdx) return;
    busyRef.current = true;
    setActiveIdx(next);
    setTimeout(() => { busyRef.current = false; }, 800);
  };

  useEffect(() => {
    if (movies.length < 2) return;
    timerRef.current = setTimeout(() => {
      goTo((activeIdx + 1) % movies.length);
    }, INTERVAL_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIdx, movies.length]);

  useEffect(() => {
    setActiveIdx(0);
    busyRef.current = false;
  }, [movies]);

  if (!movies.length) {
    return <div className="hero hero--skeleton"><div className="skeleton" style={{ width: '100%', height: '100%' }} /></div>;
  }

  return (
    <section className="hero">
      {movies.map((movie, i) => {
        const isActive = i === activeIdx;
        const backdrop = posterUrl(movie.backdrop_path, 'original');
        const inList = isInWatchlist(movie.id);
        const genres = getGenreNames(movie.genre_ids);

        return (
          <div
            key={movie.id}
            className="hero__slide"
            style={{ opacity: isActive ? 1 : 0, pointerEvents: isActive ? 'auto' : 'none' }}
            aria-hidden={!isActive}
          >
            {backdrop && (
              <div className="hero__backdrop">
                <img src={backdrop} alt="" aria-hidden="true" loading="lazy" />
                <div className="hero__backdrop-overlay" />
              </div>
            )}

            <div className="hero__content">
              <div className="hero__meta">
                {genres.slice(0, 3).map(g => (
                  <span key={g} className="hero__genre-pill">{g}</span>
                ))}
              </div>

              <h1 className="hero__title">{movie.title}</h1>

              <div className="hero__info">
                <div className="hero__rating">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                  {formatRating(movie.vote_average)}
                  <span className="hero__info-sep" />
                </div>
                <span>{releaseYear(movie.release_date)}</span>
              </div>

              {movie.overview && (
                <p className="hero__overview">{movie.overview}</p>
              )}

              <div className="hero__actions">
                <button className="hero__btn hero__btn--primary" onClick={() => onTrailer(movie)}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                  Watch Trailer
                </button>

                <button
                  className={`hero__btn hero__btn--ghost${inList ? ' hero__btn--bookmarked' : ''}`}
                  onClick={() => toggleWatchlist(movie)}
                >
                  <span className="material-symbols-outlined" style={inList ? { fontVariationSettings: '"FILL" 1' } : {}}>
                    bookmark
                  </span>
                  {inList ? 'In Watchlist' : 'Add to Watchlist'}
                </button>

                <button
                  className="hero__btn hero__btn--icon"
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  aria-label="More info"
                >
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </div>

            <div className="hero__grain" aria-hidden="true" />
          </div>
        );
      })}

      {movies.length > 1 && (
        <div className="hero__dots">
          {movies.map((_, i) => (
            <button
              key={i}
              className={`hero__dot${i === activeIdx ? ' hero__dot--active' : ''}`}
              onClick={() => {
                if (timerRef.current) clearTimeout(timerRef.current);
                goTo(i);
              }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
