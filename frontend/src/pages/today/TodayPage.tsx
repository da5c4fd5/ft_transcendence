import { useState, useEffect, useRef } from 'preact/hooks';
import { Pencil, RefreshCw, Camera, X, Zap, Sparkles, Sprout, Heart } from 'lucide-preact';
import { Button } from '../../components/Button/Button';
import { TreeVisual } from '../../components/TreeVisual/TreeVisual';
import type { SavedMemory, PastMemory } from './today.types';
import type { TreeData } from '../tree/tree.types';
import type { MemoryStats } from '../memories/memories.types';

// ─── Mock data (TODO: supprimer quand le backend est prêt) ────────────────────

const MOCK_TREE: TreeData = {
  lifeForce: 10,
  isDecreasing: false,
};

const MOCK_STATS: MemoryStats = {
  totalCapsuls: 10,
  shared: 2,
  dayStreak: 1,
  wordsWritten: 139,
};

async function fetchTreeData(): Promise<TreeData> {
  // TODO: const res = await fetch('/api/tree', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_TREE;
}

async function fetchStats(): Promise<MemoryStats> {
  // TODO: const res = await fetch('/api/memories/stats', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_STATS;
}

const MAX_CHARS = 180;

function getTodayString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).toUpperCase();
}

// ─── Calcul du label "One year ago today" côté frontend ──────────────────────

function getPastMemoryLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor(diffDays / 30);
  const isSameDay = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();

  if (years >= 1 && isSameDay) return `${years === 1 ? 'One' : years} year${years > 1 ? 's' : ''} ago today`;
  if (years >= 1) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months >= 1) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (diffDays >= 7) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function getPastMemoryDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PromptCard({ prompt, isLoading, onRefresh }: { prompt: string; isLoading: boolean; onRefresh: () => void }) {
  return (
    <div className="bg-blue rounded-3xl p-8 flex flex-col gap-5">
      <h2 className={`text-3xl font-black leading-tight h-[4.8rem] flex items-center ${isLoading ? 'text-darkgrey/30 animate-pulse' : 'text-darkgrey'}`}>
        {prompt}
      </h2>
      <button
        type="button"
        onClick={onRefresh}
        className="flex items-center gap-2 bg-white rounded-full px-4 py-2 text-sm font-semibold text-darkgrey w-fit hover:shadow-md transition-shadow"
      >
        <RefreshCw size={14} />
        Need inspiration?
      </button>
    </div>
  );
}

function EntryCard({
  dateStr, content, media,
  onContentChange, onMediaChange, onMediaRemove, onCapsul, onCancel,
}: {
  dateStr: string;
  content: string;
  media: string | null;
  onContentChange: (v: string) => void;
  onMediaChange: (e: Event) => void;
  onMediaRemove: () => void;
  onCapsul: () => void;
  onCancel: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasContent = content.trim().length > 0;

  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-sm">

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-darkgrey tracking-widest">{dateStr}</span>
        {hasContent && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-mediumgrey hover:text-darkgrey transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      <textarea
        value={content}
        onInput={(e) => onContentChange((e.target as HTMLTextAreaElement).value)}
        placeholder="Type your memory here..."
        maxLength={MAX_CHARS}
        rows={5}
        className="w-full bg-transparent outline-none text-darkgrey placeholder:text-mediumgrey text-base resize-none leading-relaxed"
      />

      {media && (
        <div className="relative rounded overflow-hidden">
          <img src={media} alt="Attached" className="w-full max-h-64 object-cover" />
          <button
            type="button"
            onClick={onMediaRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            <X size={14} className="text-darkgrey" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-black/5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onMediaChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={[
            'w-10 h-10 rounded-full flex items-center justify-center transition-all',
            media
              ? 'bg-pink text-white'
              : 'bg-verylightorange text-mediumgrey hover:text-darkgrey',
          ].join(' ')}
        >
          <Camera size={18} />
        </button>

        <span className="text-sm text-mediumgrey">{content.length}/{MAX_CHARS}</span>

        <div className="flex-1" />

        <Button variant="primary" size="sm" disabled={!hasContent} onClick={onCapsul}>
          Capsul it!
        </Button>
      </div>
    </div>
  );
}

function SavedEntryCard({ dateStr, memory, onEdit }: {
  dateStr: string;
  memory: SavedMemory;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl p-7 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-darkgrey tracking-widest">{dateStr}</span>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm text-mediumgrey hover:text-darkgrey transition-colors font-medium"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>

      <p className="text-darkgrey text-lg font-semibold leading-relaxed">{memory.content}</p>

      {memory.media && (
        <img src={memory.media} alt="Memory" className="rounded-2xl w-full max-h-64 object-cover" />
      )}
    </div>
  );
}

function SuccessBanner() {
  return (
    <div className="bg-white rounded-3xl px-7 py-5 flex flex-col items-center gap-2 shadow-sm text-center">
      <div className="flex items-center gap-2">
        <Heart size={16} className="text-lightpink" fill="currentColor" />
        <span className="font-bold text-darkgrey">Memory safely stored in your capsul!</span>
      </div>
      <p className="text-mediumgrey text-sm">
        Come back tomorrow to keep your tree growing 🌱
      </p>
    </div>
  );
}

function PastMemoryCard({ memory, onRefresh }: {
  memory: PastMemory | null;
  onRefresh: () => void;
}) {
  if (!memory) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-orange/50 p-6 flex flex-col items-center gap-2 text-center">
        <p className="text-mediumgrey text-sm leading-relaxed">
          Keep adding memories — they'll resurface here as reminders of your past.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-orange rounded-3xl p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRefresh}
          className="w-9 h-9 bg-white/40 rounded-full flex items-center justify-center shrink-0 hover:bg-white/60 transition-colors"
          aria-label="Show another memory"
        >
          <RefreshCw size={15} className="text-darkgrey" />
        </button>
        <div>
          <p className="font-bold text-darkgrey text-base">{getPastMemoryLabel(memory.date)}</p>
          <p className="text-xs text-darkgrey/60 tracking-widest font-semibold">{getPastMemoryDate(memory.date)}</p>
          <p className="text-xs text-darkgrey/50 mt-0.5">Mood: {memory.mood}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5">
        <p className="text-darkgrey text-sm leading-relaxed">{memory.content}</p>
      </div>
    </div>
  );
}

function TreeSidebar({ tree, stats, saved }: { tree: TreeData | null; stats: MemoryStats | null; saved: boolean }) {
  return (
    <div className="bg-white rounded-3xl p-6 flex flex-col gap-5 shadow-sm">

      <div className="text-center">
        <h3 className="font-bold text-darkgrey text-lg">My Tree</h3>
      </div>

      <div className="bg-linear-to-b from-blue/40 via-blue/20 to-blue/5 rounded-2xl p-4 flex items-center justify-center">
        <TreeVisual health={tree?.lifeForce ?? 0} size="medium" />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-bold text-darkgrey">
          <span>Life Force</span>
          <span className="text-pink">{tree?.lifeForce ?? 0}%</span>
        </div>
        <div className="h-2 bg-lightgrey rounded-full overflow-hidden">
          <div
            className="h-full bg-pink rounded-full transition-all duration-1000"
            style={{ width: `${tree?.lifeForce ?? 0}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-orange/80 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
          <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center">
            <Zap size={13} className="text-darkgrey" />
          </div>
          <span className="text-2xl font-black text-darkgrey">{stats?.dayStreak ?? 0}</span>
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">DAY STREAK</span>
        </div>
        <div className="bg-blue/80 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center">
          <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center">
            <Sparkles size={13} className="text-darkgrey" />
          </div>
          <span className="text-2xl font-black text-darkgrey">{stats?.wordsWritten ?? 0}</span>
          <span className="text-[10px] font-bold text-mediumgrey tracking-widest">WORDS WRITTEN</span>
        </div>
      </div>

      <div className={[
        'border-2 rounded-2xl p-4 flex flex-col items-center gap-1.5 text-center transition-colors duration-500',
        saved ? 'border-pink/20 bg-verylightorange' : 'border-dashed border-lightgrey',
      ].join(' ')}>
        <Sprout size={18} className={saved ? 'text-pink' : 'text-mediumgrey'} />
        <span className={`text-sm font-semibold ${saved ? 'text-pink' : 'text-mediumgrey'}`}>
          {saved ? 'Memory added today' : 'Capsul a memory to grow!'}
        </span>
      </div>
    </div>
  );
}

// ─── Mock prompts (TODO: supprimer et décommenter l'appel API) ────────────────

const MOCK_PROMPTS = [
  "What's something you're grateful for right now?",
  "What made you smile today?",
  "Describe a small moment that felt good.",
  "What's on your mind right now?",
  "What did you learn today?",
  "Who made your day better?",
  "What's one thing you want to remember about today?",
  "What surprised you today?",
  "What's a challenge you overcame recently?",
  "How are you feeling in your body right now?",
  "What's something you're looking forward to?",
  "What would make tomorrow a great day?",
];

async function fetchPrompt(): Promise<string> {
  // TODO: const res = await fetch('/api/prompt', { headers: { Authorization: `Bearer ${token}` } }); return (await res.json()).prompt;
  return MOCK_PROMPTS[Math.floor(Math.random() * MOCK_PROMPTS.length)];
}

// ─── Mock past memory (TODO: supprimer et décommenter l'appel API) ────────────

const MOCK_PAST_MEMORY: PastMemory = {
  id: 'm1',
  date: '2025-04-09',
  content: 'Had a great walk in the park this morning. The weather was perfect and I felt completely at peace.',
  media: null,
  mood: 'Peaceful',
};

async function fetchPastMemory(): Promise<PastMemory | null> {
  // TODO: const res = await fetch('/api/memories/capsuls', { headers: { Authorization: `Bearer ${token}` } });
  //       const capsuls = await res.json();
  //       return capsuls[0] ?? null;  // on prend le premier (le plus pertinent selon le backend)
  return MOCK_PAST_MEMORY;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TodayPage() {
  const [todayState, setTodayState] = useState<'prompt' | 'saved'>('prompt');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [savedMemory, setSavedMemory] = useState<SavedMemory | null>(null);
  const [pastMemory, setPastMemory] = useState<PastMemory | null>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);

  const dateStr = getTodayString();

  useEffect(() => {
    async function load() {
      const [p, t, s] = await Promise.all([fetchPrompt(), fetchTreeData(), fetchStats()]);
      setPrompt(p);
      setTreeData(t);
      setStats(s);
    }
    load();
  }, []);

  useEffect(() => {
    if (todayState !== 'saved') return;
    fetchPastMemory().then(setPastMemory);
  }, [todayState]);

  const handleRefreshPastMemory = async () => {
    const m = await fetchPastMemory();
    setPastMemory(m);
  };

  const handleContentChange = (v: string) => {
    if (v.length <= MAX_CHARS) setContent(v);
  };

  const handleMediaChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setMedia(ev.target?.result as string);
    reader.readAsDataURL(file);
    // TODO: après upload réel : POST /api/memories/:id/media { image: base64 }
  };

  const handleCapsul = () => {
    if (!content.trim()) return;
    // TODO: POST /api/memories { content } puis POST /api/memories/:id/media si media
    setSavedMemory({ content, media });
    setTodayState('saved');
  };

  const handleEdit = () => {
    if (!savedMemory) return;
    setContent(savedMemory.content);
    setMedia(savedMemory.media);
    setSavedMemory(null);
    setTodayState('prompt');
  };

  const handleCancel = () => {
    setContent('');
    setMedia(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 lg:gap-12 items-start">
        <div className="flex flex-col gap-6 lg:gap-8">
          {todayState === 'prompt' && (
            <>
              <PromptCard
                prompt={prompt ?? ''}
                isLoading={prompt === null}
                onRefresh={async () => {
                  setPrompt(null);
                  const p = await fetchPrompt();
                  setPrompt(p);
                }}
              />
              <EntryCard
                dateStr={dateStr}
                content={content}
                media={media}
                onContentChange={handleContentChange}
                onMediaChange={handleMediaChange}
                onMediaRemove={() => setMedia(null)}
                onCapsul={handleCapsul}
                onCancel={handleCancel}
              />
            </>
          )}

          {todayState === 'saved' && savedMemory && (
            <>
              <SavedEntryCard dateStr={dateStr} memory={savedMemory} onEdit={handleEdit} />
              <SuccessBanner />
              <PastMemoryCard
                memory={pastMemory}
                onRefresh={handleRefreshPastMemory}
              />
            </>
          )}
        </div>

        <div className="lg:sticky lg:top-20">
          <TreeSidebar tree={treeData} stats={stats} saved={todayState === 'saved'} />
        </div>
      </div>
    </div>
  );
}
