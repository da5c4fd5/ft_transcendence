import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Sparkles, Gamepad2, X, Calendar, Trophy, Zap, Check } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Button } from '../../components/Button/Button';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal';
import { MediaPreview } from '../../components/MediaPreview/MediaPreview';
import type {
  Mood,
  DaySummary,
  TimelineGameMemory,
  TimelineGameRoundResult,
} from './timeline.types';
import type { MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import { api } from '../../lib/api';
import { getFormattedDate, getTodayDateStr } from '../../lib/date';

type RawCalendarDay = { date: string; id: string; mood: string | null };
type RawMemory = { id: string; date: string; content: string; mood: string | null; isOpen: boolean; shareToken: string | null; media: { url: string }[] };
type RawContribution = {
  id: string;
  content: string;
  guestName: string | null;
  guestAvatarUrl: string | null;
  mediaUrl: string | null;
  createdAt: string;
  contributor: { username: string; avatarUrl: string | null } | null;
};

const GAME_ROUNDS = 5;
const MOOD_CONFIG: Record<Mood, { cellColor: string }> = {
  Joyful: { cellColor: 'bg-yellow' },
  Excited: { cellColor: 'bg-pink' },
  Peaceful: { cellColor: 'bg-blue' },
  Nostalgic: { cellColor: 'bg-purple' },
  Sad: { cellColor: 'bg-moodsad' },
  Anxious: { cellColor: 'bg-orange' },
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
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

function daysBetweenDates(a: string, b: string) {
  const aDate = new Date(`${a}T00:00:00`);
  const bDate = new Date(`${b}T00:00:00`);
  return Math.round(Math.abs(aDate.getTime() - bDate.getTime()) / (24 * 60 * 60 * 1000));
}

function scoreGuess(guessedDate: string, actualDate: string): TimelineGameRoundResult {
  const daysOff = daysBetweenDates(guessedDate, actualDate);
  let score: number;
  if (daysOff === 0) score = 1000;
  else if (daysOff <= 7) score = 800;
  else if (daysOff <= 30) score = 600;
  else if (daysOff <= 90) score = 400;
  else score = Math.max(0, 400 - Math.floor((daysOff - 90) / 3));
  return { guessedDate, actualDate, daysOff, score };
}

function CalendarGrid({ summaries, year, onDayClick, onAddMemory }: {
  summaries: DaySummary[];
  year: number;
  onDayClick: (date: string) => void;
  onAddMemory?: () => void;
}) {
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const entryMap = new Map(summaries.map((entry) => [entry.date, entry]));
  const weeks = generateYearGrid(year);
  const monthPositions = getMonthPositions(weeks);
  const todayStr = getTodayDateStr();

  return (
    <>
      <div className="overflow-x-auto pb-2">
        <div className="inline-flex flex-col gap-1">
          <div className="flex pl-7 gap-1">
            {weeks.map((_, wi) => {
              const monthPosition = monthPositions.find((month) => month.weekIndex === wi);
              return (
                <div key={wi} className="w-3 shrink-0 relative">
                  {monthPosition && (
                    <span className="absolute left-0 text-xs font-semibold text-darkgrey/70 whitespace-nowrap">
                      {monthPosition.label}
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

                    const entry = entryMap.get(day);
                    const isToday = day === todayStr;
                    const isClickable = !!entry || (isToday && !entry);
                    const tipText = entry
                      ? `${getFormattedDate(day, { format: 'long', uppercase: false })} · ${MOOD_EMOJI[entry.mood]} ${entry.mood}`
                      : isToday
                        ? `${getFormattedDate(day, { format: 'long', uppercase: false })} · Click to add a memory`
                        : getFormattedDate(day, { format: 'long', uppercase: false });

                    return (
                      <button
                        key={di}
                        type="button"
                        onClick={() => entry ? onDayClick(entry.date) : isToday ? onAddMemory?.() : undefined}
                        onMouseEnter={(event) => setTooltip({
                          text: tipText,
                          x: (event as MouseEvent).clientX,
                          y: (event as MouseEvent).clientY,
                        })}
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
      {(Object.keys(MOOD_CONFIG) as Mood[]).map((mood) => (
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

    for (const summary of summaries) {
      map[summary.mood] = (map[summary.mood] ?? 0) + 1;
    }

    const counts = (Object.keys(MOOD_CONFIG) as Mood[])
      .map((mood) => ({ mood, count: map[mood] ?? 0 }))
      .filter((entry) => entry.count > 0)
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

function getResultLabel(score: number) {
  if (score >= 1000) return { emoji: '🎯', message: 'Perfect!' };
  if (score >= 800) return { emoji: '🌟', message: 'So close!' };
  if (score >= 600) return { emoji: '👍', message: 'Nice try!' };
  if (score >= 400) return { emoji: '🤔', message: 'Keep trying!' };
  return { emoji: '😅', message: 'Way off…' };
}

function formatGameDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function TimelineGameModal({
  isOpen,
  loading,
  error,
  memories,
  roundIndex,
  guessDate,
  results,
  onGuessChange,
  onSubmit,
  onRestart,
  onClose,
}: {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  memories: TimelineGameMemory[];
  roundIndex: number;
  guessDate: string;
  results: TimelineGameRoundResult[];
  onGuessChange: (value: string) => void;
  onSubmit: () => void;
  onRestart: () => void;
  onClose: () => void;
}) {
  const [showResult, setShowResult] = useState(false);
  const [pendingResult, setPendingResult] = useState<{
    score: number; daysOff: number; actualDate: string; guessedDate: string;
  } | null>(null);
  const prevRoundRef = useRef(roundIndex);

  useEffect(() => {
    if (roundIndex !== prevRoundRef.current) {
      prevRoundRef.current = roundIndex;
      setShowResult(false);
      setPendingResult(null);
    }
  }, [roundIndex]);

  useEffect(() => {
    if (loading) {
      setShowResult(false);
      setPendingResult(null);
    }
  }, [loading]);

  const isComplete = memories.length > 0 && roundIndex >= memories.length;
  const activeMemory = isComplete ? null : memories[roundIndex];
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgDaysOff = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.daysOff, 0) / results.length)
    : 0;

  const { minDate, maxDate } = useMemo(() => {
    if (memories.length === 0) return { minDate: '', maxDate: '' };
    const sorted = [...memories.map(m => m.date)].sort();
    return { minDate: sorted[0], maxDate: sorted[sorted.length - 1] };
  }, [memories]);

  const minTime = minDate ? new Date(minDate + 'T00:00:00').getTime() : 0;
  const maxTime = maxDate ? new Date(maxDate + 'T00:00:00').getTime() : 0;

  const sliderValue = useMemo(() => {
    if (!guessDate || !minTime || maxTime === minTime) return 50;
    const t = new Date(guessDate + 'T00:00:00').getTime();
    return Math.round(((t - minTime) / (maxTime - minTime)) * 100);
  }, [guessDate, minTime, maxTime]);

  useEffect(() => {
    if (!guessDate && minDate && maxDate && !showResult && !isComplete) {
      const mid = new Date((minTime + maxTime) / 2).toISOString().split('T')[0];
      onGuessChange(mid);
    }
  }, [minDate, maxDate, showResult, isComplete]);

  const handleSliderChange = (value: number) => {
    if (!minTime || !maxTime) return;
    const t = minTime + (value / 100) * (maxTime - minTime);
    onGuessChange(new Date(t).toISOString().split('T')[0]);
  };

  const handleLockIn = () => {
    if (!guessDate || !activeMemory) return;
    const daysOff = daysBetweenDates(guessDate, activeMemory.date);
    const score = Math.max(0, 1000 - daysOff * 2);
    setPendingResult({ score, daysOff, actualDate: activeMemory.date, guessedDate: guessDate });
    setShowResult(true);
  };

  const handleNext = () => {
    onSubmit();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-darkgrey/45 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-black/5">

        {/* Loading */}
        {loading && (
          <div className="p-8 text-center text-mediumgrey">
            <div className="w-10 h-10 bg-yellow rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar size={18} className="text-darkgrey" />
            </div>
            Loading a fresh game…
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="p-6 flex flex-col gap-4">
            <div className="rounded-3xl bg-verylightpink/40 p-5">
              <p className="text-sm text-pink font-medium">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
              <Button variant="primary" size="sm" onClick={onRestart}>Try again</Button>
            </div>
          </div>
        )}

        {/* Playing */}
        {!loading && !error && !isComplete && activeMemory && (
          <div className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow rounded-2xl flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-darkgrey" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-darkgrey leading-tight">When was this?</h2>
                  <p className="text-xs text-mediumgrey">Memory {roundIndex + 1} of {memories.length}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-lightgrey/50 flex items-center justify-center hover:bg-lightgrey transition-colors shrink-0"
              >
                <X size={16} className="text-darkgrey" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2">
              {memories.map((_, i) => {
                const isDone = i < roundIndex;
                const isCurrent = i === roundIndex;
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                      isDone
                        ? 'bg-darkgrey text-white border-darkgrey'
                        : isCurrent
                          ? 'bg-white text-darkgrey border-yellow shadow-[0_0_0_2px_#FDE856]'
                          : 'bg-white text-mediumgrey border-black/10',
                    )}
                  >
                    {isDone
                      ? (results[i]?.score === 1000 ? '✓' : results[i]?.score ?? i + 1)
                      : i + 1}
                  </div>
                );
              })}
            </div>

            {/* Memory card */}
            <div className="bg-verylightorange rounded-3xl overflow-hidden border border-black/5">
              {activeMemory.mediaUrl && (
                <MediaPreview
                  src={activeMemory.mediaUrl}
                  alt="Memory clue"
                  className="w-full max-h-64 object-cover"
                />
              )}
              <div className="p-4">
                <p className="text-darkgrey text-sm leading-relaxed font-medium">{activeMemory.content}</p>
              </div>
            </div>

            {/* Guessing phase */}
            {!showResult && (
              <>
                <div className="text-center">
                  <p className="text-3xl font-black text-darkgrey">
                    {guessDate ? formatGameDate(guessDate) : '—'}
                  </p>
                  <p className="text-xs text-mediumgrey mt-1">Slide to guess the date</p>
                </div>

                <div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onInput={(e) => handleSliderChange(parseInt((e.target as HTMLInputElement).value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-yellow"
                    style={{
                      background: `linear-gradient(to right, #FDE856 ${sliderValue}%, rgba(74,74,74,0.12) ${sliderValue}%)`,
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-mediumgrey">{minDate ? formatGameDate(minDate) : ''}</span>
                    <span className="text-xs text-mediumgrey">{maxDate ? formatGameDate(maxDate) : ''}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLockIn}
                  disabled={!guessDate}
                  className="w-full py-4 bg-yellow text-darkgrey font-black rounded-2xl flex items-center justify-center gap-2 text-base disabled:opacity-40 hover:brightness-95 transition-all"
                >
                  <Check size={18} />
                  Lock in my guess
                </button>

                <div className="flex items-center justify-between text-sm border-t border-black/5 pt-2">
                  <span className="text-mediumgrey font-medium">Current Score</span>
                  <span className="font-black text-darkgrey text-xl">{totalScore}</span>
                </div>
              </>
            )}

            {/* Result phase */}
            {showResult && pendingResult && (
              <>
                <div className={cn(
                  'rounded-3xl p-5 text-center',
                  pendingResult.score >= 1000 ? 'bg-yellow' : 'bg-purple/40',
                )}>
                  <p className="text-3xl">{getResultLabel(pendingResult.score).emoji}</p>
                  <p className="text-xl font-black text-darkgrey mt-2">
                    {getResultLabel(pendingResult.score).message}
                  </p>
                  <p className="text-3xl font-black text-darkgrey mt-2">
                    +{pendingResult.score} points
                  </p>
                  <p className="text-sm text-darkgrey/70 mt-1">
                    {pendingResult.daysOff === 0
                      ? 'Exact match!'
                      : `You were ${pendingResult.daysOff} day${pendingResult.daysOff === 1 ? '' : 's'} off`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-verylightorange rounded-2xl border border-black/5">
                    <p className="text-[10px] font-bold text-mediumgrey uppercase tracking-widest">Your Guess</p>
                    <p className="text-sm font-black text-darkgrey mt-1.5">
                      {formatGameDate(pendingResult.guessedDate)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-verylightorange rounded-2xl border border-black/5">
                    <p className="text-[10px] font-bold text-mediumgrey uppercase tracking-widest">Actual Date</p>
                    <p className="text-sm font-black text-pink mt-1.5">
                      {formatGameDate(pendingResult.actualDate)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-4 bg-darkgrey text-white font-black rounded-2xl flex items-center justify-center gap-2 text-base hover:bg-darkgrey/90 transition-all"
                >
                  {roundIndex + 1 < memories.length ? (
                    <>Next Memory <Zap size={16} /></>
                  ) : (
                    'See Results'
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Game Complete */}
        {!loading && !error && isComplete && (
          <div className="p-6 flex flex-col gap-5">
            <div className="text-center pt-2">
              <div className="w-16 h-16 bg-yellow rounded-full flex items-center justify-center mx-auto shadow-md">
                <Trophy size={30} className="text-darkgrey" />
              </div>
              <h2 className="text-2xl font-black text-darkgrey mt-4">Game Complete!</h2>
              <p className="text-sm text-mediumgrey mt-1">Here's how you did:</p>
            </div>

            <div className="bg-yellow rounded-3xl p-6 text-center">
              <p className="text-[11px] font-bold tracking-widest text-darkgrey/60 uppercase">Total Score</p>
              <p className="text-5xl font-black text-darkgrey mt-2">
                {totalScore.toLocaleString()}
              </p>
              <p className="text-sm text-darkgrey/70 mt-1">
                {((totalScore / (memories.length * 1000)) * 100).toFixed(0)}% accuracy
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-verylightorange rounded-2xl p-4 text-center border border-black/5">
                <p className="text-[10px] font-bold text-mediumgrey uppercase tracking-widest">Memories</p>
                <p className="text-3xl font-black text-darkgrey mt-2">{results.length}</p>
              </div>
              <div className="bg-verylightorange rounded-2xl p-4 text-center border border-black/5">
                <p className="text-[10px] font-bold text-mediumgrey uppercase tracking-widest">Avg Days Off</p>
                <p className="text-3xl font-black text-darkgrey mt-2">{avgDaysOff}</p>
              </div>
            </div>

            <div className="bg-verylightorange rounded-3xl p-4 border border-black/5">
              <p className="text-[10px] font-bold text-mediumgrey uppercase tracking-widest text-center mb-3">
                Round Breakdown
              </p>
              <div className="flex flex-col gap-2">
                {results.map((result, i) => (
                  <div
                    key={`${result.actualDate}-${i}`}
                    className={cn(
                      'flex items-center justify-between px-4 py-2.5 rounded-full text-sm font-bold',
                      result.score >= 1000 ? 'bg-yellow text-darkgrey' : 'bg-blue/50 text-darkgrey',
                    )}
                  >
                    <span>Round {i + 1}</span>
                    <span>{result.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue/20 rounded-3xl p-4 text-center border border-black/5">
              <p className="text-[10px] font-bold text-mediumgrey uppercase tracking-widest mb-3">
                Scoring System
              </p>
              <div className="flex flex-col gap-1.5 text-sm text-darkgrey">
                <p>🎯 Perfect match: <strong>1000 pts</strong></p>
                <p>🌟 Within 1 week: <strong>800+ pts</strong></p>
                <p>👍 Within 1 month: <strong>600+ pts</strong></p>
                <p>🤔 Within 3 months: <strong>400+ pts</strong></p>
                <p>😅 More than 3 months: <strong>&lt;400 pts</strong></p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 bg-darkgrey text-white font-black rounded-2xl text-base hover:bg-darkgrey/90 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TimelinePage({ onNavigateToToday }: { onNavigateToToday?: () => void }) {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState<number[]>([]);
  const [year, setYear] = useState(currentYear);
  const [allRaw, setAllRaw] = useState<RawCalendarDay[]>([]);
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<MemoryDetails | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [gameOpen, setGameOpen] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const [gameMemories, setGameMemories] = useState<TimelineGameMemory[]>([]);
  const [gameRoundIndex, setGameRoundIndex] = useState(0);
  const [gameGuessDate, setGameGuessDate] = useState('');
  const [gameResults, setGameResults] = useState<TimelineGameRoundResult[]>([]);

  useEffect(() => {
    api.get<RawCalendarDay[]>('/memories/calendar').then((raw) => {
      setAllRaw(raw);
      const years = [...new Set(raw.map((entry) => parseInt(entry.date.slice(0, 4))))].sort((a, b) => a - b);
      setYears(years);
      if (years.length > 0) setYear(years[years.length - 1]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const forYear = allRaw.filter((entry) => entry.date.startsWith(String(year)));
    setSummaries(forYear.map((entry) => ({ date: entry.date, mood: (entry.mood ?? 'Peaceful') as Mood })));
  }, [year, allRaw]);

  const handleDayClick = async (date: string) => {
    const raw = allRaw.find((entry) => entry.date === date);
    if (!raw) return;

    try {
      const [memory, contributions] = await Promise.all([
        api.get<RawMemory>(`/memories/${raw.id}`),
        api.get<RawContribution[]>(`/memories/${raw.id}/contributions`),
      ]);

      setSelectedId(raw.id);
      setSelectedEntry({
        id: memory.id,
        date: memory.date.slice(0, 10),
        mood: (memory.mood ?? 'Peaceful') as Mood,
        content: memory.content,
        media: memory.media[0]?.url ?? null,
        isOpen: memory.isOpen,
        shareUrl: memory.shareToken
          ? `${window.location.origin}/memories/${memory.id}/${memory.shareToken}`
          : null,
        friendContributions: contributions.map((contribution) => ({
          id: contribution.id,
          guestName: contribution.guestName ?? contribution.contributor?.username ?? 'Anonymous',
          avatarURL: contribution.contributor?.avatarUrl ?? contribution.guestAvatarUrl ?? null,
          date: contribution.createdAt.slice(0, 10),
          content: contribution.content,
          media: contribution.mediaUrl ?? null,
        })),
      });
    } catch {
      // ignore
    }
  };

  const resetGameState = () => {
    setGameLoading(false);
    setGameError(null);
    setGameMemories([]);
    setGameRoundIndex(0);
    setGameGuessDate('');
    setGameResults([]);
  };

  const openGame = async () => {
    setGameOpen(true);
    resetGameState();
    setGameLoading(true);

    try {
      const memories = await api.get<TimelineGameMemory[]>('/memories/game', { count: GAME_ROUNDS });
      if (memories.length < GAME_ROUNDS) {
        setGameError('You need at least 5 memories before this game becomes interesting.');
        return;
      }
      setGameMemories(memories);
    } catch {
      setGameError('We could not prepare the game right now.');
    } finally {
      setGameLoading(false);
    }
  };

  const closeGame = () => {
    setGameOpen(false);
    resetGameState();
  };

  const handleSubmitGameGuess = () => {
    if (!gameGuessDate || !gameMemories[gameRoundIndex]) return;

    const result = scoreGuess(gameGuessDate, gameMemories[gameRoundIndex].date);
    setGameResults((prev) => [...prev, result]);
    setGameRoundIndex((prev) => prev + 1);
    setGameGuessDate('');
  };

  const hasAnyEntry = years.length > 0;
  const yearIndex = years.indexOf(year);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < years.length - 1;
  const canPlayGame = allRaw.length >= GAME_ROUNDS;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-darkgrey">Life Calendar</h1>
        <p className="text-mediumgrey mt-2 text-sm">Each square is a day. Colors show your mood.</p>
      </div>

      {hasAnyEntry && (
        <div className="flex flex-col items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => { void openGame(); }}
            disabled={!canPlayGame}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow text-darkgrey font-bold text-sm rounded-full shadow-sm hover:brightness-95 transition-all disabled:opacity-40"
          >
            <Gamepad2 size={15} />
            Game
          </button>
          {!canPlayGame && (
            <p className="text-xs text-mediumgrey">
              Add at least 5 memories to unlock the game.
            </p>
          )}
          <div className="flex items-center gap-4">
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
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm">
        {hasAnyEntry ? (
          <>
            <p className="text-lg font-bold text-darkgrey">
              {summaries.length} memor{summaries.length === 1 ? 'y' : 'ies'} in {year}
            </p>
            <CalendarGrid
              summaries={summaries}
              year={year}
              onDayClick={handleDayClick}
              onAddMemory={onNavigateToToday}
            />
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
          onClose={() => {
            setSelectedEntry(null);
            setSelectedId(null);
          }}
          onDelete={async () => {
            if (!selectedId) return;
            try {
              await api.delete(`/memories/${selectedId}`);
              setAllRaw((prev) => prev.filter((entry) => entry.id !== selectedId));
            } catch {
              // ignore
            } finally {
              setSelectedEntry(null);
              setSelectedId(null);
            }
          }}
        />
      )}

      <TimelineGameModal
        isOpen={gameOpen}
        loading={gameLoading}
        error={gameError}
        memories={gameMemories}
        roundIndex={gameRoundIndex}
        guessDate={gameGuessDate}
        results={gameResults}
        onGuessChange={setGameGuessDate}
        onSubmit={handleSubmitGameGuess}
        onRestart={() => { void openGame(); }}
        onClose={closeGame}
      />
    </div>
  );
}
