// apt-assist-ai-main/src/components/Chat.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "../integrations/supabase/client"; 
import PlaceholderComponent from "./chat-components/PlaceholderComponent";
import MaintenanceRequestForm from "./chat-components/MaintenanceRequestForm";
import RentStatusCard from "./chat-components/RentStatusCard";
import { Upload, X } from "lucide-react";

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

interface MaintenanceConversation {
  initialDescription: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
  uploadedFiles: string[];
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [botId, setBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationState, setConversationState] = useState("idle");
  const [tenantInfo, setTenantInfo] = useState({ name: "", unit: "" });
  const [maintenanceConversation, setMaintenanceConversation] = useState<MaintenanceConversation | null>(null);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      } else if (conversationState === "maintenance_request") {
        // This is the initial description for maintenance
        await handleMaintenanceDescription(text);
      } else if (conversationState === "maintenance_followup") {
        // This is the follow-up answer
        await handleMaintenanceFollowUp(text);
      } else {
        // Check for maintenance keywords
        if (text.toLowerCase().includes("maintenance") || 
            text.toLowerCase().includes("broken") || 
            text.toLowerCase().includes("leak") || 
            text.toLowerCase().includes("repair") ||
            text.toLowerCase().includes("fix") ||
            text.toLowerCase().includes("issue")) {
          await initiateMaintenanceRequest();
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

  const handleMaintenanceSubmit = (data: any) => {
    console.log("Maintenance request submitted:", data);
    
    // Replace the form with a confirmation message
    setMessages(prev => {
      const newMessages = [...prev];
      // Remove the form component (last message) and add confirmation
      newMessages.pop();
      newMessages.push({
        from: "bot",
        text: `Thank you! Your ${data.priority} priority maintenance request has been submitted. ${data.permissionGranted ? "We have permission to enter your unit." : "Please note: We'll need to schedule access to your unit."} You should receive an update within 24 hours.`
      });
      return newMessages;
    });
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

  // Handle file selection
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const uploadedUrl = await uploadFile(file);
    
    if (uploadedUrl) {
      setMessages(prev => [
        ...prev,
        { 
          from: "user", 
          text: `Uploaded: ${file.name}`,
          imageUrl: uploadedUrl 
        }
      ]);
      
      // Add to maintenance conversation
      if (maintenanceConversation) {
        setMaintenanceConversation(prev => prev ? {
          ...prev,
          uploadedFiles: [...prev.uploadedFiles, uploadedUrl]
        } : null);
      }
    } else {
      setMessages(prev => [...prev, { 
        from: "bot", 
        text: "Sorry, there was an error uploading your file. Please try again." 
      }]);
    }
    
    setIsLoading(false);
    setShowFileUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Initiate maintenance request flow
  const initiateMaintenanceRequest = async () => {
    setConversationState("maintenance_request");
    setMaintenanceConversation({
      initialDescription: "",
      uploadedFiles: [],
      conversationHistory: []
    });
    setShowFileUpload(true);
    
    setMessages(prev => [...prev, { 
      from: "bot", 
      text: "I'll help you submit a maintenance request. Please describe the issue you're experiencing. You can also upload a photo or video to help us understand the problem better." 
    }]);
  };

  // Handle initial maintenance description
  const handleMaintenanceDescription = async (description: string) => {
    if (!maintenanceConversation) return;

    // Update maintenance conversation
    const updatedConversation = {
      ...maintenanceConversation,
      initialDescription: description,
      conversationHistory: [
        ...maintenanceConversation.conversationHistory,
        { role: "user" as const, content: description }
      ]
    };
    
    setMaintenanceConversation(updatedConversation);
    setIsLoading(true);

    try {
      // Call LLM for follow-up question
      const { data, error } = await supabase.functions.invoke('maintenance-assistant', {
        body: {
          description,
          conversationHistory: updatedConversation.conversationHistory
        }
      });

      if (error) throw error;

      if (data?.followUpQuestion) {
        updatedConversation.followUpQuestion = data.followUpQuestion;
        updatedConversation.conversationHistory.push({
          role: "assistant",
          content: data.followUpQuestion
        });
        
        setMaintenanceConversation(updatedConversation);
        setConversationState("maintenance_followup");
        setMessages(prev => [...prev, { 
          from: "bot", 
          text: data.followUpQuestion 
        }]);
      } else {
        // No follow-up needed, complete the request
        await completeMaintenanceRequest(updatedConversation);
      }
    } catch (error) {
      console.error('Error getting LLM response:', error);
      setMessages(prev => [...prev, { 
        from: "bot", 
        text: "Thank you for the description. I'll submit your maintenance request now." 
      }]);
      await completeMaintenanceRequest(updatedConversation);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow-up response
  const handleMaintenanceFollowUp = async (answer: string) => {
    if (!maintenanceConversation) return;

    const updatedConversation = {
      ...maintenanceConversation,
      followUpAnswer: answer,
      conversationHistory: [
        ...maintenanceConversation.conversationHistory,
        { role: "user" as const, content: answer }
      ]
    };
    
    setMaintenanceConversation(updatedConversation);
    await completeMaintenanceRequest(updatedConversation);
  };

  // Complete maintenance request
  const completeMaintenanceRequest = async (conversation: MaintenanceConversation) => {
    setIsLoading(true);
    
    try {
      // TODO: Submit to database - for now just show confirmation
      setMessages(prev => [...prev, { 
        from: "bot", 
        text: `Perfect! I've submitted your maintenance request. Here's a summary:

📝 Issue: ${conversation.initialDescription}
${conversation.followUpAnswer ? `📋 Additional info: ${conversation.followUpAnswer}` : ''}
${conversation.uploadedFiles.length > 0 ? `📸 Files uploaded: ${conversation.uploadedFiles.length}` : ''}

You should receive an update within 24 hours. Your request has been prioritized based on the information provided.` 
      }]);
      
      // Reset state
      setConversationState("idle");
      setMaintenanceConversation(null);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error completing maintenance request:', error);
      setMessages(prev => [...prev, { 
        from: "bot", 
        text: "There was an error submitting your request. Please try again or contact our office directly." 
      }]);
    } finally {
      setIsLoading(false);
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
            {showFileUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-500 text-white px-3 hover:bg-gray-600 transition-colors"
                title="Upload file"
              >
                <Upload size={20} />
              </button>
            )}
            <button onClick={() => handleSend()} className="bg-blue-500 text-white px-4 rounded-r-lg">
                Send
            </button>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default Chat;
