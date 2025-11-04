export type EmotionType = 
  | 'neutral'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'surprised'
  | 'fear'
  | 'disgust';

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
