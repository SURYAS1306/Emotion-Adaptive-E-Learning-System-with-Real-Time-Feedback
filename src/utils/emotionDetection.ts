import * as faceapi from 'face-api.js';
import Sentiment from 'sentiment';
import type { EmotionType } from '@/types/emotion';

const sentiment = new Sentiment();

let modelsLoaded = false;

export async function loadFaceDetectionModels() {
  if (modelsLoaded) return;
  
  try {
    // Using CDN for easy setup. For better performance, download models to /public/models/
    const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face detection models loaded successfully');
  } catch (error) {
    console.error('Error loading face detection models:', error);
    throw error;
  }
}

export async function detectFaceEmotion(videoElement: HTMLVideoElement): Promise<EmotionType> {
  try {
    const detection = await faceapi
      .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceExpressions();

    if (!detection) {
      return 'neutral';
    }

    const expressions = detection.expressions;
    const emotions: Array<{ emotion: EmotionType; score: number }> = [
      { emotion: 'happy', score: expressions.happy },
      { emotion: 'sad', score: expressions.sad },
      { emotion: 'angry', score: expressions.angry },
      { emotion: 'surprised', score: expressions.surprised },
      { emotion: 'fear', score: expressions.fearful },
      { emotion: 'disgust', score: expressions.disgusted },
      { emotion: 'neutral', score: expressions.neutral },
    ];

    const dominantEmotion = emotions.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    return dominantEmotion.emotion;
  } catch (error) {
    console.error('Error detecting face emotion:', error);
    return 'neutral';
  }
}

export function detectTextEmotion(text: string): EmotionType {
  const result = sentiment.analyze(text);
  const score = result.score;

  // Map sentiment score to emotions
  if (score >= 3) return 'happy';
  if (score <= -3) return 'sad';
  if (score <= -5) return 'angry';
  if (result.words.some((word: string) => 
    ['wow', 'amazing', 'surprised', 'shocked', 'unexpected'].includes(word.toLowerCase())
  )) return 'surprised';
  if (result.words.some((word: string) => 
    ['scared', 'afraid', 'terrified', 'fear', 'worried'].includes(word.toLowerCase())
  )) return 'fear';
  if (result.words.some((word: string) => 
    ['gross', 'disgusting', 'eww', 'yuck'].includes(word.toLowerCase())
  )) return 'disgust';

  return 'neutral';
}
