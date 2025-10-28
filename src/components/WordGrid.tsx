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
    ? "grid h-full w-full grid-cols-2 grid-rows-1 items-center justify-items-stretch gap-6 px-12 sm:px-24 lg:px-40"
    : "grid h-full w-full grid-cols-2 grid-rows-2 items-stretch justify-items-stretch gap-6 sm:gap-10 px-8 sm:px-16 lg:px-28 py-8 sm:py-16";

  const positionClasses = isFinalPair
    ? ["justify-self-start self-center", "justify-self-end self-center"]
    : [
        "justify-self-start self-start",
        "justify-self-end self-start",
        "justify-self-start self-end",
        "justify-self-end self-end",
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
              rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 flex items-center justify-center
              transition-all duration-300
              ${highlighted ? "scale-105 shadow-2xl ring-2 sm:ring-4 ring-white/50" : "scale-100"}
              ${isTracking ? "cursor-default" : "cursor-pointer hover:scale-105"}
              min-h-[120px] sm:min-h-0
              `}
          >
            <div className="space-y-2 sm:space-y-4 text-center">
              {words.length === 0 && (
                <div className="text-white/60 text-lg sm:text-xl md:text-2xl font-semibold tracking-wide">
                  -
                </div>
              )}
              {words.map((word, idx) => (
                <div
                  key={`${quadrantIndex}-${idx}`}
                  className={`
                    text-white font-bold backdrop-blur-sm bg-black/20 rounded-lg sm:rounded-xl p-2 sm:p-4
                    transition-all duration-300
                    ${words.length <= 1 ? "text-2xl sm:text-3xl md:text-4xl lg:text-5xl px-3 py-2 sm:px-6 sm:py-4 md:px-8 md:py-6" : "text-xl sm:text-2xl md:text-3xl"}
                    ${highlighted ? "scale-110" : "scale-100"}
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
