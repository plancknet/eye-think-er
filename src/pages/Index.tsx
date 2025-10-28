import { useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { WebcamSetup } from "@/components/WebcamSetup";
import { ThemeSelection } from "@/components/ThemeSelection";
import { Countdown } from "@/components/Countdown";
import { MindReveal } from "@/components/MindReveal";
import { Direction, GameStage, Theme } from "@/types/mindreader";
import { getRandomWords } from "@/data/wordLists";

const MAX_ROUNDS = 4;

const distributeWordsIntoQuadrants = (words: string[]): string[][] => {
  const quadrants: string[][] = Array.from({ length: 4 }, () => []);

  if (words.length === 0) {
    return quadrants;
  }

  const chunkSize = Math.max(1, Math.ceil(words.length / quadrants.length));
  let currentIndex = 0;

  for (let quadrant = 0; quadrant < quadrants.length; quadrant++) {
    const nextIndex = currentIndex + chunkSize;
    quadrants[quadrant] = words.slice(currentIndex, nextIndex);
    currentIndex = nextIndex;
  }

  return quadrants;
};

const getIndicesToKeep = (direction: Direction): number[] => {
  return direction === "left" ? [0, 2] : [1, 3];
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
    const initialQuadrants = distributeWordsIntoQuadrants(words);

    setRemainingWords(words);
    setCurrentQuadrants(initialQuadrants);
    setSelectionStageIndex(initialStageIndex);
    setStage('selection');
  };

  const handleSelectionRoundComplete = (direction: Direction) => {
    const indicesToKeep = getIndicesToKeep(direction);
    const nextWords = indicesToKeep
      .flatMap((index) => currentQuadrants[index] ?? [])
      .filter((word) => Boolean(word));

    const nextStageIndex = selectionStageIndex + 1;

    setRemainingWords(nextWords);

    if (nextWords.length <= 1 || nextStageIndex >= MAX_ROUNDS) {
      const word = nextWords[0] ?? '';
      setSelectedWord(word);
      setStage('reveal');
      return;
    }

    const nextQuadrants = distributeWordsIntoQuadrants(nextWords);

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
