import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { detectTextEmotion } from '@/utils/emotionDetection';
import type { ChatMessage, EmotionType } from '@/types/emotion';

interface EmotionChatProps {
  onEmotionDetected: (emotion: EmotionType) => void;
}

export default function EmotionChat({ onEmotionDetected }: EmotionChatProps) {
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

    // GPT API Integration using OpenRouter
    // IMPORTANT: Get your free API key from https://openrouter.ai/keys
    // Sign up for free account and create a new API key
    const API_KEY = '';
    const API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Try models in order - prioritize free and reliable models
    const modelsToTry = [
      'google/gemini-flash-1.5:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'openai/gpt-3.5-turbo',
      'anthropic/claude-3-haiku',
    ];

    try {
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}`);
          
          const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`,
              'HTTP-Referer': window.location.origin || '',
              'X-Title': 'Face Mood Chat',
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: 'system',
                  content: 'You are a helpful and knowledgeable assistant. Answer questions accurately and provide useful information. Be conversational and helpful.',
                },
                {
                  role: 'user',
                  content: inputText,
                },
              ],
              max_tokens: 500,
              temperature: 0.7,
            }),
          });

          console.log(`Response status: ${response.status}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
            console.error(`Model ${model} failed:`, errorMessage);
            
            // If it's a payment error for free model, try next
            if (response.status === 402 && model.includes(':free')) {
              console.log(`Free model requires payment, trying next...`);
              continue;
            }
            
            // If it's the last model, throw error
            if (model === modelsToTry[modelsToTry.length - 1]) {
              throw new Error(`All models failed. Last error: ${errorMessage}`);
            }
            
            // Try next model
            continue;
          }

          const data = await response.json();
          console.log('API Response:', data);
          
          // Extract response from different possible structures
          let aiResponse = '';
          if (data.choices?.[0]?.message?.content) {
            aiResponse = data.choices[0].message.content;
          } else if (data.message?.content) {
            aiResponse = data.message.content;
          } else if (data.content) {
            aiResponse = data.content;
          }

          if (!aiResponse || aiResponse.trim().length === 0) {
            console.warn('Empty response, trying next model...');
            continue;
          }

          // Success! Return the response
          console.log('✅ API Success:', aiResponse.substring(0, 100));
          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: aiResponse.trim(),
            emotion: 'neutral',
            isUser: false,
            timestamp: Date.now(),
          };
          setMessages(prev => [...prev, aiMessage]);
          return; // Success, exit
          
        } catch (error) {
          console.error(`Error with ${model}:`, error);
          
          // If last model, throw to outer catch
          if (model === modelsToTry[modelsToTry.length - 1]) {
            throw error;
          }
          // Otherwise continue to next model
          continue;
        }
      }
    
    } catch (error) {
      console.error('All API models failed:', error);
      
      // Show helpful error message to user
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let userMessage = '';
      
      if (errorMessage.includes('User not found') || errorMessage.includes('401') || errorMessage.includes('invalid')) {
        userMessage = `❌ Your API key is invalid or expired. 

To fix this:
1. Go to https://openrouter.ai/keys
2. Sign up for a free account (if you don't have one)
3. Create a new API key
4. Replace the API_KEY in src/components/EmotionChat.tsx (line 46)

You'll get $5 free credits when you sign up!`;
      } else if (errorMessage.includes('402') || errorMessage.includes('credits')) {
        userMessage = `❌ Your OpenRouter account has no credits. 

To fix this:
1. Go to https://openrouter.ai/credits
2. Add credits to your account
3. Or use free models that don't require credits`;
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        userMessage = `⏱️ Rate limit exceeded. Please wait a moment and try again.`;
      } else {
        userMessage = `❌ Connection error: ${errorMessage}

Please check:
- Your internet connection
- Your API key at https://openrouter.ai/keys
- Browser console (F12) for more details`;
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: userMessage,
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
    <Card className="flex flex-col h-[600px] emotion-card emotion-transition">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">Emotion-Aware Chat</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your messages are analyzed for emotional context
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
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
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 border-t">
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
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>AI Chat Integration:</strong> Powered by OpenRouter API with GPT models.
          </p>
        </div>
      </div>
    </Card>
  );
}
