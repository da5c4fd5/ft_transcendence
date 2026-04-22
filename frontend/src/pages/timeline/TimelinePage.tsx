import { useState, useEffect, useMemo } from 'preact/hooks';
import { ChevronLeft, ChevronRight, Sparkles, Gamepad2, X } from 'lucide-preact';
import { clsx as cn } from 'clsx';
import { Button } from '../../components/Button/Button';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal';
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
  return {
    guessedDate,
    actualDate,
    daysOff,
    score: Math.max(0, 1000 - daysOff * 2),
  };
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
  if (!isOpen) return null;

  const isComplete = memories.length > 0 && roundIndex >= memories.length;
  const currentMemory = !isComplete ? memories[roundIndex] : null;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-darkgrey/45 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-darkgrey/60 uppercase">Timeline Game</p>
            <h2 className="text-2xl font-black text-darkgrey">Guess the date</h2>
            <p className="text-sm text-mediumgrey mt-1">
              Five rounds. Each perfect guess is worth 1000 points.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-lightgrey/60 flex items-center justify-center hover:bg-lightgrey transition-colors shrink-0"
            aria-label="Close game"
          >
            <X size={18} className="text-darkgrey" />
          </button>
        </div>

        {loading && (
          <div className="rounded-3xl bg-verylightorange p-8 text-center text-mediumgrey">
            Loading a fresh game…
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl bg-verylightpink/40 p-6 flex flex-col gap-4">
            <p className="text-sm text-pink font-medium">{error}</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
              <Button variant="primary" size="sm" onClick={onRestart}>Try again</Button>
            </div>
          </div>
        )}

        {!loading && !error && currentMemory && (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-darkgrey">
                Round {roundIndex + 1} / {memories.length}
              </span>
              <span className="text-mediumgrey">Current score: {totalScore} / 5000</span>
            </div>

            <div className="bg-verylightorange rounded-3xl p-5 flex flex-col gap-4">
              {currentMemory.mediaUrl && (
                <img
                  src={currentMemory.mediaUrl}
                  alt="Memory clue"
                  className="w-full max-h-72 object-cover rounded-2xl"
                />
              )}
              <p className="text-darkgrey text-base leading-relaxed font-medium">{currentMemory.content}</p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-bold text-darkgrey" htmlFor="timeline-game-date">
                Your guess
              </label>
              <input
                id="timeline-game-date"
                type="date"
                value={guessDate}
                max={getTodayDateStr()}
                onInput={(event) => onGuessChange((event.target as HTMLInputElement).value)}
                className="w-full px-4 py-3 rounded-2xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey"
              />
              <p className="text-xs text-mediumgrey">
                Closer dates keep more points. A perfect game scores 5000.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={onSubmit}
                disabled={!guessDate}
              >
                Lock in guess
              </Button>
            </div>
          </>
        )}

        {!loading && !error && isComplete && (
          <div className="flex flex-col gap-5">
            <div className="bg-blue/15 rounded-3xl p-6 text-center">
              <p className="text-xs font-bold tracking-widest text-darkgrey/60 uppercase">Final Score</p>
              <p className="text-5xl font-black text-darkgrey mt-2">{totalScore}</p>
              <p className="text-sm text-mediumgrey mt-1">out of 5000</p>
            </div>

            <div className="flex flex-col gap-3">
              {results.map((result, index) => (
                <div key={`${result.actualDate}-${index}`} className="rounded-2xl border border-black/5 p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-darkgrey">Round {index + 1}</span>
                    <span className="text-sm font-bold text-pink">+{result.score}</span>
                  </div>
                  <p className="text-sm text-mediumgrey">
                    Guessed {getFormattedDate(result.guessedDate, { format: 'long', uppercase: false })}
                  </p>
                  <p className="text-sm text-mediumgrey">
                    Actual date {getFormattedDate(result.actualDate, { format: 'long', uppercase: false })}
                  </p>
                  <p className="text-xs text-darkgrey/70">
                    {result.daysOff === 0 ? 'Perfect guess.' : `${result.daysOff} day${result.daysOff === 1 ? '' : 's'} off`}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
              <Button variant="primary" size="sm" onClick={onRestart}>Play again</Button>
            </div>
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
        <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
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
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { void openGame(); }}
            disabled={!canPlayGame}
            className="gap-2"
          >
            <Gamepad2 size={15} />
            Game
          </Button>
        </div>
      )}

      {hasAnyEntry && !canPlayGame && (
        <p className="text-center text-xs text-mediumgrey mb-6">
          Add at least 5 memories to unlock the date guessing game.
        </p>
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
