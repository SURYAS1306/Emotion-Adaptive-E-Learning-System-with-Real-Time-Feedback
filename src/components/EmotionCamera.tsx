import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Loader2 } from 'lucide-react';
import { detectFaceEmotion, loadFaceDetectionModels } from '@/utils/emotionDetection';
import type { EmotionType } from '@/types/emotion';

interface EmotionCameraProps {
  onEmotionDetected: (emotion: EmotionType) => void;
}

export default function EmotionCamera({ onEmotionDetected }: EmotionCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [modelsReady, setModelsReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadFaceDetectionModels()
      .then(() => setModelsReady(true))
      .catch(console.error);

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!modelsReady) {
      console.error('Models not ready yet');
      return;
    }

    setIsLoading(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
      startEmotionDetection();
    } catch (error) {
      console.error('Error accessing camera:', error);
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
    setCurrentEmotion('neutral');
    onEmotionDetected('neutral');
  };

  const startEmotionDetection = () => {
    intervalRef.current = window.setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const emotion = await detectFaceEmotion(videoRef.current);
        setCurrentEmotion(emotion);
        onEmotionDetected(emotion);
      }
    }, 1000);
  };

  const toggleCamera = () => {
    if (isCameraOn) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <Card className="p-6 emotion-card emotion-transition">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Face Emotion Detection</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Current emotion: <span className="font-semibold capitalize">{currentEmotion}</span>
            </p>
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
            {isLoading ? 'Loading...' : isCameraOn ? 'Turn Off' : 'Turn On Camera'}
          </Button>
        </div>

        <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            style={{ display: isCameraOn ? 'block' : 'none' }}
            playsInline
            muted
          />
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Camera is off</p>
                {!modelsReady && <p className="text-xs mt-2">Loading AI models...</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
