import type { SharedMemory } from './guest.types';

// TODO: remove when backend is ready — real data comes from GET /memories/:id + GET /memories/:id/contributions

export const MOCK_SHARED_MEMORY: SharedMemory = {
  date: 'THURSDAY, APRIL 2, 2026',
  content: 'Spent the whole evening laughing until our stomachs hurt. Sunsets with these two never get old. We talked about everything and nothing. I want to remember this feeling of complete peace.',
  media: null,
  ownerName: 'Alex',
  friendContributions: [
    { id: '1', guestName: 'Léa',            avatarURL: null, date: '02/04/2026', content: "This was such a perfect evening!! Look at this polaroid I took!", media: null },
    { id: '2', guestName: 'Thomas',         avatarURL: null, date: '02/04/2026', content: "Next time I'm picking the restaurant though!", media: null },
    { id: '3', guestName: 'Cloclolaloutre', avatarURL: null, date: '02/04/2026', content: 'Top top top', media: null },
  ],
};
