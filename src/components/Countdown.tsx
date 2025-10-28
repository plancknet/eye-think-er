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

const SAMPLE_WINDOW_MS = 2500;
const MOVEMENT_THRESHOLD = 40;
const MIN_SAMPLES = 15;

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const inferDirection = (samples: Sample[]): Direction | null => {
  if (samples.length < MIN_SAMPLES) {
    return null;
  }

  const windowSize = Math.max(5, Math.floor(samples.length * 0.2));
  const firstWindow = samples.slice(0, windowSize).map((sample) => sample.x);
  const lastWindow = samples.slice(-windowSize).map((sample) => sample.x);

  if (firstWindow.length === 0 || lastWindow.length === 0) {
    return null;
  }

  const delta = average(lastWindow) - average(firstWindow);

  if (Math.abs(delta) < MOVEMENT_THRESHOLD) {
    return null;
  }

  return delta > 0 ? "right" : "left";
};

export const Countdown = ({
  quadrants,
  onComplete,
  duration = 3,
  round,
}: CountdownProps) => {
  const [count, setCount] = useState(duration);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [manualDirection, setManualDirection] = useState<Direction | null>(null);
  const [inferredDirection, setInferredDirection] = useState<Direction | null>(null);

  const samplesRef = useRef<Sample[]>([]);
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

    const finalDirection =
      manualDirection ??
      inferredDirection ??
      (Math.random() > 0.5 ? "right" : "left");

    onComplete(finalDirection);
  }, [count, isCountingDown, inferredDirection, manualDirection, onComplete]);

  useEffect(() => {
    if (!isTracking) {
      samplesRef.current = [];
      setInferredDirection(null);
      return;
    }

    samplesRef.current = [];
    const listener = (data: { x?: number } | null) => {
      if (!data || typeof data.x !== "number") {
        return;
      }

      const now = Date.now();
      samplesRef.current.push({ time: now, x: data.x });

      const cutoff = now - SAMPLE_WINDOW_MS;
      while (samplesRef.current.length > 0 && samplesRef.current[0].time < cutoff) {
        samplesRef.current.shift();
      }

      const detected = inferDirection(samplesRef.current);
      setInferredDirection(detected);
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

  const handleManualChoice = (direction: Direction) => {
    setManualDirection(direction);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <WordGrid
        quadrants={quadrants}
        highlightedDirection={highlightedDirection}
        onDirectionChoice={handleManualChoice}
        isTracking={isTracking && count > 0}
      />

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
