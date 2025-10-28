import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Camera } from 'lucide-react';

type Zone = 'left' | 'center' | 'right' | null;

const HeadPoseDetector = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceLandmarker, setFaceLandmarker] = useState<FaceLandmarker | null>(null);
  const [currentZone, setCurrentZone] = useState<Zone>(null);
  const [timer, setTimer] = useState(0);
  const [detectedSide, setDetectedSide] = useState<'left' | 'right' | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const zoneStartTimeRef = useRef<number | null>(null);
  const lastZoneRef = useRef<Zone>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const initializeFaceLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });
        
        setFaceLandmarker(landmarker);
        setIsModelLoading(false);
      } catch (err) {
        console.error('Error loading face landmarker:', err);
        setError('Erro ao carregar modelo de detecção');
        setIsModelLoading(false);
      }
    };

    initializeFaceLandmarker();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 1280, height: 720 }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Não foi possível acessar a câmera');
      }
    };

    if (!isModelLoading && faceLandmarker) {
      startCamera();
    }

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isModelLoading, faceLandmarker]);

  useEffect(() => {
    if (!faceLandmarker || !videoRef.current || !canvasRef.current || !cameraActive) return;

    const detectFace = () => {
      if (!videoRef.current || !canvasRef.current || !faceLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw video frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      // Detect face landmarks
      const startTimeMs = performance.now();
      const results = faceLandmarker.detectForVideo(video, startTimeMs);

      // Draw zone dividers (Centro: 7%, Lados: 46.5% cada)
      const leftZoneEnd = canvas.width * 0.465;
      const centerZoneEnd = canvas.width * 0.535;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      
      ctx.beginPath();
      ctx.moveTo(leftZoneEnd, 0);
      ctx.lineTo(leftZoneEnd, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(centerZoneEnd, 0);
      ctx.lineTo(centerZoneEnd, canvas.height);
      ctx.stroke();

      ctx.setLineDash([]);

      // Zone labels
      ctx.font = 'bold 20px system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText('DIREITA 46.5%', 20, 40);
      ctx.fillText('CENTRO 7%', leftZoneEnd + 10, 40);
      ctx.fillText('ESQUERDA 46.5%', centerZoneEnd + 20, 40);

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        
        // Calculate head rotation (yaw) using facial landmarks
        // Using nose tip, left eye inner, right eye inner corners
        const noseTip = landmarks[1];
        const leftEyeInner = landmarks[133];
        const rightEyeInner = landmarks[362];
        const leftMouth = landmarks[61];
        const rightMouth = landmarks[291];

        // Calculate face center and width
        const faceCenter = {
          x: (leftEyeInner.x + rightEyeInner.x) / 2,
          y: (leftEyeInner.y + rightEyeInner.y) / 2
        };

        const eyeDistance = Math.abs(rightEyeInner.x - leftEyeInner.x);
        const mouthDistance = Math.abs(rightMouth.x - leftMouth.x);
        
        // Calculate horizontal offset from face center to nose
        const noseOffset = noseTip.x - faceCenter.x;
        
        // Normalized rotation angle (-1 to 1, where -1 is full left, 1 is full right)
        const rotationRatio = noseOffset / (eyeDistance * 0.5);
        
        // Determine zone based on rotation angle
        let zone: Zone = 'center';
        const threshold = 0.07; // 7% threshold - sai da zona central
        
        if (rotationRatio < -threshold) {
          zone = 'left'; // Head rotated to the left (looking left)
        } else if (rotationRatio > threshold) {
          zone = 'right'; // Head rotated to the right (looking right)
        }

        setCurrentZone(zone);

        // Visual feedback - draw on canvas
        const noseX = noseTip.x * canvas.width;
        const noseY = noseTip.y * canvas.height;

        // Draw face outline
        ctx.strokeStyle = zone === 'left' ? '#fb923c' : zone === 'right' ? '#34d399' : '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // Draw simplified face boundary
        const faceOval = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
        
        for (let i = 0; i < faceOval.length; i++) {
          const point = landmarks[faceOval[i]];
          const x = point.x * canvas.width;
          const y = point.y * canvas.height;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.stroke();

        // Draw rotation indicator
        ctx.fillStyle = zone === 'left' ? '#fb923c' : zone === 'right' ? '#34d399' : '#60a5fa';
        ctx.beginPath();
        ctx.arc(noseX, noseY, 8, 0, 2 * Math.PI);
        ctx.fill();

        // Draw rotation angle visualization
        const centerX = faceCenter.x * canvas.width;
        const centerY = faceCenter.y * canvas.height;
        
        ctx.strokeStyle = zone === 'left' ? '#fb923c' : zone === 'right' ? '#34d399' : '#60a5fa';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(noseX, noseY);
        ctx.stroke();

        // Display rotation angle
        ctx.font = 'bold 16px system-ui';
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        const angleText = `Rotação: ${(rotationRatio * 100).toFixed(0)}°`;
        ctx.strokeText(angleText, 20, canvas.height - 30);
        ctx.fillText(angleText, 20, canvas.height - 30);

        // Track time in zone
        if (zone !== 'center') {
          if (lastZoneRef.current === zone) {
            if (zoneStartTimeRef.current === null) {
              zoneStartTimeRef.current = Date.now();
            } else {
              const elapsed = (Date.now() - zoneStartTimeRef.current) / 1000;
              setTimer(elapsed);

              if (elapsed >= 3 && detectedSide !== zone) {
                setDetectedSide(zone);
                // Play sound notification
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWm98OScTgwOUKzn77RgGgU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQU9mNzxxW8gBS1/y+3ajzsKGGS53OihUBELTKXh6rJeGwU7k9nywHElBSh+zPLajDgJFmW62+mVSQ0NTarn7bVlHQ==');
                audio.play().catch(e => console.log('Audio play failed:', e));
              }
            }
          } else {
            zoneStartTimeRef.current = Date.now();
            lastZoneRef.current = zone;
            setTimer(0);
          }
        } else {
          zoneStartTimeRef.current = null;
          lastZoneRef.current = null;
          setTimer(0);
        }
      } else {
        setCurrentZone(null);
        zoneStartTimeRef.current = null;
        lastZoneRef.current = null;
        setTimer(0);
      }

      animationFrameRef.current = requestAnimationFrame(detectFace);
    };

    detectFace();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [faceLandmarker, cameraActive, detectedSide]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Detector de Rotação de Cabeça
          </h1>
          <p className="text-muted-foreground text-lg">
            Gire sua cabeça e mantenha por 3 segundos para um dos lados
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isModelLoading && (
          <Card className="p-8 text-center">
            <div className="space-y-4">
              <Camera className="w-16 h-16 mx-auto animate-pulse text-primary" />
              <p className="text-lg text-muted-foreground">Carregando modelo de detecção...</p>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          <Card className={`p-6 transition-all ${currentZone === 'right' ? 'bg-zone-right/10 ring-2 ring-zone-right shadow-glow' : ''}`}>
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-zone-right">46.5%</div>
              <div className="text-xl font-semibold">Faixa Direita</div>
              {currentZone === 'right' && (
                <div className="text-lg text-zone-right animate-pulse">
                  ● Detectando
                </div>
              )}
            </div>
          </Card>

          <Card className={`p-6 transition-all ${currentZone === 'center' ? 'bg-zone-center/10 ring-2 ring-zone-center shadow-glow' : ''}`}>
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-zone-center">7%</div>
              <div className="text-xl font-semibold">Faixa Central</div>
              {currentZone === 'center' && (
                <div className="text-lg text-zone-center animate-pulse">
                  ● Centralizado
                </div>
              )}
            </div>
          </Card>

          <Card className={`p-6 transition-all ${currentZone === 'left' ? 'bg-zone-left/10 ring-2 ring-zone-left shadow-glow' : ''}`}>
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-zone-left">46.5%</div>
              <div className="text-xl font-semibold">Faixa Esquerda</div>
              {currentZone === 'left' && (
                <div className="text-lg text-zone-left animate-pulse">
                  ● Detectando
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="text-center space-y-2">
              <div className="text-muted-foreground">Timer</div>
              <div className={`text-5xl font-bold transition-colors ${
                timer >= 2.5 ? 'text-alert' : timer >= 1.5 ? 'text-warning' : 'text-primary'
              }`}>
                {timer.toFixed(1)}s
              </div>
              <div className="text-sm text-muted-foreground">
                {timer >= 3 ? '✓ 3 segundos atingidos!' : 'Aguardando 3 segundos...'}
              </div>
            </div>
          </Card>

          <Card className={`p-6 transition-all ${
            detectedSide ? 'bg-gradient-alert shadow-alert' : ''
          }`}>
            <div className="text-center space-y-2">
              <div className="text-muted-foreground">Lado Detectado</div>
              <div className="text-5xl font-bold">
                {detectedSide === 'left' ? '← ESQUERDA' : detectedSide === 'right' ? 'DIREITA →' : '—'}
              </div>
              {detectedSide && (
                <div className="text-sm animate-pulse">
                  ✓ Permaneceu por 3 segundos!
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeadPoseDetector;
