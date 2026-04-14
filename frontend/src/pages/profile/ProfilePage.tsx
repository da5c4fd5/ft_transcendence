import { useState, useEffect, useRef } from 'preact/hooks';
import { User, Camera, Pencil, LogOut, UserPlus, Lock, Eye, EyeOff, LayoutDashboard, X, Check, Bell, BellRing, Monitor, Smartphone, Globe, ShieldOff } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import type { ProfilePageProps, Friend, Session } from './profile.types';
import type { User as UserType } from './profile.types';
import { MOCK_FRIENDS, MOCK_SESSIONS } from './profile.mocks';

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

function ProfileCard({ user, onLogout }: { user: UserType; onLogout: () => void }) {
  const [isEditing, setIsEditing]       = useState(false);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editEmail, setEditEmail]       = useState(user.email);
  const [currentPw, setCurrentPw]       = useState('');
  const [error, setError]               = useState<string | null>(null);

  const emailChanged = editEmail !== user.email;

  const handleSave = () => {
    if (emailChanged && !currentPw.trim()) {
      setError('Please enter your current password to confirm the email change.');
      return;
    }
    // TODO: PATCH /api/users/me { username, email, currentPassword? }
    setIsEditing(false);
    setError(null);
    setCurrentPw('');
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
          <AvatarDisplay avatarURL={user.avatarURL} className="w-20 h-20" />
          <button
            type="button"
            aria-label="Change profile picture"
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-darkgrey rounded-full flex items-center justify-center p-0 leading-none hover:bg-darkgrey/80 transition-colors"
          >
            <Camera size={13} className="text-white shrink-0" />
          </button>
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
              {error && <p className="text-xs text-pink px-1">{error}</p>}
            </div>
          )}
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
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors"
          >
            <Check size={14} /> Save
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
      <AvatarDisplay avatarURL={user.avatarURL} className="w-24 h-24" />

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

function FriendsCard({ friends }: { friends: Friend[] }) {
  const [input, setInput]         = useState('');
  const [pingedIds, setPingedIds] = useState<Set<string>>(new Set());

  // Store timer IDs so we can cancel them if the component unmounts.
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); };
  }, []);

  const handleAdd = () => {
    if (!input.trim()) return;
    // TODO: GET /api/users/search?q={input} then PUT /api/friends/:id
    setInput('');
  };

  const handlePing = async (id: string) => {
    if (pingedIds.has(id)) return;
    try {
      // TODO: POST /api/friends/:id/ping
      setPingedIds(prev => new Set(prev).add(id));
      const timer = setTimeout(() => {
        setPingedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
        timersRef.current.delete(id);
      }, 3000);
      timersRef.current.set(id, timer);
    } catch {
      // TODO: show error toast
    }
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
          placeholder="Add friend by username..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLInputElement).value)}
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

      <div className="flex flex-col gap-2">
        {friends.map(f => {
          const pinged = pingedIds.has(f.id);
          const pingLabel = !f.online ? `${f.username} is offline` : pinged ? 'Ping sent!' : 'Remind to create a memory';
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
                  <span className={cn('w-2 h-2 rounded-full shrink-0', f.online ? 'bg-blue' : 'bg-mediumgrey')} />
                  <span className={cn('text-xs font-medium', f.online ? 'text-blue' : 'text-mediumgrey')}>
                    {f.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePing(f.id)}
                disabled={!f.online || pinged}
                aria-label={pingLabel}
                title={pingLabel}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0',
                  pinged
                    ? 'bg-blue/20 text-blue cursor-default'
                    : f.online
                      ? 'bg-verylightorange text-mediumgrey hover:bg-orange/30 hover:text-darkgrey'
                      : 'bg-verylightorange text-mediumgrey/40 cursor-not-allowed',
                )}
              >
                {pinged ? <BellRing size={13} /> : <Bell size={13} />}
                {pinged ? 'Pinged!' : 'Ping'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getSessionIcon(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes('iphone') || ua.includes('android') || ua.includes('mobile'))
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

function SessionsCard({ sessions }: { sessions: Session[] }) {
  const [list, setList]           = useState<Session[]>(sessions);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handleRevoke = async (id: string) => {
    try {
      // TODO: DELETE /api/users/me/sessions/:id
      setList(prev => prev.filter(s => s.id !== id));
      setConfirmId(null);
    } catch {
      // TODO: show error toast
    }
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
                  aria-label={`Revoke session: ${s.userAgent}`}
                  className="text-xs font-semibold text-pink hover:text-pink/70 transition-colors shrink-0 px-2 py-1"
                >
                  Revoke
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordCard() {
  const [isOpen, setIsOpen]       = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew]         = useState('');
  const [pwConfirm, setPwConfirm] = useState('');

  const handleCancel = () => {
    setIsOpen(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
  };

  const handleChange = () => {
    // TODO: PATCH /api/users/me/password { currentPassword, newPassword }
    handleCancel();
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
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-yellow text-darkgrey font-bold text-sm hover:bg-yellow/80 transition-colors mt-1"
          >
            Change Password
          </button>
        </form>
      )}
    </div>
  );
}

export function ProfilePage({ user, onLogout, onNavigateToAdmin }: ProfilePageProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:py-12 flex flex-col gap-6">

      <ProfileCard user={user} onLogout={onLogout} />

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

      <FriendsCard friends={MOCK_FRIENDS} />
      <PasswordCard />
      <SessionsCard sessions={MOCK_SESSIONS} />

    </div>
  );
}
