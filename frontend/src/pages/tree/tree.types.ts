export interface TreeData {
  lifeForce: number;    // 0–100 (score calculé par le backend)
  isDecreasing: boolean; // true si le lifeForce est en baisse
}

// Achievements — le backend renvoie uniquement les IDs débloqués : string[]
// Le mapping id → emoji/titre/description est statique côté frontend (voir TreePage)
export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}
