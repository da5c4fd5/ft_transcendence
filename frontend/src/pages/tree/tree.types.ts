export type TreeStage = 'seed' | 'sprout' | 'sapling' | 'young' | 'mature' | 'ancient';

export interface TreeData {
  stage: TreeStage;
  lifeForce: number;       // 0–100
  stageName: string;       // e.g. "Struggling"
  stageMotivation: string; // e.g. "Don't give up!"
  totalCapsuls: number;
  dayStreak: number;
  wordsWritten: number;
}

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}
