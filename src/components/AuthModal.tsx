import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './styles/AuthModal.scss';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Tab = 'login' | 'register';

export default function AuthModal({ open, onClose }: Props) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [open, tab]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const reset = () => { setUsername(''); setEmail(''); setPassword(''); setPassword2(''); setError(''); setShowPw(false); };
  const switchTab = (t: Tab) => { setTab(t); reset(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'register' && password !== password2) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      if (tab === 'login') await login(username, password);
      else await register(username, email, password, password2);
      onClose();
      reset();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal__overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal" role="dialog" aria-modal="true">
        <button className="auth-modal__close" onClick={onClose} aria-label="Close">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="auth-modal__brand">
          <img src="/app-logo-alt.png" alt="" className="auth-modal__logo" aria-hidden="true" />
          <span className="auth-modal__wordmark">FilmFlare</span>
        </div>

        <div className="auth-modal__tabs">
          <button className={`auth-modal__tab${tab === 'login' ? ' auth-modal__tab--active' : ''}`} onClick={() => switchTab('login')}>Sign In</button>
          <button className={`auth-modal__tab${tab === 'register' ? ' auth-modal__tab--active' : ''}`} onClick={() => switchTab('register')}>Create Account</button>
        </div>

        <form className="auth-modal__form" onSubmit={handleSubmit} noValidate>
          <div className="auth-modal__field">
            <label className="auth-modal__label">Username</label>
            <div className="auth-modal__input-wrap">
              <span className="material-symbols-outlined">person</span>
              <input ref={firstInputRef} className="auth-modal__input" type="text" value={username}
                onChange={e => setUsername(e.target.value)} placeholder="your_username" required autoComplete="username" />
            </div>
          </div>

          {tab === 'register' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label">Email</label>
              <div className="auth-modal__input-wrap">
                <span className="material-symbols-outlined">mail</span>
                <input className="auth-modal__input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
              </div>
            </div>
          )}

          <div className="auth-modal__field">
            <label className="auth-modal__label">Password</label>
            <div className="auth-modal__input-wrap">
              <span className="material-symbols-outlined">lock</span>
              <input className="auth-modal__input" type={showPw ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', display: 'flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPw ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div className="auth-modal__field">
              <label className="auth-modal__label">Confirm Password</label>
              <div className="auth-modal__input-wrap">
                <span className="material-symbols-outlined">lock</span>
                <input className="auth-modal__input" type="password" value={password2}
                  onChange={e => setPassword2(e.target.value)} placeholder="••••••••" required autoComplete="new-password" />
              </div>
            </div>
          )}

          {error && (
            <div className="auth-modal__error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <button className="auth-modal__submit" type="submit" disabled={loading}>
            {loading && <span className="auth-modal__spinner" />}
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="auth-modal__divider">or</div>

          <button type="button" className="auth-modal__guest" onClick={onClose}>
            Continue as guest
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </form>
      </div>
    </div>
  );
}
