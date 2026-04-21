import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import { User, Camera, Pencil, LogOut, UserPlus, Lock, Eye, EyeOff, LayoutDashboard, X, Check, Bell, BellRing, Monitor, Smartphone, Globe, ShieldOff, Shield, ShieldCheck, Copy, CheckCheck } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import type { ProfilePageProps, Friend, Session } from './profile.types';
import type { User as UserType } from './profile.types';
import { formatSessionDateTime } from '../../lib/date';
import { api, getApiErrorMessage, validateImageFile } from '../../lib/api';
import type { ApiError } from '../../lib/api';
import { useRealtime } from '../../lib/realtime';

const cardBase   = 'bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm';
const inputBase  = 'w-full px-4 py-3 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey';
const ghostBtn   = 'flex items-center gap-1.5 text-xs font-semibold text-darkgrey border border-black/10 rounded-full px-3 py-1.5 hover:bg-lightgrey/30 transition-colors';
const logoutBtn  = 'w-full flex items-center justify-center gap-2 py-3 rounded-full bg-verylightpink/30 text-pink font-semibold text-sm hover:bg-lightpink/80 transition-colors';
const avatarBase = 'w-10 h-10 rounded-full object-cover shrink-0';
const DELETE_ACCOUNT_CONFIRMATION = 'delete my account';

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

function AvatarDisplay({ avatarUrl, className }: { avatarUrl: string | null; className: string }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
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

function ProfileCard({ user, onLogout, onUserUpdate }: { user: UserType; onLogout: () => void; onUserUpdate: (u: UserType) => void }) {
  const [isEditing, setIsEditing]       = useState(false);
  const [editUsername, setEditUsername] = useState(user.username);
  const [editEmail, setEditEmail]       = useState(user.email);
  const [currentPw, setCurrentPw]       = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]     = useState<File | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [saving, setSaving]             = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const emailChanged    = editEmail !== user.email;
  const usernameChanged = editUsername !== user.username;

  const handleAvatarChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const imageError = validateImageFile(file);
    if (imageError) {
      setAvatarFile(null);
      setAvatarPreview(null);
      setError(imageError);
      input.value = '';
      return;
    }
    setError(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    input.value = '';
  };

  const handleSave = async () => {
    if (emailChanged && !currentPw.trim()) {
      setError('Please enter your current password to confirm the email change.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (usernameChanged) {
        await api.patch('/users/me', { username: editUsername });
      }
      if (emailChanged) {
        await api.patch('/users/me/email', { email: editEmail, password: currentPw });
      }
      if (avatarFile) {
        const form = new FormData();
        form.append('file', avatarFile);
        await api.upload('/users/me/avatar', form);
      }
      const updated = await api.get<UserType>('/users/me');
      onUserUpdate(updated);
      setIsEditing(false);
      setAvatarPreview(null);
      setAvatarFile(null);
      setCurrentPw('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save changes.'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setCurrentPw('');
    setAvatarPreview(null);
    setAvatarFile(null);
    setError(null);
  };

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => { e.preventDefault(); handleSave(); }}
        className={cn(cardBase, 'items-center')}
      >
        <div className="relative w-fit">
          <AvatarDisplay avatarUrl={avatarPreview ?? user.avatarUrl} className="w-20 h-20" />
          <button
            type="button"
            aria-label="Change profile picture"
            onClick={() => fileRef.current?.click()}
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
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/50 transition-colors disabled:opacity-50"
          >
            <X size={14} /> Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors disabled:opacity-50"
          >
            <Check size={14} /> {saving ? 'Saving…' : 'Save'}
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
      <AvatarDisplay avatarUrl={user.avatarUrl} className="w-24 h-24" />

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

type RawFriendUser = { id: string; username: string; avatarUrl: string | null };
type RawFriendListUser = RawFriendUser & { online: boolean };
type RawFriend = { id: string; requesterId: string; recipientId: string; requester: RawFriendListUser; recipient: RawFriendListUser };

type RawRequest = { id: string; requesterId: string; requester: RawFriendUser };

function FriendsCard({ userId }: { userId: string }) {
  const { onlineUserIds, presenceReady, sendPing } = useRealtime();
  const [friends, setFriends]           = useState<Friend[]>([]);
  const [requests, setRequests]         = useState<RawRequest[]>([]);
  const [input, setInput]               = useState('');
  const [addError, setAddError]         = useState<string | null>(null);
  const [adding, setAdding]             = useState(false);
  const [pendingPingIds, setPendingPingIds] = useState<Set<string>>(new Set());
  const [pingedIds, setPingedIds]       = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions]   = useState<RawFriendUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlighted, setHighlighted]   = useState(-1);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const timersRef    = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const refreshFriends = useCallback(async () => {
    const [raw, reqs] = await Promise.all([
      api.get<RawFriend[]>('/friends'),
      api.get<RawRequest[]>('/friends/requests'),
    ]);
    setFriends(raw.map(f => {
      const other = f.requesterId === userId ? f.recipient : f.requester;
      return { id: other.id, username: other.username, avatarUrl: other.avatarUrl, online: other.online };
    }));
    setRequests(reqs);
  }, [userId]);

  useEffect(() => {
    refreshFriends().catch(() => {});
    return () => { timersRef.current.forEach(clearTimeout); };
  }, [refreshFriends]);

  useEffect(() => {
    if (!presenceReady) return;
    setFriends(prev => prev.map(friend => {
      const online = onlineUserIds.has(friend.id);
      return friend.online === online ? friend : { ...friend, online };
    }));
  }, [onlineUserIds, presenceReady]);

  useEffect(() => {
    const handlePingResult = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; delivered: boolean }>).detail;
      if (!detail?.userId) return;

      setPendingPingIds(prev => {
        const next = new Set(prev);
        next.delete(detail.userId);
        return next;
      });

      if (detail.delivered) {
        setPingedIds(prev => new Set(prev).add(detail.userId));
        const timer = setTimeout(() => {
          setPingedIds(prev => {
            const next = new Set(prev);
            next.delete(detail.userId);
            return next;
          });
          timersRef.current.delete(detail.userId);
        }, 3000);
        const previousTimer = timersRef.current.get(detail.userId);
        if (previousTimer) clearTimeout(previousTimer);
        timersRef.current.set(detail.userId, timer);
        return;
      }

      setFriends(prev => prev.map(friend =>
        friend.id === detail.userId ? { ...friend, online: false } : friend
      ));
    };

    window.addEventListener('capsul:ping-result', handlePingResult as EventListener);
    return () => window.removeEventListener('capsul:ping-result', handlePingResult as EventListener);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchUsers = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await api.get<RawFriendUser[]>('/users/search', { q });
        // Filter out already-friends and self
        const friendIds = new Set(friends.map(f => f.id));
        const filtered  = results.filter(r => r.id !== userId && !friendIds.has(r.id));
        setSuggestions(filtered);
        setShowDropdown(filtered.length > 0);
        setHighlighted(-1);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);
  };

  const handleAddById = async (targetId: string) => {
    setAddError(null);
    setAdding(true);
    setSuggestions([]);
    setShowDropdown(false);
    setInput('');
    try {
      await api.put(`/friends/${targetId}`);
      await refreshFriends();
    } catch (err) {
      setAddError((err as ApiError).message ?? 'Failed to add friend.');
    } finally {
      setAdding(false);
    }
  };

  const handleAdd = async () => {
    // Keyboard: user highlighted a suggestion with arrow keys
    if (highlighted >= 0 && suggestions[highlighted]) {
      const s = suggestions[highlighted];
      setInput(s.username);
      setSelectedId(s.id);
      setSuggestions([]);
      setShowDropdown(false);
      setHighlighted(-1);
      handleAddById(s.id);
      return;
    }
    const q = input.trim();
    if (!q) return;
    setAddError(null);
    setAdding(true);
    setSuggestions([]);
    setShowDropdown(false);
    try {
      // If user selected from dropdown, use that ID directly
      const targetId = selectedId;
      if (targetId) {
        await api.put(`/friends/${targetId}`);
      } else {
        const results = await api.get<RawFriendUser[]>('/users/search', { q });
        if (!results.length) { setAddError('No user found with that username.'); return; }
        await api.put(`/friends/${results[0].id}`);
      }
      await refreshFriends();
      setInput('');
      setSelectedId(null);
    } catch (err) {
      setAddError((err as ApiError).message ?? 'Failed to add friend.');
    } finally {
      setAdding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showDropdown) {
      if (e.key === 'Enter') handleAdd();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlighted(-1);
    }
  };

  const handleAccept = async (requesterId: string) => {
    setRespondingId(requesterId);
    try {
      await api.put(`/friends/${requesterId}`); // auto-accepts since they sent it
      await refreshFriends();
    } catch { /* ignore */ } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (requesterId: string) => {
    setRespondingId(requesterId);
    try {
      await api.delete(`/friends/${requesterId}`);
      await refreshFriends();
    } catch { /* ignore */ } finally {
      setRespondingId(null);
    }
  };

  const handlePing = async (id: string) => {
    if (pingedIds.has(id) || pendingPingIds.has(id)) return;
    if (!sendPing(id)) return;
    setPendingPingIds(prev => new Set(prev).add(id));
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

      <div className="flex flex-col gap-1.5" ref={containerRef}>
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Add friend by username..."
              value={input}
              onInput={(e) => {
                const v = (e.target as HTMLInputElement).value;
                setInput(v);
                setSelectedId(null);
                setAddError(null);
                searchUsers(v);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length) setShowDropdown(true); }}
              className="w-full px-4 py-2.5 rounded-full bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey placeholder:text-mediumgrey"
            />
            {showDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-lg border border-black/8 overflow-hidden z-50">
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setInput(s.username);
                      setSelectedId(s.id);
                      setSuggestions([]);
                      setShowDropdown(false);
                      setHighlighted(-1);
                    }}
                    onMouseEnter={() => setHighlighted(i)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      i === highlighted ? 'bg-verylightorange' : 'hover:bg-verylightorange/60'
                    )}
                  >
                    {s.avatarUrl ? (
                      <img src={s.avatarUrl} alt={s.username} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-yellow/60 flex items-center justify-center shrink-0">
                        <User size={14} className="text-darkgrey" />
                      </div>
                    )}
                    <span className="text-sm font-semibold text-darkgrey">{s.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !input.trim()}
            className="px-5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors disabled:opacity-50"
          >
            {adding ? '…' : 'Add'}
          </button>
        </div>
        {addError && <p className="text-xs text-pink px-2">{addError}</p>}
      </div>

      {requests.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-mediumgrey uppercase tracking-wide px-1">
            Friend requests · {requests.length}
          </p>
          {requests.map(r => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-verylightorange/60 border border-yellow/30">
              {r.requester.avatarUrl ? (
                <img src={r.requester.avatarUrl} alt={r.requester.username} className={avatarBase} />
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow/60 flex items-center justify-center shrink-0">
                  <User size={18} className="text-darkgrey" />
                </div>
              )}
              <span className="flex-1 text-sm font-bold text-darkgrey truncate">{r.requester.username}</span>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={respondingId === r.requester.id}
                  onClick={() => handleAccept(r.requester.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow text-darkgrey hover:bg-yellow/80 transition-colors disabled:opacity-50"
                  title="Accept"
                >
                  <Check size={14} />
                </button>
                <button
                  type="button"
                  disabled={respondingId === r.requester.id}
                  onClick={() => handleDecline(r.requester.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-lightgrey text-darkgrey hover:bg-mediumgrey/30 transition-colors disabled:opacity-50"
                  title="Decline"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {friends.map(f => {
          const pinged = pingedIds.has(f.id);
          const pingPending = pendingPingIds.has(f.id);
          const pingLabel = !f.online ? `${f.username} is offline` : pinged ? 'Ping sent!' : pingPending ? 'Sending ping...' : 'Remind to create a memory';
          return (
            <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl border border-black/5">
              {f.avatarUrl ? (
                <img src={f.avatarUrl} alt={f.username} className={avatarBase} />
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
                disabled={!f.online || pinged || pingPending}
                aria-label={pingLabel}
                title={pingLabel}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0',
                  pinged
                    ? 'bg-blue/20 text-blue cursor-default'
                    : pingPending
                      ? 'bg-yellow/30 text-darkgrey cursor-progress'
                    : f.online
                      ? 'bg-verylightorange text-mediumgrey hover:bg-orange/30 hover:text-darkgrey'
                      : 'bg-verylightorange text-mediumgrey/40 cursor-not-allowed',
                )}
              >
                {pinged ? <BellRing size={13} /> : <Bell size={13} />}
                {pinged ? 'Pinged!' : pingPending ? 'Sending...' : 'Ping'}
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

function SessionsCard() {
  const [list, setList]           = useState<Session[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    api.get<Session[]>('/auth/sessions').then(setList).catch(() => {});
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      setList(prev => prev.filter(s => s.id !== id));
      setConfirmId(null);
    } catch {
      // ignore
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
              <p className="text-xs text-mediumgrey mt-0.5">{formatSessionDateTime(s.connectedAt)}</p>
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
  const [error, setError]         = useState<string | null>(null);
  const [success, setSuccess]     = useState(false);
  const [saving, setSaving]       = useState(false);

  const handleCancel = () => {
    setIsOpen(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
    setError(null); setSuccess(false);
  };

  const handleChange = async () => {
    if (pwNew !== pwConfirm) {
      setError('Passwords do not match.');
      return;
    }
    if (pwNew.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await api.patch('/users/me/password', { currentPassword: pwCurrent, newPassword: pwNew });
      setSuccess(true);
      setPwCurrent(''); setPwNew(''); setPwConfirm('');
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to change password.');
    } finally {
      setSaving(false);
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
          onClick={isOpen ? handleCancel : () => { setIsOpen(true); setSuccess(false); }}
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
          {success && (
            <p className="text-sm text-blue text-center py-1 font-semibold">Password updated successfully!</p>
          )}
          <PasswordInput placeholder="Current password" value={pwCurrent} onChange={(v) => { setPwCurrent(v); setError(null); }} />
          <PasswordInput placeholder="New password"     value={pwNew}     onChange={(v) => { setPwNew(v); setError(null); }} />
          <PasswordInput placeholder="Confirm password" value={pwConfirm} onChange={(v) => { setPwConfirm(v); setError(null); }} />
          {error && <p className="text-xs text-pink px-1">{error}</p>}
          <button
            type="submit"
            disabled={saving || !pwCurrent || !pwNew || !pwConfirm}
            className="w-full py-3 rounded-full bg-yellow text-darkgrey font-bold text-sm hover:bg-yellow/80 transition-colors mt-1 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      )}
    </div>
  );
}

type MfaStatus = 'idle' | 'loading-setup' | 'setup' | 'verifying' | 'active' | 'disabling' | 'loading-disable';

function MfaCard({ initialHasMfa }: { initialHasMfa: boolean }) {
  const [status, setStatus]         = useState<MfaStatus>(initialHasMfa ? 'active' : 'idle');
  const [qrCode, setQrCode]         = useState<string | null>(null);
  const [secret, setSecret]         = useState<string | null>(null);
  const [totpCode, setTotpCode]     = useState('');
  const [password, setPassword]     = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError]           = useState<string | null>(null);
  const [copied, setCopied]         = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleStartSetup = async () => {
    setError(null);
    setStatus('loading-setup');
    try {
      const res = await api.post<{ secret: string; qrCode: string }>('/users/me/mfa');
      setQrCode(res.qrCode);
      setSecret(res.secret);
      setTotpCode('');
      setStatus('setup');
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to start MFA setup.');
      setStatus('idle');
    }
  };

  const handleVerify = async (e: Event) => {
    e.preventDefault();
    if (totpCode.length < 6) { setError('Enter the 6-digit code from your app.'); return; }
    setError(null);
    setStatus('verifying');
    try {
      await api.post('/users/me/mfa/verify', { code: totpCode });
      setStatus('active');
      setQrCode(null); setSecret(null); setTotpCode('');
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.status === 422 ? 'Invalid code — try again.' : (apiErr.message ?? 'Verification failed.'));
      setStatus('setup');
    }
  };

  const handleDisable = async (e: Event) => {
    e.preventDefault();
    if (!password.trim()) { setError('Please enter your password.'); return; }
    if (disableCode.length < 6) { setError('Enter the 6-digit code from your app.'); return; }
    setError(null);
    setStatus('loading-disable');
    try {
      await api.delete('/users/me/mfa', { password, code: disableCode });
      setStatus('idle');
      setPassword(''); setDisableCode('');
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.status === 401 ? 'Wrong password.' : apiErr.status === 422 ? 'Invalid code.' : (apiErr.message ?? 'Failed to disable MFA.'));
      setStatus('disabling');
    }
  };

  const handleCopy = useCallback(() => {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2000);
  }, [secret]);

  const totpInput = (value: string, onChange: (v: string) => void, placeholder = '000000') => (
    <input
      type="text"
      inputMode="numeric"
      maxLength={6}
      placeholder={placeholder}
      value={value}
      onInput={(e) => { setError(null); onChange((e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6)); }}
      className={cn(inputBase, 'tracking-[0.4em] text-center font-mono placeholder:tracking-normal placeholder:text-mediumgrey')}
    />
  );

  return (
    <div className={cardBase}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'active'
            ? <ShieldCheck size={18} className="text-pink" />
            : <Shield size={18} className="text-pink" />}
          <h2 className="text-lg font-black text-darkgrey">Two-Factor Authentication</h2>
        </div>
        {status === 'active' && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-pink bg-verylightpink/40 rounded-full px-2.5 py-1">
            <ShieldCheck size={11} /> ENABLED
          </span>
        )}
      </div>

      {/* ─── Idle: MFA disabled ─── */}
      {(status === 'idle' || status === 'loading-setup') && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-mediumgrey leading-relaxed">
            Add an extra layer of security. Once enabled, you'll need a code from your authenticator app each time you log in.
          </p>
          {error && <p className="text-xs text-pink">{error}</p>}
          <button
            type="button"
            onClick={handleStartSetup}
            disabled={status === 'loading-setup'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors w-fit disabled:opacity-50"
          >
            <Shield size={14} />
            {status === 'loading-setup' ? 'Loading…' : 'Enable'}
          </button>
        </div>
      )}

      {/* ─── Setup: scan QR + enter code ─── */}
      {(status === 'setup' || status === 'verifying') && qrCode && (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-darkgrey">1. Scan with your authenticator app</p>
            <div className="flex justify-center">
              <img src={qrCode} alt="MFA QR Code" className="w-36 h-36 rounded-2xl border border-black/5" />
            </div>
          </div>

          {secret && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-mediumgrey">Or enter the secret manually:</p>
              <div className="flex items-center gap-2 bg-verylightorange rounded-2xl px-3 py-2">
                <code className="flex-1 text-xs font-mono text-darkgrey break-all">{secret}</code>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy secret"
                  className="text-mediumgrey hover:text-darkgrey transition-colors shrink-0"
                >
                  {copied ? <CheckCheck size={14} className="text-blue" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold text-darkgrey">2. Enter the 6-digit code</p>
            {totpInput(totpCode, setTotpCode)}
          </div>

          {error && <p className="text-xs text-pink">{error}</p>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStatus('idle'); setQrCode(null); setSecret(null); setTotpCode(''); setError(null); }}
              className="flex-1 py-2.5 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'verifying'}
              className="flex-1 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors disabled:opacity-50"
            >
              {status === 'verifying' ? 'Verifying…' : 'Enable'}
            </button>
          </div>
        </form>
      )}

      {/* ─── Active: MFA enabled ─── */}
      {status === 'active' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-verylightpink/40 rounded-2xl px-4 py-3">
            <ShieldCheck size={15} className="text-pink shrink-0" />
            <p className="text-sm text-pink font-medium">Your account is protected with 2FA.</p>
          </div>
          <button
            type="button"
            onClick={() => { setStatus('disabling'); setError(null); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors w-fit"
          >
            <ShieldOff size={14} /> Disable 2FA
          </button>
        </div>
      )}

      {/* ─── Disabling: confirm with password + TOTP ─── */}
      {(status === 'disabling' || status === 'loading-disable') && (
        <form onSubmit={handleDisable} className="flex flex-col gap-3">
          <p className="text-sm text-mediumgrey">To disable 2FA, confirm your identity:</p>
          <PasswordInput placeholder="Current password" value={password} onChange={(v) => { setPassword(v); setError(null); }} />
          {totpInput(disableCode, setDisableCode, 'Authenticator code')}
          {error && <p className="text-xs text-pink">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStatus('active'); setPassword(''); setDisableCode(''); setError(null); }}
              className="flex-1 py-2.5 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === 'loading-disable'}
              className="flex-1 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors disabled:opacity-50"
            >
              {status === 'loading-disable' ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function DeleteAccountCard({ onAccountDeleted }: { onAccountDeleted: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleClose = () => {
    if (deleting) return;
    setIsOpen(false);
    setPassword('');
    setConfirmation('');
    setError(null);
  };

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    if (confirmation !== DELETE_ACCOUNT_CONFIRMATION) {
      setError('The confirmation phrase does not match.');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await api.delete('/users/me', {
        password,
        confirmation,
      });
      onAccountDeleted();
    } catch (err) {
      const apiErr = err as ApiError;
      setError(
        apiErr.status === 401
          ? 'Wrong password.'
          : apiErr.status === 400
            ? 'The confirmation phrase does not match.'
            : (apiErr.message ?? 'Failed to delete account.')
      );
      setDeleting(false);
    }
  };

  return (
    <>
      <div className={cn(cardBase, 'border border-pink/20 bg-verylightpink/20')}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <ShieldOff size={18} className="text-pink mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-black text-darkgrey">Delete Account</h2>
              <p className="text-sm text-mediumgrey mt-1 leading-relaxed">
                Permanently remove your account, sessions, memories, friends, and related data.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="shrink-0 px-4 py-2 rounded-full bg-pink text-white text-sm font-bold hover:bg-pink/80 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={handleClose}>
          <div className="absolute inset-0 bg-darkgrey/40 backdrop-blur-sm" />
          <form
            onSubmit={handleDelete}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-3xl p-7 w-full max-w-md flex flex-col gap-4 shadow-xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink/10 flex items-center justify-center shrink-0">
                <ShieldOff size={22} className="text-pink" />
              </div>
              <div>
                <h3 className="text-xl font-black text-darkgrey">Delete your account?</h3>
                <p className="text-sm text-mediumgrey mt-1 leading-relaxed">
                  This action is irreversible. To confirm, enter your password and retype the phrase below manually.
                </p>
              </div>
            </div>

            <div className="bg-verylightpink/30 rounded-2xl px-4 py-3">
              <p className="text-xs font-bold text-pink uppercase tracking-wide">Required phrase</p>
              <p className="text-sm font-semibold text-darkgrey mt-1">{DELETE_ACCOUNT_CONFIRMATION}</p>
            </div>

            <div className="flex flex-col gap-3">
              <PasswordInput
                placeholder="Current password"
                value={password}
                onChange={(v) => { setPassword(v); setError(null); }}
              />
              <input
                type="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="Retype the exact phrase"
                value={confirmation}
                onInput={(e) => { setConfirmation((e.target as HTMLInputElement).value); setError(null); }}
                onPaste={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                className={cn(inputBase, 'placeholder:text-mediumgrey')}
              />
            </div>

            {error && <p className="text-xs text-pink">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={deleting}
                className="flex-1 py-3 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={deleting || !password.trim() || confirmation !== DELETE_ACCOUNT_CONFIRMATION}
                className="flex-1 py-3 rounded-full bg-pink text-white text-sm font-bold hover:bg-pink/80 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete my account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

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

      <FriendsCard userId={user.id} />
      <PasswordCard />
      <MfaCard initialHasMfa={user.hasMfa ?? false} />
      <SessionsCard />
      <DeleteAccountCard onAccountDeleted={onLogout} />

    </div>
  );
}
