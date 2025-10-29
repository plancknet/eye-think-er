import { CSSProperties, useMemo, useState } from "react";
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
  if (count >= 4) return "text-xs sm:text-sm lg:text-base";
  if (count === 3) return "text-sm sm:text-base lg:text-lg";
  if (count === 2) return "text-base sm:text-lg lg:text-xl";
  return "text-lg sm:text-xl lg:text-2xl";
};

const QUADRANT_POSITIONS = [
  { top: "clamp(1.25rem, 8vh, 5rem)", left: "clamp(0.75rem, 5vw, 4rem)" },
  { top: "clamp(1.25rem, 8vh, 5rem)", right: "clamp(0.75rem, 5vw, 4rem)" },
  { bottom: "clamp(1.25rem, 8vh, 5rem)", left: "clamp(0.75rem, 5vw, 4rem)" },
  { bottom: "clamp(1.25rem, 8vh, 5rem)", right: "clamp(0.75rem, 5vw, 4rem)" },
] as const;

const QUADRANT_SIZE = {
  width: "clamp(120px, 34vw, 260px)",
  height: "clamp(160px, 40vh, 260px)",
};

export const WordGrid = ({
  quadrants,
  onDirectionChoice,
  highlightedDirection,
  isTracking,
}: WordGridProps) => {
  const [hoveredDirection, setHoveredDirection] = useState<Direction | null>(null);

  const directionByQuadrant = useMemo<Direction[]>(() => ["left", "right", "left", "right"], []);

  const totalWords = useMemo(
    () => quadrants.reduce((sum, words) => sum + words.length, 0),
    [quadrants],
  );

  const isTwoWordMode = totalWords === 2;

  const displayQuadrants = useMemo(
    () =>
      isTwoWordMode
        ? [0, 1].map((quadrantIndex) => ({
            words: quadrants[quadrantIndex] ?? [],
            quadrantIndex,
            style: { ...QUADRANT_SIZE } as CSSProperties,
          }))
        : (quadrants.length >= 4 ? quadrants.slice(0, 4) : Array.from({ length: 4 }, (_, idx) => quadrants[idx] ?? [])).map(
            (words, quadrantIndex) => ({
              words,
              quadrantIndex,
              style: {
                position: "absolute" as const,
                ...QUADRANT_SIZE,
                ...QUADRANT_POSITIONS[quadrantIndex],
              } as CSSProperties,
            }),
          ),
    [isTwoWordMode, quadrants],
  );

  const activeHighlight = useMemo<Direction | null>(() => {
    if (highlightedDirection) return highlightedDirection;
    if (!isTracking) return hoveredDirection;
    return null;
  }, [highlightedDirection, hoveredDirection, isTracking]);

  const handleQuadrantClick = (quadrantIndex: number) => {
    if (isTracking) return;
    const direction = directionByQuadrant[quadrantIndex];
    onDirectionChoice?.(direction);
  };

  const handleQuadrantEnter = (quadrantIndex: number) => {
    if (isTracking) return;
    setHoveredDirection(directionByQuadrant[quadrantIndex]);
  };

  const handleQuadrantLeave = () => {
    if (isTracking) return;
    setHoveredDirection(null);
  };

  const containerClassName = isTwoWordMode
    ? "relative flex h-full w-full items-center justify-center gap-6 sm:gap-10"
    : "relative h-full w-full";

  return (
    <div className="word-grid-container pointer-events-auto absolute inset-0 z-10">
      <div className={containerClassName}>
        {displayQuadrants.map(({ words, quadrantIndex, style }) => {
          const direction = directionByQuadrant[quadrantIndex] ?? "left";
          const highlighted = activeHighlight === direction;
          const quadrantClass = quadrantClasses[quadrantIndex % quadrantClasses.length];
          const wordFontClass = getWordFontClass(words.length);

          const contentJustifyClass =
            words.length > 2 ? "justify-between" : "justify-center";

          return (
            <div key={quadrantIndex} style={style} className="flex items-stretch justify-stretch">
              <button
                type="button"
                onClick={() => handleQuadrantClick(quadrantIndex)}
                onMouseEnter={() => handleQuadrantEnter(quadrantIndex)}
                onMouseLeave={handleQuadrantLeave}
                className={`
                  ${quadrantClass}
                  relative flex h-full w-full flex-col items-center justify-center gap-3
                  rounded-xl sm:rounded-2xl lg:rounded-3xl
                  px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6
                  transition-all duration-300
                  ${highlighted ? "ring-2 ring-white/50 shadow-[0_18px_40px_rgba(15,23,42,0.4)]" : "ring-1 ring-white/20 shadow-[0_10px_28px_rgba(15,23,42,0.25)]"}
                  ${isTracking ? "cursor-default" : "cursor-pointer hover:scale-[1.02]"}
                  backdrop-blur-sm bg-white/10 max-w-full
                `}
              >
                <div
                  className={`flex w-full flex-col items-center ${contentJustifyClass} gap-2 sm:gap-3 text-center`}
                  style={{ flex: 1 }}
                >
                  {words.length === 0 && (
                    <div className="text-white/60 text-sm font-semibold tracking-wide">-</div>
                  )}
                  {words.map((word, idx) => (
                    <div
                      key={`${quadrantIndex}-${idx}`}
                      className={`
                    w-full rounded-lg sm:rounded-xl
                    ${highlighted ? "bg-black/45" : "bg-black/30"} px-3 py-2 sm:px-4 sm:py-3 lg:px-5 lg:py-4
                    text-white font-semibold leading-tight tracking-tight break-words
                    ${wordFontClass}
                    transition-transform duration-300
                  `}
                >
                      {word}
                    </div>
                  ))}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
