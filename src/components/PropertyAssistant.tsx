import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Building2, MessageCircle, Mic, MicOff } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useToast } from '@/hooks/use-toast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  options?: string[];
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

const MAINTENANCE_ISSUE_TYPES = [
  "Leak or water issue",
  "No heat or AC not working", 
  "Broken appliance",
  "Electrical problem",
  "Clogged sink or drain",
  "Broken lock or door issue",
  "Pest problem",
  "Smoke detector issue",
  "No hot water",
  "Other"
];

// Category-specific follow-up questions
const CATEGORY_FOLLOW_UPS: Record<string, string> = {
  "Leak or water issue": "Where is the leak happening (kitchen, bathroom, ceiling, etc.)? Is it minor or causing flooding?",
  "No heat or AC not working": "Is this affecting your entire unit or just one room?",
  "Broken appliance": "Which appliance is broken? (e.g. stove, fridge, washer)",
  "Electrical problem": "What electrical issue are you experiencing? (e.g. power out, light fixture not working, outlet issue)",
  "Clogged sink or drain": "Which sink or drain is clogged (kitchen, bathroom, shower)?",
  "Broken lock or door issue": "Which door or lock has the problem? Is it preventing you from securing your unit?",
  "Pest problem": "What kind of pest problem is this (e.g. rodents, roaches, ants)?",
  "Smoke detector issue": "Is the smoke detector beeping or malfunctioning? Please describe what's happening.",
  "No hot water": "Is this affecting all your faucets or just one area (kitchen, bathroom)?",
  "Other": "Please describe what's happening and where, so we can assist as quickly as possible."
};

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

  const { isListening, isSupported, startListening, stopListening } = useVoiceInput({
    onTranscript: (transcript) => {
      setInput(transcript);
    },
    onError: (error) => {
      toast({
        title: "Voice Input Error",
        description: "Unable to process voice input. Please try typing instead.",
        variant: "destructive",
      });
    }
  });

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
      ['Report Maintenance Issue', 'Ask a Question']
    );
  }, []);

  const addMessage = (content: string, type: 'user' | 'assistant', options?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addAssistantMessage = (content: string, options?: string[]) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      addMessage(content, 'assistant', options);
    }, 1000);
  };

  const sendMaintenanceEmail = async (request: MaintenanceRequest) => {
    try {
      const response = await supabase.functions.invoke('send-maintenance-email', {
        body: {
          tenantName: request.tenantName,
          unit: request.unitNumber,
          contactInfo: request.contactInfo,
          issueType: request.issueType,
          description: request.description,
          urgency: request.isUrgent ? "Yes, it's urgent" : "No, it's routine",
          recipientEmail: 'inder1297@gmail.com'
        }
      });

      if (response.error) {
        console.error('Error sending maintenance email:', response.error);
        toast({
          title: "Email Error",
          description: "Could not send email to property manager, but your request was logged.",
          variant: "destructive",
        });
      } else {
        console.log('Maintenance email sent successfully');
      }
    } catch (error) {
      console.error('Error sending maintenance email:', error);
    }
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
        "Thanks for letting me know!\n\nWhat kind of issue are you experiencing?\n\nYou can tap one of these common options or describe it in your own words:",
        MAINTENANCE_ISSUE_TYPES
      );
    } else {
      setCurrentStep('name');
      addAssistantMessage("Great — can I have your name?");
    }
  };

  const handleMaintenanceFlow = async (userInput: string) => {
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
          "Thanks for letting me know!\n\nWhat kind of issue are you experiencing?\n\nYou can tap one of these common options or describe it in your own words:",
          MAINTENANCE_ISSUE_TYPES
        );
        break;
      
      case 'issue_type':
        setMaintenanceData(prev => ({ ...prev, issueType: userInput }));
        setCurrentStep('description');
        
        // Get category-specific follow-up question
        const followUpQuestion = CATEGORY_FOLLOW_UPS[userInput];
        addAssistantMessage(followUpQuestion);
        break;
      
      case 'description':
        setMaintenanceData(prev => ({ ...prev, description: userInput }));
        setCurrentStep('urgency');
        addAssistantMessage(
          "Would you consider this urgent?",
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
        
        // Send email to property manager
        await sendMaintenanceEmail(completedRequest);
        
        addAssistantMessage(
          `Thank you! Your maintenance request has been submitted and sent to the property manager. Our team will contact you soon.`
        );
        
        toast({
          title: "Maintenance Request Submitted",
          description: `Your ${urgencyLabel.toLowerCase()} request has been forwarded to the property manager.`,
        });

        // Move to end conversation flow
        setTimeout(() => {
          setCurrentFlow('end_conversation');
          addAssistantMessage(
            "Do you need help with anything else?",
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
        ['Report Maintenance Issue', 'Ask a Question']
      );
    } else {
      addAssistantMessage("Thanks for contacting us! Your request has been received. Have a great day.");
      setCurrentFlow('completed');
    }
  };

  const handleUserInput = async (userInput: string) => {
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
        await handleMaintenanceFlow(userInput);
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
          ['Report Maintenance Issue', 'Ask a Question']
        );
        break;
    }
  };

  const handleOptionClick = async (option: string) => {
    await handleUserInput(option);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await handleUserInput(input);
      setInput('');
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center gap-3 shadow-sm">
        <div className="w-8 h-8 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-semibold text-lg">[Property Name] Assistant</h1>
          <p className="text-sm opacity-90">Here to help with your property needs</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ scrollBehavior: 'smooth' }}>
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onOptionClick={handleOptionClick}
            />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-muted-foreground mb-3 animate-fade-in">
              <div className="bg-chat-assistant-bg border border-border rounded-[18px] rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-sm">Assistant is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="pr-12 py-3 text-base rounded-full border-border bg-chat-input-bg 
                          focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={isListening}
              />
              {isSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full",
                    isListening ? "bg-red-100 text-red-600 hover:bg-red-200" : "hover:bg-muted"
                  )}
                  onClick={handleVoiceToggle}
                >
                  {isListening ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim()}
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
