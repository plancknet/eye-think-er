import { useMemo, useState } from "react";
import { Direction } from "@/types/mindreader";

interface WordGridProps {
  quadrants: string[][];
  onDirectionChoice?: (direction: Direction) => void;
  highlightedDirection?: Direction | null;
  isTracking?: boolean;
}

const quadrantClasses = [
  "quadrant-1",
  "quadrant-2",
  "quadrant-3",
  "quadrant-4",
];

export const WordGrid = ({
  quadrants,
  onDirectionChoice,
  highlightedDirection,
  isTracking,
}: WordGridProps) => {
  const [hoveredDirection, setHoveredDirection] = useState<Direction | null>(null);

  const directionByQuadrant = useMemo<Direction[]>(() => {
    if (quadrants.length === 4) {
      return ["left", "right", "left", "right"];
    }
    return ["left", "right"];
  }, [quadrants.length]);

  const activeHighlight = useMemo(() => {
    if (highlightedDirection) {
      return highlightedDirection;
    }
    if (!isTracking) {
      return hoveredDirection;
    }
    return null;
  }, [highlightedDirection, hoveredDirection, isTracking]);

  const isQuadrantHighlighted = (quadrantIndex: number) => {
    const direction = directionByQuadrant[quadrantIndex] ?? null;
    return direction !== null && activeHighlight === direction;
  };

  const handleQuadrantClick = (quadrantIndex: number) => {
    if (isTracking) return;
    const direction = directionByQuadrant[quadrantIndex];
    if (direction) {
      onDirectionChoice?.(direction);
    }
  };

  const handleQuadrantEnter = (quadrantIndex: number) => {
    if (isTracking) return;
    const direction = directionByQuadrant[quadrantIndex] ?? null;
    setHoveredDirection(direction);
  };

  const handleQuadrantLeave = () => {
    if (isTracking) return;
    setHoveredDirection(null);
  };

  const isFinalPair = quadrants.length === 2;

  const containerClasses = isFinalPair
    ? "grid h-full w-full grid-cols-1 sm:grid-cols-2 grid-rows-2 sm:grid-rows-1 items-stretch justify-items-stretch gap-4 sm:gap-6 lg:gap-10 px-4 sm:px-8 lg:px-16 py-4 sm:py-8"
    : "grid h-full w-full grid-cols-1 sm:grid-cols-2 grid-rows-4 sm:grid-rows-2 items-stretch justify-items-stretch gap-4 sm:gap-6 lg:gap-10 px-4 sm:px-10 lg:px-16 py-4 sm:py-10";

  const positionClasses = isFinalPair
    ? ["justify-self-stretch self-end sm:self-stretch", "justify-self-stretch self-start sm:self-stretch"]
    : [
        "justify-self-stretch self-end sm:self-start",
        "justify-self-stretch self-end sm:self-start",
        "justify-self-stretch self-start sm:self-end",
        "justify-self-stretch self-start sm:self-end",
      ];

  return (
    <div className={`word-grid-container pointer-events-auto absolute inset-0 z-10 ${containerClasses}`}>
      {quadrants.map((words, quadrantIndex) => {
        const highlighted = isQuadrantHighlighted(quadrantIndex);
        const quadrantClass = quadrantClasses[quadrantIndex % quadrantClasses.length];
        const positioning = positionClasses[quadrantIndex] ?? "";

        return (
          <button
            key={quadrantIndex}
            type="button"
            onClick={() => handleQuadrantClick(quadrantIndex)}
            onMouseEnter={() => handleQuadrantEnter(quadrantIndex)}
            onMouseLeave={handleQuadrantLeave}
            className={`
              ${quadrantClass} ${positioning}
              rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-5 lg:p-6 xl:p-8 flex items-center justify-center
              transition-all duration-300
              ${highlighted ? "shadow-2xl ring-2 sm:ring-4 ring-white/40 scale-[1.02]" : "shadow-lg scale-100"}
              ${isTracking ? "cursor-default" : "cursor-pointer hover:scale-[1.03]"}
              min-h-[120px] sm:min-h-[160px]
              overflow-hidden
              `}
          >
            <div className="flex max-h-full w-full flex-col items-center justify-center space-y-2 sm:space-y-3 lg:space-y-4 text-center overflow-hidden">
              {words.length === 0 && (
                <div className="text-white/60 text-base sm:text-lg md:text-xl font-semibold tracking-wide">
                  -
                </div>
              )}
              {words.map((word, idx) => (
                <div
                  key={`${quadrantIndex}-${idx}`}
                  className={`
                    text-white font-semibold sm:font-bold backdrop-blur-sm bg-black/15 rounded-md sm:rounded-lg px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4 max-w-full break-words
                    transition-all duration-300
                    ${words.length <= 1 ? "text-xl sm:text-2xl md:text-3xl lg:text-4xl" : "text-base sm:text-lg md:text-xl lg:text-2xl"}
                    ${highlighted ? "scale-[1.04]" : "scale-100"}
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
