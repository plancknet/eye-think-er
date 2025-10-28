import { useEffect, useMemo, useRef, useState } from "react";
import { WordGrid } from "./WordGrid";
import { Direction } from "@/types/mindreader";

interface CountdownProps {
  quadrants: string[][];
  onComplete: (direction: Direction) => void;
  duration?: number;
  round?: number;
}

interface Sample {
  time: number;
  x: number;
}

const DIRECTION_THRESHOLD = 35;
const MAX_SAMPLE_INTERVAL = 500;
const HIGHLIGHT_MIN_TIME = 250;

export const Countdown = ({
  quadrants,
  onComplete,
  duration = 7,
  round,
}: CountdownProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [count, setCount] = useState(duration);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [manualDirection, setManualDirection] = useState<Direction | null>(null);
  const [inferredDirection, setInferredDirection] = useState<Direction | null>(null);
  const [debugCursor, setDebugCursor] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const samplesRef = useRef<Sample[]>([]);
  const lastSampleRef = useRef<Sample | null>(null);
  const directionTimesRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });
  const sumRef = useRef<number>(0);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const startDelay = setTimeout(() => {
      setIsTracking(true);
      setIsCountingDown(true);
    }, 1000);

    return () => {
      clearTimeout(startDelay);
    };
  }, []);

  useEffect(() => {
    if (!isCountingDown) {
      return;
    }

    if (count > 0) {
      const timer = setTimeout(() => {
        setCount((current) => current - 1);
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (hasCompletedRef.current) {
      return;
    }

    hasCompletedRef.current = true;
    setIsTracking(false);
    setIsCountingDown(false);

    const { left, right } = directionTimesRef.current;
    const trackedDirection =
      left === 0 && right === 0 ? null : right >= left ? "right" : "left";

    const finalDirection =
      manualDirection ??
      trackedDirection ??
      inferredDirection ??
      (Math.random() > 0.5 ? "right" : "left");

    setInferredDirection(finalDirection);
    onComplete(finalDirection);
  }, [count, isCountingDown, inferredDirection, manualDirection, onComplete]);

  useEffect(() => {
    if (!isTracking) {
      samplesRef.current = [];
      setInferredDirection(null);
      return;
    }

    samplesRef.current = [];
    lastSampleRef.current = null;
    directionTimesRef.current = { left: 0, right: 0 };
    sumRef.current = 0;
    const listener = (data: { x?: number } | null) => {
      if (!data || typeof data.x !== "number") {
        return;
      }

      const now = Date.now();
      const x = data.x;

      samplesRef.current.push({ time: now, x });
      sumRef.current += x;

      const lastSample = lastSampleRef.current;
      if (lastSample) {
        const elapsed = now - lastSample.time;
        if (elapsed > 0 && elapsed < MAX_SAMPLE_INTERVAL) {
          const center = sumRef.current / samplesRef.current.length;
          const averageX = (lastSample.x + x) / 2;
          const offset = averageX - center;

          if (Math.abs(offset) >= DIRECTION_THRESHOLD) {
            if (offset > 0) {
              directionTimesRef.current.right += elapsed;
            } else {
              directionTimesRef.current.left += elapsed;
            }
          }
        }
      }

      lastSampleRef.current = { time: now, x };

      const { left, right } = directionTimesRef.current;
      const dominant =
        Math.max(left, right) >= HIGHLIGHT_MIN_TIME
          ? right >= left
            ? "right"
            : "left"
          : null;

      setInferredDirection(dominant);
    };

    const webgazer = (window as any).webgazer;
    if (webgazer?.setGazeListener) {
      webgazer.setGazeListener(listener);
    }

    return () => {
      const wg = (window as any).webgazer;
      if (wg?.setGazeListener) {
        wg.setGazeListener(null);
      }
    };
  }, [isTracking]);

  useEffect(() => {
    return () => {
      const wg = (window as any).webgazer;
      if (wg?.setGazeListener) {
        wg.setGazeListener(null);
      }
    };
  }, []);

  const highlightedDirection = useMemo<Direction | null>(() => {
    if (manualDirection) {
      return manualDirection;
    }
    return inferredDirection;
  }, [inferredDirection, manualDirection]);

  const flattenedWords = useMemo(
    () => quadrants.flat().filter(Boolean).length,
    [quadrants]
  );

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      setDebugCursor((prev) => ({ ...prev, visible: false }));
      return;
    }

    if (!highlightedDirection) {
      setDebugCursor((prev) => ({ ...prev, visible: false }));
      return;
    }

    const rect = element.getBoundingClientRect();
    const targetX =
      highlightedDirection === "left"
        ? rect.left + rect.width * 0.2
        : rect.right - rect.width * 0.2;
    const targetY = rect.top + rect.height * 0.5;

    setDebugCursor({
      x: targetX,
      y: targetY,
      visible: true,
    });

    const simulatedMove = new MouseEvent("mousemove", {
      clientX: targetX,
      clientY: targetY,
      bubbles: true,
    });
    window.dispatchEvent(simulatedMove);
  }, [highlightedDirection]);

  const handleManualChoice = (direction: Direction) => {
    setManualDirection(direction);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-background"
    >
      <WordGrid
        quadrants={quadrants}
        highlightedDirection={highlightedDirection}
        onDirectionChoice={handleManualChoice}
        isTracking={isTracking && count > 0}
      />

      {debugCursor.visible && (
        <div
          className="pointer-events-none absolute z-30 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-white/40 shadow-lg transition-all duration-300"
          style={{ left: debugCursor.x, top: debugCursor.y }}
        />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20 px-6">
        <div className="space-y-4 text-center max-w-xl animate-fade-in">
          {typeof round === "number" && (
            <p className="uppercase tracking-[0.3em] text-xs sm:text-sm text-white/60">
              Etapa {round} de 4
            </p>
          )}
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white/90">
            {count > 0
              ? "Movimente a cabeça para o lado da palavra escolhida"
              : "Detectando movimento..."}
          </h2>
        </div>

        <div className="relative mt-8 sm:mt-10">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative h-40 w-40 sm:h-52 sm:w-52 md:h-60 md:w-60 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(59,130,246,0.7)] border border-white/30">
            <div className="text-5xl sm:text-6xl md:text-7xl font-black text-white">
              {count > 0 ? count : "…"}
            </div>
          </div>
        </div>

        <p className="mt-6 text-sm sm:text-base text-white/70">
          Restam {flattenedWords} palavra{flattenedWords === 1 ? "" : "s"}.
        </p>
      </div>
    </div>
  );
};
