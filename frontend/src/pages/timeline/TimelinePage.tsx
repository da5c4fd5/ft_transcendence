import { useState, useEffect } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-preact';
import { Button } from '../../components/Button/Button';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_CONFIG } from './timeline.types';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal.types';
import type { Mood, DaySummary, TimelineStats } from './timeline.types';
import type { MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function generateYearGrid(year: number): (string | null)[][] {
  const weeks: (string | null)[][] = [];
  const jan1 = new Date(year, 0, 1);
  const startDow = (jan1.getDay() + 6) % 7;

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

const MOCK_SUMMARIES: DaySummary[] = [
  { date: '2026-04-02', mood: 'Peaceful' },
  { date: '2026-04-07', mood: 'Joyful' },
  { date: '2026-04-09', mood: 'Excited' },
  { date: '2026-03-30', mood: 'Peaceful' },
  { date: '2026-03-22', mood: 'Sad' },
  { date: '2026-03-15', mood: 'Nostalgic' },
  { date: '2026-03-08', mood: 'Anxious' },
  { date: '2026-02-14', mood: 'Joyful' },
  { date: '2026-01-01', mood: 'Excited' },
];

const MOCK_ENTRIES: MemoryDetails[] = [
  {
    date: '2026-04-02', mood: 'Peaceful',
    content: 'Spent the whole evening laughing until our stomachs hurt. Sunsets with these two never get old. We talked about everything and nothing. I want to remember this feeling of complete peace.',
    media: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80',
    isOpen: true,
    shareUrl: 'https://capsul.app/shared/9bfb4077-fa56-400e-831f',
    friendContributions: [
      { id: '1', guestName: 'Léa', avatarURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80', date: '02/04/2026', content: "This was such a perfect evening!! Look at this polaroid I took!", media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
      { id: '2', guestName: 'Thomas', avatarURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80', date: '02/04/2026', content: "Next time I'm picking the restaurant though!", media: null },
    ],
  },
  { date: '2026-04-07', mood: 'Joyful',    content: 'Beautiful spring day. Went for a run in the park and felt amazing.',    media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-04-09', mood: 'Excited',   content: 'Started working on the new project today. So many ideas flowing!',      media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-30', mood: 'Peaceful',  content: 'Super aprem bar à jeux avec Victor et Auriane au Nid Cocon Ludique!',   media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-22', mood: 'Sad',       content: "Rainy day, feeling a bit low. But that's okay.",                        media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-15', mood: 'Nostalgic', content: 'Found old photos from childhood. Spent hours going through them.',       media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-03-08', mood: 'Anxious',   content: 'Big presentation tomorrow. Trying to stay calm.',                        media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-02-14', mood: 'Joyful',    content: "Valentine's day! Best surprise ever.",                                   media: null, isOpen: false, shareUrl: null, friendContributions: [] },
  { date: '2026-01-01', mood: 'Excited',   content: 'New year, new adventures! Feeling hopeful.',                             media: null, isOpen: false, shareUrl: null, friendContributions: [] },
];

const MOCK_STATS: TimelineStats = { totalCapsuls: 9, shared: 1, dayStreak: 2 };

async function fetchSummaries(year: number): Promise<DaySummary[]> {
  // TODO: const res = await fetch(`/api/timeline?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_SUMMARIES.filter(e => e.date.startsWith(String(year)));
}

async function fetchEntry(date: string): Promise<MemoryDetails | null> {
  // TODO: const res = await fetch(`/api/entries/${date}`, { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_ENTRIES.find(e => e.date === date) ?? null;
}

async function fetchStats(): Promise<TimelineStats> {
  // TODO: const res = await fetch('/api/memories/stats', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_STATS;
}

async function fetchYearsWithEntries(): Promise<number[]> {
  // TODO: const res = await fetch('/api/timeline/years', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  const years = [...new Set(MOCK_SUMMARIES.map(e => parseInt(e.date.split('-')[0])))];
  return years.sort((a, b) => a - b);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CalendarGrid({ summaries, year, onDayClick }: {
  summaries: DaySummary[];
  year: number;
  onDayClick: (date: string) => void;
}) {
  const entryMap = new Map(summaries.map(e => [e.date, e]));
  const weeks = generateYearGrid(year);
  const monthPositions = getMonthPositions(weeks);

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-flex flex-col gap-1">

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

        <div className="flex gap-1 mt-3">

          <div className="flex flex-col gap-1 w-6 shrink-0">
            {DAY_LABELS.map((label, i) => (
              <div key={i} className="h-3 flex items-center">
                <span className="text-[9px] text-mediumgrey font-semibold leading-none">{label}</span>
              </div>
            ))}
          </div>

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
                      onClick={() => entry && onDayClick(entry.date)}
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

function MoodLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 mt-4 border-t border-black/5">
      <span className="text-xs font-bold text-darkgrey">Mood Legend:</span>
      {(Object.keys(MOOD_CONFIG) as Mood[]).map(mood => (
        <div key={mood} className="flex items-center gap-1.5">
          <div className={`w-3 h-3 rounded-sm shrink-0 ${MOOD_CONFIG[mood].cellColor}`} />
          <span className="text-xs text-mediumgrey">
            {MOOD_EMOJI[mood]} {mood}
          </span>
        </div>
      ))}
    </div>
  );
}

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

function StatCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className={`${color} rounded-3xl p-6 flex flex-col items-center gap-1.5 text-center`}>
      <span className="text-3xl font-black text-darkgrey">{value}</span>
      <span className="text-[11px] font-bold text-darkgrey/60 tracking-widest">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TimelinePage({ onNavigateToToday, onPreviewGuest }: { onNavigateToToday?: () => void; onPreviewGuest?: () => void }) {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState(currentYear);
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MemoryDetails | null>(null);

  useEffect(() => {
    async function init() {
      const availableYears = await fetchYearsWithEntries();
      setYears(availableYears);
      if (availableYears.length === 0) return;
      setYear(availableYears[availableYears.length - 1]);
      const s = await fetchStats();
      setStats(s);
    }
    init();
  }, []);

  useEffect(() => {
    if (years.length === 0) return;
    fetchSummaries(year).then(setSummaries);
  }, [year, years]);

  const handleDayClick = async (date: string) => {
    const entry = await fetchEntry(date);
    if (entry) setSelectedEntry(entry);
  };

  const hasAnyEntry = years.length > 0;
  const yearIndex   = years.indexOf(year);
  const canGoPrev   = yearIndex > 0;
  const canGoNext   = yearIndex < years.length - 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">

      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-darkgrey">Life Calendar</h1>
        <p className="text-mediumgrey mt-2 text-sm">Each square is a day. Colors show your mood.</p>
      </div>

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

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        {hasAnyEntry
          ? <>
              <CalendarGrid summaries={summaries} year={year} onDayClick={handleDayClick} />
              <MoodLegend />
            </>
          : <EmptyCalendar onAddMemory={() => onNavigateToToday?.()} />
        }
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          <StatCard value={stats.totalCapsuls} label="CAPSULS"  color="bg-yellow/60" />
          <StatCard value={stats.shared}       label="SHARED"   color="bg-lightpink" />
          <StatCard value={stats.dayStreak}    label="STREAK"   color="bg-blue/60"   />
        </div>
      )}

      {selectedEntry && (
        <MemoryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onDelete={() => {
            // TODO: DELETE /api/entries/:date
            setSummaries(prev => prev.filter(s => s.date !== selectedEntry.date));
            setSelectedEntry(null);
          }}
          onPreviewGuest={() => { setSelectedEntry(null); onPreviewGuest?.(); }}
        />
      )}

    </div>
  );
}
