import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import MovieCard from './movieCard';
import type { Movie } from '../services/tmdb';
import './styles/MovieRow.scss';

interface Props {
  title: string;
  badge?: string;
  movies: Movie[];
  loading?: boolean;
  onTrailer: (movie: Movie) => void;
  onLoadMore?: () => Promise<void>;
  hasMore?: boolean;
}

export default function MovieRow({ title, badge, movies, loading = false, onTrailer, onLoadMore, hasMore = false }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    dragFree: true,
    containScroll: 'trimSnaps',
    slidesToScroll: 'auto',
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const updateButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  // Infinite scroll — load more when near the end
  const onScroll = useCallback(async () => {
    if (!emblaApi || !onLoadMore || !hasMore || loadingMore) return;
    const offset = emblaApi.scrollProgress() || 0;
    if (offset >= 0.85) {
      setLoadingMore(true);
      await onLoadMore();
      setLoadingMore(false);
    }
  }, [emblaApi, onLoadMore, hasMore, loadingMore]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', updateButtons);
    emblaApi.on('reInit', updateButtons);
    emblaApi.on('scroll', onScroll);
    updateButtons();
    return () => {
      emblaApi.off('select', updateButtons);
      emblaApi.off('reInit', updateButtons);
      emblaApi.off('scroll', onScroll);
    };
  }, [emblaApi, updateButtons, onScroll]);

  // Re-init when movies array grows (infinite load)
  useEffect(() => {
    emblaApi?.reInit();
  }, [movies.length, emblaApi]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (loading && movies.length === 0) {
    return (
      <section className="movie-row">
        <div className="movie-row__header">
          <div className="skeleton" style={{ width: 200, height: 26, borderRadius: 6 }} />
        </div>
        <div className="movie-row__viewport">
          <div className="movie-row__container">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="movie-row__slide">
                <div className="movie-row__skeleton-card skeleton" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!loading && movies.length === 0) return null;

  return (
    <section className="movie-row">
      <div className="movie-row__header">
        <h2 className="movie-row__title">
          {title}
          {badge && <span className="movie-row__badge">{badge}</span>}
        </h2>
        <div className="movie-row__arrows">
          <button
            className="movie-row__arrow"
            onClick={scrollPrev}
            disabled={!canPrev}
            aria-label="Scroll left"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            className="movie-row__arrow"
            onClick={scrollNext}
            disabled={!canNext}
            aria-label="Scroll right"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Embla viewport — handles touch/mouse drag natively */}
      <div className="movie-row__viewport" ref={emblaRef}>
        <div className="movie-row__container">
          {movies.map(movie => (
            <div key={movie.id} className="movie-row__slide">
              <MovieCard movie={movie} onTrailer={onTrailer} />
            </div>
          ))}
          {loadingMore && (
            <div className="movie-row__slide movie-row__slide--loading">
              <div className="movie-row__spinner" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
