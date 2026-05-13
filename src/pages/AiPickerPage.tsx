import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdb } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import { posterUrl, formatRating, releaseYear, getGenreNames } from '../services/tmdb';
import { useWatchlist } from '../context/WatchlistContext';
import TrailerModal from '../components/TrailerModal';
import AuthGate from '../components/AuthGate';
import './styles/AiPickerPage.scss';

interface Suggestion {
  title: string;
  reason: string;
  year?: string;
}

const MOODS = [
  { label: 'Action-packed', icon: 'local_fire_department' },
  { label: 'Mind-bending', icon: 'psychology' },
  { label: 'Feel-good', icon: 'sentiment_very_satisfied' },
  { label: 'Romantic', icon: 'favorite' },
  { label: 'Scary', icon: 'skull' },
  { label: 'Epic adventure', icon: 'explore' },
  { label: 'Dark drama', icon: 'nights_stay' },
  { label: 'Laugh out loud', icon: 'mood' },
];

// OpenRouter via OpenAI-compatible endpoint (CORS-safe from browsers)
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

  // Strip markdown fences if present
  const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Try full parse first; fall back to extracting partial suggestions array
  let suggestions: Suggestion[];
  try {
    suggestions = JSON.parse(clean).suggestions;
  } catch {
    // Extract whatever complete suggestion objects exist from a truncated response
    const matches = [...clean.matchAll(/\{[^{}]*"title"\s*:\s*"([^"]+)"[^{}]*"year"\s*:\s*"([^"]*)"[^{}]*"reason"\s*:\s*"([^"]+)"\s*\}/g)];
    if (!matches.length) throw new Error('AI returned an unreadable response. Try again.');
    suggestions = matches.map(m => ({ title: m[1], year: m[2], reason: m[3] }));
  }

  if (!suggestions?.length) throw new Error('AI returned no suggestions. Try again.');
  return suggestions;
}

export default function AiPickerPage() {
  const navigate = useNavigate();
  const { toggleWatchlist, isInWatchlist } = useWatchlist();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Movie[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
  const [error, setError] = useState('');

  const pickMood = (mood: string) => setPrompt(mood);

  const searchMoviesForSuggestions = async (titles: Suggestion[]): Promise<Movie[]> => {
    const found: Movie[] = [];
    for (const s of titles.slice(0, 5)) {
      try {
        const res = await tmdb.search(s.title);
        if (res.results.length) found.push(res.results[0]);
      } catch { /* skip silently */ }
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
      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />

      <div className="ai-page">
        <div className="ai-page__header">
          <div className="ai-page__header-icon">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
          </div>
          <p className="ai-page__label">Powered by OpenRouter AI</p>
          <h1 className="ai-page__title">What are you in the mood for?</h1>
          <p className="ai-page__subtitle">Describe a vibe, genre, or theme and get personalised picks.</p>
        </div>

        <div className="ai-page__input-section">
          <div className="ai-page__moods">
            {MOODS.map(m => (
              <button
                key={m.label}
                className={`ai-page__mood-chip${prompt === m.label ? ' ai-page__mood-chip--active' : ''}`}
                onClick={() => pickMood(m.label)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>

          <div className="ai-page__textarea-wrap">
            <textarea
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

          <button
            className="ai-page__submit"
            onClick={handleAsk}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <>
                <div className="ai-page__spinner" />
                Thinking…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                Get AI Picks
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="ai-page__error">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Fallback: show text suggestions while TMDB results are loading */}
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

        {results.length > 0 && (
          <div className="ai-page__results">
            <h2 className="ai-page__results-title">Your Picks</h2>
            <div className="ai-page__results-grid">
              {results.map((movie, i) => {
                const inList = isInWatchlist(movie.id);
                const genres = getGenreNames(movie.genre_ids);
                const reason = suggestions[i]?.reason;

                return (
                  <div key={movie.id} className="ai-card" onClick={() => navigate(`/movie/${movie.id}`)}>
                    <div className="ai-card__poster">
                      {movie.poster_path ? (
                        <img src={posterUrl(movie.poster_path) ?? ''} alt={movie.title} loading="lazy" />
                      ) : (
                        <div className="ai-card__no-poster">
                          <span className="material-symbols-outlined">movie</span>
                        </div>
                      )}
                      <span className="ai-card__num">{i + 1}</span>
                    </div>

                    <div className="ai-card__info">
                      <h3 className="ai-card__title">{movie.title}</h3>

                      <div className="ai-card__meta">
                        <span className="ai-card__rating">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>star</span>
                          {formatRating(movie.vote_average)}
                        </span>
                        <span>{releaseYear(movie.release_date)}</span>
                        {genres[0] && <><span className="ai-card__dot" /><span>{genres[0]}</span></>}
                      </div>

                      {reason && <p className="ai-card__reason">"{reason}"</p>}

                      <div className="ai-card__actions" onClick={e => e.stopPropagation()}>
                        <button className="ai-card__trailer-btn" onClick={() => setTrailerMovie(movie)}>
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>play_arrow</span>
                          Trailer
                        </button>
                        <button
                          className={`ai-card__wl-btn${inList ? ' ai-card__wl-btn--active' : ''}`}
                          onClick={() => toggleWatchlist(movie)}
                          aria-label={inList ? 'Remove from watchlist' : 'Add to watchlist'}
                        >
                          <span className="material-symbols-outlined" style={inList ? { fontVariationSettings: '"FILL" 1' } : {}}>bookmark</span>
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
