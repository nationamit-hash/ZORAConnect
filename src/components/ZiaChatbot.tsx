import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, Sparkles, AlertTriangle, Siren, ShieldAlert, Clock, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Ticket } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

interface ZiaChatbotProps {
  tickets?: Ticket[];
  sessionUser?: { role: 'tenant' | 'manager'; info: any } | null;
  onEscalate?: (ticketId: string) => Promise<void>;
}

export function ZiaChatbot({ tickets = [], sessionUser = null, onEscalate }: ZiaChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEscalatorOpen, setIsEscalatorOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I am Zia, your Zora Stays AI Companion. 🌸\n\nI can answer questions regarding gate timings, visitor policies, mess meal schedules, rent cycles, housekeeping, or how to log maintenance tickets. If anything has been stuck in pending for over 24 hours, you can also use my Director Escalation panel at the top. How may I help you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<{ origin: string; needsConfig: boolean } | null>(null);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);

  // Simulation time shift triggers
  const [simulatedAges, setSimulatedAges] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    setErrorStatus(null);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Map message history cleanly for the API endpoint
      const historyPayload = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.reply || "I am currently processing your inquiry. Could you please specify a bit more?",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Zia communication failed:", err);
      // Check if API key is likely missing
      const isConfigError = err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key");
      setErrorStatus({
        origin: err.message || "Failed to reach servers.",
        needsConfig: isConfigError
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(input);
    }
  };

  const executeEscalation = async (ticket: Ticket) => {
    if (!onEscalate) return;
    setEscalatingId(ticket.id);
    try {
      await onEscalate(ticket.id);
      
      // Post direct verification model update message in state
      const escalationSuccessMessage: ChatMessage = {
        id: "ESCALATE-" + Date.now(),
        role: 'model',
        text: `🚨 **DIRECTOR ESCALATION DISPATCHED** 🚨\n\nI have automatically escalated Ticket **#${ticket.id}** ("*${ticket.title}*") directly to the Executive Director command desk. Priority state is override-configured as **URGENT**.\n\nA high-alert SMS and WhatsApp dispatch has been broadcasted to the headquarter group. Support dispatchers will contact you directly within 2 hours. We deeply regret the slow support loop!`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, escalationSuccessMessage]);
      setIsEscalatorOpen(false);
    } catch (err: any) {
      setErrorStatus({
        origin: err.message || "Failed to submit escalation override.",
        needsConfig: false
      });
    } finally {
      setEscalatingId(null);
    }
  };

  const quickQuestions = [
    "What are the gate hours?",
    "What is the mess meal schedule?",
    "Are male guests allowed inside?",
    "How do I raise a room issue ticket?"
  ];

  // Logic: Parse current tenant pending tickets
  const tenantId = sessionUser?.role === 'tenant' ? sessionUser.info?.tenantId : null;
  const isTenant = sessionUser?.role === 'tenant';

  const pendingTenantTickets = isTenant
    ? tickets.filter(t => t.tenantId === tenantId && t.status === 'pending')
    : [];

  // Helper: Retrieve elapsed hours
  const parseTicketAge = (ticket: Ticket) => {
    // If simulated to be older, return 25 hours
    if (simulatedAges[ticket.id]) {
      return {
        hours: 25.4,
        minutes: 24,
        isEligible: true,
        summaryStr: "Pending for 25.4h (Simulation Applied)"
      };
    }

    const createdMs = new Date(ticket.createdAt).getTime();
    const elapsedMs = Date.now() - createdMs;
    const hours = elapsedMs / (3600 * 1000);
    const totalMins = Math.floor(elapsedMs / (60 * 1000));
    const finalHoursStr = (hours).toFixed(1);

    return {
      hours,
      minutes: totalMins % 60,
      isEligible: hours >= 24,
      summaryStr: `Pending for ${finalHoursStr}h`
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans flex flex-col items-end gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-[#0E0B0A] border border-zinc-800 rounded-2xl w-[360px] sm:w-[390px] h-[550px] shadow-2xl flex flex-col overflow-hidden mr-0 mb-1 pointer-events-auto"
          >
            {/* Header segment of Chatbot */}
            <div className="bg-gradient-to-r from-[#f05d24] to-[#f6aa8e] p-4 flex justify-between items-center relative flex-shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-black/20 rounded-xl flex items-center justify-center border border-white/10 relative">
                  <Bot className="w-5 h-5 text-white" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-[#f05d24] rounded-full"></span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-wider text-white uppercase font-sans">Zia</h3>
                    <Sparkles className="w-3.5 h-3.5 text-white/90 fill-white" />
                  </div>
                  <span className="text-[10px] text-white/80 font-mono uppercase tracking-widest font-bold">Zora AI PG Companion</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 bg-black/10 hover:bg-black/20 text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* LIVE WHATSAPP BUSINESS SUPPORT QUICK DISPATCH BAR */}
            <a
              href="https://wa.me/919540960412?text=Hello%20Zora%20Stays%20Support%20Team%2C%20I%20need%20direct%2520assistance..."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-950/80 hover:bg-emerald-900/80 border-b border-emerald-800/60 px-4 py-2 flex items-center justify-between text-xs transition-colors group relative z-25 flex-shrink-0"
              title="Open WhatsApp Business Direct Chat"
            >
              <div className="flex items-center gap-2 text-emerald-450">
                <span className="w-2 h-2 bg-emerald-450 rounded-full animate-pulse"></span>
                <span className="font-extrabold text-[10px] uppercase tracking-wider font-mono text-emerald-400">Live WhatsApp Desk</span>
              </div>
              <div className="flex items-center gap-1.5 text-white font-bold font-mono text-[11px] group-hover:text-emerald-350">
                <span>+91 95409 60412</span>
                <span className="text-[10px] text-emerald-400 font-bold">➔</span>
              </div>
            </a>

            {/* INTERACTIVE COMPACT ESCALATION HEADER WIDGET (only for tenants) */}
            {isTenant && pendingTenantTickets.length > 0 && (
              <div className="bg-zinc-900/90 border-b border-zinc-800/80 px-4 py-2.5 flex flex-col relative z-20 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEscalatorOpen(!isEscalatorOpen)}
                  className="flex items-center justify-between text-left w-full group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Siren className="w-4 h-4 text-[#f05d24] animate-pulse" />
                    <div>
                      <span className="text-[11px] font-extrabold text-white uppercase tracking-wider block leading-tight">
                        Director Escalation Desk
                      </span>
                      <span className="text-[9px] text-[#f6aa8e] font-mono uppercase">
                        {pendingTenantTickets.length} unresolved {pendingTenantTickets.length === 1 ? 'incident' : 'incidents'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#f05d24]/10 border border-[#f05d24]/20 px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold text-[#f05d24] font-mono">Inspect</span>
                    {isEscalatorOpen ? (
                      <ChevronUp className="w-3 h-3 text-[#f05d24]" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-[#f05d24]" />
                    )}
                  </div>
                </button>

                {/* Expanded Escalation control list */}
                <AnimatePresence>
                  {isEscalatorOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-3 pt-2.5 border-t border-zinc-800/50 space-y-2.5"
                    >
                      {pendingTenantTickets.map((ticket) => {
                        const age = parseTicketAge(ticket);
                        return (
                          <div 
                            key={ticket.id} 
                            className="bg-black/60 border border-zinc-800/80 rounded-xl p-3 flex flex-col space-y-2.5 transition-all hover:border-zinc-700/60"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[8px] font-mono text-[#f6aa8e] tracking-widest uppercase bg-zinc-900 border border-zinc-800/60 px-1.5 py-0.5 rounded">
                                  #{ticket.id} • {ticket.category.toUpperCase()}
                                </span>
                                <h4 className="text-[11px] font-bold text-white uppercase tracking-wide mt-1 leading-tight">
                                  {ticket.title}
                                </h4>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`text-[9px] font-mono font-black ${age.isEligible ? 'text-red-400' : 'text-zinc-500'}`}>
                                  {age.summaryStr}
                                </span>
                              </div>
                            </div>

                            {/* Escalation Control Buttons */}
                            <div className="flex items-center justify-between gap-2.5 pt-1">
                              {/* Simulator hook for checking easily */}
                              {!age.isEligible && (
                                <button
                                  type="button"
                                  onClick={() => setSimulatedAges(prev => ({ ...prev, [ticket.id]: true }))}
                                  className="text-[8.5px] text-[#f6aa8e] hover:text-[#f05d24] bg-zinc-900 px-2 py-1 rounded border border-zinc-800 font-mono transition-colors cursor-pointer"
                                  title="Skip the 24 hour pending security lock to unlock the high-priority Director escalation flow."
                                >
                                  🧪 Simulate Age (&gt;24h)
                                </button>
                              )}
                              
                              {age.isEligible ? (
                                <button
                                  type="button"
                                  disabled={escalatingId === ticket.id}
                                  onClick={() => executeEscalation(ticket)}
                                  className="w-full py-2 bg-gradient-to-r from-red-500 to-amber-500 text-white font-extrabold text-[9px] font-mono tracking-widest uppercase rounded-lg hover:brightness-105 transition-all shadow-md shadow-red-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5 animate-bounce" />
                                  Escalate to Director
                                </button>
                              ) : (
                                <div className="flex-1 flex items-center gap-1 bg-zinc-950 p-1.5 rounded-lg border border-zinc-900">
                                  <Clock className="w-3 h-3 text-zinc-600" />
                                  <span className="text-[9px] text-zinc-500 font-medium">
                                    Direct escalation available after 24 hours.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Conversation Window */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950/40 relative z-10">
              {messages.map((message) => {
                const isModel = message.role === 'model';
                return (
                  <div
                    key={message.id}
                    className={`flex ${isModel ? 'justify-start' : 'justify-end'} items-start gap-2`}
                  >
                    {isModel && (
                      <div className="w-6 h-6 rounded-lg bg-[#f05d24]/10 border border-[#f05d24]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-[#f05d24]" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                        isModel
                          ? 'bg-zinc-900 border border-zinc-850 text-slate-250 select-text font-light'
                          : 'bg-gradient-to-r from-[#f05d24] to-[#f6aa8e] text-white font-semibold shadow-md shadow-[#f05d24]/5'
                      }`}
                    >
                      {message.text}
                      <span className="block text-[8px] opacity-40 text-right mt-1.5 font-mono select-none">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start items-start gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#f05d24]/10 border border-[#f05d24]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#f05d24]" />
                  </div>
                  <div className="bg-zinc-900 border border-zinc-850 rounded-2xl px-4 py-3 flex items-center gap-1.5 justify-center">
                    <span className="w-1.5 h-1.5 bg-[#f05d24] rounded-full animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 bg-[#f05d24] rounded-full animate-bounce delay-200"></span>
                    <span className="w-1.5 h-1.5 bg-[#f05d24] rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              )}

              {/* Error Status Indicator */}
              {errorStatus && (
                <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-red-300 leading-normal">
                    {errorStatus.needsConfig ? (
                      <div>
                        <span className="font-extrabold block">Gemini API Key Missing</span>
                        Please configure your <b className="text-[#f6aa8e]">GEMINI_API_KEY</b> in the AI Studio <b>Settings &gt; Secrets</b> panel to activate live responses.
                      </div>
                    ) : (
                      <span>{errorStatus.origin}</span>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-zinc-950/20 border-t border-zinc-900 flex-shrink-0 relative z-10">
                {quickQuestions.map((qq) => (
                  <button
                    key={qq}
                    type="button"
                    onClick={() => handleSendMessage(qq)}
                    className="text-[10px] bg-zinc-900 hover:bg-[#f05d24]/10 hover:text-[#f05d24] border border-zinc-800 hover:border-[#f05d24]/30 px-2.5 py-1 rounded-full text-slate-400 transition-colors cursor-pointer text-left font-mono"
                  >
                    {qq}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form area */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex gap-2 flex-shrink-0 relative z-10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                placeholder="Ask Zia something..."
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-[#f05d24] focus:ring-1 focus:ring-[#f05d24]/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-650 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#f05d24] to-[#f6aa8e] hover:opacity-95 text-white flex items-center justify-center transition-opacity disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-[#f05d24]/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Floating WhatsApp Business Direct Chat Trigger */}
        <motion.a
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          href="https://wa.me/919540960412?text=Hello%20Zora%20Stays%20Support%20Team%2C%20I%20need%20direct%20assistance..."
          target="_blank"
          rel="noopener noreferrer"
          className="w-13 h-13 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] shadow-[0_4px_15px_rgba(37,211,102,0.45)] text-white flex items-center justify-center relative cursor-pointer transition-all"
          title="Direct WhatsApp Business Support: +91 95409 60412"
          id="whatsapp-floating-trigger"
        >
          {/* Pulsing indicator ring */}
          <span className="absolute inset-0 rounded-2xl border-2 border-[#25D366] animate-ping opacity-60"></span>
          
          <svg
            className="w-6 h-6 text-white fill-current block"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.458h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          
          <span className="absolute -top-1 -right-1 flex h-3 w-3 select-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-550"></span>
          </span>
        </motion.a>

        {/* Floating launcher trigger */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-13 h-13 rounded-2xl bg-gradient-to-r from-[#f05d24] to-[#f6aa8e] hover:brightness-105 rounded-tr-sm text-white shadow-lg shadow-[#f05d24]/30 flex items-center justify-center relative cursor-pointer"
          id="zia-floating-trigger"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="message"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <Bot className="w-6 h-6 text-white animate-pulse" />
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-green-400 border-2 border-[#f05d24] rounded-full animate-ping"></span>
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-green-400 border-2 border-[#f05d24] rounded-full"></span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}
