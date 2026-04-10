import { useState, useEffect } from 'preact/hooks';
import { Activity, Zap, Sparkles, Sprout } from 'lucide-preact';
import type { TreeData, Achievement } from './tree.types';

// ─── Mock data (TODO: supprimer quand le backend est prêt) ────────────────────

const MOCK_TREE: TreeData = {
  stage: 'sprout',
  lifeForce: 10,
  stageName: 'Struggling',
  stageMotivation: "Don't give up!",
  totalCapsuls: 10,
  dayStreak: 1,
  wordsWritten: 139,
};

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_capsul',    emoji: '🌱', title: 'First Capsul',      description: 'Started your journey',  unlocked: true  },
  { id: 'week_warrior',    emoji: '🔥', title: 'Week Warrior',      description: '7 day streak',           unlocked: false },
  { id: 'photographer',    emoji: '📷', title: 'Photographer',      description: '10 photos captured',     unlocked: false },
  { id: 'monthly_master',  emoji: '⭐', title: 'Monthly Master',    description: '30 capsuls',             unlocked: false },
  { id: 'visual_storyteller', emoji: '🎨', title: 'Visual Storyteller', description: '25 photo memories', unlocked: false },
  { id: 'consistency_king', emoji: '💪', title: 'Consistency King', description: '30 day streak',          unlocked: false },
];

// ─── Fetch functions ──────────────────────────────────────────────────────────

async function fetchTreeData(): Promise<TreeData> {
  // TODO: const res = await fetch('/api/tree'); return res.json();
  return MOCK_TREE;
}

async function fetchAchievements(): Promise<Achievement[]> {
  // TODO: const res = await fetch('/api/achievements'); return res.json();
  return MOCK_ACHIEVEMENTS;
}

async function petTree(): Promise<void> {
  // TODO: POST /api/tree/pet
}

// ─── TreeVisual ───────────────────────────────────────────────────────────────

function TreeVisual({ lifeForce, onPet }: { lifeForce: number; onPet: () => void }) {
  const [petted, setPetted] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handlePet = async () => {
    if (petted) return;
    setPetted(true);
    setParticles([
      { id: 1, x: -20, y: -30 },
      { id: 2, x: 20,  y: -40 },
      { id: 3, x: 0,   y: -50 },
    ]);
    await petTree();
    setTimeout(() => setParticles([]), 800);
  };

  const healthColor =
    lifeForce < 20  ? 'text-moodsad' :
    lifeForce < 50  ? 'text-orange' :
    lifeForce < 80  ? 'text-yellow' :
                      'text-green-500';

  const healthLabel =
    lifeForce < 20  ? 'Very weak' :
    lifeForce < 50  ? 'Growing' :
    lifeForce < 80  ? 'Healthy' :
                      'Thriving';

  const healthDotColor =
    lifeForce < 20  ? 'bg-moodsad' :
    lifeForce < 50  ? 'bg-orange' :
    lifeForce < 80  ? 'bg-yellow' :
                      'bg-green-400';

  return (
    <div className="relative bg-gradient-to-b from-blue/40 via-blue/20 to-blue/5 rounded-3xl p-8 flex flex-col items-center gap-5 overflow-hidden">

      {/* Glow background */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ width: 200, height: 200, background: `radial-gradient(circle, rgba(147,197,253,0.8) 0%, transparent 70%)` }}
      />

      {/* Tree illustration */}
      <div className="relative flex flex-col items-center">
        {/* Particles on pet */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute text-yellow text-lg animate-bounce pointer-events-none"
            style={{ left: `calc(50% + ${p.x}px)`, top: p.y, animationDuration: '0.6s' }}
          >
            ✨
          </div>
        ))}

        {/* Simple SVG tree matching the screenshot style */}
        <svg width="120" height="130" viewBox="0 0 120 130" fill="none" className="drop-shadow-sm">
          {/* Trunk */}
          <rect x="50" y="90" width="20" height="35" rx="6" fill="#C4956A" />
          {/* Ground mound */}
          <ellipse cx="60" cy="118" rx="38" ry="10" fill="#D4A574" opacity="0.6" />
          {/* Leaves — small sprout stage */}
          <ellipse cx="60" cy="72" rx="28" ry="22" fill="#86EFAC" opacity="0.9" />
          <ellipse cx="42" cy="80" rx="18" ry="14" fill="#6EE7B7" opacity="0.8" />
          <ellipse cx="78" cy="80" rx="18" ry="14" fill="#6EE7B7" opacity="0.8" />
          <ellipse cx="60" cy="58" rx="20" ry="18" fill="#A7F3D0" opacity="0.9" />
          {/* Little decorative dots */}
          <circle cx="48" cy="70" r="3" fill="#FCD34D" opacity="0.7" />
          <circle cx="72" cy="65" r="2.5" fill="#FCD34D" opacity="0.6" />
          <circle cx="60" cy="75" r="2" fill="#FDE68A" opacity="0.8" />
        </svg>
      </div>

      {/* Health badge */}
      <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-sm">
        <span className={`w-2 h-2 rounded-full ${healthDotColor}`} />
        <span className={`text-sm font-semibold ${healthColor}`}>{healthLabel}</span>
      </div>

      {/* Pet button */}
      <button
        type="button"
        onClick={handlePet}
        className={`flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold text-darkgrey shadow-sm transition-all ${
          petted ? 'opacity-50 cursor-default' : 'hover:shadow-md hover:bg-white active:scale-95'
        }`}
      >
        <span>✨</span>
        {petted ? 'Tree petted!' : 'Click to pet your tree!'}
      </button>

      {/* Life force bar */}
      <div className="w-full max-w-xs bg-white/60 backdrop-blur-sm rounded-2xl px-5 py-3 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between text-sm font-semibold text-darkgrey">
          <span>Life Force</span>
          <span className="text-blue font-bold">{lifeForce}%</span>
        </div>
        <div className="h-2 bg-lightgrey rounded-full overflow-hidden">
          <div
            className="h-full bg-blue rounded-full transition-all duration-1000"
            style={{ width: `${lifeForce}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── StageCard ────────────────────────────────────────────────────────────────

function StageCard({ tree }: { tree: TreeData }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <h2 className="text-3xl font-black text-darkgrey">{tree.stageName}</h2>
      <p className="text-mediumgrey text-sm">{tree.stageMotivation}</p>
      <div className="flex items-center gap-2 bg-white rounded-full px-5 py-2.5 shadow-sm mt-1">
        <Activity size={16} className="text-pink" />
        <span className="font-bold text-darkgrey text-sm">{tree.lifeForce}%</span>
        <span className="text-mediumgrey text-sm">Life Force</span>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

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

// ─── AchievementCard ──────────────────────────────────────────────────────────

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

// ─── TreePage ─────────────────────────────────────────────────────────────────

export function TreePage() {
  const [tree, setTree]                 = useState<TreeData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    fetchTreeData().then(setTree);
    fetchAchievements().then(setAchievements);
  }, []);

  if (!tree) return null;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-4 lg:py-12 flex flex-col gap-6">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-black text-darkgrey">My Tree</h1>
        <p className="text-mediumgrey mt-1 text-sm">Watch it grow with your daily presence 🌿</p>
      </div>

      {/* Tree visual + stage info */}
      <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
        <TreeVisual lifeForce={tree.lifeForce} onPet={() => {}} />
        <StageCard tree={tree} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Sprout size={18} className="text-darkgrey" />}
          value={tree.totalCapsuls}
          label="Total Capsuls"
          sublabel="Every memory forms the roots"
          color="bg-yellow/60"
        />
        <StatCard
          icon={<Zap size={18} className="text-darkgrey" />}
          value={tree.dayStreak}
          label="Day Streak"
          sublabel="Daily visits drive the growth"
          color="bg-lightpink"
        />
        <StatCard
          icon={<Sparkles size={18} className="text-darkgrey" />}
          value={tree.wordsWritten}
          label="Words Written"
          sublabel="Every word waters the tree"
          color="bg-lightpink"
        />
      </div>

      {/* Achievements */}
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
