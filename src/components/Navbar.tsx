import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './styles/Navbar.scss';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { watchlist } = useWatchlist();
  const { user, loggedIn, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (q) {
      navigate(`/?q=${encodeURIComponent(q)}`);
      setSearchOpen(false);
      setSearchTerm('');
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? '?';
  const avatar = user?.avatar ?? '';

  return (
    <>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
        <div className="navbar__inner">

          <Link to="/" className="navbar__brand" aria-label="FilmFlare home">
            <img src="/app-logo-alt.png" alt="FilmFlare icon" className="navbar__logo-icon" />
            <span className="navbar__logo-text">FilmFlare</span>
          </Link>

          <div className="navbar__links">
            <Link to="/" className={`navbar__link${isActive('/') ? ' navbar__link--active' : ''}`}>Discover</Link>
            {loggedIn ? (
              <>
                <Link to="/watchlist" className={`navbar__link${isActive('/watchlist') ? ' navbar__link--active' : ''}`}>
                  Watchlist
                  {watchlist.length > 0 && <span className="navbar__badge">{watchlist.length}</span>}
                </Link>
                <Link to="/liked" className={`navbar__link${isActive('/liked') ? ' navbar__link--active' : ''}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: '"FILL" 1' }}>favorite</span>
                  Liked
                </Link>
                <Link to="/ai-pick" className={`navbar__link${isActive('/ai-pick') ? ' navbar__link--active' : ''}`}>AI Pick</Link>
              </>
            ) : (
              <button className="navbar__link navbar__link--guest" onClick={() => setAuthOpen(true)}>
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>
                Members
              </button>
            )}
          </div>

          <div className="navbar__actions">
            {searchOpen ? (
              <form className="navbar__search" onSubmit={handleSearch}>
                <span className="material-symbols-outlined navbar__search-icon">search</span>
                <input autoFocus type="text" placeholder="Search movies…" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} className="navbar__search-input" />
                <button type="button" className="navbar__search-close"
                  onClick={() => { setSearchOpen(false); setSearchTerm(''); }} aria-label="Close search">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </form>
            ) : (
              <button className="navbar__icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
                <span className="material-symbols-outlined">search</span>
              </button>
            )}

            {loggedIn ? (
              <div className="navbar__user" ref={dropdownRef}>
                <button className="navbar__avatar" onClick={() => setDropdownOpen(o => !o)} aria-label="User menu">
                  {avatar ? <img src={avatar} alt={user?.username} className="navbar__avatar-img" /> : initial}
                </button>
                {dropdownOpen && (
                  <div className="navbar__dropdown">
                    <div className="navbar__dropdown-header">
                      <span className="navbar__dropdown-name">{user?.username}</span>
                      <span className="navbar__dropdown-email">{user?.email}</span>
                    </div>
                    <div className="navbar__dropdown-divider" />
                    <Link to="/profile" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span className="material-symbols-outlined">manage_accounts</span>Edit Profile
                    </Link>
                    <Link to="/watchlist" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span className="material-symbols-outlined">bookmark</span>My Watchlist
                    </Link>
                    <Link to="/liked" className="navbar__dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>favorite</span>Liked Movies
                    </Link>
                    <div className="navbar__dropdown-divider" />
                    <button className="navbar__dropdown-item navbar__dropdown-item--danger" onClick={handleLogout}>
                      <span className="material-symbols-outlined">logout</span>Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="navbar__signin-btn" onClick={() => setAuthOpen(true)}>
                Sign In
              </button>
            )}
          </div>

        </div>
      </nav>
    </>
  );
}
