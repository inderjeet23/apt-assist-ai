import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Building2, MessageCircle } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MaintenanceRequest {
  tenantName: string;
  unitNumber: string;
  contactInfo: string;
  description: string;
  isUrgent: boolean;
}

const FAQ_RESPONSES = {
  'pay rent': 'Rent can be paid online at [property manager URL] or dropped off at the leasing office during business hours.',
  'pet policy': 'We allow pets with approval. Please check your lease or contact us for any breed restrictions or fees.',
  'emergency maintenance': 'Emergencies include no heat, major leaks, flooding, broken locks, and fire hazards. For emergencies, please call [emergency phone number] immediately.',
  'office hours': 'Our office hours are Monday through Friday, 9am to 5pm.',
  'maintenance request': 'You can submit requests right here or through your tenant portal at [property manager portal URL].'
};

const URGENT_KEYWORDS = ['leak', 'flood', 'flooding', 'no heat', 'broken lock', 'fire', 'emergency', 'urgent', 'water damage', 'electrical'];

export function PropertyAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<'initial' | 'faq' | 'maintenance' | 'collecting_info'>('initial');
  const [maintenanceData, setMaintenanceData] = useState<Partial<MaintenanceRequest>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    addAssistantMessage("Hello! I'm here to help with your property management needs. How can I assist you today?", true, [
      'I have a question',
      'I need to report a maintenance issue'
    ]);
  }, []);

  const addMessage = (content: string, type: 'user' | 'assistant') => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addAssistantMessage = (content: string, showOptions = false, options: string[] = []) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(content, 'assistant');
      if (showOptions && options.length > 0) {
        // Add option buttons after a brief delay
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `options-${Date.now()}`,
            type: 'assistant',
            content: JSON.stringify({ type: 'options', options }),
            timestamp: new Date()
          }]);
        }, 500);
      }
    }, 1000);
  };

  const checkForFAQ = (userInput: string): string | null => {
    const input = userInput.toLowerCase();
    
    if (input.includes('pay') && input.includes('rent')) {
      return FAQ_RESPONSES['pay rent'];
    }
    if (input.includes('pet')) {
      return FAQ_RESPONSES['pet policy'];
    }
    if (input.includes('emergency') || input.includes('urgent')) {
      return FAQ_RESPONSES['emergency maintenance'];
    }
    if (input.includes('office') && input.includes('hours')) {
      return FAQ_RESPONSES['office hours'];
    }
    if (input.includes('maintenance') && input.includes('request')) {
      return FAQ_RESPONSES['maintenance request'];
    }
    
    return null;
  };

  const isUrgentMaintenance = (description: string): boolean => {
    const input = description.toLowerCase();
    return URGENT_KEYWORDS.some(keyword => input.includes(keyword));
  };

  const generateMaintenanceEmail = (request: MaintenanceRequest): string => {
    const urgencyLabel = request.isUrgent ? 'URGENT' : 'NON-URGENT';
    return `
Subject: [${urgencyLabel}] Maintenance Request from ${request.tenantName}

Tenant Name: ${request.tenantName}
Unit/Property: ${request.unitNumber}
Contact Information: ${request.contactInfo}
Priority: ${urgencyLabel}

Issue Description:
${request.description}

Submitted via Property Assistant on ${new Date().toLocaleString()}
    `.trim();
  };

  const handleMaintenanceFlow = (userInput: string) => {
    const steps = ['name', 'unit', 'contact', 'description'];
    const currentStepName = steps[currentStep];

    switch (currentStepName) {
      case 'name':
        setMaintenanceData(prev => ({ ...prev, tenantName: userInput }));
        addAssistantMessage("Thank you. What's your unit number or property address?");
        setCurrentStep(1);
        break;
      
      case 'unit':
        setMaintenanceData(prev => ({ ...prev, unitNumber: userInput }));
        addAssistantMessage("What's the best phone number or email to reach you?");
        setCurrentStep(2);
        break;
      
      case 'contact':
        setMaintenanceData(prev => ({ ...prev, contactInfo: userInput }));
        addAssistantMessage("Please describe what's happening and where the problem is located.");
        setCurrentStep(3);
        break;
      
      case 'description':
        const isUrgent = isUrgentMaintenance(userInput);
        const completedRequest: MaintenanceRequest = {
          ...maintenanceData,
          description: userInput,
          isUrgent
        } as MaintenanceRequest;

        setMaintenanceData(completedRequest);
        
        const responseMessage = isUrgent 
          ? "Thank you. We've flagged this as urgent and will escalate it right away."
          : "Thanks for letting us know. We'll review and follow up during normal business hours.";
        
        addAssistantMessage(responseMessage);
        
        // Generate and "send" email
        const emailContent = generateMaintenanceEmail(completedRequest);
        console.log('Generated maintenance email:', emailContent);
        
        toast({
          title: "Maintenance Request Submitted",
          description: `Your ${isUrgent ? 'urgent' : 'non-urgent'} request has been forwarded to the property manager.`,
        });

        // Reset flow
        setTimeout(() => {
          addAssistantMessage("Is there anything else I can help you with today?", true, [
            'I have another question',
            'I need to report another issue'
          ]);
          setCurrentFlow('initial');
          setCurrentStep(0);
          setMaintenanceData({});
        }, 2000);
        break;
    }
  };

  const handleUserInput = (userInput: string) => {
    addMessage(userInput, 'user');

    if (currentFlow === 'initial') {
      if (userInput.toLowerCase().includes('question')) {
        setCurrentFlow('faq');
        addAssistantMessage("What question can I help you with?");
      } else if (userInput.toLowerCase().includes('maintenance') || userInput.toLowerCase().includes('issue')) {
        setCurrentFlow('maintenance');
        setCurrentStep(0);
        addAssistantMessage("I'll help you report that maintenance issue. First, what's your full name?");
      } else {
        // Check if it's a direct FAQ question
        const faqResponse = checkForFAQ(userInput);
        if (faqResponse) {
          addAssistantMessage(faqResponse);
          setTimeout(() => {
            addAssistantMessage("Is there anything else I can help you with?", true, [
              'I have another question',
              'I need to report a maintenance issue'
            ]);
          }, 2000);
        } else {
          addAssistantMessage("Thanks for your question! We'll forward this to the property manager and they will follow up with you shortly.");
          setTimeout(() => {
            addAssistantMessage("Is there anything else I can help you with?", true, [
              'I have another question',
              'I need to report a maintenance issue'
            ]);
          }, 2000);
        }
      }
    } else if (currentFlow === 'faq') {
      const faqResponse = checkForFAQ(userInput);
      if (faqResponse) {
        addAssistantMessage(faqResponse);
      } else {
        addAssistantMessage("Thanks for your question! We'll forward this to the property manager and they will follow up with you shortly.");
      }
      
      setTimeout(() => {
        addAssistantMessage("Is there anything else I can help you with?", true, [
          'I have another question',
          'I need to report a maintenance issue'
        ]);
        setCurrentFlow('initial');
      }, 2000);
    } else if (currentFlow === 'maintenance') {
      handleMaintenanceFlow(userInput);
    }
  };

  const handleOptionClick = (option: string) => {
    handleUserInput(option);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleUserInput(input);
      setInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-property-blue text-white p-4 flex items-center gap-3">
        <Building2 className="h-6 w-6" />
        <div>
          <h1 className="font-semibold">Property Assistant</h1>
          <p className="text-sm opacity-90">Here to help with your property needs</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onOptionClick={handleOptionClick}
          />
        ))}
        {isTyping && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">Assistant is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="m-4 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  );
}