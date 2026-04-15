import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { Clock, Heart, Search, SlidersHorizontal, Share2 } from 'lucide-preact';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal';
import type { Mood, MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import type { TimeCapsule, MemoryCard, MoodFilter, PeriodFilter, CollectionFilters } from './memories.types';
import { api } from '../../services/api';
import type { Memory as ApiMemory, Contribution as ApiContribution } from '../../services/api';

const VALID_MOODS: Mood[] = ['Joyful', 'Excited', 'Peaceful', 'Nostalgic', 'Sad', 'Anxious'];

function parseMood(mood: string | null | undefined): Mood {
  if (mood && (VALID_MOODS as string[]).includes(mood)) return mood as Mood;
  return 'Peaceful';
}

function apiMemoryToCard(m: ApiMemory): MemoryCard {
  return {
    id:      m.id,
    date:    m.date.split('T')[0],
    content: m.content,
    media:   m.media?.[0]?.url ?? null,
    mood:    parseMood(m.mood),
    isOpen:  m.isOpen,
  };
}

function apiMemoryToDetails(m: ApiMemory, contributions: ApiContribution[]): MemoryDetails {
  return {
    id:      m.id,
    date:    m.date.split('T')[0],
    mood:    parseMood(m.mood),
    content: m.content,
    media:   m.media?.[0]?.url ?? null,
    isOpen:  m.isOpen,
    shareUrl: null,
    friendContributions: contributions.map(c => ({
      id:        c.id,
      guestName: c.guestName ?? 'Anonymous',
      avatarURL: null,
      date:      new Date(c.createdAt).toLocaleDateString('en-GB'),
      content:   c.content,
      media:     null,
    })),
  };
}

const PAGE_SIZE = 9;
const ALL_MOODS: Mood[] = ['Joyful', 'Excited', 'Peaceful', 'Nostalgic', 'Sad', 'Anxious'];

function getRelativeLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  if (diffDays < 30) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(diffDays / 30);
  if (diffDays < 365) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(diffDays / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

function getFormattedDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

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

// ─── Mock data (TODO: supprimer quand backend pret) ────────────────────

const MOCK_CAPSULES: TimeCapsule[] = [
  { id: 'c1', date: '2025-03-10', mood: 'Nostalgic', content: 'Found an old photo that brought back so many memories. Time really does fly.',             media: 'https://picsum.photos/seed/otter/400/300'  },
  { id: 'c2', date: '2025-04-09', mood: 'Peaceful',  content: 'It was a lazy day today. Ordered pizza, watched a movie, and just relaxed. Much needed.',  media: null                                        },
  { id: 'c3', date: '2023-04-05', mood: 'Excited',   content: "Finally finished that project I've been working on for weeks. Feels amazing!",             media: null                                        },
];

const MOCK_COLLECTION: MemoryCard[] = [
  { id: 'm1',  date: '2026-04-09', content: 'Walked along the canal at sunset, everything felt slow and golden.',                                                                                       media: 'https://images.unsplash.com/photo-1720198270654-dbe3ca4b838f?q=80&w=870&auto=format&fit=crop',    mood: 'Peaceful',  isOpen: false },
  { id: 'm3',  date: '2026-03-30', content: 'Super aprem bar à jeux avec Victor et Auriane. On a ri comme des fous.',                                                                                    media: null,                                          mood: 'Joyful',    isOpen: false },
  { id: 'm4',  date: '2026-03-22', content: "Rainy day, feeling a bit low. But that's okay — not every day has to be extraordinary.",                                                                    media: null,                                          mood: 'Sad',       isOpen: false },
  { id: 'm5',  date: '2026-03-15', content: 'Found old photos from childhood. Spent hours going through them with mom. So many stories I had forgotten.',                                                media: 'https://picsum.photos/seed/childhood/600/400',mood: 'Nostalgic', isOpen: true  },
  { id: 'm6',  date: '2026-03-08', content: "Big presentation tomorrow. Trying to stay calm and trust the work I've put in.",                                                                            media: null,                                          mood: 'Anxious',   isOpen: false },
  { id: 'm7',  date: '2026-02-14', content: "Valentine's day — unexpected flowers on the doorstep. Best surprise ever.",                                                                                media: 'https://picsum.photos/seed/flowers/600/400',  mood: 'Joyful',    isOpen: false },
  { id: 'm8',  date: '2026-02-01', content: 'First day of the month, fresh start. Set some intentions and made a proper breakfast for once.',                                                            media: null,                                          mood: 'Peaceful',  isOpen: false },
  { id: 'm9',  date: '2026-01-20', content: "Concert tonight was absolutely electric. The crowd, the lights, the music — I felt alive in a way I hadn't in a long time.",                               media: 'https://picsum.photos/seed/concert/600/400',  mood: 'Excited',   isOpen: true  },
  { id: 'm10', date: '2026-01-01', content: 'New year, new adventures! Feeling hopeful and ready.',                                                                                                      media: null,                                          mood: 'Excited',   isOpen: false },
  { id: 'm11', date: '2025-12-25', content: "Christmas morning with the whole family around the table. Grandma's recipe, same as every year. Some things never change and that's perfect.",             media: 'https://picsum.photos/seed/xmas/600/400',     mood: 'Nostalgic', isOpen: false },
  { id: 'm12', date: '2025-11-10', content: "Ran my first 10k today! Didn't stop once. Three months ago I couldn't run for 5 minutes.",                                                                 media: null,                                          mood: 'Excited',   isOpen: true  },
  { id: 'm13', date: '2025-10-31', content: 'Halloween night, carved pumpkins with the neighbours. The street was full of kids and laughter.',                                                           media: 'https://picsum.photos/seed/halloween/600/400',mood: 'Joyful',    isOpen: false },
  { id: 'm14', date: '2025-10-12', content: 'Long hike in the mountains. My legs are destroyed but the view from the top made everything worth it.',                                                     media: null,                                          mood: 'Excited',   isOpen: false },
  { id: 'm15', date: '2025-09-21', content: 'Last day of summer. Sat on the terrace until midnight, not ready to let go.',                                                                               media: 'https://picsum.photos/seed/terrace/600/400',  mood: 'Nostalgic', isOpen: false },
  { id: 'm16', date: '2025-09-01', content: 'Back to the routine after holidays. Inbox is terrifying but I feel rested for once.',                                                                       media: null,                                          mood: 'Anxious',   isOpen: false },
  { id: 'm17', date: '2025-08-10', content: 'Beach day. Read half a book, swam three times, ate too much ice cream. Perfect.',                                                                           media: 'https://picsum.photos/seed/beach/600/400',    mood: 'Peaceful',  isOpen: true  },
  { id: 'm18', date: '2025-07-14', content: 'Fireworks over the city. Watched from the rooftop with a bottle of wine. Feeling lucky.',                                                                   media: null,                                          mood: 'Joyful',    isOpen: false },
  { id: 'm19', date: '2025-06-21', content: 'Summer solstice — longest day of the year. Took my bike out at 6am and watched the sunrise. Completely alone, completely at peace.',                        media: 'https://picsum.photos/seed/sunrise/600/400',  mood: 'Peaceful',  isOpen: false },
  { id: 'm20', date: '2025-05-05', content: "Got some really hard feedback on my work today. It stung, but they're probably right. Need to sit with it.",                                                media: null,                                          mood: 'Sad',       isOpen: false },
  { id: 'm21', date: '2025-04-20', content: 'Picnic in the park. Everyone brought something to share. One of those afternoons that stretches on and feels like it lasts forever.',                       media: 'https://picsum.photos/seed/picnic/600/400',   mood: 'Joyful',    isOpen: true  },
  { id: 'm22', date: '2025-03-08', content: "Spent the day reorganising my apartment. Threw out a lot of old stuff. Feels lighter in here now.",                                                          media: null,                                          mood: 'Peaceful',  isOpen: false },
  { id: 'm23', date: '2025-02-01', content: 'Road trip weekend, no plan, just a direction. We ended up in a tiny village with an incredible restaurant. Best accident.',                                 media: 'https://picsum.photos/seed/roadtrip/600/400', mood: 'Excited',   isOpen: false },
  { id: 'm24', date: '2025-01-15', content: "Woke up at 3am with anxiety spiraling. Made tea, wrote it all down, went back to sleep. Writing really does help.",                                         media: null,                                          mood: 'Anxious',   isOpen: false },
  { id: 'm25', date: '2024-12-31', content: "Last night of the year. Stayed home, cooked, reflected. Didn't feel the need to be anywhere else.",                                                         media: 'https://picsum.photos/seed/newyear/600/400',  mood: 'Peaceful',  isOpen: false },
  { id: 'm26', date: '2024-11-03', content: 'Autumn walk in the forest. The light through the leaves was unreal. Collected a few and pressed them in a book.',                                           media: null,                                          mood: 'Nostalgic', isOpen: false },
  { id: 'm27', date: '2024-09-14', content: 'Music festival — three days of total sensory overload. Still buzzing.',                                                                                      media: 'https://picsum.photos/seed/festival/600/400', mood: 'Excited',   isOpen: true  },
  { id: 'm2',  date: '2023-04-01', content: 'Just found this amazing little coffee shop hidden in the alleyway. The espresso is perfect, and I sat here for hours sketching. I want to remember this.',  media: 'https://picsum.photos/seed/coffee/600/400',   mood: 'Peaceful',  isOpen: true  },
];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function fetchTimeCapsules(): Promise<TimeCapsule[]> {
  try {
    const { items } = await api.memories.list(1, 100);
    // Pick up to 3 oldest memories as "time capsules"
    const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(0, 3).map(m => ({
      id:      m.id,
      date:    m.date.split('T')[0],
      content: m.content,
      media:   m.media?.[0]?.url ?? null,
      mood:    parseMood(m.mood),
    }));
  } catch { return MOCK_CAPSULES; }
}

async function fetchCollection(): Promise<MemoryCard[]> {
  try {
    const { items } = await api.memories.list(1, 100);
    return items.map(apiMemoryToCard);
  } catch {
    await sleep(400);
    return MOCK_COLLECTION;
  }
}

async function fetchMemoryDetails(id: string): Promise<MemoryDetails> {
  try {
    const [memory, contributions] = await Promise.all([
      api.memories.get(id),
      api.contributions.list(id),
    ]);
    return apiMemoryToDetails(memory, contributions);
  } catch {
    const card    = MOCK_COLLECTION.find(c => c.id === id);
    const capsule = MOCK_CAPSULES.find(c => c.id === id);
    return {
      id,
      date:    card?.date ?? capsule?.date ?? new Date().toISOString().split('T')[0],
      mood:    card?.mood ?? capsule?.mood ?? 'Peaceful',
      content: card?.content ?? capsule?.content ?? '',
      media:   card?.media  ?? capsule?.media  ?? null,
      isOpen:  card?.isOpen ?? false,
      shareUrl: null,
      friendContributions: [],
    };
  }
}

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
  const [allCards, setAllCards]           = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filters, setFilters]             = useState<CollectionFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters]     = useState(false);
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE);
  const [selectedEntry, setSelectedEntry] = useState<MemoryDetails | null>(null);
  const sentinelRef                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTimeCapsules().then(setCapsules);
    fetchCollection().then(cards => { setAllCards(cards); setIsLoading(false); });
  }, []);

  // TODO: déplacer le filtrage côté serveur (GET /api/memories/search?...) quand le backend est prêt
  const filtered = useMemo(() => {
    const now = new Date();
    return allCards.filter(card => {
      if (filters.search.trim() && !card.content.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.mood !== 'all' && card.mood !== filters.mood) return false;
      if (filters.sharedOnly && !card.isOpen) return false;
      if (filters.period !== 'all') {
        const cardDate = new Date(card.date);
        if (filters.period === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          if (cardDate < weekAgo) return false;
        } else if (filters.period === 'month') {
          const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1);
          if (cardDate < monthAgo) return false;
        } else if (filters.period === 'year') {
          const yearAgo = new Date(now); yearAgo.setFullYear(now.getFullYear() - 1);
          if (cardDate < yearAgo) return false;
        } else if (filters.period === 'custom') {
          if (filters.dateFrom && new Date(card.date) < new Date(filters.dateFrom)) return false;
          if (filters.dateTo   && new Date(card.date) > new Date(filters.dateTo))   return false;
        }
      }
      return true;
    });
  }, [allCards, filters]);

  const visibleItems = filtered.slice(0, visibleCount);
  const hasMore      = visibleCount < filtered.length;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          sleep(800).then(() => {
            setVisibleCount(n => n + PAGE_SIZE);
            setIsLoadingMore(false);
          });
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore]);

  const handleFiltersChange = (f: CollectionFilters) => {
    setFilters(f);
    setVisibleCount(PAGE_SIZE);
  };

  const handleCardClick = async (id: string) => {
    const details = await fetchMemoryDetails(id);
    setSelectedEntry(details);
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
          onClose={() => setSelectedEntry(null)}
          onDelete={async () => {
            if (selectedEntry.id) {
              try { await api.memories.delete(selectedEntry.id); } catch { /* ignore */ }
              setAllCards(prev => prev.filter(c => c.id !== selectedEntry.id));
            }
            setSelectedEntry(null);
          }}
        />
      )}

    </div>
  );
}
