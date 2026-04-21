export interface TreeVisualProps {
  health: number;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  isDecreasing?: boolean;
}

export interface StageData {
  stage: number;
  color: string;
  accent: string;
  message: string;
  mood: 'ecstatic' | 'happy' | 'content' | 'neutral' | 'sleeping';
}
