
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  options?: string[];
}

interface ChatMessageProps {
  message: Message;
  onOptionClick: (option: string) => Promise<void>;
}

export const ChatMessage = ({ message, onOptionClick }: ChatMessageProps) => {
  return (
    <div className={cn(
      "flex mb-4",
      message.type === 'user' ? 'justify-end' : 'justify-start'
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2",
        message.type === 'user' 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-muted text-muted-foreground'
      )}>
        <p className="text-sm whitespace-pre-line">{message.content}</p>
        
        {/* Render options as buttons if they exist */}
        {message.options && message.options.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onOptionClick(option)}
                className="text-xs rounded-full border-border hover:bg-accent hover:text-accent-foreground"
              >
                {option}
              </Button>
            ))}
          </div>
        )}
        
        <span className="text-xs opacity-70 mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
