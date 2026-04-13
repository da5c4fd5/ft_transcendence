import { useState } from 'preact/hooks';
import { User, Camera, Pencil, LogOut, UserPlus, Lock, Eye, EyeOff, LayoutDashboard, X, Check } from 'lucide-preact';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfilePageProps {
  user: { name: string; isAdmin: boolean };
  onLogout: () => void;
  onNavigateToAdmin: () => void;
}

interface Friend {
  id: string;
  name: string;
  avatar: string | null;
  online: boolean;
}

// ─── Mock data (TODO: supprimer quand le backend est prêt) ────────────────────

const MOCK_EMAIL  = 'alex.explorer@example.com';
const MOCK_AVATAR = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face';

const MOCK_FRIENDS: Friend[] = [
  { id: 'f1', name: 'Sam Sparks',   avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', online: true  },
  { id: 'f2', name: 'Jordan River', avatar: null, online: false },
];

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
        className="w-full px-4 py-3 pr-12 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey placeholder:text-mediumgrey"
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-mediumgrey hover:text-darkgrey transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

function ProfileCard({ user, onLogout }: { user: { name: string }; onLogout: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName]   = useState(user.name);
  const [editEmail, setEditEmail] = useState(MOCK_EMAIL);
  const [currentPw, setCurrentPw] = useState('');
  const [error, setError]         = useState<string | null>(null);

  const emailChanged = editEmail !== MOCK_EMAIL;

  const handleSave = () => {
    if (emailChanged && !currentPw.trim()) {
      setError('Please enter your current password to confirm the email change.');
      return;
    }
    // TODO: PATCH /api/profile
    setIsEditing(false);
    setError(null);
    setCurrentPw('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditName(user.name);
    setEditEmail(MOCK_EMAIL);
    setCurrentPw('');
    setError(null);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 shadow-sm">
        <div className="relative w-fit">
          <img src={MOCK_AVATAR} alt="" className="w-20 h-20 rounded-full object-cover" />
          <button
            type="button"
            className="absolute -bottom-1 -right-1 w-7 h-7 bg-darkgrey rounded-full flex items-center justify-center p-0 leading-none hover:bg-darkgrey/80 transition-colors"
          >
            <Camera size={13} className="text-white shrink-0" />
          </button>
        </div>

        <div className="w-full flex flex-col gap-3">
          <input
            type="text"
            value={editName}
            onInput={(e) => setEditName((e.target as HTMLInputElement).value)}
            className="w-full px-4 py-3 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey font-semibold"
          />
          <input
            type="email"
            value={editEmail}
            onInput={(e) => setEditEmail((e.target as HTMLInputElement).value)}
            className="w-full px-4 py-3 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey"
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
              {error && (
                <p className="text-xs text-pink px-1">{error}</p>
              )}
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
            type="button"
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-yellow text-darkgrey text-sm font-bold hover:bg-yellow/80 transition-colors"
          >
            <Check size={14} /> Save
          </button>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-verylightpink/30 text-pink font-semibold text-sm hover:bg-lightpink/80 transition-colors"
        >
          <LogOut size={15} /> Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-5 shadow-sm">
      <div className="relative w-fit">
        <img src={MOCK_AVATAR} alt="" className="w-24 h-24 rounded-full object-cover" />
        <div className="absolute bottom-0 right-0 w-7 h-7 bg-darkgrey rounded-full flex items-center justify-center leading-none shadow">
          <Camera size={12} className="text-white block translate-x-px" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-black text-darkgrey">{user.name}</h2>
        <p className="text-sm text-mediumgrey mt-0.5">{MOCK_EMAIL}</p>
      </div>

      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/30 transition-colors"
      >
        <Pencil size={14} /> Edit Profile
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-verylightpink/30 text-pink font-semibold text-sm hover:bg-lightpink/80 transition-colors"
      >
        <LogOut size={15} /> Log Out
      </button>
    </div>
  );
}

function FriendsCard({ friends }: { friends: Friend[] }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (!input.trim()) return;
    // TODO: POST /api/friends
    setInput('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
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
        {friends.map(f => (
          <div key={f.id} className="flex items-center gap-3 p-3 rounded-2xl border border-black/5">
            {f.avatar ? (
              <img src={f.avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-yellow/60 flex items-center justify-center shrink-0">
                <User size={18} className="text-darkgrey" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-darkgrey">{f.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${f.online ? 'bg-blue' : 'bg-mediumgrey'}`} />
                <span className={`text-xs font-medium ${f.online ? 'text-blue' : 'text-mediumgrey'}`}>
                  {f.online ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordCard() {
  const [isOpen, setIsOpen]     = useState(false);
  const [pwCurrent, setPwCurrent] = useState('');
  const [pwNew, setPwNew]         = useState('');
  const [pwConfirm, setPwConfirm] = useState('');

  const handleCancel = () => {
    setIsOpen(false);
    setPwCurrent(''); setPwNew(''); setPwConfirm('');
  };

  const handleChange = () => {
    // TODO: PATCH /api/profile/password
    handleCancel();
  };

  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-pink" />
          <h2 className="text-lg font-black text-darkgrey">Password</h2>
        </div>
        {isOpen ? (
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center gap-1.5 text-xs font-semibold text-darkgrey border border-black/10 rounded-full px-3 py-1.5 hover:bg-lightgrey/30 transition-colors"
          >
            <X size={12} /> Cancel
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-darkgrey border border-black/10 rounded-full px-3 py-1.5 hover:bg-lightgrey/30 transition-colors"
          >
            <Pencil size={12} /> Change Password
          </button>
        )}
      </div>

      {isOpen && (
        <div className="flex flex-col gap-3">
          <PasswordInput placeholder="Current password" value={pwCurrent} onChange={setPwCurrent} />
          <PasswordInput placeholder="New password"     value={pwNew}     onChange={setPwNew}     />
          <PasswordInput placeholder="Confirm password" value={pwConfirm} onChange={setPwConfirm} />
          <button
            type="button"
            onClick={handleChange}
            className="w-full py-3 rounded-full bg-yellow text-darkgrey font-bold text-sm hover:bg-yellow/80 transition-colors mt-1"
          >
            Change Password
          </button>
        </div>
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

    </div>
  );
}
