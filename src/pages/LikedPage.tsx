import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLikes } from '../context/LikesContext';
import TrailerModal from '../components/TrailerModal';
import AuthGate from '../components/AuthGate';
import Seo from '../components/Seo';
import { useNavigate } from 'react-router-dom';
import { posterUrl, formatRating, releaseYear, getGenreNames } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './styles/LikedPage.scss';

type SortKey = 'liked' | 'rating' | 'title' | 'year';

export default function LikedPage() {
  const { liked, toggleLike } = useLikes();
  const navigate = useNavigate();
  const [sort, setSort] = useState<SortKey>('liked');
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  const sorted = liked.slice().sort((a, b) => {
    switch (sort) {
      case 'rating': return b.vote_average - a.vote_average;
      case 'title': return a.title.localeCompare(b.title);
      case 'year': return new Date(b.release_date).getFullYear() - new Date(a.release_date).getFullYear();
      default: return 0;
    }
  });

  return (
    <AuthGate icon="favorite" title="Your liked movies" subtitle="Sign in to save your favourite films and build your taste profile.">
      <Seo title="Liked Movies" description="Movies you've liked on FilmFlare." path="/liked" />
      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />

      <div className="liked-page">
        <div className="liked-page__header">
          <div>
            <p className="liked-page__label">Your Favourites</p>
            <h1 className="liked-page__title">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>
              Liked Movies
            </h1>
          </div>
          <span className="liked-page__count">{liked.length} films</span>
        </div>

        {liked.length === 0 ? (
          <div className="liked-page__empty">
            <span className="material-symbols-outlined liked-page__empty-icon">favorite_border</span>
            <h2>No liked movies yet</h2>
            <p>Heart movies as you browse to save them here.</p>
            <Link to="/" className="liked-page__empty-btn">Discover Movies</Link>
          </div>
        ) : (
          <>
            <div className="liked-page__controls">
              <select className="liked-page__sort" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort by">
                <option value="liked">Recently Liked</option>
                <option value="rating">Top Rated</option>
                <option value="title">A–Z</option>
                <option value="year">Newest First</option>
              </select>
            </div>

            <div className="liked-page__grid">
              {sorted.map(movie => {
                const poster = posterUrl(movie.poster_path);
                const genres = getGenreNames(movie.genre_ids);
                const primaryGenre = genres[0] ?? 'Movie';
                return (
                  <article key={movie.id} className="liked-card" onClick={() => navigate(`/movie/${movie.id}`)}>
                    <div className="liked-card__poster">
                      {poster
                        ? <img src={poster} alt={movie.title} loading="lazy" />
                        : <div className="liked-card__no-poster"><span className="material-symbols-outlined">movie</span></div>
                      }
                      <div className="liked-card__overlay">
                        <div className="liked-card__overlay-content">
                          <h3 className="liked-card__overlay-title">{movie.title}</h3>
                          <div className="liked-card__overlay-meta">
                            <span className="liked-card__overlay-rating">
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                              {formatRating(movie.vote_average)}
                            </span>
                            <span className="liked-card__overlay-dot" />
                            <span>{releaseYear(movie.release_date)}</span>
                          </div>
                          <div className="liked-card__overlay-actions" onClick={e => e.stopPropagation()}>
                            <button className="liked-card__btn liked-card__btn--trailer" onClick={() => setTrailerMovie(movie)}>
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                              Watch Trailer
                            </button>
                            <button className="liked-card__btn liked-card__btn--unlike" onClick={() => toggleLike(movie)}>
                              <span className="material-symbols-outlined">heart_minus</span>
                              Unlike
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="liked-card__badge">{primaryGenre.toUpperCase()}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AuthGate>
  );
}
