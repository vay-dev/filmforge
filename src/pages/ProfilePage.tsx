import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../services/api';
import AuthGate from '../components/AuthGate';
import { useWatchlist } from '../context/WatchlistContext';
import { useLikes } from '../context/LikesContext';
import './styles/ProfilePage.scss';

type Tab = 'profile' | 'password';

export default function ProfilePage() {
  return (
    <AuthGate icon="person" title="Sign in to view your profile" subtitle="Manage your account details and preferences.">
      <ProfileContent />
    </AuthGate>
  );
}

function ProfileContent() {
  const { user, updateUser } = useAuth();
  const { watchlist } = useWatchlist();
  const { liked } = useLikes();
  const [tab, setTab] = useState<Tab>('profile');

  // Profile form
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Avatar upload
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar ?? '');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username ?? '';
  const initial = user?.username?.[0]?.toUpperCase() ?? '?';

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'err', text: 'Please select an image file (jpg, png, webp…).' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({ type: 'err', text: 'Image must be under 5 MB.' });
      return;
    }

    // Optimistic local preview
    const reader = new FileReader();
    reader.onload = e => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    setAvatarMsg(null);
    try {
      const updated = await auth.uploadAvatar(file);
      // Replace optimistic preview with the real server URL
      setAvatarPreview(updated.avatar ?? '');
      // Sync auth context
      await updateUser({ bio });
      setAvatarMsg({ type: 'ok', text: 'Profile picture updated.' });
    } catch (err: unknown) {
      setAvatarPreview(user?.avatar ?? '');
      setAvatarMsg({ type: 'err', text: err instanceof Error ? err.message : 'Upload failed.' });
    } finally {
      setAvatarUploading(false);
    }
  }, [bio, updateUser, user?.avatar]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await updateUser({ first_name: firstName, last_name: lastName, email, bio });
      setProfileMsg({ type: 'ok', text: 'Profile updated successfully.' });
    } catch (err: unknown) {
      setProfileMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to save changes.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    if (newPass.length < 8) {
      setPassMsg({ type: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    setPassSaving(true);
    setPassMsg(null);
    try {
      await auth.changePassword(oldPass, newPass);
      setPassMsg({ type: 'ok', text: 'Password changed successfully.' });
      setOldPass(''); setNewPass(''); setConfirmPass('');
    } catch (err: unknown) {
      setPassMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="profile-page">
      {/* ── Sidebar ── */}
      <aside className="profile-page__sidebar">
        <div className="profile-page__avatar-wrap">
          {avatarPreview ? (
            <img src={avatarPreview} alt={displayName} className="profile-page__avatar-img" />
          ) : (
            <div className="profile-page__avatar-placeholder">{initial}</div>
          )}
          {avatarUploading && <div className="profile-page__avatar-uploading"><div className="profile-page__avatar-spinner" /></div>}
        </div>

        <div className="profile-page__identity">
          <span className="profile-page__displayname">{displayName || user?.username}</span>
          <span className="profile-page__username">@{user?.username}</span>
          <span className="profile-page__email-badge">{user?.email}</span>
        </div>

        <div className="profile-page__stats">
          <div className="profile-page__stat">
            <span className="profile-page__stat-value">{watchlist.length}</span>
            <span className="profile-page__stat-label">Watchlist</span>
          </div>
          <div className="profile-page__stat-divider" />
          <div className="profile-page__stat">
            <span className="profile-page__stat-value">{liked.length}</span>
            <span className="profile-page__stat-label">Liked</span>
          </div>
        </div>

        {bio && <p className="profile-page__bio-preview">{bio}</p>}

        <nav className="profile-page__nav">
          <button
            className={`profile-page__nav-item${tab === 'profile' ? ' profile-page__nav-item--active' : ''}`}
            onClick={() => setTab('profile')}
          >
            <span className="material-symbols-outlined">person</span>
            Edit Profile
          </button>
          <button
            className={`profile-page__nav-item${tab === 'password' ? ' profile-page__nav-item--active' : ''}`}
            onClick={() => setTab('password')}
          >
            <span className="material-symbols-outlined">lock</span>
            Change Password
          </button>
        </nav>
      </aside>

      {/* ── Main panel ── */}
      <main className="profile-page__main">
        {tab === 'profile' && (
          <form className="profile-page__form" onSubmit={handleProfileSave}>
            <div className="profile-page__form-header">
              <h2 className="profile-page__form-title">Edit Profile</h2>
              <p className="profile-page__form-subtitle">Update your public information and preferences.</p>
            </div>

            {/* Avatar upload */}
            <div className="profile-page__field">
              <label className="profile-page__label">Profile Picture</label>
              <div
                className={`profile-page__drop-zone${dragOver ? ' profile-page__drop-zone--over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                role="button"
                tabIndex={0}
                aria-label="Upload profile picture"
                onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="profile-page__file-input"
                  onChange={onFileChange}
                />
                {avatarPreview ? (
                  <div className="profile-page__drop-preview">
                    <img src={avatarPreview} alt="Preview" />
                    {avatarUploading && (
                      <div className="profile-page__drop-uploading">
                        <div className="profile-page__spinner" />
                        <span>Uploading…</span>
                      </div>
                    )}
                    {!avatarUploading && (
                      <div className="profile-page__drop-change">
                        <span className="material-symbols-outlined">photo_camera</span>
                        Change photo
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="profile-page__drop-empty">
                    <span className="material-symbols-outlined">cloud_upload</span>
                    <span className="profile-page__drop-title">
                      {dragOver ? 'Drop to upload' : 'Click or drag to upload'}
                    </span>
                    <span className="profile-page__drop-hint">JPG, PNG, WEBP · max 5 MB</span>
                  </div>
                )}
              </div>
              {avatarMsg && (
                <div className={`profile-page__msg profile-page__msg--${avatarMsg.type}`}>
                  <span className="material-symbols-outlined">
                    {avatarMsg.type === 'ok' ? 'check_circle' : 'error'}
                  </span>
                  {avatarMsg.text}
                </div>
              )}
            </div>

            {/* Name row */}
            <div className="profile-page__row">
              <div className="profile-page__field">
                <label className="profile-page__label" htmlFor="firstName">First Name</label>
                <input id="firstName" type="text" className="profile-page__input"
                  value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" />
              </div>
              <div className="profile-page__field">
                <label className="profile-page__label" htmlFor="lastName">Last Name</label>
                <input id="lastName" type="text" className="profile-page__input"
                  value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" />
              </div>
            </div>

            {/* Email */}
            <div className="profile-page__field">
              <label className="profile-page__label" htmlFor="email">Email</label>
              <input id="email" type="email" className="profile-page__input"
                value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>

            {/* Bio */}
            <div className="profile-page__field">
              <label className="profile-page__label" htmlFor="bio">Bio</label>
              <textarea id="bio" className="profile-page__textarea"
                value={bio} onChange={e => setBio(e.target.value)}
                placeholder="Tell us a little about your taste in film…"
                rows={3} maxLength={200} />
              <span className="profile-page__char-count">{bio.length}/200</span>
            </div>

            {profileMsg && (
              <div className={`profile-page__msg profile-page__msg--${profileMsg.type}`}>
                <span className="material-symbols-outlined">
                  {profileMsg.type === 'ok' ? 'check_circle' : 'error'}
                </span>
                {profileMsg.text}
              </div>
            )}

            <div className="profile-page__actions">
              <button type="submit" className="profile-page__save-btn" disabled={profileSaving}>
                {profileSaving ? <><div className="profile-page__spinner" />Saving…</> : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form className="profile-page__form" onSubmit={handlePasswordSave}>
            <div className="profile-page__form-header">
              <h2 className="profile-page__form-title">Change Password</h2>
              <p className="profile-page__form-subtitle">Use a strong password you don't use elsewhere.</p>
            </div>

            <div className="profile-page__field">
              <label className="profile-page__label" htmlFor="oldPass">Current Password</label>
              <div className="profile-page__input-wrap">
                <input id="oldPass" type={showOld ? 'text' : 'password'} className="profile-page__input"
                  value={oldPass} onChange={e => setOldPass(e.target.value)}
                  placeholder="Current password" autoComplete="current-password" />
                <button type="button" className="profile-page__eye" onClick={() => setShowOld(v => !v)} aria-label="Toggle visibility">
                  <span className="material-symbols-outlined">{showOld ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="profile-page__field">
              <label className="profile-page__label" htmlFor="newPass">New Password</label>
              <div className="profile-page__input-wrap">
                <input id="newPass" type={showNew ? 'text' : 'password'} className="profile-page__input"
                  value={newPass} onChange={e => setNewPass(e.target.value)}
                  placeholder="Min 8 characters" autoComplete="new-password" />
                <button type="button" className="profile-page__eye" onClick={() => setShowNew(v => !v)} aria-label="Toggle visibility">
                  <span className="material-symbols-outlined">{showNew ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            <div className="profile-page__field">
              <label className="profile-page__label" htmlFor="confirmPass">Confirm New Password</label>
              <div className="profile-page__input-wrap">
                <input id="confirmPass" type="password" className="profile-page__input"
                  value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  placeholder="Repeat new password" autoComplete="new-password" />
              </div>
            </div>

            {passMsg && (
              <div className={`profile-page__msg profile-page__msg--${passMsg.type}`}>
                <span className="material-symbols-outlined">
                  {passMsg.type === 'ok' ? 'check_circle' : 'error'}
                </span>
                {passMsg.text}
              </div>
            )}

            <div className="profile-page__actions">
              <button type="submit" className="profile-page__save-btn"
                disabled={passSaving || !oldPass || !newPass || !confirmPass}>
                {passSaving ? <><div className="profile-page__spinner" />Saving…</> : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
