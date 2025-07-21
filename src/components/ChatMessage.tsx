import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
        <p className="text-sm">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};