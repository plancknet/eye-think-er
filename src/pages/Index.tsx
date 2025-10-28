import { useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { WebcamSetup } from "@/components/WebcamSetup";
import { ThemeSelection } from "@/components/ThemeSelection";
import { Countdown } from "@/components/Countdown";
import { MindReveal } from "@/components/MindReveal";
import { Direction, GameStage, Theme } from "@/types/mindreader";
import { getRandomWords } from "@/data/wordLists";

const STAGE_QUADRANT_COUNTS = [4, 4, 4, 2] as const;

const distributeWordsIntoQuadrants = (words: string[], quadrantCount: number): string[][] => {
  const quadrants: string[][] = Array.from({ length: quadrantCount }, () => []);
  let currentIndex = 0;

  for (let quadrant = 0; quadrant < quadrants.length; quadrant++) {
    if (currentIndex >= words.length) {
      quadrants[quadrant] = [];
      continue;
    }

    const remainingQuadrants = quadrants.length - quadrant;
    const remainingWords = words.length - currentIndex;
    const groupSize = Math.ceil(remainingWords / remainingQuadrants);

    quadrants[quadrant] = words.slice(currentIndex, currentIndex + groupSize);
    currentIndex += groupSize;
  }

  return quadrants;
};

const getIndicesToKeep = (direction: Direction, quadrantCount: number): number[] => {
  if (quadrantCount === 4) {
    return direction === "left" ? [0, 2] : [1, 3];
  }

  if (quadrantCount === 2) {
    return direction === "left" ? [0] : [1];
  }

  return [];
};

const Index = () => {
  const [stage, setStage] = useState<GameStage>('welcome');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [remainingWords, setRemainingWords] = useState<string[]>([]);
  const [currentQuadrants, setCurrentQuadrants] = useState<string[][]>([]);
  const [selectionStageIndex, setSelectionStageIndex] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<string>('');

  const handleStart = () => {
    setStage('webcam-setup');
  };

  const handleWebcamComplete = () => {
    setStage('theme-selection');
  };

  const handleThemeSelect = (theme: Theme) => {
    setSelectedTheme(theme);
    const words = getRandomWords(theme, 16);
    setAllWords(words);

    const initialStageIndex = 0;
    const initialQuadrants = distributeWordsIntoQuadrants(
      words,
      STAGE_QUADRANT_COUNTS[initialStageIndex]
    );

    setRemainingWords(words);
    setCurrentQuadrants(initialQuadrants);
    setSelectionStageIndex(initialStageIndex);
    setStage('selection');
  };

  const handleSelectionRoundComplete = (direction: Direction) => {
    const currentQuadrantCount = currentQuadrants.length;
    const indicesToKeep = getIndicesToKeep(direction, currentQuadrantCount);
    const nextWords = indicesToKeep
      .flatMap((index) => currentQuadrants[index] ?? [])
      .filter((word) => Boolean(word));

    if (nextWords.length <= 1) {
      const word = nextWords[0] ?? '';
      setSelectedWord(word);
      setStage('reveal');
      return;
    }

    const nextStageIndex = selectionStageIndex + 1;
    if (nextStageIndex >= STAGE_QUADRANT_COUNTS.length) {
      const word = nextWords[0] ?? '';
      setSelectedWord(word);
      setStage('reveal');
      return;
    }

    const nextQuadrantCount = STAGE_QUADRANT_COUNTS[nextStageIndex];
    const nextQuadrants = distributeWordsIntoQuadrants(nextWords, nextQuadrantCount);

    setRemainingWords(nextWords);
    setCurrentQuadrants(nextQuadrants);
    setSelectionStageIndex(nextStageIndex);
  };

  const handleRestart = () => {
    setStage('welcome');
    setSelectedTheme(null);
    setAllWords([]);
    setRemainingWords([]);
    setCurrentQuadrants([]);
    setSelectionStageIndex(0);
    setSelectedWord('');
    
    // Clean up WebGazer
    // @ts-ignore
    if (window.webgazer) {
      // @ts-ignore
      window.webgazer.end();
    }
  };

  return (
    <>
      {stage === 'welcome' && <WelcomeScreen onStart={handleStart} />}
      {stage === 'webcam-setup' && <WebcamSetup onComplete={handleWebcamComplete} />}
      {stage === 'theme-selection' && <ThemeSelection onSelect={handleThemeSelect} />}
      {stage === 'selection' && remainingWords.length > 0 && (
        <Countdown
          key={`${selectionStageIndex}-${remainingWords.length}`}
          quadrants={currentQuadrants}
          onComplete={handleSelectionRoundComplete}
          duration={7}
          round={selectionStageIndex + 1}
        />
      )}
      {stage === 'reveal' && <MindReveal word={selectedWord} onRestart={handleRestart} />}
    </>
  );
};

export default Index;
