import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  onOptionClick?: (option: string) => void;
}

export function ChatMessage({ message, onOptionClick }: ChatMessageProps) {
  // Check if message content is options data
  const isOptionsMessage = message.content.startsWith('{"type":"options"');
  
  if (isOptionsMessage) {
    try {
      const optionsData = JSON.parse(message.content);
      return (
        <div className="flex justify-start animate-fade-in">
          <div className="max-w-xs space-y-2">
            {optionsData.options.map((option: string, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto py-3 px-4 whitespace-normal"
                onClick={() => onOptionClick?.(option)}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      );
    } catch {
      return null;
    }
  }

  const isUser = message.type === 'user';

  return (
    <div className={cn(
      "flex animate-fade-in",
      isUser ? "justify-end" : "justify-start"
    )}>
      <Card className={cn(
        "max-w-xs lg:max-w-md px-4 py-3",
        isUser 
          ? "bg-chat-user-bg text-chat-user-text border-transparent" 
          : "bg-chat-assistant-bg text-chat-assistant-text"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className={cn(
          "text-xs mt-2 block",
          isUser ? "text-chat-user-text/70" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </Card>
    </div>
  );
}