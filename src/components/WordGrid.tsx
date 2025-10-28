import { useEffect, useState } from "react";

interface WordGridProps {
  words: string[];
  onQuadrantDetected?: (quadrant: number) => void;
  highlightQuadrant?: number | null;
  isCountingDown?: boolean;
}

export const WordGrid = ({ words, onQuadrantDetected, highlightQuadrant, isCountingDown }: WordGridProps) => {
  const [hoveredQuadrant, setHoveredQuadrant] = useState<number | null>(null);
  const [gazeQuadrant, setGazeQuadrant] = useState<number | null>(null);
  const [quadrantTimes, setQuadrantTimes] = useState<number[]>([0, 0, 0, 0]);

  useEffect(() => {
    if (!isCountingDown) return;

    let lastQuadrant: number | null = null;
    let lastTime = Date.now();

    const gazeListener = (data: any) => {
      if (!data) return;
      
      const { x, y } = data;
      
      // Get the grid container bounds for more accurate detection
      const gridElement = document.querySelector('.word-grid-container');
      if (!gridElement) return;
      
      const rect = gridElement.getBoundingClientRect();
      
      // Check if gaze is within the grid bounds
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        return;
      }
      
      // Calculate relative position within the grid
      const relativeX = x - rect.left;
      const relativeY = y - rect.top;
      const gridWidth = rect.width;
      const gridHeight = rect.height;
      
      // Determine which quadrant based on gaze position within the grid
      let quadrant = 0;
      if (relativeX < gridWidth / 2) {
        quadrant = relativeY < gridHeight / 2 ? 0 : 2;
      } else {
        quadrant = relativeY < gridHeight / 2 ? 1 : 3;
      }
      
      setGazeQuadrant(quadrant);
      
      // Track time spent looking at each quadrant
      const currentTime = Date.now();
      if (lastQuadrant === quadrant) {
        const timeSpent = currentTime - lastTime;
        setQuadrantTimes(prev => {
          const newTimes = [...prev];
          newTimes[quadrant] += timeSpent;
          return newTimes;
        });
      }
      lastQuadrant = quadrant;
      lastTime = currentTime;
    };

    // @ts-ignore
    if (window.webgazer) {
      // @ts-ignore
      window.webgazer.setGazeListener(gazeListener);
    }

    return () => {
      // @ts-ignore
      if (window.webgazer) {
        // @ts-ignore
        window.webgazer.setGazeListener(null);
      }
    };
  }, [isCountingDown]);

  // Report the most looked-at quadrant when countdown ends
  useEffect(() => {
    if (!isCountingDown && quadrantTimes.some(t => t > 0)) {
      const mostLookedQuadrant = quadrantTimes.indexOf(Math.max(...quadrantTimes));
      onQuadrantDetected?.(mostLookedQuadrant);
    }
  }, [isCountingDown, quadrantTimes, onQuadrantDetected]);

  const getQuadrantWords = (quadrant: number) => {
    if (words.length === 16) {
      // First grid: 4 words per quadrant
      const start = quadrant * 4;
      return words.slice(start, start + 4);
    } else {
      // Second grid: 1 word per quadrant
      return [words[quadrant]];
    }
  };

  const handleQuadrantClick = (quadrant: number) => {
    if (isCountingDown) return;
    onQuadrantDetected?.(quadrant);
  };

  const quadrantClasses = [
    'quadrant-1',
    'quadrant-2',
    'quadrant-3',
    'quadrant-4'
  ];

  const isHighlighted = (quadrant: number) => {
    if (highlightQuadrant !== null && highlightQuadrant !== undefined) {
      return highlightQuadrant === quadrant;
    }
    if (isCountingDown && gazeQuadrant !== null) {
      return gazeQuadrant === quadrant;
    }
    return hoveredQuadrant === quadrant;
  };

  return (
    <div className="word-grid-container grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-6xl mx-auto h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] p-2 sm:p-4">
      {[0, 1, 2, 3].map((quadrant) => {
        const quadrantWords = getQuadrantWords(quadrant);
        const highlighted = isHighlighted(quadrant);
        
        return (
          <button
            key={quadrant}
            onClick={() => handleQuadrantClick(quadrant)}
            onMouseEnter={() => !isCountingDown && setHoveredQuadrant(quadrant)}
            onMouseLeave={() => setHoveredQuadrant(null)}
            className={`
              ${quadrantClasses[quadrant]}
              rounded-2xl sm:rounded-3xl p-3 sm:p-6 md:p-8 flex items-center justify-center
              transition-all duration-300
              ${highlighted ? 'scale-105 shadow-2xl ring-2 sm:ring-4 ring-white/50' : 'scale-100'}
              ${isCountingDown ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
              min-h-[120px] sm:min-h-0
            `}
          >
            <div className="space-y-2 sm:space-y-4 text-center">
              {quadrantWords.map((word, idx) => (
                <div
                  key={idx}
                  className={`
                    text-white font-bold backdrop-blur-sm bg-black/20 rounded-lg sm:rounded-xl p-2 sm:p-4
                    transition-all duration-300
                    ${words.length === 4 ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl px-3 py-2 sm:px-6 sm:py-4 md:px-8 md:py-6' : 'text-xl sm:text-2xl md:text-3xl'}
                    ${highlighted ? 'scale-110' : 'scale-100'}
                  `}
                >
                  {word}
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};
