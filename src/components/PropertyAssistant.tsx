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
  issueType: string;
  description?: string;
  isUrgent: boolean;
}

interface SessionData {
  tenantName?: string;
  unitNumber?: string;
  contactInfo?: string;
}

const FAQ_RESPONSES = {
  'pay rent': 'Rent can be paid online at [insert payment URL] or dropped off at the leasing office.',
  'pet policy': 'We allow pets with approval. Please check your lease or contact us for details.',
  'emergency maintenance': 'Emergencies include leaks, no heat, flooding, fire hazards, and broken locks. For urgent issues, call [emergency phone number].',
  'office hours': 'Office hours are Monday–Friday, 9am–5pm.',
};

const MAINTENANCE_ISSUE_TYPES = ['Leak', 'No heat', 'Broken appliance', 'Other'];

type FlowType = 'welcome' | 'maintenance' | 'faq' | 'completed' | 'end_conversation';
type MaintenanceStep = 'name' | 'unit' | 'contact' | 'issue_type' | 'description' | 'urgency' | 'confirmation';

export function PropertyAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<FlowType>('welcome');
  const [maintenanceData, setMaintenanceData] = useState<Partial<MaintenanceRequest>>({});
  const [currentStep, setCurrentStep] = useState<MaintenanceStep>('name');
  const [sessionData, setSessionData] = useState<SessionData>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Welcome message with options
    addAssistantMessage(
      "Hi! I'm here to help with your property needs. What would you like to do today?",
      true,
      ['Report Maintenance Issue', 'Ask a Question']
    );
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
    
    if (input.includes('pay rent') || (input.includes('pay') && input.includes('rent'))) {
      return FAQ_RESPONSES['pay rent'];
    }
    if (input.includes('pet policy') || input.includes('pet')) {
      return FAQ_RESPONSES['pet policy'];
    }
    if (input.includes('emergency maintenance') || input.includes('emergency')) {
      return FAQ_RESPONSES['emergency maintenance'];
    }
    if (input.includes('office hours') || (input.includes('office') && input.includes('hours'))) {
      return FAQ_RESPONSES['office hours'];
    }
    
    return null;
  };

  const generateMaintenanceEmail = (request: MaintenanceRequest): string => {
    const urgencyLabel = request.isUrgent ? 'Urgent' : 'Non-urgent';
    return `
Subject: [${urgencyLabel.toUpperCase()}] Maintenance Request from ${request.tenantName}

Tenant name: ${request.tenantName}
Unit/address: ${request.unitNumber}
Contact info: ${request.contactInfo}
Issue type: ${request.issueType}
${request.description ? `Description: ${request.description}` : ''}
Urgent/Non-urgent flag: ${urgencyLabel}

Submitted via Property Assistant on ${new Date().toLocaleString()}
    `.trim();
  };

  const startMaintenanceFlow = () => {
    setCurrentFlow('maintenance');
    
    // Check if we have session data to reuse
    if (sessionData.tenantName && sessionData.unitNumber && sessionData.contactInfo) {
      setMaintenanceData({
        tenantName: sessionData.tenantName,
        unitNumber: sessionData.unitNumber,
        contactInfo: sessionData.contactInfo
      });
      setCurrentStep('issue_type');
      addAssistantMessage(
        "Select the type of issue you're reporting:",
        true,
        MAINTENANCE_ISSUE_TYPES
      );
    } else {
      setCurrentStep('name');
      addAssistantMessage("Great — can I have your name?");
    }
  };

  const handleMaintenanceFlow = (userInput: string) => {
    switch (currentStep) {
      case 'name':
        setMaintenanceData(prev => ({ ...prev, tenantName: userInput }));
        setSessionData(prev => ({ ...prev, tenantName: userInput }));
        setCurrentStep('unit');
        addAssistantMessage("What's your unit number or property address?");
        break;
      
      case 'unit':
        setMaintenanceData(prev => ({ ...prev, unitNumber: userInput }));
        setSessionData(prev => ({ ...prev, unitNumber: userInput }));
        setCurrentStep('contact');
        addAssistantMessage("What's the best phone number or email to reach you?");
        break;
      
      case 'contact':
        setMaintenanceData(prev => ({ ...prev, contactInfo: userInput }));
        setSessionData(prev => ({ ...prev, contactInfo: userInput }));
        setCurrentStep('issue_type');
        addAssistantMessage(
          "Select the type of issue you're reporting:",
          true,
          MAINTENANCE_ISSUE_TYPES
        );
        break;
      
      case 'issue_type':
        if (userInput === 'Other') {
          setMaintenanceData(prev => ({ ...prev, issueType: userInput }));
          setCurrentStep('description');
          addAssistantMessage("Please describe the issue you're experiencing:");
        } else {
          setMaintenanceData(prev => ({ ...prev, issueType: userInput }));
          setCurrentStep('urgency');
          addAssistantMessage(
            "Would you consider this urgent?",
            true,
            ['Yes, it\'s urgent', 'No, it\'s routine']
          );
        }
        break;
      
      case 'description':
        setMaintenanceData(prev => ({ ...prev, description: userInput }));
        setCurrentStep('urgency');
        addAssistantMessage(
          "Would you consider this urgent?",
          true,
          ['Yes, it\'s urgent', 'No, it\'s routine']
        );
        break;
      
      case 'urgency':
        const isUrgent = userInput.toLowerCase().includes('urgent') || userInput.toLowerCase().includes('yes');
        const completedRequest: MaintenanceRequest = {
          ...maintenanceData,
          isUrgent
        } as MaintenanceRequest;

        const urgencyLabel = isUrgent ? 'Urgent' : 'Non-urgent';
        addAssistantMessage(
          `Thank you — your request has been logged and marked as ${urgencyLabel}. We'll review and follow up as soon as possible.`
        );
        
        // Generate and "send" email
        const emailContent = generateMaintenanceEmail(completedRequest);
        console.log('Generated maintenance email:', emailContent);
        
        toast({
          title: "Maintenance Request Submitted",
          description: `Your ${urgencyLabel.toLowerCase()} request has been forwarded to the property manager.`,
        });

        // Move to end conversation flow
        setTimeout(() => {
          setCurrentFlow('end_conversation');
          addAssistantMessage(
            "Do you need help with anything else?",
            true,
            ['Yes', 'No']
          );
        }, 2000);
        break;
    }
  };

  const handleFAQFlow = (userInput: string) => {
    const faqResponse = checkForFAQ(userInput);
    if (faqResponse) {
      addAssistantMessage(faqResponse);
    } else {
      addAssistantMessage("Thanks for your question! We'll forward this to the property manager and they will follow up with you shortly.");
    }
    
    setTimeout(() => {
      setCurrentFlow('end_conversation');
      addAssistantMessage(
        "Do you need help with anything else?",
        true,
        ['Yes', 'No']
      );
    }, 2000);
  };

  const handleEndConversation = (userInput: string) => {
    if (userInput.toLowerCase().includes('yes')) {
      setCurrentFlow('welcome');
      setMaintenanceData({});
      setCurrentStep('name');
      addAssistantMessage(
        "What would you like to do?",
        true,
        ['Report Maintenance Issue', 'Ask a Question']
      );
    } else {
      addAssistantMessage("Thanks for contacting us! Your request has been received. Have a great day.");
      setCurrentFlow('completed');
    }
  };

  const handleUserInput = (userInput: string) => {
    addMessage(userInput, 'user');

    switch (currentFlow) {
      case 'welcome':
        if (userInput.includes('Report Maintenance Issue')) {
          startMaintenanceFlow();
        } else if (userInput.includes('Ask a Question')) {
          setCurrentFlow('faq');
          addAssistantMessage("What question can I help you with?");
        }
        break;
      
      case 'maintenance':
        handleMaintenanceFlow(userInput);
        break;
      
      case 'faq':
        handleFAQFlow(userInput);
        break;
      
      case 'end_conversation':
        handleEndConversation(userInput);
        break;
      
      case 'completed':
        // Restart conversation
        setCurrentFlow('welcome');
        setMaintenanceData({});
        setCurrentStep('name');
        addAssistantMessage(
          "Hi! I'm here to help with your property needs. What would you like to do today?",
          true,
          ['Report Maintenance Issue', 'Ask a Question']
        );
        break;
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
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
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