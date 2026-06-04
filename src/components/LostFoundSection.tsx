/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, MapPin, Calendar, Clock, Check, RefreshCw, Trash2, ShieldAlert, PlusCircle, Inbox, HelpCircle } from 'lucide-react';
import { LostFoundItem } from '../types';

interface LostFoundSectionProps {
  items: LostFoundItem[];
  onToggleStatus: (item: LostFoundItem) => void;
  onDelete: (id: string) => void;
  onOpenPostModal: () => void;
  currentUserId?: string;
  userRole: 'tenant' | 'manager';
}

export const LostFoundSection: React.FC<LostFoundSectionProps> = ({
  items,
  onToggleStatus,
  onDelete,
  onOpenPostModal,
  currentUserId,
  userRole
}) => {
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'resolved'>('all');
  const [searchText, setSearchText] = useState('');

  // Apply filter pipeline
  const filtered = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.location.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description.toLowerCase().includes(searchText.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="bg-[#0A0B1A] border border-slate-850 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative Gradient Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-bl-full pointer-events-none"></div>

      {/* Title block with CTA button based on user actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-850/60 mb-5">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#f6aa8e] font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 neon-glow-orange animate-pulse"></span>
            Lost & Found Community Hub
          </h3>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">
            PG Residents Bulletins Board • Realtime Community Sync
          </p>
        </div>

        <button
          onClick={onOpenPostModal}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-[#f6aa8e] hover:brightness-105 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-orange-500/10 active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          Broadcast Property Report
        </button>
      </div>

      {/* Control Search & Filters Shelf Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-6 bg-slate-950/50 p-3 rounded-xl border border-slate-900/80">
        {/* Search */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search details, spots, tags..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-650 outline-none focus:border-slate-700 transition-colors"
          />
        </div>

        {/* Classification classification Select Type */}
        <div className="md:col-span-4 flex gap-1.5">
          {(['all', 'lost', 'found'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                  : 'bg-slate-900/30 border-slate-900 text-slate-450 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Status filters type selector */}
        <div className="md:col-span-3 flex gap-1.5">
          {(['all', 'active', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-1 py-1.5 text-[9px] font-mono font-bold uppercase rounded border transition-all cursor-pointer ${
                filterStatus === s
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-slate-900/30 border-slate-900 text-slate-450 hover:text-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bulletins Grid Panel */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-850 rounded-2xl bg-slate-950/20">
          <Inbox className="w-10 h-10 text-slate-750 mx-auto mb-3" />
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">No Items Matching Ledger</h4>
          <p className="text-[10px] text-slate-600 mt-1 uppercase max-w-sm mx-auto leading-relaxed">
            All PG catalogs are fully cleared. Use 'Broadcast Property Report' to flag items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const isOwner = currentUserId && item.tenantId === currentUserId;
            const canManage = isOwner || userRole === 'manager';
            
            return (
              <div
                key={item.id}
                className={`bg-[#0E0F26] border rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all flex flex-col justify-between ${
                  item.status === 'resolved'
                    ? 'border-slate-900 opacity-60 bg-slate-950/30'
                    : item.type === 'lost'
                      ? 'border-orange-900/30 hover:border-orange-500/30'
                      : 'border-emerald-900/30 hover:border-emerald-500/30'
                }`}
              >
                {/* Photo preview spacer */}
                <div className="relative h-44 bg-slate-950 border-b border-slate-900 overflow-hidden flex items-center justify-center">
                  {item.photoUrl ? (
                    <img
                      src={item.photoUrl}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <HelpCircle className="w-9 h-9 text-slate-800" />
                      <span className="text-[9px] text-slate-700 tracking-wider font-mono">NO PHOTO VERIFIED</span>
                    </div>
                  )}

                  {/* Absolute classifications */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                    <span className={`px-2 py-0.5 text-[8px] font-black uppercase rounded-md tracking-wider ${
                      item.type === 'lost'
                        ? 'bg-orange-950/90 text-orange-400 border border-orange-500/30'
                        : 'bg-emerald-950/95 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.type === 'lost' ? '🚨 LOST' : '✨ FOUND'}
                    </span>
                    <span className="text-[8px] font-mono font-bold text-slate-400 bg-black/80 px-1 py-0.5 rounded border border-slate-850">
                      {item.id}
                    </span>
                  </div>

                  {item.status === 'resolved' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                      <span className="px-4 py-1.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-widest font-mono shadow-md rotate-[-6deg]">
                        🎉 RECLAIMED
                      </span>
                    </div>
                  )}
                </div>

                {/* Info and tags */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                  <div>
                    <h4 className="text-xs font-extrabold text-white leading-snug tracking-wide">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 lines-clamp-3 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-900/60 pt-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span className="truncate">Spot: <strong className="text-slate-300 font-medium">{item.location}</strong></span>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span>Log Date: <strong className="font-mono text-slate-400 font-normal">{item.dateStr}</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                      <span>Reporter: <strong className="text-[#f6aa8e]">{item.tenantName}</strong> (Room {item.roomNumber})</span>
                    </div>
                  </div>

                  {/* Actions buttons shelf can resolve or edit */}
                  {canManage && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-900/60 justify-end">
                      <button
                        onClick={() => onToggleStatus(item)}
                        className={`px-3 py-1 text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1cursor-pointer transition-all ${
                          item.status === 'resolved'
                            ? 'bg-amber-955/20 border border-amber-500/20 text-amber-400 hover:bg-amber-950/40'
                            : 'bg-emerald-955/20 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/40'
                        }`}
                        title={item.status === 'active' ? "Mark as reclaimed" : "Mark as active"}
                      >
                        {item.status === 'active' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            Mark Reclaimed
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                            Reactivate item
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 px-1.5 rounded bg-red-955/15 border border-red-500/10 text-red-400 hover:bg-red-950/50 hover:border-red-500/40 transition-all cursor-pointer"
                        title="Remove Post completely"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
