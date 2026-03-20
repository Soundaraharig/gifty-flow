import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Send, Loader2, Bot, Gift } from "lucide-react";
import Header from "@/components/Header";

// Resolve asset bundle paths dynamically via Vite
const assets = import.meta.glob('/src/assets/*.{jpg,png}', { eager: true, query: '?url', import: 'default' });

const getImageUrl = (filename: string) => {
  const match = Object.keys(assets).find(key => key.includes(filename));
  return match ? (assets[match] as string) : "";
};

const SYSTEM_PROMPT = `You are the primary, professional sales assistant for 'Zero Gifts', a high-end handcrafted gifts company. 
Your ONLY allowed topic of conversation is Zero Gifts products and services. You sell Custom Photo Frames, Resin Art (bookmarks, coasters, trays, clocks), and various Digital Art Styles (oil painting, minimalist retouch, vintage retro, mosaic collage, etc.). 
CRITICAL RULE 1: If the user asks general, off-topic, or non-product questions (like math, coding, history, weather), you MUST politely refuse and guide them back to our products. 
CRITICAL RULE 2: When users ask to see examples of a product or style, you MUST show them a picture by writing the exact token format: [[IMG:filename.jpg]]. 
Available filenames you can use: 
- Photo Frames: 'category-photo-frames.jpg'
- Resin Art: 'category-resin-art.jpg', 'resin-bookmarks.jpg', 'resin-coasters.jpg', 'resin-keychains.jpg', 'resin-phone-grips.jpg', 'resin-trays.jpg', 'resin-wall-clocks.jpg'
- Art Styles: 'style-digital-illustration.jpg', 'style-minimalist-retouch.jpg', 'style-mosaic-collage.jpg', 'style-oil-painting.jpg', 'style-pencil-sketch.jpg', 'style-pop-art.jpg', 'style-vintage-retro.jpg', 'style-watercolor.jpg'
- Custom Gifts: 'category-custom-gifts.jpg'
Keep your responses conversational, concise, and highly focused on making a wonderful gift recommendation.`;

interface Message {
  role: "user" | "bot";
  content: string;
}

// Function to securely parse the special text tokens into actual image previews
const renderMessage = (text: string) => {
  const regex = /\[\[IMG:(.*?)\]\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={lastIndex}>{text.substring(lastIndex, match.index)}</span>);
    }
    const filename = match[1];
    const url = getImageUrl(filename);
    
    if (url) {
      parts.push(
        <div key={match.index} className="my-3 max-w-sm rounded-lg overflow-hidden border border-border shadow-sm block">
          <img src={url} alt={filename} className="w-full h-auto object-cover" />
        </div>
      );
    } else {
      // In case AI hallucinates an image that doesn't exist
      parts.push(<span key={match.index} className="italic text-muted-foreground">[Image Unavailable]</span>);
    }
    lastIndex = regex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(<span key={lastIndex}>{text.substring(lastIndex)}</span>);
  }

  return <div>{parts.map((p, i) => <span key={i}>{p}</span>)}</div>;
};

const ChatAssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: "Welcome to Zero Gifts! I'm your dedicated sales assistant. Are you looking for customized photo frames or some of our beautiful handcrafted resin art today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-flash-latest",
        systemInstruction: SYSTEM_PROMPT 
      });
      
      // Inject previous context manually to help it remember
      const historyContext = messages.map(m => `${m.role === 'bot' ? 'Assistant' : 'User'}: ${m.content}`).join('\\n');
      const prompt = `History:\\n${historyContext}\\n\\nUser: ${userMessage}\\nAssistant:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response.text();
      
      setMessages((prev) => [...prev, { role: "bot", content: response }]);
    } catch (error: any) {
      console.error("Error generating response:", error);
      const errorMessage = error?.message || "Unknown error occurred";
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: `API Error: ${errorMessage}. Please verify your API key is valid.` }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background pt-16">
      <Header />
      
      <div className="flex-1 container mx-auto p-4 max-w-4xl flex flex-col pt-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-primary p-3 rounded-full text-primary-foreground shadow-rose">
            <Gift size={28} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Zero Gifts Concierge</h1>
            <p className="text-muted-foreground">Expert assistance for all our beautifully handcrafted presents.</p>
          </div>
        </div>

        {/* Chat Interface Container */}
        <div className="flex-1 bg-card border border-border/50 rounded-2xl shadow-xl flex flex-col overflow-hidden mb-6">
          
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-muted/10">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "bot" && (
                  <div className="mr-3 mt-1 flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Bot size={18} />
                    </div>
                  </div>
                )}
                
                <div
                  className={`max-w-[75%] p-4 rounded-3xl text-[15px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-rose/20 shadow-md"
                      : "bg-background border border-border text-foreground rounded-tl-sm shadow-sm"
                  }`}
                >
                  {renderMessage(msg.content)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                 <div className="mr-3 flex-shrink-0">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <Bot size={18} />
                    </div>
                  </div>
                <div className="bg-background border border-border text-muted-foreground p-4 rounded-3xl rounded-tl-sm shadow-sm flex items-center gap-3">
                  <Loader2 size={18} className="animate-spin text-primary" />
                  <span className="text-sm font-medium">Finding the perfect gift...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-background border-t border-border/50">
            <div className="max-w-3xl mx-auto flex items-center gap-3 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about photo frames or resin art..."
                className="flex-1 bg-muted border-none shadow-inner rounded-full px-6 py-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 p-3 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:scale-105 active:scale-95 transition-transform"
                title="Send Message"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="text-center mt-3 text-xs text-muted-foreground">
              Powered by Google Gemini
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default ChatAssistantPage;
