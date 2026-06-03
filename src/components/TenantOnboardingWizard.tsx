/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Home, 
  Bed,
  Phone, 
  MapPin, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle, 
  Sparkles, 
  AlertCircle, 
  Wrench, 
  Utensils, 
  Clock, 
  HelpCircle,
  Camera,
  Layers,
  ShieldAlert,
  Menu
} from 'lucide-react';
import { Tenant, Ticket } from '../types';
import { playSuccessTone, playCyberBlip } from '../hooks/useSound';

interface TenantOnboardingWizardProps {
  isOpen: boolean;
  tenant: Tenant;
  onClose: () => void;
  onComplete: (updatedTenant: Tenant) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
];

export const TenantOnboardingWizard: React.FC<TenantOnboardingWizardProps> = ({
  isOpen,
  tenant,
  onClose,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  // Step 1: Profile State
  const [name, setName] = useState(tenant.name || '');
  const [roomNumber, setRoomNumber] = useState(tenant.roomNumber || '');
  const [sharingType, setSharingType] = useState(tenant.sharingType || 'Single');
  const [phoneNumber, setPhoneNumber] = useState(tenant.phoneNumber || '');
  const [address, setAddress] = useState(tenant.address || '');

  // Step 2: Avatar state
  const [photoUrl, setPhotoUrl] = useState(tenant.photoUrl || AVATAR_PRESETS[0]);
  const [customFileLoading, setCustomFileLoading] = useState(false);

  // Step 3: Interactive Mock Ticket Lifecycle for user learning
  const [mockTicketStatus, setMockTicketStatus] = useState<'pending' | 'in-progress' | 'resolved'>('pending');
  const [mockTicketFeedback, setMockTicketFeedback] = useState('Your ticket was successfully raised and pending manager response.');

  // Auto transition of mock ticket to simulate portal lifecycle learning
  useEffect(() => {
    if (step === 3) {
      setMockTicketStatus('pending');
      setMockTicketFeedback('Step 1: Under "Pending", property managers are instantly notified on Slack / WhatsApp.');
      
      const timer1 = setTimeout(() => {
        setMockTicketStatus('in-progress');
        setMockTicketFeedback('Step 2: When "In Progress", a vendor (HVAC, plumber) is assigned.');
      }, 3500);

      const timer2 = setTimeout(() => {
        setMockTicketStatus('resolved');
        setMockTicketFeedback('Step 3: Once "Resolved", you receive a secure push notification to close the thread!');
      }, 7000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [step]);

  const validateStep1 = () => {
    if (!name.trim()) return "Full name is required.";
    if (!roomNumber.trim()) return "Room number is required.";
    if (!phoneNumber.trim()) return "Contact number is required.";
    if (!address.trim()) return "Permanent address is required.";
    return "";
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const stepError = validateStep1();
      if (stepError) {
        setError(stepError);
        return;
      }
    }
    playCyberBlip();
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    playCyberBlip();
    setStep(prev => prev - 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Please choose a photograph under 2MB.");
      return;
    }

    setCustomFileLoading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      setCustomFileLoading(false);
      playSuccessTone();
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setCustomFileLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFinishOnboarding = () => {
    const updatedTenant: Tenant = {
      ...tenant,
      name: name.trim(),
      roomNumber: roomNumber.trim(),
      sharingType,
      phoneNumber: phoneNumber.trim(),
      address: address.trim(),
      photoUrl,
      onboarded: true, // Tag onboarding completion
    };
    onComplete(updatedTenant);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        {/* Animated backdrop with dense dark blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Wizard Container (Dark Tech Living Theme) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0A0B1A] border-2 border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col md:min-h-[560px]"
        >
          {/* Main Visual Header Accent Line */}
          <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-amber-500 to-emerald-500 animate-pulse"></div>

          {/* Top Panel */}
          <div className="p-6 bg-[#0E102F] border-b border-slate-850 flex justify-between items-center relative">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/25 text-orange-400">
                <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white tracking-wide flex items-center gap-1.5 leading-none">
                  Zora Resident Onboarding
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">STEP {step} OF 3 • Verification & Protocol Setup</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Indicator Slider */}
          <div className="bg-slate-950 px-6 py-3 border-b border-slate-900 flex justify-between gap-2.5 items-center">
            {[1, 2, 3].map((num) => {
              const label = num === 1 ? "Vital Metadata" : num === 2 ? "Resident Identity" : "Portal Roadmap";
              const isCurrent = step === num;
              const isCompleted = step > num;
              return (
                <div key={num} className="flex-1 flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                      isCurrent
                        ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(241,90,36,0.4)]'
                        : isCompleted
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-900 text-slate-600 border border-slate-850'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : num}
                  </div>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider hidden sm:inline ${
                      isCurrent ? 'text-white' : 'text-slate-500 font-normal'
                    }`}
                  >
                    {label}
                  </span>
                  {num < 3 && <div className="hidden sm:block flex-1 h-px bg-slate-850"></div>}
                </div>
              );
            })}
          </div>

          {/* Content Area with Slide Animation */}
          <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
            {error && (
              <div className="mb-5 flex gap-2.5 p-3.5 bg-red-950/40 border border-red-500/35 rounded-2xl text-red-400 text-xs items-center font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide">Enter Resident Information</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-light">
                        Verify and complete your official PG room ledger details below. These details are used to set up automatic rent receipts, food tokens, and gate approvals.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-750 focus:border-orange-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all font-sans font-medium"
                            placeholder="e.g. Nikita Varma"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Contact Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-750 focus:border-orange-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all font-mono"
                            placeholder="e.g. +91 98xxx xxxxx"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Assigned Room</label>
                        <div className="relative">
                          <Home className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-750 focus:border-orange-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all font-mono font-bold"
                            placeholder="e.g. 104A"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Sharing Choice Class</label>
                        <div className="relative">
                          <select
                            value={sharingType}
                            onChange={(e) => setSharingType(e.target.value)}
                            className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-750 focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none transition-all cursor-pointer font-sans appearance-none"
                          >
                            <option value="Single">Single Deluxe Suite</option>
                            <option value="Double">Two Sharing Studio</option>
                            <option value="Triple">Three Sharing Standard</option>
                            <option value="Quad">Quad Communal Studio</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center px-1 text-slate-500">
                            <Menu className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {tenant.bedNumber && (
                      <div className="bg-[#f05d24]/5 border border-[#f05d24]/10 rounded-2xl p-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <Bed className="w-4 h-4 text-[#f05d24] animate-pulse" />
                          <span className="text-xs font-bold text-slate-200">Your Allotted Bed / Seat Number:</span>
                        </div>
                        <span className="text-xs font-black font-mono text-[#f05d24] bg-[#f05d24]/10 px-3 py-1 rounded-lg border border-[#f05d24]/20">
                          {tenant.bedNumber}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Permanent / Communication Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                        <textarea
                          rows={2}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-750 focus:border-orange-500 rounded-xl pl-9.5 pr-4 py-2.5 text-xs text-slate-200 outline-none transition-all font-sans resize-none"
                          placeholder="e.g. Ward no 12, MG road, Bengaluru Rural, Karnataka, 560001"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide">Personalize Resident Avatar</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-light">
                        Select an high-fidelity avatar preset below or direct-upload your own photograph file. This image is mapped to your high-speed Gate Passes & Incident Board.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                      {/* Live Image Preview Frame */}
                      <div className="md:col-span-4 flex flex-col items-center justify-center">
                        <div className="w-28 h-28 rounded-full bg-slate-950 border-2 border-orange-500/50 p-1 relative group overflow-hidden shadow-[0_0_20px_rgba(241,90,36,0.15)]">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt="Profile Preview"
                              className="w-full h-full object-cover rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-900 border border-dashed border-slate-800 flex items-center justify-center text-slate-600">
                              <Camera className="w-6 h-6" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-full cursor-pointer">
                            <span className="text-[10px] font-mono text-orange-400 tracking-wider">PREVIEW OK</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 mt-2">Active Resident Token</span>
                      </div>

                      {/* Presets and Upload Input */}
                      <div className="md:col-span-8 space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Choose High-Res Preset</span>
                          <div className="flex flex-wrap gap-2">
                            {AVATAR_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => { setPhotoUrl(preset); playCyberBlip(); }}
                                className={`w-11 h-11 rounded-full overflow-hidden border transition-all hover:scale-105 cursor-pointer ${
                                  photoUrl === preset ? 'border-orange-500 scale-105 shadow-[0_0_8px_rgba(241,90,36,0.4)]' : 'border-slate-800'
                                }`}
                              >
                                <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* File Upload Trigger */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block">Or Direct-Upload Custom Photo</label>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 rounded-xl cursor-pointer text-xs font-mono text-slate-300 transition-all select-none">
                              <Upload className="w-3.5 h-3.5 text-orange-400" />
                              {customFileLoading ? "Reading File..." : "Browse Portrait..."}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                                disabled={customFileLoading}
                              />
                            </label>
                            <span className="text-[9px] font-mono text-slate-500">Supports PNG, JPEG (Max 2MB)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                        Understanding Incident Actions
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed font-light">
                        Every concern is tracked dynamically under Zora's Incident Hub. Watch how status logs instantly adapt when property managers review code feedback.
                      </p>
                    </div>

                    {/* Interactive Showcase Frame */}
                    <div className="bg-slate-950 rounded-2xl p-4.5 border border-slate-900 space-y-3.5 shadow-inner">
                      <div className="flex justify-between items-center bg-[#070817] p-2.5 rounded-xl border border-slate-900">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-blue-400" />
                          <div>
                            <span className="text-xs font-bold text-white block">AC cooling issue in Room {roomNumber || '104'}</span>
                            <span className="text-[9px] text-slate-500 font-mono">Simulated Demo Ticket ID: TKT-DEMO</span>
                          </div>
                        </div>

                        {/* Simulated Stage Badge */}
                        <div>
                          {mockTicketStatus === 'pending' && (
                            <span className="px-2.5 py-0.5 bg-amber-950/60 border border-amber-500/20 text-amber-400 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono animate-pulse">
                              Pending Review
                            </span>
                          )}
                          {mockTicketStatus === 'in-progress' && (
                            <span className="px-2.5 py-0.5 bg-blue-900/40 border border-blue-500/30 text-blue-300 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono">
                              In Progress
                            </span>
                          )}
                          {mockTicketStatus === 'resolved' && (
                            <span className="px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-500/20 text-emerald-400 rounded-full text-[9px] font-extrabold uppercase tracking-wider font-mono">
                              Resolved ✓
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Descriptive interactive notification */}
                      <p className="text-xs text-orange-400 leading-relaxed font-medium bg-[#140E0A] p-3 border border-orange-500/15 rounded-xl">
                        {mockTicketFeedback}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-400">
                        <div className="flex items-center gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>Always provide clear description of the room issue.</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 text-[11px]">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          <span>Attach priority so managers assign the correct plumber/HVAC.</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-6 border-t border-slate-900 flex justify-between items-center mt-6">
              <div>
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl border border-slate-805 text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all font-sans text-xs font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-600 font-mono">Resident verified by system checks.</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-500 hover:text-slate-300 transition-all text-xs font-sans font-bold"
                >
                  Skip
                </button>

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-sans text-xs font-bold transition-all shadow-lg shadow-orange-950/30 active:scale-95 cursor-pointer"
                  >
                    Next Phase
                    <ArrowRight className="w-4 h-4 font-extrabold" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishOnboarding}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold transition-all shadow-lg shadow-emerald-950/30 active:scale-95 cursor-pointer neon-glow-emerald"
                  >
                    Finish & Activate Profile
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
