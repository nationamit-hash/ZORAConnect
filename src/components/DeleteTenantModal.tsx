/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { Tenant } from '../types';

interface DeleteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onConfirm: (tenantId: string) => void;
}

export const DeleteTenantModal: React.FC<DeleteTenantModalProps> = ({ isOpen, onClose, tenant, onConfirm }) => {
  if (!tenant) return null;

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
            className="relative w-full max-w-md bg-[#0A0B1A]/95 border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center overflow-hidden z-10"
          >
            {/* Red alert glow effect */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600" />

            <div className="flex justify-between items-center pb-4 border-b border-slate-850 mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#f05d24] font-mono flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Critical Clearance Authority
              </h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-2 space-y-4">
              <div className="w-16 h-16 bg-red-950/20 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <Trash2 className="w-8 h-8 text-red-550" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-base font-extrabold text-white">Permanently Delete Tenant?</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  You are performing an irreversible administrative block. 
                  This will immediately terminate <strong className="text-white">{tenant.name}</strong>'s lease records, free up <strong className="text-blue-400 font-mono">Room {tenant.roomNumber}</strong>, and purge all active contract dossiers.
                </p>
              </div>

              {/* Dossier info mini block */}
              <div className="bg-slate-950/60 border border-slate-900/80 p-3.5 rounded-xl text-left text-[11px] space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Resident Name:</span>
                  <span className="text-slate-200 font-bold">{tenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Registered UID:</span>
                  <span className="text-slate-200">{tenant.tenantId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Room Allocation:</span>
                  <span className="text-blue-400 font-bold">Room {tenant.roomNumber} ({tenant.sharingType} Share)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 uppercase">Financial Claim:</span>
                  <span className="text-emerald-450 font-bold">${tenant.rentAmount} / Month</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-slate-850 flex items-center justify-end gap-3 bg-[#090b1c]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-transparent border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Keep Record
              </button>
              <button
                type="button"
                onClick={() => onConfirm(tenant.tenantId)}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-900/20 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-1 animate-pulse"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Purge Record
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
