import { useEffect, useState } from 'preact/hooks';
import { Zap, Sparkles, Sprout } from 'lucide-preact';
import { TreeVisual } from '../../components/TreeVisual/TreeVisual';
import type { TreeData, Achievement } from './tree.types';
import type { MemoryStats } from '../memories/memories.types';
import { api } from '../../lib/api';
import { getFormattedDate } from '../../lib/date';

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_memory', emoji: '🌱', title: 'First Memory', description: 'Create your first memory', unlocked: false },
  { id: 'week_warrior', emoji: '🔥', title: 'Week Warrior', description: 'Write memories 7 days in a row', unlocked: false },
  { id: 'memory_keeper', emoji: '📚', title: 'Memory Keeper', description: 'Collect 30 memories', unlocked: false },
  { id: 'social_butterfly', emoji: '🦋', title: 'Social Butterfly', description: 'Have 5 friends', unlocked: false },
  { id: 'open_book', emoji: '📖', title: 'Open Book', description: 'Share a memory with someone', unlocked: false },
  { id: 'contributor', emoji: '✍️', title: 'Contributor', description: 'Contribute to 5 memories', unlocked: false },
];

const EMPTY_TREE: TreeData = {
  lifeForce: 0,
  isDecreasing: false,
  stage: 1,
  stageLabel: 'Dormant Seed',
  lastMemoryDate: null,
};

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

export function TreePage() {
  const [tree, setTree] = useState<TreeData | null>(null);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    async function load() {
      const [treeData, memoryStats, unlockedIds] = await Promise.all([
        api.get<TreeData | null>('/users/me/tree').catch(() => null),
        api.get<MemoryStats>('/memories/stats').catch(() => null),
        api.get<string[]>('/users/me/achievements').catch(() => [] as string[]),
      ]);

      setTree(treeData ?? EMPTY_TREE);
      setStats(memoryStats);
      setAchievements(ALL_ACHIEVEMENTS.map((achievement) => ({
        ...achievement,
        unlocked: unlockedIds.includes(achievement.id),
      })));
    }

    load();
  }, []);

  if (!tree) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 lg:py-12 flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-4xl font-black text-darkgrey">My Tree</h1>
        <p className="text-mediumgrey mt-1 text-sm">Watch it grow with your daily presence</p>
      </div>

      <div className="bg-purple/40 rounded-3xl px-6 py-5 flex flex-col gap-2 text-center">
        <p className="text-xs font-bold text-darkgrey/60 tracking-widest uppercase">Current Stage</p>
        <p className="text-xl font-black text-darkgrey">{tree.stageLabel}</p>
        <p className="text-sm text-darkgrey/70">
          {tree.isDecreasing
            ? 'Your tree is losing momentum until you write again.'
            : 'Your tree is stable and fed by your recent memories.'}
        </p>
        <p className="text-xs text-darkgrey/55">
          {tree.lastMemoryDate
            ? `Last memory: ${getFormattedDate(tree.lastMemoryDate, { format: 'long', uppercase: false })}`
            : 'No memories yet'}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="bg-linear-to-b from-blue/40 via-blue/20 to-blue/5 rounded-2xl p-6 flex flex-col items-center gap-4">
          <TreeVisual
            health={tree.lifeForce}
            size="large"
            showDetails
            isDecreasing={tree.isDecreasing}
          />
          <div className="w-full max-w-sm flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-bold text-darkgrey">
              <span>Life Force</span>
              <span className="text-pink">{tree.lifeForce}%</span>
            </div>
            <div className="h-2 bg-white/70 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink rounded-full transition-all duration-1000"
                style={{ width: `${tree.lifeForce}%` }}
              />
            </div>
          </div>
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
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </div>
    </div>
  );
}
