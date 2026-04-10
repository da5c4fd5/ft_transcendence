import { useState, useEffect, useMemo, useRef } from 'preact/hooks';
import { Clock, Heart, Search, SlidersHorizontal, Share2 } from 'lucide-preact';
import { MemoryModal } from '../../components/MemoryModal/MemoryModal';
import { MOOD_EMOJI } from '../../components/MemoryModal/MemoryModal.types';
import type { Mood, MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';
import type { TimeCapsule, MemoryCard, MoodFilter, PeriodFilter, CollectionFilters } from './memories.types';

const PAGE_SIZE = 9;
const ALL_MOODS: Mood[] = ['Joyful', 'Excited', 'Peaceful', 'Nostalgic', 'Sad', 'Anxious'];

// Distribue les items dans 3 colonnes en plaçant chaque item dans la colonne
// la plus courte (algorithme greedy), pour équilibrer les hauteurs visuelles.
function distributeToColumns(items: MemoryCard[]): [MemoryCard[], MemoryCard[], MemoryCard[]] {
  const cols: [MemoryCard[], MemoryCard[], MemoryCard[]] = [[], [], []];
  const heights = [0, 0, 0];
  for (const item of items) {
    const h = item.image ? 300 : 130; // hauteur estimée en px
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

// ─── Mock data (TODO: supprimer quand le backend est prêt) ────────────────────

const MOCK_CAPSULES: TimeCapsule[] = [
  { id: 'c1', label: '1 month ago',  text: 'Found an old photo that brought back so many memories. Time really does fly.',             image: 'https://picsum.photos/seed/otter/400/300'  },
  { id: 'c2', label: '1 year ago',   text: 'It was a lazy day today. Ordered pizza, watched a movie, and just relaxed. Much needed.',  image: null                                        },
  { id: 'c3', label: '3 years ago',  text: "Finally finished that project I've been working on for weeks. Feels amazing!",             image: null                                        },
];

// Triés du plus récent au plus ancien (le backend renvoie déjà dans cet ordre)
const MOCK_COLLECTION: MemoryCard[] = [
  { id: 'm1',  date: '2026-04-09', relativeLabel: 'Yesterday',    formattedDate: 'THU, APR 9, 2026',  text: 'Walked along the canal at sunset, everything felt slow and golden.',                                                                                       image: 'https://images.unsplash.com/photo-1720198270654-dbe3ca4b838f?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',    mood: 'Peaceful',  isShared: false },
  { id: 'm3',  date: '2026-03-30', relativeLabel: '11 days ago',  formattedDate: 'MON, MAR 30, 2026', text: 'Super aprem bar à jeux avec Victor et Auriane. On a ri comme des fous.',                                                                                    image: null,                                          mood: 'Joyful',    isShared: false },
  { id: 'm4',  date: '2026-03-22', relativeLabel: '19 days ago',  formattedDate: 'SAT, MAR 22, 2026', text: "Rainy day, feeling a bit low. But that's okay — not every day has to be extraordinary.",                                                                    image: null,                                          mood: 'Sad',       isShared: false },
  { id: 'm5',  date: '2026-03-15', relativeLabel: '26 days ago',  formattedDate: 'SAT, MAR 15, 2026', text: 'Found old photos from childhood. Spent hours going through them with mom. So many stories I had forgotten.',                                                image: 'https://picsum.photos/seed/childhood/600/400',mood: 'Nostalgic', isShared: true  },
  { id: 'm6',  date: '2026-03-08', relativeLabel: '1 month ago',  formattedDate: 'SAT, MAR 8, 2026',  text: "Big presentation tomorrow. Trying to stay calm and trust the work I've put in.",                                                                            image: null,                                          mood: 'Anxious',   isShared: false },
  { id: 'm7',  date: '2026-02-14', relativeLabel: '2 months ago', formattedDate: 'SAT, FEB 14, 2026', text: "Valentine's day — unexpected flowers on the doorstep. Best surprise ever.",                                                                                image: 'https://picsum.photos/seed/flowers/600/400',  mood: 'Joyful',    isShared: false },
  { id: 'm8',  date: '2026-02-01', relativeLabel: '2 months ago', formattedDate: 'SAT, FEB 1, 2026',  text: 'First day of the month, fresh start. Set some intentions and made a proper breakfast for once.',                                                            image: null,                                          mood: 'Peaceful',  isShared: false },
  { id: 'm9',  date: '2026-01-20', relativeLabel: '3 months ago', formattedDate: 'TUE, JAN 20, 2026', text: "Concert tonight was absolutely electric. The crowd, the lights, the music — I felt alive in a way I hadn't in a long time.",                               image: 'https://picsum.photos/seed/concert/600/400',  mood: 'Excited',   isShared: true  },
  { id: 'm10', date: '2026-01-01', relativeLabel: '3 months ago', formattedDate: 'THU, JAN 1, 2026',  text: 'New year, new adventures! Feeling hopeful and ready.',                                                                                                      image: null,                                          mood: 'Excited',   isShared: false },
  { id: 'm11', date: '2025-12-25', relativeLabel: '4 months ago', formattedDate: 'THU, DEC 25, 2025', text: "Christmas morning with the whole family around the table. Grandma's recipe, same as every year. Some things never change and that's perfect.",             image: 'https://picsum.photos/seed/xmas/600/400',     mood: 'Nostalgic', isShared: false },
  { id: 'm12', date: '2025-11-10', relativeLabel: '5 months ago', formattedDate: 'MON, NOV 10, 2025', text: "Ran my first 10k today! Didn't stop once. Three months ago I couldn't run for 5 minutes.",                                                                 image: null,                                          mood: 'Excited',   isShared: true  },
  { id: 'm13', date: '2025-10-31', relativeLabel: '6 months ago', formattedDate: 'FRI, OCT 31, 2025', text: 'Halloween night, carved pumpkins with the neighbours. The street was full of kids and laughter.',                                                           image: 'https://picsum.photos/seed/halloween/600/400',mood: 'Joyful',    isShared: false },
  { id: 'm14', date: '2025-10-12', relativeLabel: '6 months ago', formattedDate: 'SUN, OCT 12, 2025', text: 'Long hike in the mountains. My legs are destroyed but the view from the top made everything worth it.',                                                     image: null,                                          mood: 'Excited',   isShared: false },
  { id: 'm15', date: '2025-09-21', relativeLabel: '7 months ago', formattedDate: 'SUN, SEP 21, 2025', text: 'Last day of summer. Sat on the terrace until midnight, not ready to let go.',                                                                               image: 'https://picsum.photos/seed/terrace/600/400',  mood: 'Nostalgic', isShared: false },
  { id: 'm16', date: '2025-09-01', relativeLabel: '7 months ago', formattedDate: 'MON, SEP 1, 2025',  text: 'Back to the routine after holidays. Inbox is terrifying but I feel rested for once.',                                                                       image: null,                                          mood: 'Anxious',   isShared: false },
  { id: 'm17', date: '2025-08-10', relativeLabel: '8 months ago', formattedDate: 'SUN, AUG 10, 2025', text: 'Beach day. Read half a book, swam three times, ate too much ice cream. Perfect.',                                                                           image: 'https://picsum.photos/seed/beach/600/400',    mood: 'Peaceful',  isShared: true  },
  { id: 'm18', date: '2025-07-14', relativeLabel: '9 months ago', formattedDate: 'MON, JUL 14, 2025', text: 'Fireworks over the city. Watched from the rooftop with a bottle of wine. Feeling lucky.',                                                                   image: null,                                          mood: 'Joyful',    isShared: false },
  { id: 'm19', date: '2025-06-21', relativeLabel: '10 months ago',formattedDate: 'SAT, JUN 21, 2025', text: 'Summer solstice — longest day of the year. Took my bike out at 6am and watched the sunrise. Completely alone, completely at peace.',                        image: 'https://picsum.photos/seed/sunrise/600/400',  mood: 'Peaceful',  isShared: false },
  { id: 'm20', date: '2025-05-05', relativeLabel: '11 months ago',formattedDate: 'MON, MAY 5, 2025',  text: "Got some really hard feedback on my work today. It stung, but they're probably right. Need to sit with it.",                                                image: null,                                          mood: 'Sad',       isShared: false },
  { id: 'm21', date: '2025-04-20', relativeLabel: '1 year ago',   formattedDate: 'SUN, APR 20, 2025', text: 'Picnic in the park. Everyone brought something to share. One of those afternoons that stretches on and feels like it lasts forever.',                       image: 'https://picsum.photos/seed/picnic/600/400',   mood: 'Joyful',    isShared: true  },
  { id: 'm22', date: '2025-03-08', relativeLabel: '1 year ago',   formattedDate: 'SAT, MAR 8, 2025',  text: "Spent the day reorganising my apartment. Threw out a lot of old stuff. Feels lighter in here now.",                                                          image: null,                                          mood: 'Peaceful',  isShared: false },
  { id: 'm23', date: '2025-02-01', relativeLabel: '1 year ago',   formattedDate: 'SAT, FEB 1, 2025',  text: 'Road trip weekend, no plan, just a direction. We ended up in a tiny village with an incredible restaurant. Best accident.',                                 image: 'https://picsum.photos/seed/roadtrip/600/400', mood: 'Excited',   isShared: false },
  { id: 'm24', date: '2025-01-15', relativeLabel: '1 year ago',   formattedDate: 'WED, JAN 15, 2025', text: "Woke up at 3am with anxiety spiraling. Made tea, wrote it all down, went back to sleep. Writing really does help.",                                         image: null,                                          mood: 'Anxious',   isShared: false },
  { id: 'm25', date: '2024-12-31', relativeLabel: '1 year ago',   formattedDate: 'TUE, DEC 31, 2024', text: "Last night of the year. Stayed home, cooked, reflected. Didn't feel the need to be anywhere else.",                                                         image: 'https://picsum.photos/seed/newyear/600/400',  mood: 'Peaceful',  isShared: false },
  { id: 'm26', date: '2024-11-03', relativeLabel: '1 year ago',   formattedDate: 'SUN, NOV 3, 2024',  text: 'Autumn walk in the forest. The light through the leaves was unreal. Collected a few and pressed them in a book.',                                           image: null,                                          mood: 'Nostalgic', isShared: false },
  { id: 'm27', date: '2024-09-14', relativeLabel: '2 years ago',  formattedDate: 'SAT, SEP 14, 2024', text: 'Music festival — three days of total sensory overload. Still buzzing.',                                                                                      image: 'https://picsum.photos/seed/festival/600/400', mood: 'Excited',   isShared: true  },
  { id: 'm2',  date: '2023-04-01', relativeLabel: '3 years ago',  formattedDate: 'SAT, APR 1, 2023',  text: 'Just found this amazing little coffee shop hidden in the alleyway. The espresso is perfect, and I sat here for hours sketching. I want to remember this.',  image: 'https://picsum.photos/seed/coffee/600/400',   mood: 'Peaceful',  isShared: true  },
];

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function fetchTimeCapsules(): Promise<TimeCapsule[]> {
  // TODO: const res = await fetch('/api/memories/capsules'); return res.json();
  await sleep(800);
  return MOCK_CAPSULES;
}

async function fetchCollection(): Promise<MemoryCard[]> {
  // TODO: const res = await fetch('/api/memories'); return res.json();
  await sleep(1500);
  return MOCK_COLLECTION;
}

async function fetchMemoryDetails(id: string): Promise<MemoryDetails> {
  // TODO: const res = await fetch(`/api/memories/${id}`); return res.json();
  const card = MOCK_COLLECTION.find(c => c.id === id);
  const capsule = MOCK_CAPSULES.find(c => c.id === id);
  return {
    date: card?.date ?? new Date().toISOString().split('T')[0],
    mood: 'Peaceful',
    text: card?.text ?? capsule?.text ?? '',
    image: card?.image ?? capsule?.image ?? null,
    isShared: card?.isShared ?? false,
    shareUrl: null,
    friendContributions: [],
  };
}

function TimeCapsuleCard({ capsule, onClick }: { capsule: TimeCapsule; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-blue/20 rounded-3xl p-4 flex flex-col gap-3 shrink-0 w-64 lg:w-auto text-left hover:bg-blue/30 transition-colors"
    >
      <span className="self-start bg-white/80 rounded-full px-3 py-1 text-[10px] font-bold text-darkgrey tracking-widest uppercase">
        {capsule.label}
      </span>
      <div className={`bg-white rounded-2xl p-4 shadow-sm flex-1 ${capsule.image ? 'flex flex-col gap-3' : 'flex items-center justify-center'}`}>
        {capsule.image && (
          <img src={capsule.image} alt="" className="w-full h-32 object-cover rounded" />
        )}
        <p className="text-darkgrey text-sm leading-relaxed text-center">
          {capsule.text}
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
      {card.image && (
        <img src={card.image} alt="" className="w-full object-cover" />
      )}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-[10px] font-bold text-darkgrey tracking-widest uppercase">
            {card.relativeLabel}
          </p>
          <p className="text-[10px] text-mediumgrey mt-0.5">{card.formattedDate}</p>
        </div>
        <p className="text-sm text-darkgrey leading-relaxed line-clamp-3">
          {card.text}
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
  { value: 'all',   label: 'All time'   },
  { value: 'week',  label: 'This week'  },
  { value: 'month', label: 'This month' },
  { value: 'year',  label: 'This year'  },
  { value: 'custom', label: 'Custom…'  },
];

function FilterPanel({ filters, onChange }: {
  filters: CollectionFilters;
  onChange: (f: CollectionFilters) => void;
}) {
  const set = (patch: Partial<CollectionFilters>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-col gap-4">

      {/* Période */}
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

      {/* Mood */}
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

  // TODO: déplacer le filtrage côté serveur quand le backend est prêt
  const filtered = useMemo(() => {
    const now = new Date();
    return allCards.filter(card => {
      if (filters.search.trim() && !card.text.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.mood !== 'all' && card.mood !== filters.mood) return false;
      if (filters.sharedOnly && !card.isShared) return false;
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

  // IntersectionObserver : charge plus quand le sentinel est visible
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
            {/* Mobile: single column */}
            <div className="flex flex-col sm:hidden gap-4">
              {visibleItems.map(card => (
                <MemoryCardItem key={card.id} card={card} onClick={() => handleCardClick(card.id)} />
              ))}
            </div>
            {/* Desktop: 3 colonnes, distribution par hauteur estimée */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 items-start">
              {distributeToColumns(visibleItems).map((col, i) => (
                <div key={i} className="flex flex-col gap-4">
                  {col.map(card => (
                    <MemoryCardItem key={card.id} card={card} onClick={() => handleCardClick(card.id)} />
                  ))}
                </div>
              ))}
            </div>
            {/* Sentinel lazy loading */}
            {hasMore && <div ref={sentinelRef} className="h-8" />}
            {/* Indicateur loading more */}
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
          onDelete={() => {
            // TODO: DELETE /api/memories/:id
            setSelectedEntry(null);
          }}
        />
      )}

    </div>
  );
}
