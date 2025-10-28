export type Theme = 'countries' | 'fruits' | 'animals';

export type GameStage = 
  | 'welcome'
  | 'webcam-setup'
  | 'theme-selection'
  | 'first-grid'
  | 'first-countdown'
  | 'second-grid'
  | 'second-countdown'
  | 'reveal';

export interface WordGridProps {
  words: string[];
  onQuadrantSelect?: (quadrant: number) => void;
  highlightQuadrant?: number | null;
  mode?: 'selection' | 'final';
}

export interface CountdownProps {
  onComplete: () => void;
  duration?: number;
}
