import { EmotionType, UnifiedEmotionState } from "@/types/emotion";

/**
 * Heuristic mapping from a discrete emotion + simple context into a richer
 * UnifiedEmotionState. This is intentionally simple and explainable for
 * final-year research and can be refined/validated experimentally.
 */
export function computeUnifiedEmotionState(params: {
  emotion: EmotionType;
  lastState?: UnifiedEmotionState;
  source?: UnifiedEmotionState["source"];
  /**
   * Whether the face stream is currently active (camera on & visible face).
   * This is used as a proxy for attention when we don't yet have full gaze tracking.
   */
  faceStreamActive?: boolean;
}): UnifiedEmotionState {
  const {
    emotion,
    lastState,
    source = "fusion",
    faceStreamActive = true,
  } = params;

  const now = Date.now();

  // Base attention heuristic
  let attention = faceStreamActive ? 0.75 : 0.35;

  // Emotion-specific adjustments
  let frustration = 0.1;
  let boredom = 0.1;
  let engagement = 0.6;

  switch (emotion) {
    case "happy":
      engagement = 0.8;
      frustration = 0.1;
      boredom = 0.1;
      break;
    case "surprised":
      engagement = 0.9;
      frustration = 0.15;
      boredom = 0.05;
      break;
    case "sad":
      engagement = 0.45;
      frustration = 0.5;
      boredom = 0.2;
      attention -= 0.05;
      break;
    case "angry":
      engagement = 0.55;
      frustration = 0.7;
      boredom = 0.15;
      attention -= 0.1;
      break;
    case "fear":
      engagement = 0.65;
      frustration = 0.6;
      boredom = 0.1;
      attention += 0.05;
      break;
    case "disgust":
      engagement = 0.4;
      frustration = 0.65;
      boredom = 0.25;
      attention -= 0.05;
      break;
    case "neutral":
    default:
      // If neutral for a prolonged period, treat as boredom.
      if (lastState && lastState.emotion === "neutral") {
        const dtSec = (now - lastState.timestamp) / 1000;
        boredom = Math.min(0.1 + dtSec / 60, 0.8);
        engagement = Math.max(0.5 - dtSec / 120, 0.3);
      } else {
        boredom = 0.2;
        engagement = 0.55;
      }
      frustration = 0.1;
      break;
  }

  attention = clamp(attention, 0, 1);
  engagement = clamp(engagement, 0, 1);
  frustration = clamp(frustration, 0, 1);
  boredom = clamp(boredom, 0, 1);

  // Cognitive load heuristic: medium by default, high if both engagement and frustration are high.
  let cognitive_load: UnifiedEmotionState["cognitive_load"] = "medium";
  if (engagement > 0.7 && frustration > 0.5) {
    cognitive_load = "high";
  } else if (engagement < 0.4 && boredom > 0.5) {
    cognitive_load = "low";
  }

  // Confidence can be tuned later when we have model probabilities.
  const confidence = 0.85;

  return {
    emotion,
    attention,
    engagement,
    frustration,
    boredom,
    cognitive_load,
    confidence,
    source,
    timestamp: now,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

