/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, Bed, ShieldCheck, Home, AlertTriangle, CheckCircle2, ChevronRight, User } from 'lucide-react';
import { Tenant } from '../types';

interface AllotBedModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  onAllot: (tenantId: string, roomNumber: string, bedNumber: string, sharingType: string) => void;
  initialRoomNumber?: string;
  initialBedNumber?: string;
  roomDatabase: Array<{ roomNumber: string; type: string; capacity: number }>;
}

export const AllotBedModal: React.FC<AllotBedModalProps> = ({
  isOpen,
  onClose,
  tenants,
  onAllot,
  initialRoomNumber = '',
  initialBedNumber = '',
  roomDatabase
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [targetRoomNumber, setTargetRoomNumber] = useState('');
  const [targetBedNumber, setTargetBedNumber] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Prefill initial room & bed if provided from click trigger
  useEffect(() => {
    if (isOpen) {
      if (initialRoomNumber) {
        setTargetRoomNumber(initialRoomNumber);
      } else {
        setTargetRoomNumber('');
      }
      if (initialBedNumber) {
        setTargetBedNumber(initialBedNumber);
      } else {
        setTargetBedNumber('Bed A'); // default
      }
      setSelectedTenantId('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, initialRoomNumber, initialBedNumber]);

  const selectedTenant = tenants.find(t => t.tenantId === selectedTenantId);
  const targetRoomInfo = roomDatabase.find(r => r.roomNumber === targetRoomNumber);
  
  // Find current occupants of the target room (excluding the selected tenant themselves if they are already in this room)
  const targetRoomOccupants = tenants.filter(t => 
    t.roomNumber === targetRoomNumber && t.tenantId !== selectedTenantId
  );

  const handleAllotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedTenantId) {
      setError('Please select a resident to allot.');
      return;
    }
    if (!targetRoomNumber) {
      setError('Please choose a destination room.');
      return;
    }
    if (!targetBedNumber.trim()) {
      setError('Please specify a Bed/Seat number.');
      return;
    }

    if (!targetRoomInfo) {
      setError('Invalid destination room selected.');
      return;
    }

    // Capacity warning
    if (targetRoomOccupants.length >= targetRoomInfo.capacity) {
      // Allow overriding or block? The user wants a flexible experience, let's warn but allow under high-fidelity settings,
      // or let them know it's full. Let's block if strict, or let them confirm. Let's enforce strict capacity limits
      // unless custom sharing is selected!
      setError(`Room ${targetRoomNumber} has reached its sharing capacity of ${targetRoomInfo.capacity} bed(s).`);
      return;
    }

    // Check if bed is already taken in that target room
    const isBedTaken = targetRoomOccupants.some(
      occ => occ.bedNumber?.toLowerCase().trim() === targetBedNumber.toLowerCase().trim()
    );
    if (isBedTaken) {
      setError(`Bed slot "${targetBedNumber}" in Room ${targetRoomNumber} is already occupied by another roommate.`);
      return;
    }

    // Sharing type update matching the room profile
    const newSharingType = targetRoomInfo.type;

    onAllot(selectedTenantId, targetRoomNumber, targetBedNumber.trim(), newSharingType);
    setSuccess(`Successfully rescheduled ${selectedTenant?.name} to Room ${targetRoomNumber} (${targetBedNumber})!`);
    
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="allot-bed-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-lg bg-[#090b1c] border border-slate-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-850 bg-[#0c0f2b] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white tracking-wide uppercase font-sans flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-orange-500 animate-pulse" />
                  Real-Time Bed Allotment & Seat Migration
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  SECURE SYSTEM PROTOCOL • PROPERTIES DIRECTIVE
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAllotSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex gap-2 p-3 bg-red-950/40 border border-red-550/30 rounded-xl text-red-400 text-xs items-center">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex gap-2 p-3 bg-emerald-950/40 border border-emerald-550/30 rounded-xl text-emerald-400 text-xs items-center">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                  <p className="font-bold">{success}</p>
                </div>
              )}

              {/* Step 1: Select Tenant */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                  1. Select Target Resident
                </label>
                <select
                  value={selectedTenantId}
                  onChange={(e) => {
                    setSelectedTenantId(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-orange-500 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none transition-all cursor-pointer font-sans"
                >
                  <option value="">-- Choose Resident Guest --</option>
                  {tenants.map((t) => (
                    <option key={t.tenantId} value={t.tenantId}>
                      {t.name} (UID: {t.tenantId} • Rm {t.roomNumber} {t.bedNumber ? `• ${t.bedNumber}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Choose Room & Bed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    2. Destination Room
                  </label>
                  <select
                    value={targetRoomNumber}
                    onChange={(e) => {
                      setTargetRoomNumber(e.target.value);
                      setError('');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none transition-all cursor-pointer font-mono"
                  >
                    <option value="">-- Room --</option>
                    {roomDatabase.map((r) => {
                      const occupancyCount = tenants.filter(t => t.roomNumber === r.roomNumber && t.tenantId !== selectedTenantId).length;
                      const isFull = occupancyCount >= r.capacity;
                      return (
                        <option key={r.roomNumber} value={r.roomNumber} disabled={isFull}>
                          Room {r.roomNumber.padStart(2, '0')} ({r.type} Share) {isFull ? '[FULLY BOOKED 🔒]' : `[Occupied: ${occupancyCount}/${r.capacity}]`}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    3. Assigned Bed / Seat
                  </label>
                  <input
                    type="text"
                    value={targetBedNumber}
                    onChange={(e) => {
                      setTargetBedNumber(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. Bed A, Seat 1"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Quick-choice helper buttons for bed numbers */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">Quick-Allot Slots</span>
                <div className="flex gap-2">
                  {['Bed A', 'Bed B', 'Bed C'].map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => {
                        setTargetBedNumber(choice);
                        setError('');
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        targetBedNumber === choice
                          ? 'bg-purple-950 text-purple-400 border-purple-800'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800'
                      }`}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telemetry Relocation Preview Block */}
              {selectedTenant && targetRoomNumber && (
                <div className="bg-orange-950/10 border border-orange-500/20 rounded-xl p-4 space-y-3.5">
                  <span className="text-[10px] uppercase font-bold text-orange-400 font-mono tracking-widest block">Migration Visual Preview</span>
                  
                  <div className="flex items-center justify-between text-xs font-sans">
                    {/* Source */}
                    <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 flex-1 text-center min-w-0">
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Current Seat</p>
                      <p className="text-white font-extrabold truncate mt-1">Room {selectedTenant.roomNumber || 'None'}</p>
                      <span className="text-[10px] font-mono text-slate-400">{selectedTenant.bedNumber || 'Unassigned'}</span>
                    </div>

                    {/* Arrow */}
                    <div className="px-3 flex flex-col items-center">
                      <ArrowRight className="w-5 h-5 text-orange-500 animate-pulse" />
                      <span className="text-[8px] font-mono text-slate-500 mt-1 font-bold">MIGRATE</span>
                    </div>

                    {/* Destination */}
                    <div className="bg-slate-950 border border-orange-900/30 rounded-lg p-2.5 flex-1 text-center min-w-0">
                      <p className="text-[9px] text-orange-400 font-extrabold uppercase tracking-wider">New Seat</p>
                      <p className="text-orange-300 font-black truncate mt-1">Room {targetRoomNumber || '?'}</p>
                      <span className="text-[10px] font-mono text-orange-400 font-bold">{targetBedNumber || '?'}</span>
                    </div>
                  </div>

                  {/* Target Room Roommates listing */}
                  <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-400">
                    <span className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
                      Target Room Occupants:
                    </span>
                    {targetRoomOccupants.length === 0 ? (
                      <span className="italic text-emerald-400 font-medium">None (Entire room is fully vacant!)</span>
                    ) : (
                      <div className="space-y-1">
                        {targetRoomOccupants.map(occ => (
                          <div key={occ.tenantId} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span>{occ.name} <span className="text-slate-500 font-mono">({occ.bedNumber || 'Unassigned Slot'})</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submission CTA Row */}
              <div className="pt-2 flex gap-3 justify-end font-sans">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancel Protocol
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-950/40 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Allot Guest Bed
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
