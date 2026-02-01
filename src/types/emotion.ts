export type EmotionType =
  | "neutral"
  | "happy"
  | "sad"
  | "angry"
  | "surprised"
  | "fear"
  | "disgust";

export interface EmotionDetection {
  emotion: EmotionType;
  confidence: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  emotion: EmotionType;
  isUser: boolean;
  timestamp: number;
}

/**
 * Unified emotion-cognitive state used across the platform.
 * This is the primary format exposed by the Emotion Intelligence Engine.
 */
export interface UnifiedEmotionState {
  /** Dominant categorical emotion */
  emotion: EmotionType;
  /** Visual attention in [0,1] (1 = fully focused on task) */
  attention: number;
  /** Overall engagement in [0,1] (1 = highly engaged) */
  engagement: number;
  /** Estimated frustration in [0,1] (1 = highly frustrated) */
  frustration: number;
  /** Estimated boredom in [0,1] (1 = very bored / disengaged) */
  boredom: number;
  /** Coarse cognitive load indicator */
  cognitive_load: "low" | "medium" | "high";
  /** Confidence in fused state in [0,1] */
  confidence: number;
  /** Source of the most recent update driving this state */
  source: "face" | "text" | "gaze" | "fusion";
  /** Unix timestamp in milliseconds */
  timestamp: number;
}

/**
 * Minimal payload used for streaming over WebSocket.
 * This mirrors UnifiedEmotionState but omits fields that can be re-derived server-side later.
 */
export interface EmotionStreamEvent extends UnifiedEmotionState {
  /** Anonymous session identifier used by backend for grouping events */
  session_id: string;
  /** Optional identifier for the current learning activity or question */
  context?: {
    activity_id?: string;
    question_id?: string;
    mode?: "static" | "adaptive";
  };
}
