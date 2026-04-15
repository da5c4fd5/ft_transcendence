import { useState, useEffect, useRef } from 'preact/hooks';
import { User, Camera, Pencil, LogOut, UserPlus, Lock, Eye, EyeOff, LayoutDashboard, X, Check, Bell, BellRing, Monitor, Smartphone, Globe, ShieldOff } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import type { ProfilePageProps, Friend, Session } from './profile.types';
import type { User as UserType } from './profile.types';
import { api, ApiError } from '../../services/api';

const cardBase   = 'bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm';
const inputBase  = 'w-full px-4 py-3 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey';
const ghostBtn   = 'flex items-center gap-1.5 text-xs font-semibold text-darkgrey border border-black/10 rounded-full px-3 py-1.5 hover:bg-lightgrey/30 transition-colors';
const logoutBtn  = 'w-full flex items-center justify-center gap-2 py-3 rounded-full bg-verylightpink/30 text-pink font-semibold text-sm hover:bg-lightpink/80 transition-colors';
const avatarBase = 'w-10 h-10 rounded-full object-cover shrink-0';

function PasswordInput({ placeholder, value, onChange }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onInput={(e) => onChange((e.target as HTMLInputElement).value)}
        className={cn(inputBase, 'pr-12 placeholder:text-mediumgrey')}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumgrey hover:text-darkgrey transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function AvatarDisplay({ avatarURL, className }: { avatarURL: string | null; className: string }) {
  if (avatarURL) {
    return (
      <img
        src={avatarURL}
        alt="Profile picture"
        className={cn('rounded-full object-cover', className)}
      />
    );
  }
  return (
    <div className={cn('rounded-full bg-yellow/60 flex items-center justify-center', className)}>
      <User size={32} className="text-darkgrey" />
    </div>
  );
}

function ProfileCard({ user, onLogout, onUserUpdate }: {
  user: UserType;
  onLogout: () => void;
  onUserUpdate?: (user: UserType) => void;
}) {
  const [isEditing, setIsEditing]       = useState(false);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editEmail, setEditEmail]       = useState(user.email);
  const [currentPw, setCurrentPw]       = useState('');
  const [error, setError]               = useState<string | null>(null);
  const [isSaving, setIsSaving]         = useState(false);
  const [avatarURL, setAvatarURL]       = useState(user.avatarURL);
  const fileRef                         = useRef<HTMLInputElement>(null);

  const emailChanged    = editEmail !== user.email;
  const usernameChanged = editUsername !== user.username;

  const handleAvatarChange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const updated = await api.users.uploadAvatar(file);
      setAvatarURL(updated.avatarUrl ?? null);
      onUserUpdate?.({ ...user, avatarURL: updated.avatarUrl ?? null });
    } catch {
      setError('Failed to upload avatar.');
    }
  };

  const handleSave = async () => {
    if (emailChanged && !currentPw.trim()) {
      setError('Please enter your current password to confirm the email change.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      let updatedUser = user;
      if (usernameChanged) {
        const u = await api.users.updateMe({ username: editUsername });
        updatedUser = { ...updatedUser, username: u.username };
      }
      if (emailChanged) {
        const u = await api.users.updateEmail(currentPw, editEmail);
        updatedUser = { ...updatedUser, email: u.email };
      }
      onUserUpdate?.({ ...updatedUser, avatarURL });
      setIsEditing(false);
      setCurrentPw('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setCurrentPw('');
    setError(null);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        className={cn(cardBase, 'items-center')}
      >
        <div className="relative w-fit">
          <AvatarDisplay avatarURL={avatarURL} className="w-20 h-20" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change profile picture"
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-darkgrey rounded-full flex items-center justify-center p-0 leading-none hover:bg-darkgrey/80 transition-colors"
          >
            <Camera size={13} className="text-white shrink-0" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={editUsername}
            onInput={(e) => setEditUsername((e.target as HTMLInputElement).value)}
            className={cn(inputBase, 'font-semibold placeholder:text-mediumgrey')}
          />
          <input
            type="email"
            value={editEmail}
            onInput={(e) => setEditEmail((e.target as HTMLInputElement).value)}
            className={cn(inputBase, 'placeholder:text-mediumgrey')}
          />

          {emailChanged && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 bg-verylightpink/30 rounded-2xl px-4 py-3">
                <Lock size={14} className="text-pink shrink-0" />
                <p className="text-xs text-pink leading-relaxed text-center flex-1">
                  To validate the modifications, please enter your current password.
                </p>
              </div>
              <PasswordInput
                placeholder="Current password"
                value={currentPw}
                onChange={(v) => { setCurrentPw(v); setError(null); }}
              />
            </div>
          )}
          {error && <p className="text-xs text-pink px-1">{error}</p>}
        </div>

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/50 transition-colors"
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors disabled:opacity-60"
          >
            <Check size={14} /> {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <button type="button" onClick={onLogout} className={logoutBtn}>
          <LogOut size={15} /> Log Out
        </button>
      </form>
    );
  }

  return (
    <div className={cn(cardBase, 'items-center p-8 gap-5')}>
      <AvatarDisplay avatarURL={avatarURL} className="w-24 h-24" />

      <div className="text-center">
        <h2 className="text-xl font-black text-darkgrey">{user.username}</h2>
        <p className="text-sm text-mediumgrey mt-0.5">{user.email}</p>
      </div>

      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/30 transition-colors"
      >
        <Pencil size={14} /> Edit Profile
      </button>

      <button type="button" onClick={onLogout} className={logoutBtn}>
        <LogOut size={15} /> Log Out
      </button>
    </div>
  );
}

// ─── FriendsCard ─────────────────────────────────────────────────────────────

function FriendsCard({ currentUserId }: { currentUserId: string }) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [input, setInput]     = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [pingedIds, setPingedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    api.friends.list().then(async (friendships) => {
      const accepted = friendships.filter(f => f.status === 'ACCEPTED');
      const users = await Promise.all(
        accepted.map(f => {
          const otherId = f.requesterId === currentUserId ? f.recipientId : f.requesterId;
          return api.users.getUser(otherId).then(u => ({
            id:        u.id,
            username:  u.username,
            avatarURL: u.avatarUrl ?? null,
            online:    false, // no realtime presence in API
            _friendId: f.id,
          }));
        }),
      );
      setFriends(users);
    }).catch(() => { /* leave empty */ });

    return () => { timersRef.current.forEach(clearTimeout); };
  }, [currentUserId]);

  const handleAdd = async () => {
    const q = input.trim();
    if (q.length < 2) return;
    setAddError(null);
    try {
      const results = await api.users.search(q);
      if (results.length === 0) { setAddError('User not found'); return; }
      const target = results[0];
      await api.friends.add(target.id);
      setFriends(prev => [...prev, {
        id:        target.id,
        username:  target.username,
        avatarURL: target.avatarUrl ?? null,
        online:    false,
        _friendId: '',
      }]);
    } catch { setAddError('Could not add user'); }
    setInput('');
  };

  const handleRemove = async (id: string) => {
    try {
      await api.friends.remove(id);
      setFriends(prev => prev.filter(f => f.id !== id));
    } catch { /* ignore */ }
  };

  const handlePing = async (id: string) => {
    if (pingedIds.has(id)) return;
    // TODO: POST /friends/:id/ping — not yet in backend
    setPingedIds(prev => new Set(prev).add(id));
    const timer = setTimeout(() => {
      setPingedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
      timersRef.current.delete(id);
    }, 3000);
    timersRef.current.set(id, timer);
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-pink" />
          <h2 className="text-lg font-black text-darkgrey">Friends</h2>
        </div>
        <span className="bg-lightgrey text-darkgrey text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {friends.length}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add friend by username…"
          value={input}
          onInput={(e) => { setAddError(null); setInput((e.target as HTMLInputElement).value); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          className="flex-1 px-4 py-2.5 rounded-full bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey placeholder:text-mediumgrey"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="px-5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors"
        >
          Add
        </button>
      </div>
      {addError && <p className="text-xs text-pink font-semibold px-1">{addError}</p>}

      <div className="flex flex-col gap-2">
        {friends.map(f => {
          const pinged = pingedIds.has(f.id);
          const pingLabel = pinged ? 'Ping sent!' : 'Remind to create a memory';
          return (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl border border-black/5">
              {f.avatarURL ? (
                <img src={f.avatarURL} alt={f.username} className={avatarBase} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow/60 flex items-center justify-center shrink-0">
                  <User size={18} className="text-darkgrey" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-darkgrey">{f.username}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full shrink-0 bg-mediumgrey" />
                  <span className="text-xs font-medium text-mediumgrey">Offline</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePing(f.id)}
                disabled={pinged}
                aria-label={pingLabel}
                title={pingLabel}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0',
                  pinged
                    ? 'bg-blue/20 text-blue cursor-default'
                    : 'bg-verylightorange text-mediumgrey hover:bg-orange/30 hover:text-darkgrey',
                )}
              >
                {pinged ? <BellRing size={13} /> : <Bell size={13} />}
                {pinged ? 'Pinged!' : 'Ping'}
              </button>
              <button
                type="button"
                onClick={() => handleRemove(f.id)}
                aria-label={`Remove ${f.username}`}
                className="text-xs font-semibold text-mediumgrey hover:text-pink transition-colors px-2 py-1"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SessionsCard ─────────────────────────────────────────────────────────────

function getSessionIcon(hint: string) {
  const ua = hint.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone'))
    return <Smartphone size={16} className="text-mediumgrey" />;
  if (ua.includes('safari') || ua.includes('chrome') || ua.includes('firefox'))
    return <Monitor size={16} className="text-mediumgrey" />;
  return <Globe size={16} className="text-mediumgrey" />;
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' · '
    + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function SessionsCard() {
  const [list, setList]           = useState<Session[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api.auth.getSessions().then(sessions => {
      setList(sessions);
    }).catch(() => { /* leave empty */ });
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      // Only the current session can be revoked via logout; individual revocation not supported
      setList(prev => prev.filter(s => s.id !== id));
      setConfirmId(null);
    } catch { /* ignore */ }
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center gap-2">
        <ShieldOff size={18} className="text-pink" />
        <h2 className="text-lg font-black text-darkgrey">Active Sessions</h2>
      </div>

      <div className="flex flex-col gap-2">
        {list.map(s => (
          <div
            key={s.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-2xl border',
              s.isCurrent ? 'border-yellow bg-yellow/10' : 'border-black/5',
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-lightgrey/60 flex items-center justify-center shrink-0">
              {getSessionIcon(s.userAgent)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-darkgrey truncate">{s.userAgent}</p>
                {s.isCurrent && (
                  <span className="text-[10px] font-bold bg-yellow text-darkgrey px-2 py-0.5 rounded-full shrink-0">
                    Current
                  </span>
                )}
              </div>
              <p className="text-xs text-mediumgrey mt-0.5">{formatSessionDate(s.connectedAt)}</p>
            </div>
            {!s.isCurrent && (
              confirmId === s.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmId(null)}
                    className="text-xs font-semibold text-mediumgrey hover:text-darkgrey transition-colors px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevoke(s.id)}
                    className="text-xs font-bold text-white bg-pink rounded-full px-3 py-1.5 hover:bg-pink/80 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(s.id)}
                  aria-label={`Revoke session`}
                  className="text-xs font-semibold text-pink hover:text-pink/70 transition-colors shrink-0 px-2 py-1"
                >
                  Revoke
                </button>
              )
            )}
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-mediumgrey text-center py-4">No active sessions found.</p>
        )}
      </div>
    </div>
  );
}

// ─── PasswordCard ─────────────────────────────────────────────────────────────

function PasswordCard() {
  const [isOpen, setIsOpen]       = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew]         = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [error, setError]         = useState<string | null>(null);
  const [isSaving, setIsSaving]   = useState(false);
  const [success, setSuccess]     = useState(false);

  const handleCancel = () => {
    setIsOpen(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setError(null); setSuccess(false);
  };

  const handleChange = async () => {
    if (pwNew !== pwConfirm) { setError('Passwords do not match.'); return; }
    if (pwNew.length < 8)    { setError('New password must be at least 8 characters.'); return; }
    setIsSaving(true);
    setError(null);
    try {
      await api.users.updatePassword(pwCurrent, pwNew);
      setSuccess(true);
      setTimeout(handleCancel, 1500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-pink" />
          <h2 className="text-lg font-black text-darkgrey">Password</h2>
        </div>
        <button
          type="button"
          onClick={isOpen ? handleCancel : () => setIsOpen(true)}
          className={ghostBtn}
        >
          {isOpen ? <><X size={12} /> Cancel</> : <><Pencil size={12} /> Change Password</>}
        </button>
      </div>

      {isOpen && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleChange(); }}
          className="flex flex-col gap-3"
        >
          <PasswordInput placeholder="Current password" value={pwCurrent} onChange={setPwCurrent} />
          <PasswordInput placeholder="New password"     value={pwNew}     onChange={setPwNew}     />
          <PasswordInput placeholder="Confirm password" value={pwConfirm} onChange={setPwConfirm} />
          {error   && <p className="text-xs text-pink px-1">{error}</p>}
          {success && <p className="text-xs text-blue px-1 font-semibold">Password changed!</p>}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-full bg-yellow text-darkgrey font-bold text-sm hover:bg-yellow/80 transition-colors mt-1 disabled:opacity-60"
          >
            {isSaving ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── ProfilePage ──────────────────────────────────────────────────────────────

export function ProfilePage({ user, onLogout, onNavigateToAdmin, onUserUpdate }: ProfilePageProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:py-12 flex flex-col gap-6">

      <ProfileCard user={user} onLogout={onLogout} onUserUpdate={onUserUpdate} />

      {user.isAdmin && (
        <button
          type="button"
          onClick={onNavigateToAdmin}
          className="sm:hidden bg-purple/30 rounded-3xl p-5 flex items-center gap-4 text-left hover:bg-purple/40 transition-colors w-full"
        >
          <div className="w-10 h-10 bg-purple/50 rounded-2xl flex items-center justify-center shrink-0">
            <LayoutDashboard size={18} className="text-darkgrey" />
          </div>
          <div>
            <p className="font-black text-darkgrey">Admin Dashboard</p>
            <p className="text-xs text-mediumgrey mt-0.5">Manage users and platform settings</p>
          </div>
        </button>
      )}

      <FriendsCard currentUserId={user.id} />
      <PasswordCard />
      <SessionsCard />

    </div>
  );
}
