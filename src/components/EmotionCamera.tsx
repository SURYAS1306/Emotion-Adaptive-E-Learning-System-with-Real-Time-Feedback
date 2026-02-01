import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import {
  detectFaceEmotionDetailed,
  loadFaceDetectionModels,
} from "@/utils/emotionDetection";
import type { EmotionType } from "@/types/emotion";

interface EmotionCameraProps {
  onEmotionDetected: (emotion: EmotionType) => void;
  /** Compact layout for sidebar/quiz embedding */
  compact?: boolean;
}

export default function EmotionCamera({ onEmotionDetected, compact = false }: EmotionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>("neutral");
  const [modelsReady, setModelsReady] = useState(false);
  const [statusText, setStatusText] = useState<string>("Models loading...");
  const [lastConfidence, setLastConfidence] = useState<number>(0);
  const [lastFaceScore, setLastFaceScore] = useState<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const detectingRef = useRef(false);
  const noFaceFramesRef = useRef(0);
  const recentEmotionsRef = useRef<EmotionType[]>([]);

  useEffect(() => {
    loadFaceDetectionModels()
      .then(() => {
        setModelsReady(true);
        setStatusText("Models ready.");
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
        setStatusText("Model load failed (check /public/models weights).");
      });

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!modelsReady) {
      setStatusText("Models not ready yet.");
      return;
    }

    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
      setStatusText("Camera on. Looking for a face...");
      startEmotionDetection();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error accessing camera:", error);
      setStatusText("Camera access failed. Check browser permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setIsCameraOn(false);
    setCurrentEmotion("neutral");
    onEmotionDetected("neutral");
    setStatusText(modelsReady ? "Camera off." : "Models loading...");
    setLastConfidence(0);
    setLastFaceScore(0);
    noFaceFramesRef.current = 0;
    recentEmotionsRef.current = [];
  };

  const startEmotionDetection = () => {
    intervalRef.current = window.setInterval(async () => {
      if (detectingRef.current) return;
      const video = videoRef.current;
      if (!video) return;

      detectingRef.current = true;
      try {
        const result = await detectFaceEmotionDetailed(video, {
          inputSize: 224,
          scoreThreshold: 0.4,
          emotionThreshold: 0.45,
        });

        setLastConfidence(result.confidence);
        setLastFaceScore(result.faceScore);

        if (!result.faceDetected) {
          noFaceFramesRef.current += 1;
          setStatusText("No face detected (improve lighting / face the camera).");

          // Don’t instantly jump to neutral; only reset after a short streak.
          if (noFaceFramesRef.current >= 6) {
            setCurrentEmotion("neutral");
            onEmotionDetected("neutral");
          }
          return;
        }

        noFaceFramesRef.current = 0;
        setStatusText("Face detected.");

        // Simple smoothing: use majority vote over last few predictions
        const windowSize = 5;
        recentEmotionsRef.current.push(result.emotion);
        if (recentEmotionsRef.current.length > windowSize) {
          recentEmotionsRef.current.shift();
        }
        const stable = modeEmotion(recentEmotionsRef.current);

        setCurrentEmotion(stable);
        onEmotionDetected(stable);
      } finally {
        detectingRef.current = false;
      }
    }, 500);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <Card className={compact ? "p-4 emotion-card emotion-transition" : "p-6 emotion-card emotion-transition"}>
      <div className="space-y-3">
        <div className={compact ? "flex flex-col gap-2" : "flex items-center justify-between"}>
          <div>
            <h2 className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>Face Emotion Detection</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Current emotion:{" "}
              <span className="font-semibold capitalize">{currentEmotion}</span>
            </p>
            {!compact && (
              <p className="text-xs text-muted-foreground mt-1">
                {statusText} · face={Math.round(lastFaceScore * 100)}% · expr=
                {Math.round(lastConfidence * 100)}%
              </p>
            )}
          </div>
          <Button
            onClick={toggleCamera}
            disabled={isLoading || !modelsReady}
            size="lg"
            className="emotion-transition"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : isCameraOn ? (
              <CameraOff className="mr-2 h-5 w-5" />
            ) : (
              <Camera className="mr-2 h-5 w-5" />
            )}
            {isLoading ? "Loading..." : isCameraOn ? "Turn Off" : "Turn On Camera"}
          </Button>
        </div>

        <div className={`relative rounded-lg overflow-hidden bg-muted aspect-video ${compact ? "max-h-[160px]" : ""}`}>
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ display: isCameraOn ? "block" : "none" }}
            playsInline
            muted
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Camera is off</p>
                {!modelsReady && (
                  <p className="text-xs mt-2">Loading AI models...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function modeEmotion(values: EmotionType[]): EmotionType {
  if (values.length === 0) return "neutral";
  const counts = new Map<EmotionType, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: EmotionType = values[values.length - 1];
  let bestCount = -1;
  for (const [k, c] of counts.entries()) {
    if (c > bestCount) {
      best = k;
      bestCount = c;
    }
  }
  return best;
}
