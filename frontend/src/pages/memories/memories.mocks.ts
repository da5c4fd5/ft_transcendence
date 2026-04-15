import type { TimeCapsule, MemoryCard } from './memories.types';
import type { MemoryDetails } from '../../components/MemoryModal/MemoryModal.types';

// TODO: remove when backend is ready

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

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

export async function fetchTimeCapsules(): Promise<TimeCapsule[]> {
  // TODO: const res = await fetch('/api/memories/capsuls', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_CAPSULES;
}

export async function fetchCollection(): Promise<MemoryCard[]> {
  // TODO: const res = await fetch('/api/memories', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  // Advanced filtering: GET /api/memories/search?mood=...&period=...&sharedOnly=...&limit=...
  await sleep(400);
  return MOCK_COLLECTION;
}

export async function fetchMemoryDetails(id: string): Promise<MemoryDetails> {
  // TODO: const res = await fetch(`/api/memories/${id}`, { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  // Contributions are included via GET /api/memories/:id/contributions
  const card    = MOCK_COLLECTION.find(c => c.id === id);
  const capsule = MOCK_CAPSULES.find(c => c.id === id);
  return {
    date:    card?.date    ?? capsule?.date    ?? new Date().toISOString().split('T')[0],
    mood:    card?.mood    ?? capsule?.mood    ?? 'Peaceful',
    content: card?.content ?? capsule?.content ?? '',
    media:   card?.media   ?? capsule?.media   ?? null,
    isOpen:  card?.isOpen  ?? false,
    shareUrl: null,
    friendContributions: [],
  };
}
