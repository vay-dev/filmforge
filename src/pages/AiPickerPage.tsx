import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdb } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import { posterUrl, formatRating, releaseYear, getGenreNames } from '../services/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import TrailerModal from '../components/TrailerModal';
import AuthGate from '../components/AuthGate';
import Seo from '../components/Seo';
import './styles/AiPickerPage.scss';

interface Suggestion {
  title: string;
  reason: string;
  year?: string;
}

const MOODS = [
  { label: 'Action-packed', icon: 'local_fire_department', color: '#ff6b35' },
  { label: 'Mind-bending', icon: 'psychology', color: '#a78bfa' },
  { label: 'Feel-good', icon: 'sentiment_very_satisfied', color: '#34d399' },
  { label: 'Romantic', icon: 'favorite', color: '#f472b6' },
  { label: 'Scary', icon: 'skull', color: '#94a3b8' },
  { label: 'Epic adventure', icon: 'explore', color: '#f5a623' },
  { label: 'Dark drama', icon: 'nights_stay', color: '#818cf8' },
  { label: 'Laugh out loud', icon: 'mood', color: '#fbbf24' },
];

const TYPEWRITER_TEXT = "What are you in the mood for?";

async function callOpenRouter(userPrompt: string): Promise<Suggestion[]> {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const model = import.meta.env.VITE_AI_MODEL ?? 'openrouter/free';

  if (!apiKey || apiKey === 'your-openrouter-api-key-here') {
    throw new Error('Add your VITE_OPENROUTER_API_KEY to .env to enable AI picks.');
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'FilmFlare',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      messages: [
        {
          role: 'system',
          content: 'You are a film recommendation assistant. Respond ONLY with a valid JSON object — no reasoning, no preamble, no markdown. Output must be parseable JSON immediately.',
        },
        {
          role: 'user',
          content: `Suggest 5 movies for: "${userPrompt}". Reply with ONLY this JSON, nothing else:\n{"suggestions":[{"title":"Movie Title","year":"2021","reason":"One sentence why."},{"title":"Movie Title","year":"2019","reason":"One sentence why."},{"title":"Movie Title","year":"2017","reason":"One sentence why."},{"title":"Movie Title","year":"2015","reason":"One sentence why."},{"title":"Movie Title","year":"2010","reason":"One sentence why."}]}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('Invalid OpenRouter API key. Check VITE_OPENROUTER_API_KEY in .env');
    if (res.status === 429) throw new Error('Rate limited. Try again in a moment.');
    throw new Error(`AI error ${res.status}: ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  const text: string = data.choices?.[0]?.message?.content ?? '';
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let suggestions: Suggestion[];
  try {
    suggestions = JSON.parse(clean).suggestions;
  } catch {
    const matches = [...clean.matchAll(/\{[^{}]*"title"\s*:\s*"([^"]+)"[^{}]*"year"\s*:\s*"([^"]*)"[^{}]*"reason"\s*:\s*"([^"]+)"\s*\}/g)];
    if (!matches.length) throw new Error('AI returned an unreadable response. Try again.');
    suggestions = matches.map(m => ({ title: m[1], year: m[2], reason: m[3] }));
  }

  if (!suggestions?.length) throw new Error('AI returned no suggestions. Try again.');
  return suggestions;
}

function TypewriterTitle() {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      setDisplayed(TYPEWRITER_TEXT.slice(0, i + 1));
      i++;
      if (i >= TYPEWRITER_TEXT.length) {
        clearInterval(timer);
        setDone(true);
      }
    }, 45);
    return () => clearInterval(timer);
  }, []);

  return (
    <h1 className="ai-page__title">
      {displayed}
      {!done && <span className="ai-page__cursor" aria-hidden="true" />}
    </h1>
  );
}

// Pre-generated stable random values — never re-randomise on re-render
const METEOR_DATA = Array.from({ length: 14 }, () => ({
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 3}s`,
  duration: `${2.5 + Math.random() * 4}s`,
}));

const STAR_DATA = Array.from({ length: 120 }, (_, i) => ({
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 1 + Math.random() * 2,
  delay: `${Math.random() * 4}s`,
  duration: `${2 + Math.random() * 4}s`,
  opacity: 0.2 + Math.random() * 0.7,
  // every 3rd = warm gold, every 5th = purple, every 7th = halo glow
  gold: i % 3 === 0,
  purple: i % 5 === 0,
  halo: i % 7 === 0,
}));

function CosmicBackground() {
  const [phase, setPhase] = useState<'meteors' | 'transitioning' | 'stars'>('meteors');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transitioning'), 5000);
    const t2 = setTimeout(() => setPhase('stars'), 6500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="cosmic-bg" aria-hidden="true">
      <div className="cosmic-bg__orb cosmic-bg__orb--1" />
      <div className="cosmic-bg__orb cosmic-bg__orb--2" />

      {/* Meteors — fade out after 5s */}
      <div className={`cosmic-bg__meteors${phase !== 'meteors' ? ' cosmic-bg__meteors--out' : ''}`}>
        {METEOR_DATA.map((m, i) => (
          <span
            key={i}
            className="cosmic-bg__meteor"
            style={{ left: m.left, animationDelay: m.delay, animationDuration: m.duration }}
          />
        ))}
      </div>

      {/* Stars — fade in after transition */}
      <div className={`cosmic-bg__stars${phase === 'stars' || phase === 'transitioning' ? ' cosmic-bg__stars--in' : ''}`}>
        {STAR_DATA.map((s, i) => (
          <span
            key={i}
            className={[
              'cosmic-bg__star',
              s.gold   ? 'cosmic-bg__star--gold'   : '',
              s.purple ? 'cosmic-bg__star--purple'  : '',
              s.halo   ? 'cosmic-bg__star--halo'    : '',
            ].filter(Boolean).join(' ')}
            style={{
              left: s.left,
              top: s.top,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: s.delay,
              animationDuration: s.duration,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function FilmReelLoader() {
  return (
    <div className="ai-loader" aria-label="AI is thinking">
      <div className="ai-loader__reel">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="ai-loader__hole" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="ai-loader__strip">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="ai-loader__frame" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="ai-loader__text">
        <span>Scanning the archive</span>
        <span className="ai-loader__dots">
          <span>.</span><span>.</span><span>.</span>
        </span>
      </p>
    </div>
  );
}

export default function AiPickerPage() {
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [error, setError] = useState('');
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stagger results reveal
  useEffect(() => {
    if (results.length === 0) { setVisibleCount(0); return; }
    setVisibleCount(0);
    results.forEach((_, i) => {
      setTimeout(() => setVisibleCount(i + 1), i * 150);
    });
  }, [results]);

  const pickMood = (mood: string) => {
    setActiveMood(mood);
    setPrompt(mood);
    textareaRef.current?.focus();
  };

  const searchMoviesForSuggestions = async (titles: Suggestion[]): Promise<Movie[]> => {
    const found: Movie[] = [];
    for (const s of titles.slice(0, 5)) {
      try {
        const res = await tmdb.search(s.title);
        if (res.results.length) found.push(res.results[0]);
      } catch { /* skip */ }
    }
    return found;
  };

  const handleAsk = async () => {
    const q = prompt.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setResults([]);
    setSuggestions([]);
    setVisibleCount(0);

    try {
      const aiSuggestions = await callOpenRouter(q);
      setSuggestions(aiSuggestions);
      const movies = await searchMoviesForSuggestions(aiSuggestions);
      setResults(movies);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate icon="auto_awesome" title="AI-powered picks" subtitle="Sign in to get personalised movie recommendations powered by AI.">
      <Seo
        title="AI Movie Picker"
        description="Tell FilmFlare your mood and get AI-powered movie recommendations personalised just for you."
        path="/ai-pick"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'FilmFlare AI Movie Picker',
          url: 'https://enhanced-film-flare.vercel.app/ai-pick',
          description: 'Describe your mood or a genre and get personalised AI-powered movie recommendations instantly.',
          applicationCategory: 'EntertainmentApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
        }}
      />
      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />

      <div className="ai-page">
        <CosmicBackground />

        {/* Header */}
        <div className="ai-page__header">
          <div className="ai-page__header-badge">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
            <span>Powered by OpenRouter AI</span>
          </div>
          <TypewriterTitle />
          <p className="ai-page__subtitle">Describe a vibe, genre, director, or era — and get handpicked films.</p>
        </div>

        {/* Mood chips */}
        <div className="ai-page__moods">
          {MOODS.map(m => (
            <button
              key={m.label}
              className={`ai-page__mood-chip${activeMood === m.label ? ' ai-page__mood-chip--active' : ''}`}
              style={activeMood === m.label ? { '--mood-color': m.color } as React.CSSProperties : {}}
              onClick={() => pickMood(m.label)}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="ai-page__input-wrap">
          <div className={`ai-page__input-glow${prompt ? ' ai-page__input-glow--active' : ''}`} />
          <textarea
            ref={textareaRef}
            className="ai-page__textarea"
            placeholder="e.g. A slow-burn psychological thriller set in the 80s with an unreliable narrator…"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            maxLength={300}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk(); }}
          />
          <span className="ai-page__char-count">{prompt.length}/300</span>
        </div>

        {/* Submit */}
        <button
          className="ai-page__submit"
          onClick={handleAsk}
          disabled={loading || !prompt.trim()}
        >
          <div className="ai-page__submit-shimmer" aria-hidden="true" />
          {loading ? (
            <>
              <div className="ai-page__submit-spinner" />
              Thinking…
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
              Get AI Picks
            </>
          )}
        </button>

        {/* Hint */}
        <p className="ai-page__hint">
          <span className="material-symbols-outlined">keyboard</span>
          Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to submit
        </p>

        {/* Error */}
        {error && (
          <div className="ai-page__error">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && <FilmReelLoader />}

        {/* Fallback text suggestions */}
        {suggestions.length > 0 && results.length === 0 && !loading && (
          <div className="ai-page__text-suggestions">
            <h2 className="ai-page__results-title">AI Picks</h2>
            {suggestions.map((s, i) => (
              <div key={i} className="ai-page__text-suggestion">
                <span className="ai-page__text-suggestion-num">{i + 1}</span>
                <div>
                  <strong>{s.title}</strong>
                  {s.year && <span className="ai-page__text-suggestion-year"> ({s.year})</span>}
                  <p>{s.reason}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 && (
          <div className="ai-page__results">
            <div className="ai-page__results-header">
              <h2 className="ai-page__results-title">Your Picks</h2>
              <span className="ai-page__results-count">{results.length} films curated for you</span>
            </div>
            <div className="ai-page__results-grid">
              {results.map((movie, i) => {
                const inList = isInWatchlist(movie.id);
                const genres = getGenreNames(movie.genre_ids);
                const reason = suggestions[i]?.reason;
                const isVisible = i < visibleCount;
                const poster = posterUrl(movie.poster_path);

                return (
                  <div
                    key={movie.id}
                    className={`ai-result-card${isVisible ? ' ai-result-card--visible' : ''}`}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                    style={{ transitionDelay: `${i * 80}ms` }}
                  >
                    {/* Backdrop blur behind card */}
                    {poster && (
                      <div className="ai-result-card__bg-blur" style={{ backgroundImage: `url(${poster})` }} aria-hidden="true" />
                    )}

                    <div className="ai-result-card__poster">
                      {poster ? (
                        <img src={poster} alt={movie.title} loading="lazy" />
                      ) : (
                        <div className="ai-result-card__no-poster">
                          <span className="material-symbols-outlined">movie</span>
                        </div>
                      )}
                      <span className="ai-result-card__rank">#{i + 1}</span>
                    </div>

                    <div className="ai-result-card__body">
                      <div className="ai-result-card__top">
                        <h3 className="ai-result-card__title">{movie.title}</h3>
                        <div className="ai-result-card__rating">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          {formatRating(movie.vote_average)}
                        </div>
                      </div>

                      <div className="ai-result-card__meta">
                        <span>{releaseYear(movie.release_date)}</span>
                        {genres[0] && <><span className="ai-result-card__dot" /><span>{genres[0]}</span></>}
                        {genres[1] && <><span className="ai-result-card__dot" /><span>{genres[1]}</span></>}
                      </div>

                      {reason && (
                        <blockquote className="ai-result-card__reason">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>format_quote</span>
                          {reason}
                        </blockquote>
                      )}

                      <div className="ai-result-card__actions" onClick={e => e.stopPropagation()}>
                        <button className="ai-result-card__trailer-btn" onClick={() => setTrailerMovie(movie)}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_circle</span>
                          Watch Trailer
                        </button>
                        <button
                          className={`ai-result-card__wl-btn${inList ? ' ai-result-card__wl-btn--active' : ''}`}
                          onClick={() => toggleWatchlist(movie)}
                          aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
                        >
                          <span className="material-symbols-outlined" style={inList ? { fontVariationSettings: '"FILL" 1' } : {}}>bookmark</span>
                          {inList ? 'Saved' : 'Save'}
                        </button>
                        <button
                          className="ai-result-card__detail-btn"
                          onClick={() => navigate(`/movie/${movie.id}`)}
                          aria-label="View details"
                        >
                          <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
