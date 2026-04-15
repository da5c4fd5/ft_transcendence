import type { TreeData } from './tree.types';
import type { MemoryStats } from '../memories/memories.types';

// TODO: remove when backend is ready

const MOCK_TREE: TreeData = {
  lifeForce: 0,
  isDecreasing: false,
};

const MOCK_STATS: MemoryStats = {
  totalCapsuls: 0,
  shared: 0,
  dayStreak: 0,
  wordsWritten: 0,
};

export async function fetchTreeData(): Promise<TreeData> {
  // TODO: const res = await fetch('/api/tree', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_TREE;
}

export async function fetchStats(): Promise<MemoryStats> {
  // TODO: const res = await fetch('/api/memories/stats', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  return MOCK_STATS;
}

export async function fetchUnlockedAchievements(): Promise<string[]> {
  // TODO: const res = await fetch('/api/achievements', { headers: { Authorization: `Bearer ${token}` } }); return res.json();
  // Backend returns an array of unlocked IDs: ["first_capsul", "week_warrior"]
  return [];
}
