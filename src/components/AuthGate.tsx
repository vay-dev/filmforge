import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import type { ReactNode } from 'react';
import './styles/AuthGate.scss';

interface Props {
  children: ReactNode;
  icon?: string;
  title?: string;
  subtitle?: string;
}

export default function AuthGate({ children, icon = 'lock', title = 'Sign in to continue', subtitle = 'Create a free account to access this feature.' }: Props) {
  const { loggedIn, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  if (loading) return null;

  if (!loggedIn) {
    return (
      <>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
        <div className="auth-gate">
          <div className="auth-gate__icon">
            <span className="material-symbols-outlined">{icon}</span>
          </div>
          <h2 className="auth-gate__title">{title}</h2>
          <p className="auth-gate__subtitle">{subtitle}</p>
          <button className="auth-gate__btn" onClick={() => setAuthOpen(true)}>
            <span className="material-symbols-outlined">login</span>
            Sign In / Register
          </button>
        </div>
      </>
    );
  }

  return <>{children}</>;
}
