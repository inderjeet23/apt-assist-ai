// apt-assist-ai-main/src/components/Chat.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "../integrations/supabase/client"; 
import PlaceholderComponent from "./chat-components/PlaceholderComponent";

interface Message {
  from: "user" | "bot";
  text?: string;
  component?: React.ReactNode;
  options?: string[];
  onOptionClick?: (option: string) => void;
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
        let botResponse = "I'm sorry, I can only help with maintenance requests or rent inquiries at the moment.";

        if (text.toLowerCase().includes("maintenance")) {
            botResponse = "To submit a maintenance request, please describe the issue.";
        } else if (text.toLowerCase() === "rent") {
            botResponse = "To check your rent status, please provide your full name.";
            setConversationState("awaiting_name");
        }

        setMessages(prev => [...prev, { text: botResponse, from: "bot" }]);
    }

    setIsLoading(false);
  };

  const fetchRentStatus = async (name: string, unit: string) => {
    setIsLoading(true);
    
    // Simplified for demo - remove database calls that cause TypeScript errors
    setMessages(prev => [...prev, { text: "Database functionality temporarily disabled. This is a demo of the rent status feature.", from: "bot", options: ["Pay Rent"], onOptionClick: handlePayRent }]);
    setIsLoading(false);
    setConversationState("idle");
  };

  const handleTestComponent = () => {
    setMessages(prev => [...prev, { from: "bot", component: <PlaceholderComponent /> }]);
  };


  const handleRentInquiry = () => {
    setMessages(prev => [...prev, { text: "Rent", from: "user" }]);
    setConversationState("awaiting_name");
    setMessages(prev => [...prev, { text: "To check your rent status, please provide your full name.", from: "bot" }]);
  };
  
  const handlePayRent = () => {
    setMessages(prev => [...prev, { text: "You can pay your rent through our online payment portal. Please note, this is a placeholder and not a real payment link.", from: "bot" }]);
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
