import { useEffect, useState, useRef } from 'react';
import { tmdb } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './styles/TrailerModal.scss';

interface Props {
  movie: Movie | null;
  onClose: () => void;
}

export default function TrailerModal({ movie, onClose }: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!movie) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [movie, onClose]);

  if (!movie) return null;

  return (
    <div
      className="trailer-modal"
      ref={backdropRef}
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Trailer: ${movie.title}`}
    >
      <div className="trailer-modal__box">
        <div className="trailer-modal__header">
          <h2 className="trailer-modal__title">{movie.title}</h2>
          <button className="trailer-modal__close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="trailer-modal__embed">
          <TrailerEmbed movieId={movie.id} />
        </div>
      </div>
    </div>
  );
}

function TrailerEmbed({ movieId }: { movieId: number }) {
  const [loading, setLoading] = useState(true);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [noTrailer, setNoTrailer] = useState(false);

  useEffect(() => {
    setLoading(true);
    setVideoKey(null);
    setNoTrailer(false);
    tmdb.videos(movieId)
      .then(data => {
        const trailer =
          data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ??
          data.results.find(v => v.site === 'YouTube' && v.type === 'Teaser') ??
          data.results.find(v => v.site === 'YouTube');
        if (trailer) {
          setVideoKey(trailer.key);
        } else {
          setNoTrailer(true);
        }
      })
      .catch(() => setNoTrailer(true))
      .finally(() => setLoading(false));
  }, [movieId]);

  if (loading) {
    return (
      <div className="trailer-modal__state">
        <div className="trailer-modal__spinner" />
      </div>
    );
  }

  if (noTrailer || !videoKey) {
    return (
      <div className="trailer-modal__state">
        <span className="material-symbols-outlined trailer-modal__no-icon">videocam_off</span>
        <p>No trailer available for this film.</p>
      </div>
    );
  }

  return (
    <iframe
      title="Trailer"
      src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
      allow="autoplay; encrypted-media; fullscreen"
      allowFullScreen
    />
  );
}
