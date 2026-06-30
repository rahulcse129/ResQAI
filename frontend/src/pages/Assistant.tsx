import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
}

const Assistant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello. I am ResQAI, your emergency intelligence assistant. How can I help you prepare or respond to a disaster today?', isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: input, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text, location: 'Unknown', language: 'en' })
      });
      
      const data = await response.json();
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: data.reply || 'I am currently unable to process this request. Please try again or contact emergency services directly if this is life-threatening.',
        isBot: true
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: 'Connection to AI Service failed. Please ensure the backend is running.',
        isBot: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Emergency Assistant</h1>
          <p className="text-gray-400">Get context-aware recommendations for safety and evacuation.</p>
        </div>
        <div className="px-3 py-1 bg-primary/20 text-primary border border-primary/50 rounded-full text-sm flex items-center gap-2">
          <Bot size={16} /> ResQAI v1.0
        </div>
      </div>

      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
        {/* Warning Banner */}
        <div className="bg-red-500/10 border-b border-red-500/20 p-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle size={16} />
          In case of immediate life-threatening emergency, always call local emergency services directly.
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`flex gap-4 max-w-[80%] ${msg.isBot ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.isBot ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-300'}`}>
                  {msg.isBot ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.isBot ? 'bg-gray-800 text-gray-200 rounded-tl-none' : 'bg-primary text-white rounded-tr-none'}`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-gray-800 text-gray-200 rounded-tl-none flex items-center gap-2">
                  <Loader2 className="animate-spin text-primary" size={20} /> Analyzing threat vectors...
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-900 border-t border-gray-800">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="e.g. Heavy rain expected tomorrow. What should I do?"
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-xl pl-4 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-gray-700"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="absolute right-2 p-2 bg-primary hover:bg-blue-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
