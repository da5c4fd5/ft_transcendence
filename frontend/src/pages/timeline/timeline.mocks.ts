import type { DaySummary } from './timeline.types';
import type { MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';

// TODO: remove when backend is ready

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
      { id: '1', guestName: 'Léa',    avatarURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80', date: '02/04/2026', content: "This was such a perfect evening!! Look at this polaroid I took!", media: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80' },
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

export async function fetchSummaries(year: number): Promise<DaySummary[]> {
  // TODO: const res = await fetch(`/api/timeline?year=${year}`, { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_SUMMARIES.filter(e => e.date.startsWith(String(year)));
}

export async function fetchEntry(date: string): Promise<MemoryDetails | null> {
  // TODO: const res = await fetch(`/api/entries/${date}`, { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_ENTRIES.find(e => e.date === date) ?? null;
}

export async function fetchYearsWithEntries(): Promise<number[]> {
  // TODO: const res = await fetch('/api/timeline/years', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  const years = [...new Set(MOCK_SUMMARIES.map(e => parseInt(e.date.split('-')[0])))];
  return years.sort((a, b) => a - b);
}
