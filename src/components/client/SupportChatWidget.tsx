import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Bot, Loader2, Headphones, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportMessage {
  id: string;
  role: 'system' | 'ai' | 'user' | 'human_agent';
  content: string;
  createdAt: string;
}

export const SupportChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<string>('AI_ACTIVE');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resetToInitialState = () => {
    localStorage.removeItem('rephonix_support_conv_id');
    setConversationId(null);
    setChatStatus('AI_ACTIVE');
    setMessages([
      {
        id: 'greeting',
        role: 'ai',
        content: 'Hi there! I am the Rephonix AI Assistant. How can I help you today?',
        createdAt: new Date().toISOString()
      }
    ]);
  };

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Load existing conversation from localStorage if available
  useEffect(() => {
    const savedConvId = localStorage.getItem('rephonix_support_conv_id');
    if (savedConvId) {
      setConversationId(savedConvId);
      loadConversationHistory(savedConvId);
    } else {
      resetToInitialState();
    }
  }, []);

  const loadConversationHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/support/chat/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setChatStatus(data.status);
      } else {
        resetToInitialState();
      }
    } catch (err) {
      console.error('Failed to load conversation history', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    // Add temporary user message
    const tempUserMsg: SupportMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          message: userText
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
          localStorage.setItem('rephonix_support_conv_id', data.conversationId);
        }
        
        setChatStatus(data.status);
        
        if (data.response) {
          setMessages(prev => [...prev, {
            id: data.aiMessageId || Date.now().toString(),
            role: data.status === 'HUMAN_ACTIVE' ? 'human_agent' : 'ai',
            content: data.response,
            createdAt: new Date().toISOString()
          }]);
        }
        
        // If chat just switched to human waiting, we can reload to get the system message
        if (data.status === 'WAITING_FOR_HUMAN') {
          await loadConversationHistory(data.conversationId);
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'system',
        content: "Sorry, I'm having trouble responding right now. Please try again later.",
        createdAt: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestHumanHandoff = async () => {
    // Send a message triggering handoff
    setInputValue('I want to talk to a human agent');
    handleSendMessage();
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-cobalt text-white shadow-lg flex items-center justify-center hover:bg-cobalt-hover transition-colors ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[600px] max-h-[85vh] bg-canvas-pure border border-ice-border rounded-xl shadow-premium flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-cobalt p-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {chatStatus === 'HUMAN_ACTIVE' ? <Headphones className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {chatStatus === 'HUMAN_ACTIVE' ? 'Rephonix Support Agent' : 'Rephonix AI Assistant'}
                  </h3>
                  <p className="text-[10px] text-white/70 font-mono">
                    {chatStatus === 'WAITING_FOR_HUMAN' ? 'Waiting for an agent...' : 'Online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetToInitialState}
                  title="Start New Chat"
                  className="p-1.5 hover:bg-white/20 rounded-sm transition-colors text-white/80 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-canvas-white">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'system' ? (
                    <div className="w-full text-center py-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider bg-ice-gray/50 px-2 py-1 rounded-full border border-ice-border">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        msg.role === 'user' ? 'bg-ice-gray text-zinc-500 border border-ice-border' : 
                        msg.role === 'human_agent' ? 'bg-secondary text-white' : 'bg-cobalt/10 text-cobalt border border-cobalt/20'
                      }`}>
                        {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : 
                         msg.role === 'human_agent' ? <Headphones className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      </div>
                      <div className={`p-3 rounded-lg text-sm ${
                        msg.role === 'user' 
                          ? 'bg-ink-navy text-white rounded-tr-sm' 
                          : 'bg-canvas-pure border border-ice-border text-ink-slate rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-cobalt/10 text-cobalt border border-cobalt/20">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="p-3 rounded-lg bg-canvas-pure border border-ice-border rounded-tl-sm flex items-center gap-1">
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 bg-zinc-400 rounded-full" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-canvas-pure border-t border-ice-border shrink-0">
              {chatStatus === 'AI_ACTIVE' && (
                <div className="flex justify-center mb-3">
                  <button 
                    onClick={requestHumanHandoff}
                    className="text-[10px] text-zinc-500 hover:text-cobalt font-mono flex items-center gap-1 transition-colors"
                  >
                    <Headphones className="w-3 h-3" /> Talk to a Human Agent
                  </button>
                </div>
              )}
              
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 max-h-32 min-h-[44px] bg-canvas-white border border-ice-border rounded-lg px-3 py-2.5 text-sm text-ink-navy focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt resize-none"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="w-[44px] h-[44px] shrink-0 bg-cobalt hover:bg-cobalt-hover disabled:bg-ice-gray disabled:text-zinc-400 text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
