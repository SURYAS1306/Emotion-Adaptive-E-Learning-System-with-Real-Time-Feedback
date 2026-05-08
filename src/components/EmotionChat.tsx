import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { detectTextEmotion } from '@/utils/emotionDetection';
import type { ChatMessage, EmotionType } from '@/types/emotion';

interface EmotionChatProps {
  onEmotionDetected: (emotion: EmotionType) => void;
  /** Compact layout for sidebar/quiz embedding */
  compact?: boolean;
}

export default function EmotionChat({ onEmotionDetected, compact = false }: EmotionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isProcessing) return;

    const userEmotion = detectTextEmotion(inputText);
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      emotion: userEmotion,
      isUser: true,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    onEmotionDetected(userEmotion);
    setInputText('');
    setIsProcessing(true);

    try {
      const apiBase =
        (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          emotion: userEmotion,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data?.detail || `HTTP ${response.status}`;
        throw new Error(detail);
      }

      const aiReply = typeof data.reply === 'string' ? data.reply.trim() : '';
      if (!aiReply) {
        throw new Error('Received an empty response from the assistant.');
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiReply,
        emotion: 'neutral',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat request failed:', error);
      const rawErrorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorMessage = rawErrorMessage.includes('Failed to fetch')
        ? 'Unable to reach backend at http://localhost:8000. Check backend server/CORS and URL.'
        : rawErrorMessage;
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: `Sorry, I couldn't respond right now. ${errorMessage}`,
        emotion: 'neutral',
        isUser: false,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getEmotionColor = (emotion: EmotionType) => {
    const colors: Record<EmotionType, string> = {
      happy: 'bg-yellow-300 border-yellow-500',
      sad: 'bg-blue-300 border-blue-500',
      angry: 'bg-red-300 border-red-500',
      surprised: 'bg-purple-300 border-purple-500',
      fear: 'bg-indigo-300 border-indigo-500',
      disgust: 'bg-green-300 border-green-500',
      neutral: 'bg-gray-200 border-gray-400',
    };
    return colors[emotion] || colors.neutral;
  };

  return (
    <Card className={`flex flex-col emotion-card emotion-transition ${compact ? "h-[320px]" : "h-[600px]"}`}>
      <div className={compact ? "p-4 border-b" : "p-6 border-b"}>
        <h2 className={compact ? "text-lg font-bold" : "text-2xl font-bold"}>Emotion-Aware Chat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your messages are analyzed for emotional context
        </p>
      </div>

      <div className={`flex-1 overflow-y-auto space-y-4 ${compact ? "p-4" : "p-6"}`}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm mt-2">Your emotions will be detected from your messages</p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 border-2 emotion-transition ${
                message.isUser
                  ? `${getEmotionColor(message.emotion)} ml-auto`
                  : 'bg-card border-border'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p className="text-xs text-muted-foreground mt-2 capitalize">
                Emotion: {message.emotion}
              </p>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-card border-2 border-border rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">typing...</span>
                <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className={compact ? "p-4 border-t" : "p-6 border-t"}>
        <div className="flex space-x-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (emotion will be detected)"
            disabled={isProcessing}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isProcessing}
            size="icon"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {!compact && (
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>AI Chat Integration:</strong> Responses are served securely through the backend proxy.
          </p>
        </div>
        )}
      </div>
    </Card>
  );
}
