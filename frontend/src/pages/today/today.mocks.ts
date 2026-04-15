import type { TreeData } from '../tree/tree.types';
import type { MemoryStats } from '../memories/memories.types';
import type { PastMemory } from './today.types';

// TODO: remove when backend is ready

const MOCK_TREE: TreeData = {
  lifeForce: 10,
  isDecreasing: false,
};

const MOCK_STATS: MemoryStats = {
  totalCapsuls: 10,
  shared: 2,
  dayStreak: 1,
  wordsWritten: 139,
};

const MOCK_PROMPTS: string[] = [
  "What's something you're grateful for right now?",
  "What made you smile today?",
  "Describe a small moment that felt good.",
  "What's on your mind right now?",
  "What did you learn today?",
  "Who made your day better?",
  "What's one thing you want to remember about today?",
  "What surprised you today?",
  "What's a challenge you overcame recently?",
  "How are you feeling in your body right now?",
  "What's something you're looking forward to?",
  "What would make tomorrow a great day?",
];

const MOCK_PAST_MEMORY: PastMemory = {
  id: 'm1',
  date: '2025-04-09',
  content: 'Had a great walk in the park this morning. The weather was perfect and I felt completely at peace.',
  media: null,
  mood: 'Peaceful',
};

export async function fetchTreeData(): Promise<TreeData> {
  // TODO: const res = await fetch('/api/tree', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_TREE;
}

export async function fetchStats(): Promise<MemoryStats> {
  // TODO: const res = await fetch('/api/memories/stats', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_STATS;
}

export async function fetchPrompt(): Promise<string> {
  // TODO: const res = await fetch('/api/prompt', { headers: { Authorization: `Bearer ${token}` } }); return (await res.json()).prompt;
  return MOCK_PROMPTS[Math.floor(Math.random() * MOCK_PROMPTS.length)];
}

export async function fetchPastMemory(): Promise<PastMemory | null> {
  // TODO: const res = await fetch('/api/memories/capsuls', { headers: { Authorization: `Bearer ${token}` } });
  //       const capsuls = await res.json();
  //       return capsuls[0] ?? null;
  return MOCK_PAST_MEMORY;
}
