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
  if (!text || text.trim().length === 0) return 'neutral';
  
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
    
    if (detectedEmotion && detectedEmotion !== 'neutral') {
      return detectedEmotion;
    }
  }
  
  // If no keywords match, use sentiment analysis with lower thresholds
  const result = sentiment.analyze(text);
  const score = result.score;
  
  // More sensitive thresholds
  if (score >= 1) return 'happy';
  if (score <= -2) return 'angry';
  if (score <= -1) return 'sad';
  if (score === 0 && result.words.length === 0) return 'neutral';
  
  // Check for positive/negative words in sentiment analysis
  if (result.positive.length > result.negative.length) return 'happy';
  if (result.negative.length > result.positive.length) return 'sad';
  
  return 'neutral';
}
