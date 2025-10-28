import { useState } from "react";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { WebcamSetup } from "@/components/WebcamSetup";
import { ThemeSelection } from "@/components/ThemeSelection";
import { WordGrid } from "@/components/WordGrid";
import { Countdown } from "@/components/Countdown";
import { MindReveal } from "@/components/MindReveal";
import { GameStage, Theme } from "@/types/mindreader";
import { getRandomWords } from "@/data/wordLists";

const Index = () => {
  const [stage, setStage] = useState<GameStage>('welcome');
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [firstQuadrantWords, setFirstQuadrantWords] = useState<string[]>([]);
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
    setStage('first-countdown');
  };

  const handleFirstCountdownComplete = (quadrant: number) => {
    // Get the 4 words from the selected quadrant
    const start = quadrant * 4;
    const quadrantWords = allWords.slice(start, start + 4);
    setFirstQuadrantWords(quadrantWords);
    setStage('second-countdown');
  };

  const handleSecondCountdownComplete = (quadrant: number) => {
    // The selected word is at the chosen quadrant position
    const word = firstQuadrantWords[quadrant];
    setSelectedWord(word);
    setStage('reveal');
  };

  const handleRestart = () => {
    setStage('welcome');
    setSelectedTheme(null);
    setAllWords([]);
    setFirstQuadrantWords([]);
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
      {stage === 'first-countdown' && (
        <Countdown 
          words={allWords} 
          onComplete={handleFirstCountdownComplete}
          duration={3}
        />
      )}
      {stage === 'second-countdown' && (
        <Countdown 
          words={firstQuadrantWords} 
          onComplete={handleSecondCountdownComplete}
          duration={3}
        />
      )}
      {stage === 'reveal' && <MindReveal word={selectedWord} onRestart={handleRestart} />}
    </>
  );
};

export default Index;
