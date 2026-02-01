import { useEffect } from "react";
import { Link } from "react-router-dom";
import EmotionCamera from "@/components/EmotionCamera";
import EmotionChat from "@/components/EmotionChat";
import EmotionMetrics from "@/components/EmotionMetrics";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, Code2 } from "lucide-react";
import { useEmotionContext } from "@/contexts/EmotionContext";
import type { EmotionType } from "@/types/emotion";
import { useEmotionStream } from "@/domain/emotion/useEmotionStream";

const Index = () => {
  const { currentEmotion, setCurrentEmotion } = useEmotionContext();

  const { state: unifiedEmotionState } = useEmotionStream(currentEmotion, {
    faceStreamActive: true,
    enableStreaming: true,
    mode: "adaptive",
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all emotion classes
    root.classList.remove(
      "emotion-happy",
      "emotion-sad",
      "emotion-angry",
      "emotion-surprised",
      "emotion-fear",
      "emotion-disgust",
      "emotion-neutral"
    );
    
    // Add current emotion class
    root.classList.add(`emotion-${currentEmotion}`);
  }, [currentEmotion]);

  const handleEmotionDetected = (emotion: EmotionType) => {
    setCurrentEmotion(emotion);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 emotion-transition">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block px-6 py-3 rounded-full emotion-gradient-bg emotion-transition">
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Emotion-Aware Experience
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            An adaptive interface that responds to your emotions in real-time through facial recognition and text analysis
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <div className="p-4 bg-card rounded-lg inline-block emotion-card">
              <p className="text-sm font-medium">
                Current Emotion: <span className="text-2xl font-bold capitalize ml-2">{currentEmotion}</span>
              </p>
            </div>
            <Button asChild size="lg" className="emotion-transition">
              <Link to="/learn" className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Learn & Quiz
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="emotion-transition">
              <Link to="/coding" className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Coding Test
              </Link>
            </Button>
          </div>
        </div>

        {/* Emotion Metrics Dashboard */}
        <Card className="p-6 emotion-card emotion-transition">
          <EmotionMetrics
            emotionState={unifiedEmotionState}
            currentEmotion={currentEmotion}
            showSuggestion={false}
          />
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EmotionCamera onEmotionDetected={handleEmotionDetected} />
          <EmotionChat onEmotionDetected={handleEmotionDetected} />
        </div>

        {/* Info Footer */}
        <div className="mt-8 p-6 bg-card rounded-lg emotion-card text-center">
          <h3 className="text-lg font-semibold mb-2">How it works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm text-muted-foreground">
            <div>
              <span className="font-semibold text-foreground">Camera Detection</span>
              <p className="mt-1">AI analyzes your facial expressions in real-time</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Text Analysis</span>
              <p className="mt-1">Messages are analyzed for emotional sentiment</p>
            </div>
            <div>
              <span className="font-semibold text-foreground">Adaptive UI</span>
              <p className="mt-1">Interface changes color and mood based on detected emotions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
