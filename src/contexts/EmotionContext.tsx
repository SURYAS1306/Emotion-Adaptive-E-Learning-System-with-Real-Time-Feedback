import { createContext, useContext, useState, useMemo, type ReactNode } from "react";
import type { EmotionType, UnifiedEmotionState } from "@/types/emotion";

interface EmotionContextType {
  currentEmotion: EmotionType;
  setCurrentEmotion: (emotion: EmotionType) => void;
  /** Fallback emotion state for pages without live camera (e.g. Learning page) */
  emotionState: UnifiedEmotionState;
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

function deriveEmotionState(emotion: EmotionType): UnifiedEmotionState {
  const now = Date.now();
  const frustrated = ["angry", "sad", "fear"].includes(emotion);
  const bored = emotion === "neutral";
  const engaged = ["happy", "surprised"].includes(emotion);
  return {
    emotion,
    attention: engaged ? 0.8 : frustrated ? 0.4 : bored ? 0.5 : 0.6,
    engagement: engaged ? 0.85 : frustrated ? 0.3 : bored ? 0.45 : 0.6,
    frustration: frustrated ? 0.7 : 0.2,
    boredom: bored ? 0.6 : 0.2,
    cognitive_load: frustrated ? "high" : "medium",
    confidence: 0.7,
    source: "fusion",
    timestamp: now,
  };
}

export function EmotionProvider({ children }: { children: ReactNode }) {
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>("neutral");
  const emotionState = useMemo(
    () => deriveEmotionState(currentEmotion),
    [currentEmotion]
  );
  const value = useMemo(
    () => ({ currentEmotion, setCurrentEmotion, emotionState }),
    [currentEmotion, emotionState]
  );
  return (
    <EmotionContext.Provider value={value}>{children}</EmotionContext.Provider>
  );
}

export function useEmotionContext() {
  const ctx = useContext(EmotionContext);
  if (!ctx) {
    throw new Error("useEmotionContext must be used within EmotionProvider");
  }
  return ctx;
}
