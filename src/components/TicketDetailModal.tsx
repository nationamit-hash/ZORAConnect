/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MessageSquare, Send, CheckCircle2, ChevronRight, RefreshCw, SendToBack, PhoneCall, Zap } from 'lucide-react';
import { Ticket, TicketComment } from '../types';

interface TicketDetailModalProps {
  isOpen: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  currentUserRole: 'tenant' | 'manager' | 'employee';
  currentUserName: string;
  onAddComment: (ticketId: string, text: string) => void;
  onUpdateStatus?: (ticketId: string, status: Ticket['status'], resolutionLog?: string) => void;
  onFollowup?: (ticketId: string) => void;
  onFastResolve?: (ticketId: string) => void;
  onAssignTask?: (ticketId: string, employeeName: string) => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  ticket,
  onClose,
  currentUserRole,
  currentUserName,
  onAddComment,
  onUpdateStatus,
  onFollowup,
  onFastResolve,
  onAssignTask
}) => {
  const [commentText, setCommentText] = useState('');
  const [managerLog, setManagerLog] = useState('');
  const [followupAnimating, setFollowupAnimating] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    onAddComment(ticket.id, commentText.trim());
    setCommentText('');
  };

  const handleStatusChange = (status: Ticket['status']) => {
    if (onUpdateStatus) {
      onUpdateStatus(ticket.id, status, managerLog.trim() || undefined);
      setManagerLog('');
    }
  };

  const triggerFollowup = () => {
    if (onFollowup) {
      setFollowupAnimating(true);
      onFollowup(ticket.id);
      setTimeout(() => setFollowupAnimating(false), 800);
    }
  };

  // WhatsApp prefilled template generator
  const getWhatsAppLink = () => {
    const phone = "+15550190"; // Support desk phone
    const templateMessage = 
      `*ZORA CONNECT SUPPORT REQUEST*\n` +
      `---------------------------------------\n` +
      `*Ticket ID:* ${ticket.id}\n` +
      `*Resident:* ${ticket.tenantName} (Room ${ticket.roomNumber})\n` +
      `*Category:* ${ticket.category.toUpperCase()}\n` +
      `*Incident:* ${ticket.title}\n` +
      `*Priority:* ${ticket.priority.toUpperCase()}\n` +
      `*Status:* ${ticket.status.toUpperCase()}\n` +
      `*Follow-ups:* ${ticket.followupCount}\n` +
      `---------------------------------------\n` +
      `*Issue Details:* ${ticket.description}\n\n` +
      `_Please assist with the incident above on high priority._`;

    return `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(templateMessage)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#050612] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:flex-row h-[85vh] md:h-[75vh]"
      >
        {/* Left pane: Details and Actions */}
        <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-slate-800 overflow-y-auto flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                ticket.priority === 'urgent' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/25' :
                ticket.priority === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25' :
                ticket.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                'bg-slate-500/10 text-slate-400 border border-slate-500/25'
              }`}>
                {ticket.priority} priority
              </span>
              <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md font-sans ${
                ticket.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                ticket.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                'bg-slate-500/10 text-slate-400 border border-slate-550/20'
              }`}>
                ● {ticket.status}
              </span>
            </div>

            <h3 className="text-lg font-bold text-white leading-normal tracking-wide mt-1 font-sans">
              {ticket.title}
            </h3>

            <div className="text-xs text-slate-500 flex gap-4 mt-2 font-mono">
              <span>ID: {ticket.id}</span>
              <span>•</span>
              <span>Room: {ticket.roomNumber}</span>
              <span>•</span>
              <span>By: {ticket.tenantName}</span>
            </div>

            {ticket.assignedTo && (
              <div className="mt-3.5 px-3 py-1.5 bg-blue-950/20 text-blue-400 border border-blue-900/40 rounded-xl text-[10px] font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                Assigned: {ticket.assignedTo}
              </div>
            )}

            <div className="mt-5 p-4 bg-slate-900/40 border border-slate-850 rounded-xl">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 font-sans">Original Complaint Details</p>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-light">
                {ticket.description}
              </p>
            </div>
          </div>

          {/* Controls Footer */}
          <div className="mt-6 pt-4 border-t border-slate-850 space-y-3">
            {/* Action 1: Tenant Controls (Follow up + WhatsApp) */}
            {currentUserRole === 'tenant' && (
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={triggerFollowup}
                  disabled={ticket.status === 'resolved' || followupAnimating}
                  className={`py-3 px-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider cursor-pointer flex items-center justify-center gap-1.5 border transition-all ${
                    ticket.status === 'resolved'
                      ? 'bg-slate-900 border-slate-850 text-slate-600 cursor-not-allowed'
                      : 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <RefreshCw className={`w-4 h-4 ${followupAnimating ? 'animate-spin' : ''}`} />
                  Follow up ({ticket.followupCount})
                </motion.button>

                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-4 rounded-xl text-xs font-bold font-sans uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 border border-emerald-500/30 shadow-lg shadow-emerald-900/10"
                >
                  <PhoneCall className="w-4 h-4" />
                  WhatsApp Desk
                </a>
              </div>
            )}

            {/* Action 2: Manager Dynamic Status Resolution Controls */}
            {currentUserRole === 'manager' && onUpdateStatus && (
              <div className="space-y-4">
                {onAssignTask && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Assign ticket to staff</label>
                    <select
                      value={ticket.assignedTo || ''}
                      onChange={(e) => onAssignTask(ticket.id, e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="">-- Unassigned --</option>
                      <option value="Amit Kumar">Amit Kumar (Operations Specialist)</option>
                      <option value="Saraswati Devi">Saraswati Devi (Lead Housekeeper)</option>
                      <option value="Vikram Malhotra">Vikram Malhotra (Head Culinary Chef)</option>
                      <option value="Rajesh Patel">Rajesh Patel (Maintenance Field Officer)</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Write custom resolution / Action log</label>
                  <input
                    type="text"
                    value={managerLog}
                    onChange={(e) => setManagerLog(e.target.value)}
                    placeholder="e.g., HVAC team completed compressor wiring fix."
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>

                {onFastResolve && ticket.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onFastResolve(ticket.id)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/35 transition-all hover:scale-[1.01]"
                  >
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                    Fast-Resolve (Shortcut)
                  </button>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleStatusChange('pending')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      ticket.status === 'pending'
                        ? 'bg-slate-800 border-slate-600 text-white font-bold'
                        : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    Reset Pending
                  </button>
                  <button
                    onClick={() => handleStatusChange('in-progress')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      ticket.status === 'in-progress'
                        ? 'bg-amber-600/20 border-amber-500/40 text-amber-400 font-bold'
                        : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      ticket.status === 'resolved'
                        ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-400 font-bold'
                        : 'bg-slate-950/50 border-slate-850 text-slate-400 hover:text-slate-305'
                    }`}
                  >
                    Resolve Ticket
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Chat thread timeline / comments */}
        <div className="flex-1 bg-[#090A1A]/90 p-5 flex flex-col justify-between h-full">
          <div className="flex justify-between items-center pb-3 border-b border-slate-850">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-sans">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Activity Chat Logs ({ticket.comments.length})
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Comments list */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
            {ticket.comments.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center p-6">
                <MessageSquare className="w-8 h-8 text-slate-850 mb-2" />
                <p className="text-xs font-bold text-slate-600 font-sans uppercase tracking-wider">No logs written yet</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-sans">Share details, logs or enquiries below</p>
              </div>
            ) : (
              ticket.comments.map((comment) => {
                const isManager = comment.authorRole === 'manager';
                return (
                  <div
                    key={comment.id}
                    className={`flex flex-col max-w-[85%] ${isManager ? 'mr-auto items-start' : 'ml-auto items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-0.5 font-mono">
                      <span className={`font-semibold ${isManager ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {comment.authorName}
                      </span>
                      <span>•</span>
                      <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-3 rounded-xl text-xs font-sans leading-relaxed ${
                      isManager
                        ? 'bg-emerald-950/20 border border-emerald-900/30 text-emerald-200 rounded-tl-none'
                        : 'bg-[#15173B] border border-blue-900/30 text-slate-200 rounded-tr-none'
                    }`}>
                      {comment.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Comment input form */}
          <form onSubmit={handleCommentSubmit} className="pt-3 border-t border-slate-850 flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Send follow-up comment..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none"
            />
            <button
              type="submit"
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/25 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
