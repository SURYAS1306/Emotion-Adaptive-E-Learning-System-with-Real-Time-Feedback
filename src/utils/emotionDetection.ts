import Sentiment from "sentiment";
import type { EmotionType } from "@/types/emotion";

// face-api.js is loaded via CDN in index.html and exposed as window.faceapi
// We only use the types from the npm package; the runtime comes from the CDN bundle.
import type * as FaceApiTypes from "face-api.js";

declare global {
  interface Window {
    faceapi: typeof FaceApiTypes;
  }
}

const faceapi = window.faceapi;

const sentiment = new Sentiment();

let modelsLoaded = false;
let loadedFrom: string | null = null;

export async function loadFaceDetectionModels() {
  if (modelsLoaded) return;
  
  try {
    /**
     * IMPORTANT:
     * This project uses `face-api.js` (not the vladmandic fork). The recommended
     * weights are the official face-api.js weights placed under `/public/models`.
     *
     * By default we load from `/models` (served by Vite from `/public/models`).
     * You can override using Vite env: `VITE_FACEAPI_MODEL_URL`.
     */
    const localUrl =
      (import.meta.env.VITE_FACEAPI_MODEL_URL as string | undefined) ?? "/models";

    const tryLoad = async (url: string) => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(url),
        faceapi.nets.faceExpressionNet.loadFromUri(url),
      ]);
      loadedFrom = url;
    };

    try {
      await tryLoad(localUrl);
    } catch (localError) {
      // Fallback to official weights from GitHub (useful if models aren't downloaded yet).
      // Prefer local models for performance + offline-friendly demos.
      const fallbackUrl =
        "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";
      await tryLoad(fallbackUrl);
      // eslint-disable-next-line no-console
      console.warn(
        "Loaded face-api.js models from fallback URL. For best results, download weights into /public/models.",
        { localUrl, fallbackUrl, localError }
      );
    }

    // Small delay to ensure TensorFlow backend is fully initialized
    await new Promise((resolve) => setTimeout(resolve, 100));

    modelsLoaded = true;
    // eslint-disable-next-line no-console
    console.log("Face detection models loaded successfully", { loadedFrom });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error loading face detection models:", error);
    throw error;
  }
}

export async function detectFaceEmotion(videoElement: HTMLVideoElement): Promise<EmotionType> {
  const detailed = await detectFaceEmotionDetailed(videoElement);
  return detailed.emotion;
}

export async function detectFaceEmotionDetailed(
  videoElement: HTMLVideoElement,
  options?: {
    /** TinyFaceDetector input size (higher = more accurate, slower) */
    inputSize?: number;
    /** Minimum face score threshold */
    scoreThreshold?: number;
    /** If dominant expression confidence is below this, return neutral */
    emotionThreshold?: number;
  }
): Promise<{
  emotion: EmotionType;
  /** Dominant expression confidence (0..1) */
  confidence: number;
  /** Face detection confidence (0..1) */
  faceScore: number;
  /** Whether a face was detected in the frame */
  faceDetected: boolean;
  /** Raw expression probabilities (debug / research) */
  expressions?: Record<string, number>;
}> {
  try {
    const inputSize = options?.inputSize ?? 224;
    const scoreThreshold = options?.scoreThreshold ?? 0.4;
    const emotionThreshold = options?.emotionThreshold ?? 0.45;

    // Guard: if video isn't ready, avoid false "neutral".
    if (videoElement.readyState < 2 || videoElement.videoWidth === 0) {
      return {
        emotion: "neutral",
        confidence: 0,
        faceScore: 0,
        faceDetected: false,
      };
    }

    const detection = await faceapi
      .detectSingleFace(
        videoElement,
        new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
      )
      .withFaceExpressions();

    if (!detection) {
      return {
        emotion: "neutral",
        confidence: 0,
        faceScore: 0,
        faceDetected: false,
      };
    }

    const expressions = detection.expressions;
    const emotions: Array<{ emotion: EmotionType; score: number }> = [
      { emotion: "happy", score: expressions.happy },
      { emotion: "sad", score: expressions.sad },
      { emotion: "angry", score: expressions.angry },
      { emotion: "surprised", score: expressions.surprised },
      { emotion: "fear", score: expressions.fearful },
      { emotion: "disgust", score: expressions.disgusted },
      { emotion: "neutral", score: expressions.neutral },
    ];

    const dominantEmotion = emotions.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    const faceScore = detection.detection?.score ?? 0;

    // If expression confidence is too low, classify as neutral to reduce noise.
    if (dominantEmotion.score < emotionThreshold) {
      return {
        emotion: "neutral",
        confidence: dominantEmotion.score,
        faceScore,
        faceDetected: true,
        expressions: expressions as unknown as Record<string, number>,
      };
    }

    return {
      emotion: dominantEmotion.emotion,
      confidence: dominantEmotion.score,
      faceScore,
      faceDetected: true,
      expressions: expressions as unknown as Record<string, number>,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error detecting face emotion:", error);
    return {
      emotion: "neutral",
      confidence: 0,
      faceScore: 0,
      faceDetected: false,
    };
  }
}

export function detectTextEmotion(text: string): EmotionType {
  if (!text || text.trim().length === 0) return "neutral";
  
  const lowerText = text.toLowerCase();
  
  // Emotion keyword lists
  const happyKeywords = [
    'happy', 'joy', 'joyful', 'excited', 'excitement', 'great', 'wonderful', 'awesome', 
    'amazing', 'fantastic', 'excellent', 'love', 'loving', 'loved', 'like', 'liked',
    'good', 'great', 'nice', 'fun', 'funny', 'laugh', 'laughing', 'smile', 'smiling',
    'cheerful', 'glad', 'pleased', 'delighted', 'thrilled', 'haha', 'hahaha', 'yay', 
    'yeah', 'yes', 'yea', 'cool', 'awesome', 'perfect', 'best', 'favorite', 'favourite'
  ];
  
  const sadKeywords = [
    'sad', 'sadness', 'unhappy', 'depressed', 'depression', 'down', 'upset', 'crying',
    'cry', 'tears', 'tearful', 'lonely', 'loneliness', 'miss', 'missing', 'sorry',
    'apologize', 'apology', 'disappointed', 'disappointment', 'hurt', 'hurting',
    'pain', 'painful', 'broken', 'heartbroken', 'sorrow', 'sorrowful', 'grief', 'grieving'
  ];
  
  const angryKeywords = [
    'angry', 'anger', 'mad', 'annoyed', 'annoying', 'frustrated', 'frustration',
    'furious', 'rage', 'raging', 'hate', 'hated', 'hating', 'hateful', 'disgusted',
    'disgusting', 'disgust', 'irritated', 'irritating', 'pissed', 'pissed off',
    'outraged', 'fuming', 'livid', 'enraged', 'hostile', 'aggressive', 'aggression'
  ];
  
  const surprisedKeywords = [
    'surprised', 'surprise', 'shocked', 'shocking', 'wow', 'whoa', 'amazing',
    'unexpected', 'unbelievable', 'incredible', 'astonished', 'astonishing',
    'stunned', 'stunning', 'speechless', 'omg', 'oh my god', 'what', 'really'
  ];
  
  const fearKeywords = [
    'fear', 'afraid', 'scared', 'scary', 'frightened', 'terrified', 'terrifying',
    'worried', 'worry', 'worries', 'anxious', 'anxiety', 'nervous', 'nervousness',
    'panic', 'panicking', 'panicked', 'horror', 'horrified', 'dread', 'dreadful',
    'threat', 'threatening', 'danger', 'dangerous', 'unsafe', 'unsure', 'uncertain'
  ];
  
  const disgustKeywords = [
    'disgust', 'disgusted', 'disgusting', 'gross', 'grossed', 'eww', 'ew', 'yuck',
    'yucky', 'nasty', 'nauseating', 'nauseous', 'revolting', 'repulsive', 'repulsed',
    'sickening', 'sick', 'vile', 'vomit', 'puke', 'ugh', 'blech', 'ick'
  ];
  
  // Check for emotion keywords first (more reliable)
  // Count matches for each emotion
  const emotionScores = {
    happy: happyKeywords.filter(kw => lowerText.includes(kw)).length,
    sad: sadKeywords.filter(kw => lowerText.includes(kw)).length,
    angry: angryKeywords.filter(kw => lowerText.includes(kw)).length,
    surprised: surprisedKeywords.filter(kw => lowerText.includes(kw)).length,
    fear: fearKeywords.filter(kw => lowerText.includes(kw)).length,
    disgust: disgustKeywords.filter(kw => lowerText.includes(kw)).length,
    neutral: 0
  };
  
  // Find emotion with highest keyword match count
  const maxKeywordMatches = Math.max(...Object.values(emotionScores));
  
  if (maxKeywordMatches > 0) {
    const detectedEmotion = Object.entries(emotionScores).find(
      ([_, count]) => count === maxKeywordMatches
    )?.[0] as EmotionType;
    
    if (detectedEmotion && detectedEmotion !== "neutral") {
      return detectedEmotion;
    }
  }
  
  // If no keywords match, use sentiment analysis with lower thresholds
  const result = sentiment.analyze(text);
  const score = result.score;
  
  // More sensitive thresholds
  if (score >= 1) return "happy";
  if (score <= -2) return "angry";
  if (score <= -1) return "sad";
  if (score === 0 && result.words.length === 0) return "neutral";
  
  // Check for positive/negative words in sentiment analysis
  if (result.positive.length > result.negative.length) return "happy";
  if (result.negative.length > result.positive.length) return "sad";
  
  return "neutral";
}
