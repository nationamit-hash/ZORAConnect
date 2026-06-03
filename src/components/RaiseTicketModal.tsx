/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Utensils, Brush, Shirt, Wrench, CircleDollarSign, AlertCircle, HelpCircle } from 'lucide-react';
import { Ticket } from '../types';

interface RaiseTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: Ticket['category'], description: string, priority: Ticket['priority']) => void;
}

const CATEGORIES: { id: Ticket['category']; label: string; description: string; icon: any; color: string }[] = [
  { id: 'food', label: 'Food & Meals', description: 'Catering, menu requests, and meal timings', icon: Utensils, color: 'text-amber-400 group-hover:text-amber-300' },
  { id: 'housekeeping', label: 'Housekeeping', description: 'Cleanliness, trash removal, and sweeping', icon: Brush, color: 'text-blue-400 group-hover:text-blue-300' },
  { id: 'laundry', label: 'Laundry Service', description: 'Washing, ironing, and delivery checks', icon: Shirt, color: 'text-purple-400 group-hover:text-purple-300' },
  { id: 'maintenance', label: 'Maintenance', description: 'HVAC, plumbing, electrical, and room repairs', icon: Wrench, color: 'text-emerald-400 group-hover:text-emerald-300' },
  { id: 'sales', label: 'Billing / Sales', description: 'Rent invoices, sharing changes, deposits', icon: CircleDollarSign, color: 'text-rose-400 group-hover:text-rose-300' },
  { id: 'other', label: 'Other Concerns', description: 'Miscellaneous, general queries, and other problems', icon: HelpCircle, color: 'text-teal-400 group-hover:text-teal-300' }
];

const PRIORITIES: { id: Ticket['priority']; label: string; color: string; border: string; glow: string }[] = [
  { id: 'low', label: 'Low', color: 'bg-slate-800 text-slate-300 border-slate-700', border: 'border-slate-800', glow: '' },
  { id: 'medium', label: 'Medium', color: 'bg-blue-900/30 text-blue-300 border-blue-800/50', border: 'border-blue-900', glow: 'neon-glow-blue' },
  { id: 'high', label: 'High', color: 'bg-amber-900/30 text-amber-300 border-amber-800/50', border: 'border-amber-900', glow: 'neon-glow-amber' },
  { id: 'urgent', label: 'Urgent', color: 'bg-orange-900/40 text-orange-400 border-orange-800/50', border: 'border-orange-900', glow: 'neon-glow-orange' }
];

export const RaiseTicketModal: React.FC<RaiseTicketModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [selectedCategory, setSelectedCategory] = useState<Ticket['category']>('maintenance');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Ticket['priority']>('medium');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a descriptive subject title.');
      return;
    }
    if (title.length < 5) {
      setError('Title should be at least 5 characters long.');
      return;
    }
    if (!description.trim() || description.length < 15) {
      setError('Please describe your issue in detail (minimum 15 characters).');
      return;
    }

    onSubmit(title.trim(), selectedCategory, description.trim(), priority);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setSelectedCategory('maintenance');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            className="bg-[#0A0B1A] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col my-8"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 bg-[#0F112D] flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white tracking-wide font-sans flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse text-glow-emerald"></span>
                  Raise a Ticket Wizard
                </h3>
                <p className="text-xs text-slate-400 mt-1">Submit your request directly to the support desk</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                id="btn-close-ticket-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
              {error && (
                <div className="flex gap-2 p-3.5 bg-orange-950/25 border border-orange-500/30 rounded-xl text-orange-400 text-sm items-center">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Category Picker */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Incident Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`group p-3 flex flex-col items-center justify-center text-center border rounded-xl transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#12142E] border-slate-600 shadow-lg'
                            : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activeCategoryBorder"
                            className="absolute inset-0 rounded-xl border border-blue-500/40 pointer-events-none neon-glow-blue"
                          />
                        )}
                        <CatIcon className={`w-6 h-6 mb-2 transition-transform group-hover:scale-110 ${cat.color}`} />
                        <span className="text-xs font-semibold text-white tracking-wide block">
                          {cat.label.replace(' & Meals', '').replace(' Service', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Short Subject Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Heater malfunctioning / Kitchen drain clog"
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Rich Description */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Detailed Rich Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue with exact terms (room location, timings, specific observations). Minimum 15 characters."
                  rows={4}
                  className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-all placeholder:text-slate-600 resize-none"
                />
              </div>

              {/* Priority Choice */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ticket Priority Level
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {PRIORITIES.map((prio) => {
                    const isSelected = priority === prio.id;
                    return (
                      <button
                        key={prio.id}
                        type="button"
                        onClick={() => setPriority(prio.id)}
                        className={`py-3 px-4 rounded-xl text-center border text-xs font-medium uppercase tracking-wider transition-all cursor-pointer relative ${
                          isSelected
                            ? `${prio.color} font-bold border-transparent`
                            : 'bg-slate-900/20 border-slate-800 hover:border-slate-750 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="activePriorityBorder"
                            className={`absolute inset-0 rounded-xl border pointer-events-none ${prio.glow} ${
                              prio.id === 'low' ? 'border-slate-600' :
                              prio.id === 'medium' ? 'border-blue-500' :
                              prio.id === 'high' ? 'border-amber-500' : 'border-orange-500'
                            }`}
                          />
                        )}
                        {prio.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all font-sans text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-sans text-xs font-bold transition-all shadow-lg shadow-blue-900/25 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  Raise Incident
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
