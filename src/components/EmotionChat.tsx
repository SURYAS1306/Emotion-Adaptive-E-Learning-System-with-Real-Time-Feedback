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

    // GPT API Integration using OpenRouter with free model fallback
    // Try free model first, then fallback to paid model
    const API_KEY = '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';
    const API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Free models to try (no credits required)
    const freeModels = [
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemini-flash-1.5:free',
      'microsoft/phi-3-mini-128k-instruct:free',
    ];
    
    // Fallback to paid model if free models don't work
    const paidModel = 'openai/gpt-3.5-turbo';
    
    const modelsToTry = [...freeModels, paidModel];
    let apiSuccess = false;

    try {
      for (const model of modelsToTry) {
      try {
        const response = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`,
            'HTTP-Referer': window.location.origin || 'https://face-mood-chat.com',
            'X-Title': 'Face Mood Chat',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'system',
                content: `You are a helpful and empathetic assistant. The user is currently feeling ${userEmotion}. Respond in a supportive and understanding manner. Keep your response concise (2-3 sentences).`,
              },
              {
                role: 'user',
                content: inputText,
              },
            ],
            max_tokens: 150,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          // If it's a 402 (payment required) and we're trying a free model, skip to next model
          if (response.status === 402 && freeModels.includes(model)) {
            console.log(`Model ${model} requires payment, trying next model...`);
            continue;
          }
          
          let errorMessage = `Error ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.error?.message || errorData.message || errorMessage;
            console.error('API Error Details:', errorData);
          } catch (e) {
            const textError = await response.text();
            console.error('API Error Response:', textError);
          }
          
          // If it's the last model, throw the error
          if (model === modelsToTry[modelsToTry.length - 1]) {
            if (response.status === 401) {
              throw new Error('API key is invalid or expired. Please check your API key.');
            } else if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please try again later.');
            } else if (response.status === 402) {
              throw new Error('Insufficient credits. Please add credits to your account.');
            } else {
              throw new Error(`API error: ${errorMessage}`);
            }
          }
          
          // Otherwise, try next model
          continue;
        }

        const data = await response.json();
        
        // Handle different response structures
        let aiResponse = '';
        if (data.choices && data.choices[0]?.message?.content) {
          aiResponse = data.choices[0].message.content;
        } else if (data.message?.content) {
          aiResponse = data.message.content;
        } else if (typeof data === 'string') {
          aiResponse = data;
        } else {
          console.warn('Unexpected API response structure:', data);
          aiResponse = `I understand you're feeling ${userEmotion}. How can I help you today?`;
        }

        // Success! Use this response
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: aiResponse.trim() || `I understand you're feeling ${userEmotion}. How can I help you?`,
          emotion: 'neutral',
          isUser: false,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
        apiSuccess = true;
        return; // Exit successfully
        
      } catch (error) {
        // Try next model
        console.log(`Error with model ${model}, trying next...`, error);
        if (model === modelsToTry[modelsToTry.length - 1]) {
          // Last model failed, will use fallback
          break;
        }
        continue;
      }
    }
    
      // If we get here, all API models failed - use fallback response
      if (!apiSuccess) {
        // Fallback: Generate a contextual response based on emotion
        const fallbackResponses: Record<EmotionType, string[]> = {
      happy: [
        "I'm so glad you're feeling happy! What's making you smile today?",
        "That's wonderful! It's great to see you in such a positive mood!",
        "Your happiness is contagious! I'd love to hear more about what's bringing you joy."
      ],
      sad: [
        "I'm sorry you're feeling down. Would you like to talk about what's bothering you?",
        "I understand this is a difficult time. Remember, it's okay to feel sad sometimes.",
        "I'm here for you. Sometimes sharing what's on your mind can help."
      ],
      angry: [
        "I can sense you're feeling frustrated. Let's take a moment to breathe.",
        "It sounds like something is really bothering you. Would it help to talk about it?",
        "I understand you're upset. Sometimes expressing what's making you angry can help."
      ],
      surprised: [
        "Wow, something unexpected happened! I'd love to hear more about it.",
        "That sounds surprising! What caught you off guard?",
        "Something amazing must have happened! Tell me more!"
      ],
      fear: [
        "I sense you might be feeling anxious or worried. What's on your mind?",
        "It's okay to feel scared sometimes. Would you like to talk about what's worrying you?",
        "I'm here to listen. Sometimes talking about our fears can help us feel better."
      ],
      disgust: [
        "I understand something doesn't feel right. What's bothering you?",
        "It sounds like something is really unpleasant. Would you like to talk about it?",
        "I'm here to help. Sometimes expressing what we find distasteful can help."
      ],
      neutral: [
        "I'm here to chat with you. How can I help you today?",
        "What's on your mind? I'm listening.",
        "I'm ready to talk. What would you like to discuss?"
      ]
    };
    
        const responses = fallbackResponses[userEmotion] || fallbackResponses.neutral;
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: randomResponse,
          emotion: 'neutral',
          isUser: false,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Error calling GPT API:', error);
      
      // More user-friendly error messages
      let errorText = '';
      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorText = 'Network error. Please check your internet connection.';
      } else if (error instanceof Error) {
        errorText = error.message;
      } else {
        errorText = 'Unable to connect to the AI service.';
      }
      
      // Show specific error messages for known issues
      let displayMessage = '';
      if (errorText.includes('API key') || errorText.includes('invalid') || errorText.includes('expired')) {
        displayMessage = `I understand you're feeling ${userEmotion}. There's an issue with the API key - please check your OpenRouter account.`;
      } else if (errorText.includes('credits') || errorText.includes('Insufficient')) {
        displayMessage = `I understand you're feeling ${userEmotion}. Your OpenRouter account needs more credits. Please add credits to continue.`;
      } else if (errorText.includes('Rate limit') || errorText.includes('429')) {
        displayMessage = `I understand you're feeling ${userEmotion}. Too many requests - please try again in a moment.`;
      } else if (errorText.includes('Network error')) {
        displayMessage = `I understand you're feeling ${userEmotion}. Network connection issue - please check your internet.`;
      } else {
        displayMessage = `I understand you're feeling ${userEmotion}. I'm having trouble connecting right now, but I'm here to help.`;
      }
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: displayMessage,
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
