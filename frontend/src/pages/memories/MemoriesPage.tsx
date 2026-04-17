import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { Clock, Heart, Search, SlidersHorizontal, Share2 } from 'lucide-preact';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal';
import type { Mood, MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import type { TimeCapsule, MemoryCard, MoodFilter, PeriodFilter, CollectionFilters } from './memories.types';
import { api } from '../../lib/api';
import { getRelativeLabel, getFormattedDate } from '../../lib/date';

type RawMemory = {
  id: string;
  date: string;
  content: string;
  mood: string | null;
  isOpen: boolean;
  shareToken: string | null;
  media: { url: string }[];
};

type RawContribution = {
  id: string;
  content: string;
  guestName: string | null;
  createdAt: string;
  contributor: { username: string; avatarUrl: string | null } | null;
};

function rawToCard(m: RawMemory): MemoryCard {
  return {
    id: m.id,
    date: m.date.slice(0, 10),
    content: m.content,
    media: m.media[0]?.url ?? null,
    mood: (m.mood ?? 'Peaceful') as Mood,
    isOpen: m.isOpen,
  };
}

function rawToCapsule(m: RawMemory): TimeCapsule {
  return {
    id: m.id,
    date: m.date.slice(0, 10),
    content: m.content,
    media: m.media[0]?.url ?? null,
    mood: (m.mood ?? 'Peaceful') as Mood,
  };
}

const PAGE_SIZE = 9;
const ALL_MOODS: Mood[] = ['Joyful', 'Excited', 'Peaceful', 'Nostalgic', 'Sad', 'Anxious'];

function distributeToColumns(items: MemoryCard[]): [MemoryCard[], MemoryCard[], MemoryCard[]] {
  const cols: [MemoryCard[], MemoryCard[], MemoryCard[]] = [[], [], []];
  const heights = [0, 0, 0];
  for (const item of items) {
    const h = item.media ? 300 : 130;
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(item);
    heights[shortest] += h;
  }
  return cols;
}

const EMPTY_FILTERS: CollectionFilters = {
  search: '',
  mood: 'all',
  period: 'all',
  dateFrom: '',
  dateTo: '',
  sharedOnly: false,
};

function TimeCapsuleCard({ capsule, onClick }: { capsule: TimeCapsule; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-blue/20 rounded-3xl p-4 flex flex-col gap-3 shrink-0 w-64 lg:w-auto text-left hover:bg-blue/30 transition-colors"
    >
      <span className="self-start bg-white/80 rounded-full px-3 py-1 text-[10px] font-bold text-darkgrey tracking-widest uppercase">
        {getRelativeLabel(capsule.date)}
      </span>
      <div className={`bg-white rounded-2xl p-4 shadow-sm flex-1 ${capsule.media ? 'flex flex-col gap-3' : 'flex items-center justify-center'}`}>
        {capsule.media && (
          <img src={capsule.media} alt="" className="w-full h-32 object-cover rounded" />
        )}
        <p className="text-darkgrey text-sm leading-relaxed text-center">
          {capsule.content}
        </p>
      </div>
    </button>
  );
}

function MemoryCardItem({ card, onClick }: { card: MemoryCard; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-3xl shadow-sm overflow-hidden flex flex-col text-left hover:shadow-md transition-shadow w-full"
    >
      {card.media && (
        <img src={card.media} alt="" className="w-full object-cover" />
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-[10px] font-bold text-darkgrey tracking-widest uppercase">
            {getRelativeLabel(card.date)}
          </p>
          <p className="text-[10px] text-mediumgrey mt-0.5">{getFormattedDate(card.date)}</p>
        </div>
        <p className="text-sm text-darkgrey leading-relaxed line-clamp-3">
          {card.content}
        </p>
      </div>
    </button>
  );
}

const MOOD_CHIP_COLOR: Record<Mood, string> = {
  Joyful:    'bg-yellow text-darkgrey',
  Excited:   'bg-pink text-white',
  Peaceful:  'bg-blue text-darkgrey',
  Nostalgic: 'bg-purple text-white',
  Sad:       'bg-moodsad text-white',
  Anxious:   'bg-orange text-darkgrey',
};

const PERIOD_OPTIONS: { value: PeriodFilter; label: string }[] = [
  { value: 'all',    label: 'All time'   },
  { value: 'week',   label: 'This week'  },
  { value: 'month',  label: 'This month' },
  { value: 'year',   label: 'This year'  },
  { value: 'custom', label: 'Custom…'    },
];

function FilterPanel({ filters, onChange }: {
  filters: CollectionFilters;
  onChange: (f: CollectionFilters) => void;
}) {
  const set = (patch: Partial<CollectionFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-mediumgrey tracking-widest uppercase">Period</span>
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => set({ period: value })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.period === value
                  ? 'bg-darkgrey text-white'
                  : 'bg-lightgrey text-mediumgrey hover:text-darkgrey'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filters.period === 'custom' && (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="date"
              value={filters.dateFrom}
              onInput={(e) => set({ dateFrom: (e.target as HTMLInputElement).value })}
              className="flex-1 px-3 py-2 rounded-xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey"
            />
            <span className="text-mediumgrey text-sm">→</span>
            <input
              type="date"
              value={filters.dateTo}
              onInput={(e) => set({ dateTo: (e.target as HTMLInputElement).value })}
              className="flex-1 px-3 py-2 rounded-xl bg-verylightorange border-2 border-transparent focus:border-yellow outline-none text-sm text-darkgrey"
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-mediumgrey tracking-widest uppercase">Mood</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set({ mood: 'all' })}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filters.mood === 'all' ? 'bg-darkgrey text-white' : 'bg-lightgrey text-mediumgrey hover:text-darkgrey'
            }`}
          >
            All moods
          </button>
          {ALL_MOODS.map(mood => (
            <button
              key={mood}
              type="button"
              onClick={() => set({ mood: mood as MoodFilter })}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                filters.mood === mood ? MOOD_CHIP_COLOR[mood] : 'bg-lightgrey text-mediumgrey hover:text-darkgrey'
              }`}
            >
              {MOOD_EMOJI[mood]} {mood}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-mediumgrey tracking-widest uppercase">Visibility</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set({ sharedOnly: false })}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              !filters.sharedOnly ? 'bg-darkgrey text-white' : 'bg-lightgrey text-mediumgrey hover:text-darkgrey'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => set({ sharedOnly: true })}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filters.sharedOnly ? 'bg-darkgrey text-white' : 'bg-lightgrey text-mediumgrey hover:text-darkgrey'
            }`}
          >
            <Share2 size={11} />
            Shared only
          </button>
        </div>
      </div>

    </div>
  );
}

export function MemoriesPage() {
  const [capsules, setCapsules]           = useState<TimeCapsule[]>([]);
  const [fetchedCards, setFetchedCards]   = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters]             = useState<CollectionFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters]     = useState(false);
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);
  const [selectedEntry, setSelectedEntry] = useState<MemoryDetails | null>(null);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const sentinelRef                       = useRef<HTMLDivElement>(null);

  const loadCollection = async (f: CollectionFilters) => {
    setIsLoading(true);
    const params: Record<string, string | number | boolean | undefined | null> = { limit: 100 };
    if (f.mood !== 'all') params.mood = f.mood;
    if (f.period !== 'all' && f.period !== 'custom') params.period = f.period;
    if (f.period === 'custom' && f.dateFrom) params.after = f.dateFrom;
    if (f.period === 'custom' && f.dateTo)   params.before = f.dateTo;
    if (f.sharedOnly) params.sharedOnly = true;
    try {
      const raw = await api.get<RawMemory[]>('/memories/search', params);
      setFetchedCards(raw.map(rawToCard));
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.get<RawMemory[]>('/memories/capsuls').then(r => setCapsules(r.map(rawToCapsule))).catch(() => {});
    loadCollection(EMPTY_FILTERS);
  }, []);

  // Text search applied client-side (no backend search param)
  const filtered = useMemo(() => {
    if (!filters.search.trim()) return fetchedCards;
    const q = filters.search.toLowerCase();
    return fetchedCards.filter(c => c.content.toLowerCase().includes(q));
  }, [fetchedCards, filters.search]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore      = visibleCount < filtered.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount(n => n + PAGE_SIZE);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const handleFiltersChange = (f: CollectionFilters) => {
    const serverChanged =
      f.mood !== filters.mood || f.period !== filters.period ||
      f.sharedOnly !== filters.sharedOnly ||
      f.dateFrom !== filters.dateFrom || f.dateTo !== filters.dateTo;
    setFilters(f);
    setVisibleCount(PAGE_SIZE);
    if (serverChanged) loadCollection(f);
  };

  const handleCardClick = async (id: string) => {
    try {
      const [mem, contribs] = await Promise.all([
        api.get<RawMemory>(`/memories/${id}`),
        api.get<RawContribution[]>(`/memories/${id}/contributions`),
      ]);
      setSelectedId(id);
      setSelectedEntry({
        id:      mem.id,
        date:    mem.date.slice(0, 10),
        mood:    (mem.mood ?? 'Peaceful') as Mood,
        content: mem.content,
        media:   mem.media[0]?.url ?? null,
        isOpen:  mem.isOpen,
        shareUrl: mem.shareToken
          ? `${window.location.origin}/memories/${mem.id}/${mem.shareToken}`
          : null,
        friendContributions: contribs.map(c => ({
          id:        c.id,
          guestName: c.guestName ?? c.contributor?.username ?? 'Anonymous',
          avatarURL: c.contributor?.avatarUrl ?? null,
          date:      c.createdAt.slice(0, 10),
          content:   c.content,
          media:     null,
        })),
      });
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    try {
      await api.delete(`/memories/${selectedId}`);
      setFetchedCards(prev => prev.filter(c => c.id !== selectedId));
      setCapsules(prev => prev.filter(c => c.id !== selectedId));
    } catch { /* ignore */ } finally {
      setSelectedEntry(null);
      setSelectedId(null);
    }
  };

  const hasActiveFilters =
    filters.mood !== 'all' ||
    filters.period !== 'all' ||
    filters.sharedOnly;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-12">

      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-darkgrey">Memory Vault</h1>
        <p className="text-mediumgrey mt-2 text-sm">Rediscover moments from your past</p>
      </div>

      {capsules.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-verylightorange rounded-full flex items-center justify-center">
              <Clock size={15} className="text-orange" />
            </div>
            <h2 className="text-lg font-black text-darkgrey">Time Capsules</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 lg:overflow-visible lg:grid lg:grid-cols-3">
            {capsules.map(capsule => (
              <TimeCapsuleCard
                key={capsule.id}
                capsule={capsule}
                onClick={() => handleCardClick(capsule.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-pink" />
            <h2 className="text-lg font-black text-darkgrey">Your Collection</h2>
            <span className="bg-lightgrey text-darkgrey text-xs font-bold rounded-full px-2.5 py-0.5">
              {filtered.length}
            </span>
          </div>
          <div className="flex-1" />

          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-black/5 min-w-0 flex-1 max-w-xs">
            <Search size={14} className="text-mediumgrey shrink-0" />
            <input
              type="text"
              placeholder="Search memories..."
              value={filters.search}
              onInput={(e) => handleFiltersChange({ ...filters, search: (e.target as HTMLInputElement).value })}
              className="bg-transparent outline-none text-sm text-darkgrey placeholder:text-mediumgrey w-full min-w-0"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors shadow-sm border ${
              showFilters || hasActiveFilters
                ? 'bg-darkgrey text-white border-darkgrey'
                : 'bg-white text-darkgrey border-black/5'
            }`}
          >
            <SlidersHorizontal size={14} />
            {hasActiveFilters ? 'Filtered' : 'Filter'}
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl px-5 py-5 mb-4 shadow-sm flex flex-col gap-0">
            <FilterPanel filters={filters} onChange={handleFiltersChange} />
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => handleFiltersChange(EMPTY_FILTERS)}
                className="self-end mt-4 text-xs text-mediumgrey hover:text-darkgrey transition-colors underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="hidden sm:grid sm:grid-cols-3 gap-4 items-start">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl shadow-sm overflow-hidden animate-pulse ${i % 3 === 0 ? 'h-64' : i % 3 === 1 ? 'h-40' : 'h-52'}`}
              >
                {i % 2 === 0 && <div className="w-full h-36 bg-lightgrey" />}
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-2.5 bg-lightgrey rounded-full w-1/3" />
                  <div className="h-2 bg-lightgrey rounded-full w-full mt-1" />
                  <div className="h-2 bg-lightgrey rounded-full w-4/5" />
                  <div className="h-2 bg-lightgrey rounded-full w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 flex flex-col items-center gap-3 text-center shadow-sm">
            <Search size={32} className="text-lightgrey" />
            <p className="font-bold text-darkgrey">No memories found</p>
            <p className="text-sm text-mediumgrey">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:hidden gap-4">
              {visibleItems.map(card => (
                <MemoryCardItem key={card.id} card={card} onClick={() => handleCardClick(card.id)} />
              ))}
            </div>
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 items-start">
              {distributeToColumns(visibleItems).map((col, i) => (
                <div key={i} className="flex flex-col gap-4">
                  {col.map(card => (
                    <MemoryCardItem key={card.id} card={card} onClick={() => handleCardClick(card.id)} />
                  ))}
                </div>
              ))}
            </div>
            {hasMore && <div ref={sentinelRef} className="h-8" />}
            {isLoadingMore && (
              <div className="flex justify-center py-6 gap-1.5">
                <span className="w-2 h-2 bg-mediumgrey rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-mediumgrey rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-mediumgrey rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </>
        )}

      </section>

      {selectedEntry && (
        <MemoryModal
          entry={selectedEntry}
          onClose={() => { setSelectedEntry(null); setSelectedId(null); }}
          onDelete={handleDelete}
        />
      )}

    </div>
  );
}
