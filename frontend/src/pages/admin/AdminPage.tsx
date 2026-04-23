import { useState, useMemo, useEffect } from 'preact/hooks';
import { Users, Sparkles, ShieldCheck, Trash2, Search, TriangleAlert, BrainCircuit, Activity, BotMessageSquare } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Avatar } from '../../components/Avatar/Avatar';
import { MediaPreview } from '../../components/MediaPreview/MediaPreview';
import type { AdminUser, AdminStats, AdminPageProps, AdminAiOverview } from './admin.types';
import { api, getApiErrorMessage, validateMemoryMediaFile } from '../../lib/api';

type RawAdminStats = { userCount: number; memoryCount: number; sessionCount: number };
type RawAdminUser  = { id: string; username: string; email: string; avatarUrl: string | null; isAdmin: boolean; createdAt: string; updatedAt: string };
type AdminMemoryForm = {
  userId: string;
  date: string;
  content: string;
  isOpen: boolean;
};

function rawToAdminUser(u: RawAdminUser): AdminUser {
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return {
    id: u.id, username: u.username, email: u.email,
    avatarURL: u.avatarUrl, isAdmin: u.isAdmin,
    joinedDate: fmt(u.createdAt), lastActive: fmt(u.updatedAt),
    memoriesCount: 0, friendsCount: 0,
  };
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

export function AdminPage({ currentUserId }: AdminPageProps) {
  const [stats, setStats]   = useState<AdminStats>({ totalUsers: 0, totalMemories: 0, totalAdmins: 0 });
  const [users, setUsers]   = useState<AdminUser[]>([]);
  const [aiOverview, setAiOverview] = useState<AdminAiOverview | null>(null);
  const [search, setSearch] = useState('');
  const [memoryForm, setMemoryForm] = useState<AdminMemoryForm>({
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    content: '',
    isOpen: false,
  });
  const [memoryFormStatus, setMemoryFormStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingMemory, setIsSubmittingMemory] = useState(false);
  const [memoryFile, setMemoryFile] = useState<File | null>(null);
  const [memoryFilePreview, setMemoryFilePreview] = useState<string | null>(null);
  const [memoryUploadProgress, setMemoryUploadProgress] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [roleConfirmId, setRoleConfirmId]     = useState<string | null>(null);

  useEffect(() => {
    api.get<RawAdminStats>('/admin/stats').then(s => setStats({
      totalUsers: s.userCount, totalMemories: s.memoryCount, totalAdmins: 0,
    })).catch(() => {});
    api.get<{ items: RawAdminUser[]; total: number }>('/admin/users', { page: 1, limit: 100 })
      .then(r => {
        setUsers(r.items.map(rawToAdminUser));
        setMemoryForm((prev) => ({
          ...prev,
          userId: prev.userId || r.items[0]?.id || '',
        }));
      })
      .catch(() => {});
    api.get<AdminAiOverview>('/admin/ai/stats')
      .then(setAiOverview)
      .catch(() => {});
  }, []);

  const totalAdmins = useMemo(() => users.filter(u => u.isAdmin).length, [users]);

  const filtered = useMemo(() =>
    users.filter(u =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    ),
    [users, search],
  );

  const handleDeleteConfirm = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { /* ignore */ } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleToggleRole = async (id: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newIsAdmin = !user.isAdmin;
    try {
      await api.patch(`/admin/users/${id}`, { isAdmin: newIsAdmin });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: newIsAdmin } : u));
    } catch { /* ignore */ }
  };

  const handleCreateMemory = async (e: Event) => {
    e.preventDefault();
    if (!memoryForm.userId || !memoryForm.date || !memoryForm.content.trim()) {
      setMemoryFormStatus({ type: 'error', message: 'Choose a user, a date, and a memory.' });
      return;
    }

    setIsSubmittingMemory(true);
    setMemoryFormStatus(null);
    setMemoryUploadProgress(null);
    try {
      const created = await api.post<{ id: string }>('/admin/memories', {
        userId: memoryForm.userId,
        date: memoryForm.date,
        content: memoryForm.content.trim(),
        isOpen: memoryForm.isOpen,
      });
      if (memoryFile) {
        const form = new FormData();
        form.append('file', memoryFile);
        await api.upload(`/admin/memories/${created.id}/media`, form, {
          onProgress: setMemoryUploadProgress,
        });
      }
      setStats((prev) => ({ ...prev, totalMemories: prev.totalMemories + 1 }));
      setMemoryForm((prev) => ({ ...prev, content: '', isOpen: false }));
      if (memoryFilePreview) {
        URL.revokeObjectURL(memoryFilePreview);
      }
      setMemoryFile(null);
      setMemoryFilePreview(null);
      setMemoryUploadProgress(null);
      setMemoryFormStatus({
        type: 'success',
        message: memoryFile
          ? 'Memory and media created on the selected date.'
          : 'Memory created on the selected date.',
      });
    } catch (error) {
      const message = getApiErrorMessage(error, 'Failed to create the memory.');
      setMemoryFormStatus({ type: 'error', message });
      setMemoryUploadProgress(null);
    } finally {
      setIsSubmittingMemory(false);
    }
  };

  const handleMemoryFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    const validationError = validateMemoryMediaFile(file);
    if (validationError) {
      setMemoryFormStatus({ type: 'error', message: validationError });
      input.value = '';
      return;
    }

    if (memoryFilePreview) {
      URL.revokeObjectURL(memoryFilePreview);
    }
    setMemoryFile(file);
    setMemoryFilePreview(URL.createObjectURL(file));
    setMemoryFormStatus(null);
    setMemoryUploadProgress(null);
    input.value = '';
  };

  const removeMemoryFile = () => {
    if (memoryFilePreview) {
      URL.revokeObjectURL(memoryFilePreview);
    }
    setMemoryFile(null);
    setMemoryFilePreview(null);
    setMemoryUploadProgress(null);
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
        <div className="px-6 pt-6 pb-4 flex items-center gap-2.5">
          <Sparkles size={17} className="text-pink" />
          <div>
            <h2 className="text-lg font-black text-darkgrey">Add Memory For A User</h2>
            <p className="text-xs text-mediumgrey mt-0.5">Backfill a memory on any specific date.</p>
          </div>
        </div>

        <form onSubmit={handleCreateMemory} className="px-6 pb-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_11rem] gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">User</span>
              <select
                value={memoryForm.userId}
                onChange={(e) => setMemoryForm((prev) => ({ ...prev, userId: (e.target as HTMLSelectElement).value }))}
                className="rounded-2xl bg-lightgrey/40 px-4 py-3 text-sm text-darkgrey outline-none border border-transparent focus:border-yellow"
              >
                <option value="" disabled>Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Date</span>
              <input
                type="date"
                value={memoryForm.date}
                onInput={(e) => setMemoryForm((prev) => ({ ...prev, date: (e.target as HTMLInputElement).value }))}
                className="rounded-2xl bg-lightgrey/40 px-4 py-3 text-sm text-darkgrey outline-none border border-transparent focus:border-yellow"
              />
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Memory</span>
              <span className="text-xs text-mediumgrey">{memoryForm.content.length}/180</span>
            </div>
            <textarea
              value={memoryForm.content}
              onInput={(e) =>
                setMemoryForm((prev) => ({
                  ...prev,
                  content: (e.target as HTMLTextAreaElement).value.slice(0, 180),
                }))
              }
              rows={4}
              placeholder="Write the memory that should exist on that date..."
              className="rounded-3xl bg-lightgrey/40 px-4 py-3 text-sm text-darkgrey outline-none border border-transparent focus:border-yellow resize-none"
            />
          </label>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Media</span>
              <label className="inline-flex items-center justify-center rounded-full bg-verylightorange px-4 py-2 text-sm font-semibold text-darkgrey hover:bg-orange/20 transition-colors cursor-pointer">
                Add File
                <input
                  type="file"
                  accept="image/*,audio/*"
                  className="hidden"
                  onChange={handleMemoryFileChange}
                />
              </label>
            </div>

            {memoryFilePreview && (
              <div className="rounded-3xl bg-lightgrey/40 p-4 flex flex-col gap-3">
                <MediaPreview
                  src={memoryFilePreview}
                  alt="Admin memory media preview"
                  className="w-full max-h-64 rounded-2xl object-cover"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-darkgrey font-medium truncate">{memoryFile?.name}</p>
                  <button
                    type="button"
                    onClick={removeMemoryFile}
                    className="text-sm text-mediumgrey hover:text-darkgrey transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {memoryUploadProgress !== null && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-darkgrey">
                  <span>Uploading media</span>
                  <span>{memoryUploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-lightgrey overflow-hidden">
                  <div
                    className="h-full rounded-full bg-pink transition-all"
                    style={{ width: `${memoryUploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-3 text-sm text-darkgrey font-medium">
            <input
              type="checkbox"
              checked={memoryForm.isOpen}
              onChange={(e) => setMemoryForm((prev) => ({ ...prev, isOpen: (e.target as HTMLInputElement).checked }))}
              className="w-4 h-4 rounded border-black/15"
            />
            Create it as a shared memory
          </label>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="submit"
              disabled={isSubmittingMemory || users.length === 0}
              className={cn(
                'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-bold transition-colors',
                isSubmittingMemory || users.length === 0
                  ? 'bg-lightgrey text-mediumgrey cursor-not-allowed'
                  : 'bg-pink text-white hover:bg-pink/85',
              )}
            >
              {isSubmittingMemory ? 'Creating…' : 'Create Memory'}
            </button>
            {memoryFormStatus && (
              <p className={cn(
                'text-sm',
                memoryFormStatus.type === 'success' ? 'text-green-700' : 'text-pink',
              )}>
                {memoryFormStatus.message}
              </p>
            )}
          </div>
        </form>
      </div>

      {aiOverview && (
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-center gap-2.5">
            <BrainCircuit size={17} className="text-pink" />
            <h2 className="text-lg font-black text-darkgrey">AI Operations</h2>
          </div>

          <div className="px-6 pb-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-3xl bg-lightgrey/40 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BotMessageSquare size={16} className="text-darkgrey" />
                <h3 className="font-bold text-darkgrey">Prompt Generation</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Sparkles size={18} className="text-darkgrey" />} value={aiOverview.promptSuggestions.totalStoredPrompts} label="Stored Prompts" color="bg-yellow/60" />
                <StatCard icon={<Users size={18} className="text-darkgrey" />} value={aiOverview.promptSuggestions.usersWithStoredPrompts} label="Users With Queue" color="bg-blue/40" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Idle</p>
                  <p className="mt-1 text-xl font-black text-darkgrey">{aiOverview.promptSuggestions.generationStatusCounts.idle}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Generating</p>
                  <p className="mt-1 text-xl font-black text-darkgrey">{aiOverview.promptSuggestions.generationStatusCounts.generating}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Ready</p>
                  <p className="mt-1 text-xl font-black text-darkgrey">{aiOverview.promptSuggestions.generationStatusCounts.ready}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Error</p>
                  <p className="mt-1 text-xl font-black text-pink">{aiOverview.promptSuggestions.generationStatusCounts.error}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-darkgrey" />
                  <h4 className="font-semibold text-darkgrey">Recent Prompt Errors</h4>
                </div>
                {aiOverview.promptSuggestions.recentErrors.length === 0 ? (
                  <p className="mt-3 text-sm text-mediumgrey">No recent prompt-generation errors.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {aiOverview.promptSuggestions.recentErrors.map((item) => (
                      <li key={`${item.userId}-${item.updatedAt}`} className="rounded-2xl bg-lightgrey/40 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-darkgrey">{item.username}</span>
                          <span className="text-[11px] text-mediumgrey whitespace-nowrap">
                            {new Date(item.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-pink break-words">{item.lastError}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-lightgrey/40 p-5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <BrainCircuit size={16} className="text-darkgrey" />
                <h3 className="font-bold text-darkgrey">Mood Classification</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<BrainCircuit size={18} className="text-darkgrey" />} value={aiOverview.moodClassification.totalJobs} label="Total Jobs" color="bg-purple/30" />
                <StatCard icon={<Activity size={18} className="text-darkgrey" />} value={aiOverview.moodClassification.statusCounts.processing} label="Processing Now" color="bg-orange/80" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Queued</p>
                  <p className="mt-1 text-xl font-black text-darkgrey">{aiOverview.moodClassification.statusCounts.queued}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Processing</p>
                  <p className="mt-1 text-xl font-black text-darkgrey">{aiOverview.moodClassification.statusCounts.processing}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Completed</p>
                  <p className="mt-1 text-xl font-black text-darkgrey">{aiOverview.moodClassification.statusCounts.completed}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-[11px] font-bold tracking-widest text-mediumgrey uppercase">Failed</p>
                  <p className="mt-1 text-xl font-black text-pink">{aiOverview.moodClassification.statusCounts.failed}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <div className="flex items-center gap-2">
                  <TriangleAlert size={15} className="text-pink" />
                  <h4 className="font-semibold text-darkgrey">Recent Mood Failures</h4>
                </div>
                {aiOverview.moodClassification.recentFailures.length === 0 ? (
                  <p className="mt-3 text-sm text-mediumgrey">No recent mood-classification failures.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {aiOverview.moodClassification.recentFailures.map((item) => (
                      <li key={item.jobId} className="rounded-2xl bg-lightgrey/40 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-darkgrey">{item.username}</span>
                          <span className="text-[11px] text-mediumgrey whitespace-nowrap">
                            {new Date(item.updatedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-pink break-words">{item.lastError}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
