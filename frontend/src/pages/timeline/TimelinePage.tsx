import { useState, useEffect } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-preact';
import { Button } from '../../components/Button/Button';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_CONFIG } from './timeline.types';
import type { Mood, DayEntry, TimelineStats } from './timeline.types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateYearGrid(year: number): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  const jan1 = new Date(year, 0, 1);
  const startDow = (jan1.getDay() + 6) % 7; // 0=Lun, 6=Dim

  let week: (string | null)[] = Array(startDow).fill(null);
  const cur = new Date(year, 0, 1);

  while (cur.getFullYear() === year) {
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    week.push(`${year}-${mm}-${dd}`);
    if (week.length === 7) { weeks.push(week); week = []; }
    cur.setDate(cur.getDate() + 1);
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

// Retourne la position (index de semaine) du premier jour de chaque mois.
function getMonthPositions(weeks: (string | null)[][]): { label: string; weekIndex: number }[] {
  const positions: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    for (const day of week) {
      if (!day) continue;
      const month = parseInt(day.split('-')[1]) - 1;
      if (month !== lastMonth) {
        positions.push({ label: MONTH_LABELS[month], weekIndex: wi });
        lastMonth = month;
      }
      break;
    }
  });
  return positions;
}

// ─── Mock data (TODO: supprimer quand le backend est prêt) ───────────────────

const MOCK_ENTRIES: DayEntry[] = [
  {
    date: '2026-04-02',
    mood: 'Peaceful',
    text: 'Spent the whole evening laughing until our stomachs hurt. Sunsets with these two never get old. We talked about everything and nothing. I want to remember this feeling of complete peace.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
    isShared: true,
    shareUrl: 'https://capsul.app/shared/9bfb4077-fa56-400e-831f',
    friendContributions: [
      {
        id: '1', name: 'Léa', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80',
        date: '02/04/2026',
        text: "This was such a perfect evening!! Look at this polaroid I took!",
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
      },
      {
        id: '2', name: 'Thomas', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80',
        date: '02/04/2026',
        text: "Next time I'm picking the restaurant though!",
        image: null,
      },
    ],
  },
  { date: '2026-04-07', mood: 'Joyful',    text: 'Beautiful spring day. Went for a run in the park and felt amazing.', image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-04-09', mood: 'Excited',   text: 'Started working on the new project today. So many ideas flowing!', image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-30', mood: 'Peaceful',  text: 'Super aprem bar à jeux avec Victor et Auriane au Nid Cocon Ludique!', image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-22', mood: 'Sad',       text: "Rainy day, feeling a bit low. But that's okay.", image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-15', mood: 'Nostalgic', text: 'Found old photos from childhood. Spent hours going through them.', image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-08', mood: 'Anxious',   text: 'Big presentation tomorrow. Trying to stay calm.', image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-02-14', mood: 'Joyful',    text: "Valentine's day! Best surprise ever.", image: null, isShared: false, shareUrl: null, friendContributions: [] },
  { date: '2026-01-01', mood: 'Excited',   text: 'New year, new adventures! Feeling hopeful.', image: null, isShared: false, shareUrl: null, friendContributions: [] },
];

const MOCK_STATS: TimelineStats = { capsuls: 9, completePercent: 2, shared: 1, streak: 2 };

async function fetchEntries(year: number): Promise<DayEntry[]> {
  // TODO: const res = await fetch(`/api/timeline?year=${year}`); return res.json();
  return MOCK_ENTRIES.filter(e => e.date.startsWith(String(year)));""
}

async function fetchStats(): Promise<TimelineStats> {
  // TODO: const res = await fetch('/api/stats'); return res.json();
  return MOCK_STATS;
}

async function fetchYearsWithEntries(): Promise<number[]> {
  // TODO: const res = await fetch('/api/timeline/years'); return res.json();
  // Le backend retourne la liste triée des années ayant au moins un memory.
  const years = [...new Set(MOCK_ENTRIES.map(e => parseInt(e.date.split('-')[0])))];
  return years.sort((a, b) => a - b);
}

// ─── CalendarGrid ─────────────────────────────────────────────────────────────

function CalendarGrid({ entries, year, onDayClick }: {
  entries: DayEntry[];
  year: number;
  onDayClick: (entry: DayEntry) => void;
}) {
  const entryMap = new Map(entries.map(e => [e.date, e]));
  const weeks = generateYearGrid(year);
  const monthPositions = getMonthPositions(weeks);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex flex-col gap-1">

        {/* Labels des mois */}
        <div className="flex pl-7 gap-0.5">
          {weeks.map((_, wi) => {
            const mp = monthPositions.find(m => m.weekIndex === wi);
            return (
              <div key={wi} className="w-3 shrink-0 relative">
                {mp && (
                  <span className="absolute left-0 text-[10px] font-semibold text-mediumgrey whitespace-nowrap">
                    {mp.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Grille + labels des jours */}
        <div className="flex gap-1 mt-3">

          {/* Labels des jours */}
          <div className="flex flex-col gap-1 w-6 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-mediumgrey font-semibold leading-none">{label}</span>
              </div>
            ))}
          </div>

          {/* Colonnes de semaines */}
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} className="w-3 h-3" />;
                  const entry = entryMap.get(day);
                  return (
                    <button
                      key={di}
                      type="button"
                      onClick={() => entry && onDayClick(entry)}
                      title={day}
                      className={[
                        'w-3 h-3 rounded-sm transition-transform',
                        entry
                          ? `${MOOD_CONFIG[entry.mood].cellColor} hover:scale-125 cursor-pointer`
                          : 'bg-lightgrey cursor-default',
                      ].join(' ')}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MoodLegend ───────────────────────────────────────────────────────────────

function MoodLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 mt-4 border-t border-black/5">
      <span className="text-xs font-bold text-darkgrey">Mood Legend:</span>
      {(Object.keys(MOOD_CONFIG) as Mood[]).map(mood => (
        <div key={mood} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm shrink-0 ${MOOD_CONFIG[mood].cellColor}`} />
          <span className="text-xs text-mediumgrey">
            {MOOD_CONFIG[mood].emoji} {MOOD_CONFIG[mood].label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── EmptyCalendar ────────────────────────────────────────────────────────────

function EmptyCalendar({ onAddMemory }: { onAddMemory: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <div className="w-16 h-16 bg-blue/40 rounded-full flex items-center justify-center">
        <Sparkles size={28} className="text-blue" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="font-bold text-darkgrey text-xl">No memories yet</p>
        <p className="text-mediumgrey text-sm max-w-xs leading-relaxed">
          Start capturing moments today. Watch this calendar fill up with all the beautiful colors of your life.
        </p>
      </div>
      <Button variant="primary" onClick={onAddMemory}>Add Your First Capsul</Button>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className={`${color} rounded-3xl p-6 flex flex-col items-center gap-1.5 text-center`}>
      <span className="text-3xl font-black text-darkgrey">{value}</span>
      <span className="text-[11px] font-bold text-darkgrey/60 tracking-widest">{label}</span>
    </div>
  );
}

// ─── TimelinePage ─────────────────────────────────────────────────────────────

export function TimelinePage({ onNavigateToToday, onPreviewGuest }: { onNavigateToToday?: () => void; onPreviewGuest?: () => void }) {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState(currentYear);
  const [entries, setEntries] = useState<DayEntry[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DayEntry | null>(null);

  // Chargement initial : années disponibles + stats globales
  useEffect(() => {
    async function init() {
      const [availableYears, s] = await Promise.all([fetchYearsWithEntries(), fetchStats()]);
      setYears(availableYears);
      setStats(s);
      // Démarre sur la dernière année avec des memories (ou l'année courante si aucun)
      if (availableYears.length > 0) {
        setYear(availableYears[availableYears.length - 1]);
      }
    }
    init();
  }, []);

  // Chargement des entries quand l'année change
  useEffect(() => {
    async function load() {
      const e = await fetchEntries(year);
      setEntries(e);
    }
    load();
  }, [year]);

  const hasAnyEntry = years.length > 0;
  const yearIndex   = years.indexOf(year);
  const canGoPrev   = yearIndex > 0;
  const canGoNext   = yearIndex < years.length - 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

      {/* Titre */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-darkgrey">Life Calendar</h1>
        <p className="text-mediumgrey mt-2 text-sm">Each square is a day. Colors show your mood.</p>
      </div>

      {/* Sélecteur d'année — caché si aucun memory */}
      {hasAnyEntry && (
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            type="button"
            onClick={() => setYear(years[yearIndex - 1])}
            disabled={!canGoPrev}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-30"
          >
            <ChevronLeft size={18} className="text-darkgrey" />
          </button>
          <span className="text-2xl font-black text-darkgrey w-20 text-center">{year}</span>
          <button
            type="button"
            onClick={() => setYear(years[yearIndex + 1])}
            disabled={!canGoNext}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow disabled:opacity-30"
          >
            <ChevronRight size={18} className="text-darkgrey" />
          </button>
        </div>
      )}

      {/* Carte calendrier */}
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        {hasAnyEntry
          ? <>
              <CalendarGrid entries={entries} year={year} onDayClick={setSelectedEntry} />
              <MoodLegend />
            </>
          : <EmptyCalendar onAddMemory={() => onNavigateToToday?.()} />
        }
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <StatCard value={stats.capsuls}               label="CAPSULS"  color="bg-yellow/60"  />
          <StatCard value={`${stats.completePercent}%`} label="COMPLETE" color="bg-orange/50"  />
          <StatCard value={stats.shared}                label="SHARED"   color="bg-lightpink"  />
          <StatCard value={stats.streak}                label="STREAK"   color="bg-blue/60"    />
        </div>
      )}

      {/* Modal détail memory */}
      {selectedEntry && (
        <MemoryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={() => {
            // TODO: DELETE /api/entries/:date
            setEntries(prev => prev.filter(e => e.date !== selectedEntry.date));
            setSelectedEntry(null);
          }}
          onPreviewGuest={() => { setSelectedEntry(null); onPreviewGuest?.(); }}
        />
      )}

    </div>
  );
}
