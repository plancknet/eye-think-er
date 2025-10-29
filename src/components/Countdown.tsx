import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { WordGrid } from "./WordGrid";
import { Direction } from "@/types/mindreader";

interface CountdownProps {
  quadrants: string[][];
  onComplete: (direction: Direction) => void;
  round?: number;
}

const HEAD_ROTATION_THRESHOLD = 0.07;
const STABLE_DIRECTION_DURATION_MS = 3000;
const IDEAL_VIDEO_WIDTH = 640;
const IDEAL_VIDEO_HEIGHT = 480;
const VISION_WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const SHOW_DEBUG_CURSOR = false;

let faceLandmarkerInstance: FaceLandmarker | null = null;
let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null;

const loadFaceLandmarker = async () => {
  if (faceLandmarkerInstance) {
    return faceLandmarkerInstance;
  }

  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(VISION_WASM_PATH);
      try {
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        return faceLandmarkerInstance;
      } catch (gpuError) {
        console.warn(
          "[Countdown] GPU delegate unavailable, falling back to CPU for face landmarker.",
          gpuError
        );
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
        });
        return faceLandmarkerInstance;
      }
    })();
  }

  return faceLandmarkerPromise;
};

let sharedVideoElement: HTMLVideoElement | null = null;
let sharedVideoPromise: Promise<HTMLVideoElement> | null = null;

const getSharedVideoElement = async () => {
  if (sharedVideoElement && sharedVideoElement.readyState >= 2) {
    return sharedVideoElement;
  }

  if (!sharedVideoPromise) {
    sharedVideoPromise = (async () => {
      const existingWebgazerVideo =
        (document.getElementById("webgazerVideoFeed") as HTMLVideoElement | null) ??
        ((window as any).webgazer?.webcam?.videoElement as HTMLVideoElement | null) ??
        null;

      if (existingWebgazerVideo?.srcObject instanceof MediaStream) {
        sharedVideoElement = existingWebgazerVideo;
        return existingWebgazerVideo;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: IDEAL_VIDEO_WIDTH },
          height: { ideal: IDEAL_VIDEO_HEIGHT },
        },
      });

      const targetVideo = existingWebgazerVideo ?? document.createElement("video");
      targetVideo.autoplay = true;
      targetVideo.muted = true;
      targetVideo.playsInline = true;
      targetVideo.srcObject = stream;

      if (!existingWebgazerVideo) {
        targetVideo.style.position = "fixed";
        targetVideo.style.opacity = "0";
        targetVideo.style.pointerEvents = "none";
        targetVideo.style.width = "1px";
        targetVideo.style.height = "1px";
        document.body.appendChild(targetVideo);
      }

      await targetVideo.play();
      sharedVideoElement = targetVideo;
      return targetVideo;
    })();
  }

  return sharedVideoPromise;
};

export const Countdown = ({
  quadrants,
  onComplete,
  round,
}: CountdownProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const activeDirectionRef = useRef<Direction | null>(null);
  const directionStartRef = useRef<number | null>(null);
  const hasCompletedRef = useRef(false);

  const [isTracking, setIsTracking] = useState(false);
  const [manualDirection, setManualDirection] = useState<Direction | null>(null);
  const [detectedDirection, setDetectedDirection] = useState<Direction | null>(null);
  const [holdDuration, setHoldDuration] = useState<number>(0);
  const [debugCursor, setDebugCursor] = useState<{ x: number; y: number; opacity: number }>({
    x: 0,
    y: 0,
    opacity: 0,
  });

  const resetTrackingState = useCallback(() => {
    activeDirectionRef.current = null;
    directionStartRef.current = null;
    setHoldDuration(0);
    setDetectedDirection(null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const landmarker = await loadFaceLandmarker();
        const video = await getSharedVideoElement();

        if (cancelled) {
          return;
        }

        landmarkerRef.current = landmarker;
        videoRef.current = video;

        hasCompletedRef.current = false;
        setManualDirection(null);
        resetTrackingState();
        setIsTracking(true);

        const detect = () => {
          if (cancelled || hasCompletedRef.current) {
            return;
          }

          const landmarkerInstance = landmarkerRef.current;
          const videoElement = videoRef.current;

          if (!landmarkerInstance || !videoElement || videoElement.readyState < 2) {
            frameRef.current = requestAnimationFrame(detect);
            return;
          }

          const startTime = performance.now();
          const results = landmarkerInstance.detectForVideo(videoElement, startTime);

          if (results.faceLandmarks && results.faceLandmarks.length > 0) {
            const landmarks = results.faceLandmarks[0];

            const noseTip = landmarks[1];
            const leftEyeInner = landmarks[133];
            const rightEyeInner = landmarks[362];

            const faceCenterX = (leftEyeInner.x + rightEyeInner.x) / 2;
            const noseOffset = noseTip.x - faceCenterX;
            const faceWidth = Math.abs(rightEyeInner.x - leftEyeInner.x);
            const rotationRatio = noseOffset / (faceWidth * 0.5);

            let zone: Direction | "center" = "center";

            if (rotationRatio < -HEAD_ROTATION_THRESHOLD) {
              zone = "left";
            } else if (rotationRatio > HEAD_ROTATION_THRESHOLD) {
              zone = "right";
            }

            if (zone === "center") {
              if (activeDirectionRef.current !== null) {
                resetTrackingState();
              }
            } else {
              setDetectedDirection((prev) => (prev === zone ? prev : zone));

              const now = Date.now();
              if (activeDirectionRef.current !== zone) {
                activeDirectionRef.current = zone;
                directionStartRef.current = now;
                setHoldDuration(0);
              } else if (directionStartRef.current != null) {
                const heldFor = now - directionStartRef.current;
                setHoldDuration((current) =>
                  Math.abs(current - heldFor) > 50 ? heldFor : current
                );

                if (heldFor >= STABLE_DIRECTION_DURATION_MS) {
                  hasCompletedRef.current = true;
                  setIsTracking(false);
                  onComplete(zone);
                  return;
                }
              }
            }
          } else if (activeDirectionRef.current !== null) {
            resetTrackingState();
          }

          frameRef.current = requestAnimationFrame(detect);
        };

        frameRef.current = requestAnimationFrame(detect);
      } catch (error) {
        console.error("Head pose initialization failed:", error);
        if (!cancelled) {
          resetTrackingState();
          setIsTracking(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setIsTracking(false);
    };
  }, [onComplete, resetTrackingState, round]);

  const highlightedDirection = useMemo<Direction | null>(() => {
    if (manualDirection) {
      return manualDirection;
    }
    return detectedDirection;
  }, [detectedDirection, manualDirection]);

  const flattenedWords = useMemo(
    () => quadrants.flat().filter(Boolean).length,
    [quadrants]
  );

  const moveDebugCursor = useCallback(
    (direction: Direction | null, visible: boolean) => {
      if (!SHOW_DEBUG_CURSOR) {
        return;
      }

      const element = containerRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();

      let targetClientX = rect.left + rect.width / 2;
      if (direction === "left") {
        targetClientX = rect.left + rect.width * 0.2;
      } else if (direction === "right") {
        targetClientX = rect.right - rect.width * 0.2;
      }

      const targetClientY = rect.top + rect.height * 0.5;

      const relativeX = targetClientX - rect.left;
      const relativeY = targetClientY - rect.top;

      setDebugCursor({
        x: relativeX,
        y: relativeY,
        opacity: visible ? 1 : 0,
      });

      if (visible) {
        const simulatedMove = new MouseEvent("mousemove", {
          clientX: targetClientX,
          clientY: targetClientY,
          bubbles: true,
        });
        window.dispatchEvent(simulatedMove);
      }
    },
    []
  );

  useEffect(() => {
    if (!highlightedDirection) {
      moveDebugCursor(null, false);
      return;
    }
    moveDebugCursor(highlightedDirection, true);
  }, [highlightedDirection, moveDebugCursor]);

  useEffect(() => {
    moveDebugCursor(null, false);
  }, [round, moveDebugCursor]);

  const handleManualChoice = (direction: Direction) => {
    setManualDirection(direction);
    setHoldDuration(STABLE_DIRECTION_DURATION_MS);
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      setIsTracking(false);
      onComplete(direction);
    }
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
        isTracking={isTracking && !hasCompletedRef.current}
      />

      {SHOW_DEBUG_CURSOR && (
        <div
          className="pointer-events-none absolute z-30 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-white/60 shadow-lg transition-transform duration-300"
          style={{ left: debugCursor.x, top: debugCursor.y, opacity: debugCursor.opacity }}
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
            {isTracking
              ? "Mantenha a cabeca apontada para o lado escolhido"
              : "Processando escolha..."}
          </h2>
        </div>

        <div className="relative mt-8 sm:mt-10">
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative h-40 w-40 sm:h-52 sm:w-52 md:h-60 md:w-60 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-[0_0_60px_-10px_rgba(59,130,246,0.7)] border border-white/30">
            <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white">
              {Math.max(0, Math.ceil((STABLE_DIRECTION_DURATION_MS - holdDuration) / 1000))}
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
