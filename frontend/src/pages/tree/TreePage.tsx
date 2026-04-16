import { useState, useEffect } from 'preact/hooks';
import { Zap, Sparkles, Sprout, ChevronRight, ChevronLeft } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { TreeVisual } from '../../components/TreeVisual/TreeVisual';
import type { TreeData, Achievement } from './tree.types';
import type { MemoryStats } from '../memories/memories.types';
import { api } from '../../lib/api';

// Static achievement definitions — backend only returns unlocked IDs
const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_capsul',       emoji: '🌱', title: 'First Capsul',       description: '1 memory created',           unlocked: false },
  { id: 'week_warrior',       emoji: '🔥', title: 'Week Warrior',       description: '7 day streak',              unlocked: false },
  { id: 'wordsmith',          emoji: '✍️', title: 'Wordsmith',          description: '500 words written',         unlocked: false },
  { id: 'monthly_master',     emoji: '⭐', title: 'Monthly Master',     description: '30 memories',                unlocked: false },
  { id: 'visual_storyteller', emoji: '🎨', title: 'Visual Storyteller', description: '25 photo memories',        unlocked: false },
  { id: 'consistency_king',   emoji: '💪', title: 'Consistency King',   description: '30 day streak',             unlocked: false },
];


const DEMO_STAGES: Array<{ health: number; name: string }> = [
  { health:  5, name: 'Stage 1 — Dormant Seed'   },
  { health: 18, name: 'Stage 2 — New Seedling'   },
  { health: 31, name: 'Stage 3 — Fragile Sprout' },
  { health: 44, name: 'Stage 4 — Young Plant'    },
  { health: 56, name: 'Stage 5 — Strong Sapling' },
  { health: 68, name: 'Stage 6 — Flourishing Tree' },
  { health: 80, name: 'Stage 7 — Blooming Tree'  },
  { health: 94, name: 'Stage 8 — Paradise Tree'  },
];

function StatCard({ icon, value, label, sublabel, color }: {
  icon: preact.ComponentChildren;
  value: number;
  label: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-3xl p-6 flex flex-col items-center gap-2 text-center`}>
      <div className="w-10 h-10 bg-white/60 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <span className="text-3xl font-black text-darkgrey">{value}</span>
      <div>
        <p className="text-sm font-bold text-darkgrey">{label}</p>
        <p className="text-[11px] text-darkgrey/60">{sublabel}</p>
      </div>
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
      achievement.unlocked
        ? 'bg-blue/10 border-blue/20'
        : 'bg-white border-black/5 opacity-50'
    }`}>
      <span className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
        {achievement.emoji}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${achievement.unlocked ? 'text-darkgrey' : 'text-mediumgrey'}`}>
          {achievement.title}
        </p>
        <p className="text-xs text-mediumgrey">{achievement.description}</p>
      </div>
      {achievement.unlocked && (
        <div className="w-2.5 h-2.5 bg-green-400 rounded-full shrink-0" />
      )}
    </div>
  );
}

function DemoBar({ stageIndex, onPrev, onNext, isDecreasing, onToggleDecreasing }: {
  stageIndex: number;
  onPrev: () => void;
  onNext: () => void;
  isDecreasing: boolean;
  onToggleDecreasing: () => void;
}) {
  const current = DEMO_STAGES[stageIndex];
  return (
    <div className="bg-purple/40 rounded-3xl px-5 py-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold text-darkgrey/60 tracking-widest uppercase shrink-0">Demo</span>
        <button
          type="button"
          onClick={onPrev}
          disabled={stageIndex === 0}
          className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors shrink-0"
        >
          <ChevronLeft size={16} className="text-darkgrey" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-darkgrey">{current.name}</p>
          <p className="text-xs text-darkgrey/50">Life Force: {current.health}%</p>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={stageIndex === DEMO_STAGES.length - 1}
          className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors shrink-0"
        >
          <ChevronRight size={16} className="text-darkgrey" />
        </button>
      </div>
      <button
        type="button"
        onClick={onToggleDecreasing}
        className={cn(
          'w-full rounded-2xl px-4 py-2 text-xs font-bold transition-colors',
          isDecreasing ? 'bg-blue/60 text-darkgrey' : 'bg-white/40 text-mediumgrey hover:bg-white/60',
        )}
      >
        {isDecreasing ? '😢 Decreasing (on)' : '😢 Simulate decreasing'}
      </button>
    </div>
  );
}

export function TreePage() {
  const [tree, setTree]                   = useState<TreeData | null>(null);
  const [stats, setStats]                 = useState<MemoryStats | null>(null);
  const [achievements, setAchievements]   = useState<Achievement[]>([]);
  const [demoIndex, setDemoIndex]         = useState(0);
  const [demoDecreasing, setDemoDecreasing] = useState(false);

  useEffect(() => {
    async function load() {
      const [t, s, unlockedIds] = await Promise.all([
        api.get<TreeData | null>('/users/me/tree').catch(() => null),
        api.get<MemoryStats>('/memories/stats').catch(() => null),
        api.get<string[]>('/users/me/achievements').catch(() => [] as string[]),
      ]);
      setTree(t ?? { lifeForce: 0, isDecreasing: false });
      setStats(s);
      setAchievements(ALL_ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlockedIds.includes(a.id) })));
    }
    load();
  }, []);

  if (!tree) return null;

  const displayHealth = DEMO_STAGES[demoIndex].health;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:py-12 flex flex-col gap-6">

      <div className="text-center">
        <h1 className="text-4xl font-black text-darkgrey">My Tree</h1>
        <p className="text-mediumgrey mt-1 text-sm">Watch it grow with your daily presence</p>
      </div>

      <DemoBar
        stageIndex={demoIndex}
        onPrev={() => setDemoIndex(i => Math.max(0, i - 1))}
        onNext={() => setDemoIndex(i => Math.min(DEMO_STAGES.length - 1, i + 1))}
        isDecreasing={demoDecreasing}
        onToggleDecreasing={() => setDemoDecreasing(v => !v)}
      />

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="bg-linear-to-b from-blue/40 via-blue/20 to-blue/5 rounded-2xl p-6 flex flex-col items-center gap-4">
          <TreeVisual health={displayHealth} size="large" showDetails isDecreasing={demoDecreasing} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Sprout size={18} className="text-darkgrey" />}
          value={stats?.totalCapsuls ?? 0}
          label="Total Capsuls"
          sublabel="Every memory forms the roots"
          color="bg-yellow/60"
        />
        <StatCard
          icon={<Zap size={18} className="text-darkgrey" />}
          value={stats?.dayStreak ?? 0}
          label="Day Streak"
          sublabel="Daily visits drive the growth"
          color="bg-orange"
        />
        <StatCard
          icon={<Sparkles size={18} className="text-darkgrey" />}
          value={stats?.wordsWritten ?? 0}
          label="Words Written"
          sublabel="Every word waters the tree"
          color="bg-lightpink"
        />
      </div>

      <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <h2 className="text-lg font-black text-darkgrey">Achievements</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map(a => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </div>

    </div>
  );
}
