import { useState, useMemo } from 'preact/hooks';
import { Users, Sparkles, ShieldCheck, Trash2, Search, ChevronDown } from 'lucide-preact';
import { Avatar } from '../../components/Avatar/Avatar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  isAdmin: boolean;
  joinedDate: string;
  lastActive: string;
  memories: number;
  friends: number;
}

interface AdminStats {
  totalUsers: number;
  totalMemories: number;
  totalAdmins: number;
}

export interface AdminPageProps {
  currentUserId: string;
  // Dev tools
  isAdmin: boolean;
  onToggleAdmin: () => void;
  onPreviewGuestAnon: () => void;
}

// ─── Mock data (TODO: supprimer quand le backend est prêt) ────────────────────

const MOCK_STATS: AdminStats = {
  totalUsers: 5,
  totalMemories: 452,
  totalAdmins: 1,
};

const MOCK_USERS: AdminUser[] = [
  { id: 'u1', name: 'Alex Explorer', email: 'alex.explorer@example.com', avatar: null, isAdmin: true,  joinedDate: 'Jan 15, 2024', lastActive: 'Apr 7, 2024',  memories: 145, friends: 12 },
  { id: 'u2', name: 'Sam Sparks',    email: 'sam.sparks@example.com',    avatar: null, isAdmin: false, joinedDate: 'Feb 20, 2024', lastActive: 'Apr 6, 2024',  memories: 89,  friends: 8  },
  { id: 'u3', name: 'Jordan River',  email: 'jordan.river@example.com',  avatar: null, isAdmin: false, joinedDate: 'Mar 10, 2024', lastActive: 'Apr 5, 2024',  memories: 56,  friends: 15 },
  { id: 'u4', name: 'Riley Moon',    email: 'riley.moon@example.com',    avatar: null, isAdmin: false, joinedDate: 'Mar 25, 2024', lastActive: 'Apr 7, 2024',  memories: 34,  friends: 6  },
  { id: 'u5', name: 'Casey Blue',    email: 'casey.blue@example.com',    avatar: null, isAdmin: false, joinedDate: 'Jan 30, 2024', lastActive: 'Mar 20, 2024', memories: 128, friends: 20 },
];

async function fetchStats(): Promise<AdminStats> {
  // TODO: const res = await fetch('/api/admin/stats'); return res.json();
  return MOCK_STATS;
}

async function fetchUsers(): Promise<AdminUser[]> {
  // TODO: const res = await fetch('/api/admin/users'); return res.json();
  return MOCK_USERS;
}

async function deleteUser(_id: string): Promise<void> {
  // TODO: await fetch(`/api/admin/users/${_id}`, { method: 'DELETE' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, color }: {
  icon: preact.ComponentChildren;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-sm">
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-darkgrey">{value.toLocaleString()}</p>
        <p className="text-sm text-mediumgrey font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function RoleBadge({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 bg-purple/30 text-darkgrey text-[11px] font-bold px-2.5 py-1 rounded-full">
        <ShieldCheck size={11} />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center bg-lightgrey text-mediumgrey text-[11px] font-bold px-2.5 py-1 rounded-full">
      User
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AdminPage({ currentUserId, isAdmin, onToggleAdmin, onPreviewGuestAnon }: AdminPageProps) {
  const [stats]           = useState<AdminStats>(MOCK_STATS);
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDevTools, setShowDevTools] = useState(false);

  // TODO: remplacer par un vrai appel API au mount (useEffect)
  void fetchStats;
  void fetchUsers;

  const filtered = useMemo(() =>
    users.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search],
  );

  const handleDeleteConfirm = async (id: string) => {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteConfirmId(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12 flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple/30 rounded-2xl flex items-center justify-center">
          <ShieldCheck size={20} className="text-darkgrey" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-darkgrey">Admin Dashboard</h1>
          <p className="text-xs text-mediumgrey mt-0.5">Manage users and platform settings</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Users size={22} className="text-darkgrey" />}
          value={stats.totalUsers}
          label="Total Users"
          color="bg-blue/40"
        />
        <StatCard
          icon={<Sparkles size={22} className="text-darkgrey" />}
          value={stats.totalMemories}
          label="Total Memories"
          color="bg-yellow/60"
        />
        <StatCard
          icon={<ShieldCheck size={22} className="text-darkgrey" />}
          value={stats.totalAdmins}
          label="Admins"
          color="bg-purple/30"
        />
      </div>

      {/* Users table */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">

        {/* Table header */}
        <div className="px-6 pt-6 pb-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Users size={17} className="text-pink" />
            <h2 className="text-lg font-black text-darkgrey">All Users</h2>
            <span className="bg-pink/20 text-pink text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
              {users.length}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 bg-verylightorange rounded-full px-4 py-2.5 border-2 border-transparent focus-within:border-yellow transition-colors sm:w-72">
            <Search size={14} className="text-mediumgrey shrink-0" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
              className="bg-transparent outline-none text-sm text-darkgrey placeholder:text-mediumgrey w-full"
            />
          </div>
        </div>

        {/* Table — desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-black/5">
                <th className="text-left px-6 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase">Joined</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase">Last Active</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase">Memories</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase">Friends</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-black/5 hover:bg-verylightorange/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} src={u.avatar ?? undefined} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-darkgrey">{u.name}</p>
                        <p className="text-xs text-mediumgrey">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge isAdmin={u.isAdmin} />
                  </td>
                  <td className="px-4 py-4 text-sm text-mediumgrey whitespace-nowrap">{u.joinedDate}</td>
                  <td className="px-4 py-4 text-sm text-mediumgrey whitespace-nowrap">{u.lastActive}</td>
                  <td className="px-4 py-4 text-sm font-bold text-darkgrey">{u.memories}</td>
                  <td className="px-4 py-4 text-sm font-bold text-darkgrey">{u.friends}</td>
                  <td className="px-4 py-4">
                    {u.id !== currentUserId && (
                      deleteConfirmId === u.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-mediumgrey hover:text-darkgrey transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteConfirm(u.id)}
                            className="text-xs font-bold text-white bg-pink rounded-full px-3 py-1.5 hover:bg-pink/80 transition-colors"
                          >
                            Confirm
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(u.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full text-mediumgrey hover:text-pink hover:bg-pink/10 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-mediumgrey">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table — mobile (cards) */}
        <div className="sm:hidden flex flex-col divide-y divide-black/5">
          {filtered.map(u => (
            <div key={u.id} className="px-5 py-4 flex items-center gap-3">
              <Avatar name={u.name} src={u.avatar ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-darkgrey truncate">{u.name}</p>
                <p className="text-xs text-mediumgrey truncate">{u.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <RoleBadge isAdmin={u.isAdmin} />
                  <span className="text-xs text-mediumgrey">{u.memories} memories</span>
                </div>
              </div>
              {u.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(deleteConfirmId === u.id ? null : u.id)}
                  className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
                    deleteConfirmId === u.id
                      ? 'bg-pink text-white'
                      : 'text-mediumgrey hover:text-pink hover:bg-pink/10'
                  }`}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
          {deleteConfirmId && (
            <div className="px-5 py-4 bg-verylightpink/30 flex items-center justify-between gap-3">
              <p className="text-sm text-pink font-semibold">Delete this user?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs text-mediumgrey hover:text-darkgrey transition-colors px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteConfirm(deleteConfirmId)}
                  className="text-xs font-bold text-white bg-pink rounded-full px-3 py-1.5"
                >
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="h-2" />
      </div>

      {/* Dev Tools (collapsible) */}
      <div className="border border-dashed border-lightgrey rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDevTools(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-mediumgrey hover:text-darkgrey transition-colors"
        >
          <span>Dev Tools</span>
          <ChevronDown size={15} className={`transition-transform duration-200 ${showDevTools ? 'rotate-180' : ''}`} />
        </button>
        {showDevTools && (
          <div className="px-5 pb-5 flex flex-wrap gap-3 border-t border-dashed border-lightgrey pt-4">
            <button
              type="button"
              onClick={onToggleAdmin}
              className="px-4 py-2 bg-yellow rounded-full text-darkgrey font-semibold text-sm"
            >
              Switch role ({isAdmin ? 'pass to User' : 'pass to Admin'})
            </button>
            <button
              type="button"
              onClick={onPreviewGuestAnon}
              className="px-4 py-2 bg-blue rounded-full text-darkgrey font-semibold text-sm"
            >
              Preview guest view (anonymous)
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
