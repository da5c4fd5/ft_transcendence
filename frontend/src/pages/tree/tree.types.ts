export interface TreeData {
  lifeForce: number;
  isDecreasing: boolean;
}

// Achievements -> le backend renvoie uniquement les IDs débloqués : string[]
export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}
