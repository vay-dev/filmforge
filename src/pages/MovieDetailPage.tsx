import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdb, posterUrl, formatRating } from '../services/tmdb';
import type { MovieDetail, Cast, Movie } from '../services/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import { useLikes } from '../context/LikesContext';
import { useAuth } from '../context/AuthContext';
import MovieRow from '../components/MovieRow';
import TrailerModal from '../components/TrailerModal';
import AuthModal from '../components/AuthModal';
import Seo from '../components/Seo';
import './styles/MovieDetailPage.scss';

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isInWatchlist, toggleWatchlist } = useWatchlist();
  const { isLiked, toggleLike } = useLikes();
  const { loggedIn } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [cast, setCast] = useState<Cast[]>([]);
  const [similar, setSimilar] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTrailer, setShowTrailer] = useState(false);

  const movieId = Number(id);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    setError('');
    window.scrollTo({ top: 0 });

    Promise.all([
      tmdb.detail(movieId),
      tmdb.credits(movieId),
      tmdb.recommendations(movieId),
    ])
      .then(([detail, credits, recs]) => {
        setMovie(detail);
        setCast(credits.cast.slice(0, 12));
        setSimilar(recs.results);
      })
      .catch(() => setError('Failed to load movie details.'))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) return <DetailSkeleton />;
  if (error || !movie) {
    return (
      <div className="detail-page detail-page--error">
        <span className="material-symbols-outlined">error</span>
        <h2>{error || 'Movie not found'}</h2>
        <button onClick={() => navigate(-1)}>Go back</button>
      </div>
    );
  }

  const backdrop = posterUrl(movie.backdrop_path, 'original');
  const poster = posterUrl(movie.poster_path);
  const inList = isInWatchlist(movie.id);
  const liked = isLiked(movie.id);
  const movieAsBase: Movie = {
    ...movie,
    genre_ids: movie.genres.map(g => g.id),
  };

  const formatRuntime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <>
      {showTrailer && (
        <TrailerModal movie={movieAsBase} onClose={() => setShowTrailer(false)} />
      )}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <div className="detail-page">
        <Seo
          title={movie.title}
          description={movie.overview?.slice(0, 155) || undefined}
          path={`/movie/${movie.id}`}
          image={movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined}
          type="article"
          jsonLd={{
            '@context': 'https://schema.org',
            '@type': 'Movie',
            name: movie.title,
            description: movie.overview,
            dateCreated: movie.release_date,
            image: posterUrl(movie.poster_path) ?? undefined,
          }}
        />
        {/* Backdrop */}
        {backdrop && (
          <div className="detail-page__backdrop">
            <img src={backdrop} alt="" aria-hidden="true" />
            <div className="detail-page__backdrop-overlay" />
          </div>
        )}

        <div className="detail-page__content">
          <button className="detail-page__back" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back</span>
            Back
          </button>

          <div className="detail-page__main">
            {/* Poster */}
            <div className="detail-page__poster">
              {poster ? (
                <img src={poster} alt={movie.title} />
              ) : (
                <div className="detail-page__no-poster">
                  <span className="material-symbols-outlined">movie</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="detail-page__info">
              {movie.tagline && <p className="detail-page__tagline">"{movie.tagline}"</p>}
              <h1 className="detail-page__title">{movie.title}</h1>

              <div className="detail-page__genres">
                {movie.genres.map(g => (
                  <span key={g.id} className="detail-page__genre-pill">{g.name}</span>
                ))}
              </div>

              <div className="detail-page__stats">
                <div className="detail-page__stat">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                  <strong>{formatRating(movie.vote_average)}</strong>
                  <span>/ 10</span>
                </div>
                {movie.release_date && (
                  <div className="detail-page__stat">
                    <span className="material-symbols-outlined">calendar_today</span>
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
                {movie.runtime > 0 && (
                  <div className="detail-page__stat">
                    <span className="material-symbols-outlined">schedule</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
                {movie.original_language && (
                  <div className="detail-page__stat">
                    <span className="material-symbols-outlined">language</span>
                    <span>{movie.original_language.toUpperCase()}</span>
                  </div>
                )}
              </div>

              {movie.overview && (
                <p className="detail-page__overview">{movie.overview}</p>
              )}

              <div className="detail-page__actions">
                <button className="detail-page__btn detail-page__btn--primary" onClick={() => setShowTrailer(true)}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                  Watch Trailer
                </button>
                <button
                  className={`detail-page__btn detail-page__btn--ghost${inList ? ' detail-page__btn--bookmarked' : ''}`}
                  onClick={() => loggedIn ? toggleWatchlist(movieAsBase) : setAuthOpen(true)}
                >
                  <span className="material-symbols-outlined" style={inList ? { fontVariationSettings: '"FILL" 1' } : {}}>bookmark</span>
                  {inList ? 'In Watchlist' : 'Add to Watchlist'}
                </button>
                <button
                  className={`detail-page__btn detail-page__btn--ghost${liked ? ' detail-page__btn--liked' : ''}`}
                  onClick={() => loggedIn ? toggleLike(movieAsBase) : setAuthOpen(true)}
                  aria-label={liked ? 'Unlike' : 'Like this movie'}
                >
                  <span className="material-symbols-outlined" style={liked ? { fontVariationSettings: '"FILL" 1' } : {}}>favorite</span>
                  {liked ? 'Liked' : 'Like'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="detail-page__section">
            <h2 className="detail-page__section-title">Cast</h2>
            <div className="detail-page__cast">
              {cast.map(actor => (
                <div key={actor.id} className="cast-card">
                  <div className="cast-card__avatar">
                    {actor.profile_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        loading="lazy"
                      />
                    ) : (
                      <span className="material-symbols-outlined">person</span>
                    )}
                  </div>
                  <p className="cast-card__name">{actor.name}</p>
                  <p className="cast-card__char">{actor.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* More Like This */}
        {similar.length > 0 && (
          <div className="detail-page__similar">
            <MovieRow
              title="More Like This"
              movies={similar}
              onTrailer={(m) => {
                navigate(`/movie/${m.id}`);
              }}
            />
          </div>
        )}
      </div>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="detail-page detail-page--loading">
      <div className="detail-page__content">
        <div className="detail-page__main">
          <div className="skeleton detail-page__poster-skeleton" />
          <div className="detail-page__info" style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '60%', height: 16, borderRadius: 4, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '90%', height: 40, borderRadius: 6, marginBottom: 20 }} />
            <div className="skeleton" style={{ width: '40%', height: 24, borderRadius: 4, marginBottom: 16 }} />
            <div className="skeleton" style={{ width: '100%', height: 80, borderRadius: 6 }} />
          </div>
        </div>
      </div>
    </div>
  );
}
