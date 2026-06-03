/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building, Info, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { RoomDoc } from '../types';

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRoom: (room: RoomDoc) => void;
  existingRooms: RoomDoc[];
}

export const AddRoomModal: React.FC<AddRoomModalProps> = ({ isOpen, onClose, onAddRoom, existingRooms }) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<'Single' | 'Double' | 'Triple'>('Double');
  const [monthlyRent, setMonthlyRent] = useState('₹11,000');
  const [totalCapacity, setTotalCapacity] = useState(2);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Update default capacity and rent when room type changes
  useEffect(() => {
    if (roomType === 'Single') {
      setTotalCapacity(1);
      setMonthlyRent('₹15,000');
    } else if (roomType === 'Double') {
      setTotalCapacity(2);
      setMonthlyRent('₹11,000');
    } else if (roomType === 'Triple') {
      setTotalCapacity(3);
      setMonthlyRent('₹8,500');
    }
  }, [roomType]);

  const resetForm = () => {
    setRoomNumber('');
    setRoomType('Double');
    setMonthlyRent('₹11,000');
    setTotalCapacity(2);
    setError('');
    setSuccess('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formattedRoomNum = roomNumber.trim();
    if (!formattedRoomNum) {
      setError('Please specify a valid Room Number.');
      return;
    }

    // Check duplicate
    const isDuplicate = existingRooms.some(r => 
      r.roomNumber.toLowerCase() === formattedRoomNum.toLowerCase()
    );

    if (isDuplicate) {
      setError(`Room ${formattedRoomNum} already exists in the PG active directory.`);
      return;
    }

    // Clean monthlyRent string to ensure it starts with ₹ if not already
    let sanitizedRent = monthlyRent.trim();
    if (!sanitizedRent.startsWith('₹') && !sanitizedRent.startsWith('Rs')) {
      // If it's just a number, format it nicely
      const numericPart = sanitizedRent.replace(/\D/g, '');
      if (numericPart) {
        sanitizedRent = `₹${Number(numericPart).toLocaleString('en-IN')}`;
      } else {
        sanitizedRent = `₹${sanitizedRent}`;
      }
    }

    const newRoom: RoomDoc = {
      roomNumber: formattedRoomNum,
      roomType,
      monthlyRent: sanitizedRent,
      totalCapacity,
      vacantSpots: totalCapacity, // Clean room is fully vacant initially
    };

    onAddRoom(newRoom);
    setSuccess(`Room ${formattedRoomNum} successfully provisioned!`);
    
    setTimeout(() => {
      resetForm();
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-[#0A0B1A]/95 border border-blue-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden z-10 text-left"
          >
            {/* Top Cyan Accent Strip */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500" />

            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-blue-400 font-mono flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-500" />
                Provision New Room Unit
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notifications/Advisories */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-950/30 border border-red-500/20 text-red-450 rounded-xl text-xs flex items-start gap-2 font-sans"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-emerald-950/30 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2 font-sans"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{success}</span>
              </motion.div>
            )}

            {/* Advisory Information Bar */}
            <div className="mb-5 p-3 bg-blue-950/10 border border-blue-500/10 text-blue-400/90 rounded-xl text-[11px] flex items-start gap-2 font-mono">
              <Info className="w-4 h-4 shrink-0 text-blue-400" />
              <span>
                Adding a room registers it to the live Hostel Directory immediately, ready to receive resident bed-allotment operations.
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Room Identifier */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5/10">
                  Room Identifier / Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18, 19, 101"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full bg-[#04050f]/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                />
              </div>

              {/* Room Topology / Type */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                  Topology / Room Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Single', 'Double', 'Triple'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setRoomType(type)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        roomType === type
                          ? 'bg-blue-600/10 border-blue-500 text-blue-400 shadow-sm shadow-blue-500/10'
                          : 'bg-slate-950/40 border-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                      }`}
                    >
                      {type} Setup
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid: Rent & Capacity */}
              <div className="grid grid-cols-2 gap-4">
                {/* Proposed Monthly Rent */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Monthly Charter Rent <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="₹11,000"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    className="w-full bg-[#04050f]/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold"
                  />
                </div>

                {/* Maximum Bed Capacity */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1.5">
                    Bed capacity slots <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={totalCapacity}
                    onChange={(e) => setTotalCapacity(Number(e.target.value))}
                    className="w-full bg-[#46450f]/0 bg-[#04050f] border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500/60 transition-all font-semibold select-custom cursor-pointer"
                  >
                    <option value={1} className="bg-slate-955 text-white">1 Bed (Single)</option>
                    <option value={2} className="bg-slate-955 text-white">2 Beds (Double)</option>
                    <option value={3} className="bg-slate-955 text-white">3 Beds (Triple)</option>
                    <option value={4} className="bg-slate-955 text-white">4 Beds (Quad)</option>
                  </select>
                </div>
              </div>

              {/* Extra summary block */}
              <div className="bg-slate-950/60 border border-slate-900/80 p-3 rounded-xl text-[11px] space-y-1.5 font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Unit Inventory Status:</span>
                  <span className="text-emerald-450 font-bold uppercase">Immediate Vacant Space</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity Allocation:</span>
                  <span className="text-slate-200">{totalCapacity} Beds (Open for Allotments)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-transparent border border-slate-850 text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/20 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Provision Unit
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
