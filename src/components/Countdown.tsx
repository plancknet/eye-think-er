import { useEffect, useState } from "react";
import { WordGrid } from "./WordGrid";

interface CountdownProps {
  words: string[];
  onComplete: (quadrant: number) => void;
  duration?: number;
}

export const Countdown = ({ words, onComplete, duration = 3 }: CountdownProps) => {
  const [count, setCount] = useState(duration);
  const [detectedQuadrant, setDetectedQuadrant] = useState<number | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  useEffect(() => {
    // Start countdown after a brief delay
    const startDelay = setTimeout(() => {
      setIsCountingDown(true);
    }, 1000);

    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (!isCountingDown) return;

    if (count > 0) {
      const timer = setTimeout(() => {
        setCount(count - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished - determine which quadrant was most looked at
      // For now, we'll use a simple fallback to click detection
      // In a full implementation, we'd track gaze time per quadrant
      if (detectedQuadrant !== null) {
        onComplete(detectedQuadrant);
      } else {
        // Random fallback if no detection
        onComplete(Math.floor(Math.random() * 4));
      }
    }
  }, [count, isCountingDown, detectedQuadrant, onComplete]);

  const handleQuadrantDetected = (quadrant: number) => {
    setDetectedQuadrant(quadrant);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="text-center py-8 space-y-4 animate-fade-in">
        <h2 className="text-3xl font-bold">
          {count > 0 ? 'Fixe seu olhar na palavra escolhida' : 'Lendo sua mente...'}
        </h2>
        {count > 0 && (
          <div className="text-8xl font-bold text-primary animate-pulse-glow">
            {count}
          </div>
        )}
        {count === 0 && (
          <div className="text-6xl animate-pulse">🧠✨</div>
        )}
      </div>
      
      <WordGrid 
        words={words} 
        onQuadrantDetected={handleQuadrantDetected}
        isCountingDown={isCountingDown && count > 0}
      />
    </div>
  );
};
