// apt-assist-ai-main/src/components/Chat.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "../integrations/supabase/client"; 
import PlaceholderComponent from "./chat-components/PlaceholderComponent";
import MaintenanceRequestForm from "./chat-components/MaintenanceRequestForm";
import RentStatusCard from "./chat-components/RentStatusCard";
import { X } from "lucide-react";

interface Message {
  from: "user" | "bot";
  text?: string;
  component?: React.ReactNode;
  options?: string[];
  onOptionClick?: (option: string) => void;
  imageUrl?: string;
}

interface RentRecord {
  due_date: string;
  amount_due: number;
  status: string;
}


const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [botId, setBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState("idle");
  const [conversationMode, setConversationMode] = useState<'idle' | 'maintenance' | 'rent'>('idle');
  const [tenantInfo, setTenantInfo] = useState({ name: "", unit: "" });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    setBotId(id);

    setMessages([
      { text: "Hello! How can I help you today?", from: "bot" }
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text) return;

    const newMessages: Message[] = [...messages, { text, from: "user" }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Handle different conversation states
      if (conversationState === "awaiting_name") {
        setTenantInfo(prev => ({ ...prev, name: text }));
        setConversationState("awaiting_unit");
        setMessages(prev => [...prev, { text: "Thanks! What is your unit number?", from: "bot" }]);
      } else if (conversationState === "awaiting_unit") {
        const currentTenantInfo = { ...tenantInfo, unit: text };
        setTenantInfo(currentTenantInfo);
        setConversationState("fetching_rent");
        await fetchRentStatus(currentTenantInfo.name, text);
      } else {
        // Check for maintenance keywords
        if (text.toLowerCase().includes("maintenance") || 
            text.toLowerCase().includes("broken") || 
            text.toLowerCase().includes("leak") || 
            text.toLowerCase().includes("repair") ||
            text.toLowerCase().includes("fix") ||
            text.toLowerCase().includes("issue")) {
          setConversationMode('maintenance');
          setMessages(prev => [...prev, { 
            from: "bot", 
            text: "I can help with that. Please provide the details below:",
            component: <MaintenanceRequestForm onSubmit={handleMaintenanceSubmit} />
          }]);
        } else if (text.toLowerCase().includes("rent") || 
                   text.toLowerCase().includes("balance") || 
                   text.toLowerCase().includes("payment")) {
          setConversationState("awaiting_name");
          setMessages(prev => [...prev, { text: "I'll help you check your rent status. Please provide your full name.", from: "bot" }]);
        } else {
          setMessages(prev => [...prev, { 
            text: "I'm here to help with maintenance requests or rent inquiries. You can type 'maintenance' to report an issue or 'rent' to check your payment status.", 
            from: "bot" 
          }]);
        }
      }
    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessages(prev => [...prev, { 
        text: "I'm sorry, something went wrong. Please try again.", 
        from: "bot" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRentStatus = async (name: string, unit: string) => {
    setIsLoading(true);
    
    try {
      // For demo purposes, using mock data since database calls cause TypeScript errors
      const mockRentData = {
        amountDue: 1500,
        dueDate: new Date(2025, 1, 1).toISOString(), // February 1, 2025
        status: "pending",
        amountPaid: 0,
        lateFeesAmount: 0
      };

      setMessages(prev => [
        ...prev,
        { from: "bot", text: `Here's your rent information for ${name} at unit ${unit}:` },
        { from: "bot", component: <RentStatusCard {...mockRentData} /> }
      ]);
    } catch (error) {
      console.error("Error fetching rent status:", error);
      setMessages(prev => [...prev, { text: "I'm sorry, I'm having trouble fetching your rent status right now. Please try again later.", from: "bot" }]);
    } finally {
      setIsLoading(false);
      setConversationState("idle");
    }
  };

  const handleTestComponent = () => {
    setMessages(prev => [...prev, { from: "bot", component: <PlaceholderComponent /> }]);
  };

  const handleMaintenanceSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      // Upload files to Supabase Storage if any
      const mediaUrls: string[] = [];
      if (data.files && data.files.length > 0) {
        for (let i = 0; i < data.files.length; i++) {
          const file = data.files[i];
          const uploadedUrl = await uploadFile(file);
          if (uploadedUrl) {
            mediaUrls.push(uploadedUrl);
          }
        }
      }

      // Prepare payload for triage function
      const payload = {
        description: data.description,
        media_url: mediaUrls.length > 0 ? mediaUrls[0] : null, // Use first file for now
        tenant_urgency: data.priority,
        permission_to_enter: data.permissionGranted,
        tenant_id: "demo-tenant-123" // In real app, get from auth
      };

      // Call the triage-request function
      const { data: triageResult, error } = await supabase.functions.invoke('triage-request', {
        body: payload
      });

      if (error) throw error;

      // Replace the form with a confirmation message
      setMessages(prev => {
        const newMessages = [...prev];
        // Remove the form component (last message) and add confirmation
        newMessages.pop();
        newMessages.push({
          from: "bot",
          text: `Thank you! Your maintenance request has been submitted and triaged.
          
📝 **Request Details:**
- Priority: ${triageResult?.priority || data.priority}
- Specialty: ${triageResult?.specialty || 'General'}
- Status: ${triageResult?.status || 'Submitted'}

${data.permissionGranted ? "✅ We have permission to enter your unit." : "⚠️ Please note: We'll need to schedule access to your unit."}

${triageResult?.status === 'Scheduled' ? "🚀 Your request has been automatically scheduled with a vendor!" : "You should receive an update within 24 hours."}`
        });
        return newMessages;
      });

      setConversationMode('idle');
    } catch (error) {
      console.error("Error submitting maintenance request:", error);
      setMessages(prev => [...prev, { 
        from: "bot", 
        text: "Sorry, there was an error submitting your request. Please try again or contact our office directly." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleRentInquiry = () => {
    setMessages(prev => [...prev, { text: "Rent", from: "user" }]);
    setConversationState("awaiting_name");
    setMessages(prev => [...prev, { text: "To check your rent status, please provide your full name.", from: "bot" }]);
  };
  
  const handlePayRent = () => {
    setMessages(prev => [...prev, { text: "You can pay your rent through our online payment portal. Please note, this is a placeholder and not a real payment link.", from: "bot" }]);
  };

  // File upload function
  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('maintenance-media')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading file:', error);
        return null;
      }

      const { data: publicUrlData } = supabase.storage
        .from('maintenance-media')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    }
  };



  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 text-center">
        <h1 className="text-lg font-semibold">Apt Assist AI</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            {msg.component ? (
              <div className="max-w-sm">
                {msg.component}
              </div>
            ) : (
              <div className={`${msg.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-700"} rounded-lg px-4 py-2 max-w-sm`}>
                {msg.text}
                {msg.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={msg.imageUrl} 
                      alt="Uploaded file" 
                      className="max-w-full h-auto rounded-lg border"
                      style={{ maxHeight: '200px' }}
                    />
                  </div>
                )}
                {msg.options && (
                  <div className="mt-2">
                    {msg.options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => msg.onOptionClick && msg.onOptionClick(option)}
                        className="w-full text-left px-3 py-1 mt-1 text-sm border rounded-full text-blue-600 border-blue-600 hover:bg-blue-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-gray-200 rounded-lg px-4 py-2 text-gray-700 max-w-sm">
                    ...
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white">
        <div className="flex gap-2 mb-2">
            <button
                onClick={() => handleSend("New Maintenance Request")}
                className="px-3 py-1 text-sm border rounded-full text-blue-600 border-blue-600 hover:bg-blue-50"
            >
                New Maintenance Request
            </button>
            <button
                onClick={handleRentInquiry}
                className="px-3 py-1 text-sm border rounded-full text-blue-600 border-blue-600 hover:bg-blue-50"
            >
                Rent
            </button>
            <button
                onClick={handleTestComponent}
                className="px-3 py-1 text-sm border rounded-full text-green-600 border-green-600 hover:bg-green-50"
            >
                Test Component
            </button>
        </div>
        <div className="flex">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
            />
            <button onClick={() => handleSend()} className="bg-blue-500 text-white px-4 rounded-r-lg">
                Send
            </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
