import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, User, Check, Hand, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportConversation {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerId?: string;
  detectedIntent?: string;
  status: string;
  handoffReason?: string;
  createdAt: string;
  updatedAt: string;
  messages?: any[];
}

export const SupportInbox: React.FC = () => {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/support/conversations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('rephonix_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/support/conversations/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('rephonix_admin_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchSingleConversation(selectedConvId);
      const interval = setInterval(() => fetchSingleConversation(selectedConvId), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  const handleStatusChange = async (status: string) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch(`/api/support/conversations/${selectedConvId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rephonix_admin_token')}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchSingleConversation(selectedConvId);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/conversations/${selectedConvId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rephonix_admin_token')}`
        },
        body: JSON.stringify({ newMessage: replyText })
      });
      if (res.ok) {
        setReplyText('');
        fetchSingleConversation(selectedConvId);
        fetchConversations();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Inbox List */}
      <div className={`bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium transition-all ${selectedConvId ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-ice-border/40">
          <h3 className="font-outfit font-light text-xl text-ink-navy">Support Inbox</h3>
          <button onClick={fetchConversations} className="p-2 border border-ice-border rounded-sm hover:text-cobalt transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-sm">No support conversations yet.</div>
          ) : (
            conversations.map(c => (
              <div 
                key={c.id}
                onClick={() => setSelectedConvId(c.id)}
                className={`p-3 border rounded-sm cursor-pointer transition-all ${selectedConvId === c.id ? 'border-cobalt bg-cobalt/5' : 'border-ice-border hover:border-cobalt/50 bg-canvas-white'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-ink-navy flex items-center gap-2 text-sm">
                    {c.customerName || 'Anonymous Customer'}
                    {c.status === 'WAITING_FOR_HUMAN' && (
                      <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider animate-pulse">Needs Help</span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">{new Date(c.updatedAt).toLocaleTimeString()}</span>
                </div>
                
                <div className="flex justify-between items-center text-[11px]">
                  <span className={`px-2 py-0.5 rounded-sm font-mono border ${
                    c.status === 'HUMAN_ACTIVE' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    c.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    c.status === 'AI_ACTIVE' ? 'bg-cobalt/10 text-cobalt border-cobalt/20' :
                    'bg-zinc-100 text-zinc-600 border-zinc-200'
                  }`}>
                    {c.status.replace(/_/g, ' ')}
                  </span>
                  {c.detectedIntent && (
                    <span className="text-zinc-400 capitalize">{c.detectedIntent.replace(/_/g, ' ')}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <AnimatePresence>
        {selectedConvId && selectedConv && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-7 bg-canvas-pure border border-ice-border rounded-sm shadow-premium flex flex-col h-[700px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-ice-border bg-canvas-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-ink-navy text-lg">{selectedConv.customerName || 'Anonymous Customer'}</h4>
                <div className="text-xs text-zinc-500 flex items-center gap-2 mt-0.5">
                  <span>ID: {selectedConv.id.slice(0,8)}...</span>
                  {selectedConv.customerEmail && <span>• {selectedConv.customerEmail}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                {selectedConv.status !== 'HUMAN_ACTIVE' && selectedConv.status !== 'RESOLVED' && selectedConv.status !== 'CLOSED' && (
                  <button onClick={() => handleStatusChange('HUMAN_ACTIVE')} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-sm flex items-center gap-1">
                    <Hand className="w-3.5 h-3.5" /> Take Over
                  </button>
                )}
                {selectedConv.status === 'HUMAN_ACTIVE' && (
                  <button onClick={() => handleStatusChange('RESOLVED')} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-sm flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Mark Resolved
                  </button>
                )}
                <button onClick={() => setSelectedConvId(null)} className="p-1.5 border border-ice-border rounded-sm hover:bg-zinc-100">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Handoff Reason Banner */}
            {selectedConv.handoffReason && (
              <div className="bg-red-50 border-b border-red-100 p-3 text-xs text-red-700 flex items-start gap-2">
                <span className="font-bold uppercase tracking-wider text-[10px] bg-red-200 px-1.5 py-0.5 rounded mt-0.5">Escalation Reason</span>
                <span>{selectedConv.handoffReason}</span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
              {selectedConv.messages?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  {msg.role === 'system' ? (
                    <div className="w-full text-center my-2">
                      <span className="text-[10px] font-mono text-zinc-500 bg-white px-2 py-1 rounded border border-ice-border">
                        {msg.content}
                      </span>
                    </div>
                  ) : (
                    <div className={`flex gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 bg-white border border-ice-border">
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                      </div>
                      <div className={`p-3 rounded-lg text-sm shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-white border border-ice-border text-ink-navy' 
                          : msg.role === 'human_agent' 
                          ? 'bg-amber-100 border border-amber-200 text-amber-900' 
                          : 'bg-cobalt/10 border border-cobalt/20 text-ink-navy'
                      }`}>
                        <div className="text-[10px] font-bold mb-1 opacity-70 uppercase">
                          {msg.role.replace('_', ' ')}
                        </div>
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="p-4 bg-canvas-white border-t border-ice-border">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                  placeholder={selectedConv.status === 'HUMAN_ACTIVE' ? "Type a reply to the customer..." : "Take over conversation to reply"}
                  disabled={selectedConv.status !== 'HUMAN_ACTIVE'}
                  className="flex-1 max-h-32 min-h-[44px] bg-white border border-ice-border rounded-lg px-3 py-2 text-sm text-ink-navy focus:outline-none focus:border-amber-500 resize-none disabled:bg-zinc-100"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending || selectedConv.status !== 'HUMAN_ACTIVE'}
                  className="px-4 bg-amber-500 hover:bg-amber-600 disabled:bg-zinc-300 text-white font-bold rounded-lg transition-colors flex items-center"
                >
                  Reply
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
