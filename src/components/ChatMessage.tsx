import { Button } from '@/components/ui/button';
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
        <div className="flex justify-start animate-fade-in mb-3">
          <div className="max-w-sm space-y-2">
            {optionsData.options.map((option: string, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-start h-auto py-3 px-4 whitespace-normal rounded-full 
                         border-primary/20 bg-background hover:bg-primary hover:text-primary-foreground 
                         transition-all duration-200 shadow-sm hover:shadow-md font-medium"
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
      "flex animate-fade-in mb-3",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-3 shadow-sm",
        isUser 
          ? "bg-chat-user-bg text-chat-user-text rounded-[18px] rounded-br-md" 
          : "bg-chat-assistant-bg text-chat-assistant-text rounded-[18px] rounded-bl-md border border-border"
      )}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <span className={cn(
          "text-xs mt-2 block opacity-70",
          isUser ? "text-chat-user-text" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
}