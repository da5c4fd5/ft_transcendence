import { useState, useMemo } from 'preact/hooks';
import { Users, Sparkles, ShieldCheck, Trash2, Search, ChevronDown, TriangleAlert } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Avatar } from '../../components/Avatar/Avatar';
import type { AdminUser, AdminStats, AdminPageProps } from './admin.types';
import { MOCK_STATS, MOCK_USERS } from './admin.mocks';

async function deleteUser(_id: string): Promise<void> {
  // TODO: await fetch(`/api/admin/users/${_id}`, { method: 'DELETE' });
}

async function updateUserRole(_id: string, _isAdmin: boolean): Promise<void> {
  // TODO: await fetch(`/api/admin/users/${_id}`, { method: 'PATCH', body: JSON.stringify({ isAdmin: _isAdmin }) });
}

const modalOverlay = 'fixed inset-0 z-50 flex items-center justify-center px-4';
const modalPanel   = 'relative bg-white rounded-3xl p-7 w-full max-w-sm flex flex-col items-center gap-5 shadow-xl';
const modalCancel  = 'flex-1 py-3 rounded-full border border-black/10 text-sm font-semibold text-darkgrey hover:bg-lightgrey/30 transition-colors';
const iconBox      = 'w-14 h-14 rounded-2xl flex items-center justify-center';
const thCell       = 'text-left px-4 py-3 text-[11px] font-bold text-mediumgrey tracking-widest uppercase';

function ConfirmRoleModal({ user, onConfirm, onCancel }: {
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const promoting = !user.isAdmin;
  return (
    <div className={modalOverlay} onClick={onCancel}>
      <div className="absolute inset-0 bg-darkgrey/40 backdrop-blur-sm" />
      <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={cn(iconBox, promoting ? 'bg-purple/20' : 'bg-pink/10')}>
          <ShieldCheck size={26} className={promoting ? 'text-darkgrey' : 'text-pink'} />
        </div>

        <div className="text-center flex flex-col gap-1.5">
          <p className="text-lg font-black text-darkgrey">
            {promoting ? 'Promote to Admin?' : 'Remove Admin role?'}
          </p>
          <p className="text-sm text-mediumgrey leading-relaxed">
            {promoting
              ? <><span className="font-semibold text-darkgrey">{user.username}</span> will be able to access the admin dashboard and manage all users.</>
              : <><span className="font-semibold text-darkgrey">{user.username}</span> will lose all admin privileges and return to a regular user.</>
            }
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button type="button" onClick={onCancel} className={modalCancel}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'flex-1 py-3 rounded-full text-sm font-bold transition-colors',
              promoting ? 'bg-purple/30 text-darkgrey hover:bg-purple/50' : 'bg-pink text-white hover:bg-pink/80',
            )}
          >
            {promoting ? 'Yes, promote' : 'Yes, remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ user, onConfirm, onCancel }: {
  user: AdminUser;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={modalOverlay} onClick={onCancel}>
      <div className="absolute inset-0 bg-darkgrey/40 backdrop-blur-sm" />
      <div className={modalPanel} onClick={(e) => e.stopPropagation()}>
        <div className={cn(iconBox, 'bg-pink/10')}>
          <TriangleAlert size={26} className="text-pink" />
        </div>

        <div className="text-center flex flex-col gap-1.5">
          <p className="text-lg font-black text-darkgrey">Delete this account?</p>
          <p className="text-sm text-mediumgrey leading-relaxed">
            <span className="font-semibold text-darkgrey">{user.username}</span>'s account and all their data will be permanently deleted. This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button type="button" onClick={onCancel} className={modalCancel}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 rounded-full bg-pink text-white text-sm font-bold hover:bg-pink/80 transition-colors"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, color }: {
  icon: preact.ComponentChildren;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-sm">
      <div className={cn(iconBox, color, 'shrink-0')}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-black text-darkgrey">{value.toLocaleString()}</p>
        <p className="text-sm text-mediumgrey font-medium mt-0.5">{label}</p>
      </div>
    </div>
  );
}

const roleBtnBase = 'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors';

function RoleBadge({ isAdmin, onClick }: { isAdmin: boolean; onClick?: () => void }) {
  const interactive = !!onClick;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        roleBtnBase,
        isAdmin
          ? cn('bg-purple/30 text-darkgrey', interactive && 'hover:bg-pink/20 hover:text-pink cursor-pointer')
          : cn('bg-lightgrey text-mediumgrey', interactive && 'hover:bg-purple/30 hover:text-darkgrey cursor-pointer'),
        !interactive && 'cursor-default',
      )}
    >
      {isAdmin && <ShieldCheck size={11} />}
      {isAdmin ? 'Admin' : 'User'}
    </button>
  );
}

export function AdminPage({ currentUserId, isAdmin, onToggleAdmin, onPreviewGuestAnon }: AdminPageProps) {
  const [stats]           = useState<AdminStats>(MOCK_STATS);
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [roleConfirmId, setRoleConfirmId]     = useState<string | null>(null);
  const [showDevTools, setShowDevTools]       = useState(false);

  // TODO: replace with real API calls in useEffect
  // void fetchStats;
  // void fetchUsers;

  const totalAdmins = useMemo(() => users.filter(u => u.isAdmin).length, [users]);

  const filtered = useMemo(() =>
    users.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search],
  );

  const handleDeleteConfirm = async (id: string) => {
    await deleteUser(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    setDeleteConfirmId(null);
  };

  const handleToggleRole = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newIsAdmin = !user.isAdmin;
    await updateUserRole(id, newIsAdmin);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: newIsAdmin } : u));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12 flex flex-col gap-6">

      <div className="flex items-center gap-3">
        <div className={cn(iconBox, 'bg-purple/30 w-10 h-10')}>
          <ShieldCheck size={20} className="text-darkgrey" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-darkgrey">Admin Dashboard</h1>
          <p className="text-xs text-mediumgrey mt-0.5">Manage users and platform settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Users size={22} className="text-darkgrey" />}     value={stats.totalUsers}    label="Total Users"    color="bg-blue/40"   />
        <StatCard icon={<Sparkles size={22} className="text-darkgrey" />}  value={stats.totalMemories} label="Total Memories" color="bg-yellow/60" />
        <StatCard icon={<ShieldCheck size={22} className="text-darkgrey" />} value={totalAdmins}       label="Admins"         color="bg-purple/30" />
      </div>

      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">

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

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-black/5">
                <th className={cn(thCell, 'px-6')}>User</th>
                <th className={thCell}>Role</th>
                <th className={thCell}>Joined</th>
                <th className={thCell}>Last Active</th>
                <th className={thCell}>Memories</th>
                <th className={thCell}>Friends</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-t border-black/5 hover:bg-verylightorange/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.username} src={u.avatarURL ?? undefined} size="sm" />
                      <div>
                        <p className="text-sm font-bold text-darkgrey">{u.username}</p>
                        <p className="text-xs text-mediumgrey">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge
                      isAdmin={u.isAdmin}
                      onClick={u.id !== currentUserId ? () => setRoleConfirmId(u.id) : undefined}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-mediumgrey whitespace-nowrap">{u.joinedDate}</td>
                  <td className="px-4 py-4 text-sm text-mediumgrey whitespace-nowrap">{u.lastActive}</td>
                  <td className="px-4 py-4 text-sm font-bold text-darkgrey">{u.memoriesCount}</td>
                  <td className="px-4 py-4 text-sm font-bold text-darkgrey">{u.friendsCount}</td>
                  <td className="px-4 py-4">
                    {u.id !== currentUserId && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(u.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-full text-mediumgrey hover:text-pink hover:bg-pink/10 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
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

        <div className="sm:hidden flex flex-col divide-y divide-black/5">
          {filtered.map(u => (
            <div key={u.id} className="px-5 py-4 flex items-center gap-3">
              <Avatar name={u.username} src={u.avatarURL ?? undefined} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-darkgrey truncate">{u.username}</p>
                <p className="text-xs text-mediumgrey truncate">{u.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  <RoleBadge
                    isAdmin={u.isAdmin}
                    onClick={u.id !== currentUserId ? () => setRoleConfirmId(u.id) : undefined}
                  />
                  <span className="text-xs text-mediumgrey">{u.memoriesCount} memories</span>
                </div>
              </div>
              {u.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(u.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-mediumgrey hover:text-pink hover:bg-pink/10 transition-colors shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="h-2" />
      </div>

      {deleteConfirmId && (() => {
        const target = users.find(u => u.id === deleteConfirmId);
        if (!target) return null;
        return (
          <ConfirmDeleteModal
            user={target}
            onCancel={() => setDeleteConfirmId(null)}
            onConfirm={() => handleDeleteConfirm(deleteConfirmId)}
          />
        );
      })()}

      {roleConfirmId && (() => {
        const target = users.find(u => u.id === roleConfirmId);
        if (!target) return null;
        return (
          <ConfirmRoleModal
            user={target}
            onCancel={() => setRoleConfirmId(null)}
            onConfirm={() => { handleToggleRole(roleConfirmId); setRoleConfirmId(null); }}
          />
        );
      })()}

      {/* TODO: Dev Tools -> a supprimer */}
      <div className="border border-dashed border-lightgrey rounded-3xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDevTools(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-mediumgrey hover:text-darkgrey transition-colors"
        >
          <span>Dev Tools</span>
          <ChevronDown size={15} className={cn('transition-transform duration-200', showDevTools && 'rotate-180')} />
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
