import { useState, useEffect, useMemo } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Button } from '../../components/Button/Button';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal';
import type { Mood, DaySummary } from './timeline.types';
import type { MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import { fetchSummaries, fetchEntry, fetchYearsWithEntries } from './timeline.mocks';
import { getFormattedDate, getTodayDateStr } from '../../lib/date';

const MOOD_CONFIG: Record<Mood, { cellColor: string }> = {
  Joyful:    { cellColor: 'bg-yellow'  },
  Excited:   { cellColor: 'bg-pink'    },
  Peaceful:  { cellColor: 'bg-blue'    },
  Nostalgic: { cellColor: 'bg-purple'  },
  Sad:       { cellColor: 'bg-moodsad' },
  Anxious:   { cellColor: 'bg-orange'  },
};

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


function CalendarGrid({ summaries, year, onDayClick, onAddMemory }: {
  summaries: DaySummary[];
  year: number;
  onDayClick: (date: string) => void;
  onAddMemory?: () => void;
}) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const entryMap  = new Map(summaries.map(e => [e.date, e]));
  const weeks     = generateYearGrid(year);
  const monthPositions = getMonthPositions(weeks);
  const todayStr  = getTodayDateStr();

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">

          <div className="flex pl-7 gap-1">
            {weeks.map((_, wi) => {
              const mp = monthPositions.find(m => m.weekIndex === wi);
              return (
                <div key={wi} className="w-3 shrink-0 relative">
                  {mp && (
                    <span className="absolute left-0 text-xs font-semibold text-darkgrey/70 whitespace-nowrap">
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
                  <span className="text-[11px] text-darkgrey/60 font-semibold leading-none">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {week.map((day, di) => {
                    if (!day) return <div key={di} className="w-3 h-3" />;
                    const entry      = entryMap.get(day);
                    const isToday    = day === todayStr;
                    const isClickable = !!entry || (isToday && !entry);
                    const tipText    = entry
                      ? `${getFormattedDate(day, { format: 'long', uppercase: false })} · ${MOOD_EMOJI[entry.mood]} ${entry.mood}`
                      : isToday
                        ? `${getFormattedDate(day, { format: 'long', uppercase: false })} · Click to add a memory`
                        : getFormattedDate(day, { format: 'long', uppercase: false });

                    return (
                      <button
                        key={di}
                        type="button"
                        onClick={() => entry ? onDayClick(entry.date) : isToday ? onAddMemory?.() : undefined}
                        onMouseEnter={(e) => setTooltip({ text: tipText, x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY })}
                        onMouseLeave={() => setTooltip(null)}
                        className={cn(
                          'w-3 h-3 rounded-sm transition-transform',
                          isClickable ? 'hover:scale-125 cursor-pointer' : 'cursor-default',
                          entry ? MOOD_CONFIG[entry.mood].cellColor : 'bg-lightgrey',
                          isToday && 'ring-1 ring-darkgrey/40 ring-offset-1',
                        )}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-darkgrey text-white text-[11px] font-medium rounded-xl px-3 py-1.5 shadow-lg -translate-x-1/2 whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y - 36 }}
        >
          {tooltip.text}
        </div>
      )}
    </>
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

function MoodBreakdown({ summaries }: { summaries: DaySummary[] }) {
  const { counts, total } = useMemo(() => {
    const map: Partial<Record<Mood, number>> = {};
    for (const s of summaries) map[s.mood] = (map[s.mood] ?? 0) + 1;
    const counts = (Object.keys(MOOD_CONFIG) as Mood[])
      .map(mood => ({ mood, count: map[mood] ?? 0 }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count);
    return { counts, total: summaries.length };
  }, [summaries]);

  if (counts.length === 0) return null;

  return (
    <>
      <h2 className="text-sm font-bold text-darkgrey mb-3">Mood overview</h2>
      <div className="flex flex-col gap-2.5">
        {counts.map(({ mood, count }) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={mood} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-darkgrey w-28 shrink-0">
                {MOOD_EMOJI[mood]} {mood}
              </span>
              <div className="flex-1 h-2 bg-lightgrey/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${MOOD_CONFIG[mood].cellColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-mediumgrey w-8 text-right shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function TimelinePage({ onNavigateToToday, onPreviewGuest }: { onNavigateToToday?: () => void; onPreviewGuest?: () => void }) {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState(currentYear);
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MemoryDetails | null>(null);

  useEffect(() => {
    async function init() {
      const availableYears = await fetchYearsWithEntries();
      setYears(availableYears);
      if (availableYears.length === 0) return;
      setYear(availableYears[availableYears.length - 1]);
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
        <div className="flex items-center justify-center gap-4 mb-6">
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
        {hasAnyEntry ? (
          <>
            <p className="text-lg font-bold text-darkgrey">
              {summaries.length} memor{summaries.length === 1 ? 'y' : 'ies'} in {year}
            </p>
            <CalendarGrid summaries={summaries} year={year} onDayClick={handleDayClick} onAddMemory={onNavigateToToday} />
            <MoodLegend />
          </>
        ) : (
          <EmptyCalendar onAddMemory={() => onNavigateToToday?.()} />
        )}
      </div>

      {hasAnyEntry && summaries.length > 0 && (
        <div className="mt-4 bg-lightgrey/30 rounded-3xl p-6">
          <MoodBreakdown summaries={summaries} />
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
