export interface TreeData {
  lifeForce: number;     // 0–100 (score computed by the backend)
  isDecreasing: boolean; // true if lifeForce is trending down
}

// Achievements — backend returns only unlocked IDs as string[]
// The id → emoji/title/description mapping is static on the frontend (see TreePage)
export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}
