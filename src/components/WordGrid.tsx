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

const getWordFontClass = (count: number) => {
  if (count >= 4) return "text-base sm:text-lg lg:text-xl";
  if (count === 3) return "text-lg sm:text-xl lg:text-2xl";
  if (count === 2) return "text-xl sm:text-2xl lg:text-3xl";
  return "text-2xl sm:text-3xl lg:text-4xl";
};

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

  const desktopPositions = isFinalPair
    ? [
        "sm:col-start-1 sm:col-end-2 sm:row-start-2 sm:row-end-3 justify-self-stretch self-stretch",
        "sm:col-start-3 sm:col-end-4 sm:row-start-2 sm:row-end-3 justify-self-stretch self-stretch",
      ]
    : [
        "sm:col-start-1 sm:col-end-2 sm:row-start-1 sm:row-end-2 justify-self-stretch self-stretch",
        "sm:col-start-3 sm:col-end-4 sm:row-start-1 sm:row-end-2 justify-self-stretch self-stretch",
        "sm:col-start-1 sm:col-end-2 sm:row-start-3 sm:row-end-4 justify-self-stretch self-stretch",
        "sm:col-start-3 sm:col-end-4 sm:row-start-3 sm:row-end-4 justify-self-stretch self-stretch",
      ];

  const renderQuadrantButton = (quadrantIndex: number, extraClasses: string, key: string) => {
    const words = quadrants[quadrantIndex] ?? [];
    const highlighted = isQuadrantHighlighted(quadrantIndex);
    const quadrantClass = quadrantClasses[quadrantIndex % quadrantClasses.length];

    const highlightClasses = highlighted
      ? "ring-2 ring-white/50 shadow-[0_20px_45px_rgba(15,23,42,0.45)]"
      : "ring-1 ring-white/15 shadow-[0_12px_32px_rgba(15,23,42,0.25)]";

    const wordFontClass = getWordFontClass(words.length);

    return (
      <button
        key={key}
        type="button"
        onClick={() => handleQuadrantClick(quadrantIndex)}
        onMouseEnter={() => handleQuadrantEnter(quadrantIndex)}
        onMouseLeave={handleQuadrantLeave}
        className={`
          ${quadrantClass} ${extraClasses}
          relative flex flex-col items-center justify-center
          rounded-xl sm:rounded-2xl lg:rounded-3xl
          px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8
          transition-all duration-300
          ${highlightClasses}
          ${isTracking ? "cursor-default" : "cursor-pointer hover:scale-[1.02]"}
          min-h-[140px] sm:min-h-[220px] lg:min-h-[260px]
          max-w-full overflow-hidden
          backdrop-blur-sm
        `}
      >
        <div className="flex w-full flex-col items-center justify-center gap-3 lg:gap-4 text-center">
          {words.length === 0 && (
            <div className="text-white/70 text-base sm:text-lg font-semibold tracking-wide">
              -
            </div>
          )}
          {words.map((word, idx) => (
            <div
              key={`${quadrantIndex}-${idx}`}
              className={`
                w-full max-w-full rounded-lg sm:rounded-xl
                bg-black/30 px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4
                text-white font-semibold leading-tight tracking-tight
                ${wordFontClass}
                transition-all duration-300
                ${highlighted ? "scale-[1.02] bg-black/40" : "scale-100"}
              `}
            >
              <span className="block break-words">{word}</span>
            </div>
          ))}
        </div>
      </button>
    );
  };

  return (
    <div className="word-grid-container pointer-events-auto absolute inset-0 z-10">
      <div className="sm:hidden flex h-full flex-col gap-4 overflow-y-auto px-4 pt-4 pb-40">
        {quadrants.map((_, idx) => renderQuadrantButton(idx, "", `mobile-${idx}`))}
      </div>

      <div className="hidden h-full w-full sm:grid grid-cols-3 grid-rows-3 gap-5 md:gap-8 px-6 md:px-12 lg:px-16 py-8 md:py-12">
        {quadrants.map((_, idx) =>
          renderQuadrantButton(idx, desktopPositions[idx] ?? "", `desktop-${idx}`)
        )}
      </div>
    </div>
  );
};
