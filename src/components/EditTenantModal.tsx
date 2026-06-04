/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, User, Home, DollarSign, FileText, AlertTriangle, CheckCircle2, Key } from 'lucide-react';
import { Tenant } from '../types';

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  onSaveTenant: (updatedTenant: Tenant) => void;
  currentUserRole?: 'tenant' | 'manager' | 'employee';
}

export const EditTenantModal: React.FC<EditTenantModalProps> = ({ 
  isOpen, 
  onClose, 
  tenant, 
  onSaveTenant,
  currentUserRole = 'tenant'
}) => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isTenant = currentUserRole === 'tenant';

  // Group 1: Personal Info
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mailId, setMailId] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [password, setPassword] = useState('');

  // Group 2: Stay Details
  const [roomNumber, setRoomNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [sharingType, setSharingType] = useState('Double');
  const [residingSince, setResidingSince] = useState('');
  const [statusBadge, setStatusBadge] = useState<'hostel' | 'leave' | 'late'>('hostel');
  const [gender, setGender] = useState('Male');
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState('');

  // Group 3: Financials
  const [rentAmount, setRentAmount] = useState(11000);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'overdue'>('pending');
  const [dueDate, setDueDate] = useState('');
  const [securityDepositAmount, setSecurityDepositAmount] = useState(15000);
  const [securityDepositStatus, setSecurityDepositStatus] = useState<'paid' | 'pending' | 'refunded'>('paid');

  // Group 4: Documents
  const [idProofType, setIdProofType] = useState('Passport');
  const [idProofStatus, setIdProofStatus] = useState<'verified' | 'pending' | 'rejected'>('verified');

  // Load existing data
  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setPhoneNumber(tenant.phoneNumber || '');
      setMailId(tenant.mailId || '');
      setEmergencyContact(tenant.emergencyContact || '');
      setPassword(tenant.password || 'welcome123');

      setRoomNumber(tenant.roomNumber || '');
      setBedNumber(tenant.bedNumber || '');
      setSharingType(tenant.sharingType || 'Double');
      setResidingSince(tenant.residingSince || '');
      setStatusBadge(tenant.statusBadge || 'hostel');
      setGender(tenant.gender || 'Male');
      setPhotoUrl(tenant.photoUrl || '');
      setAddress(tenant.address || '');

      setRentAmount(tenant.rentAmount || 11000);
      setPaymentStatus(tenant.paymentStatus || 'pending');
      setDueDate(tenant.dueDate || '');
      setSecurityDepositAmount(tenant.securityDepositAmount || 15000);
      setSecurityDepositStatus(tenant.securityDepositStatus || 'paid');

      setIdProofType(tenant.idProofType || 'Passport');
      setIdProofStatus(tenant.idProofStatus || 'verified');

      setError('');
      setSuccess('');
    }
  }, [tenant, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!name.trim()) {
      setError('Please provide a full guest name.');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Please provide a room number.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please provide a working phone number.');
      return;
    }
    if (!mailId.trim()) {
      setError('Please provide a registered email Address.');
      return;
    }

    const updatedTenant: Tenant = {
      ...tenant,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      mailId: mailId.trim(),
      emergencyContact: emergencyContact.trim(),
      password: password.trim() || 'welcome123',

      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber.trim() || undefined,
      sharingType,
      residingSince,
      statusBadge,
      gender,
      photoUrl: photoUrl.trim(),
      address: address.trim(),

      rentAmount: Number(rentAmount),
      paymentStatus,
      dueDate,
      securityDepositAmount: Number(securityDepositAmount),
      securityDepositStatus,

      idProofType,
      idProofStatus,
    };

    onSaveTenant(updatedTenant);
    setSuccess(`Updated parameters for guest: ${name}`);
    setTimeout(() => {
      setSuccess('');
      onClose();
    }, 1000);
  };

  return (
    <AnimatePresence>
      {isOpen && tenant && (
        <div id="edit-tenant-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/75 backdrop-blur-sm">
          {/* Backdrop wrapper click handle */}
          <div className="absolute inset-0 cursor-default" onClick={onClose} />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-2xl bg-[#090b1c] border border-slate-800 rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-850 bg-[#0c0f2b] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide font-sans flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Comprehensive Profile Customization Center
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Adjust and sync parameters for resident UID: <span className="font-mono text-blue-400 font-bold">{tenant.tenantId}</span>
                </p>
              </div>
              <button
                id="edit-modal-close-btn"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto max-h-[75vh] p-6 space-y-6">
              {error && (
                <div className="flex gap-2 p-3 bg-red-950/25 border border-red-550/30 rounded-xl text-red-400 text-xs items-center animate-shake">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="flex gap-2 p-3 bg-emerald-950/25 border border-emerald-550/30 rounded-xl text-emerald-400 text-xs items-center">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {/* SECTION 1: Personal Info */}
              <div className="space-y-3 bg-slate-900/45 p-4 rounded-xl border border-slate-850">
                <h4 className="text-[11px] uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                  <User className="w-3.5 h-3.5" />
                  1. Personal Identification & Info
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Resident Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Primary Phone Number</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      placeholder="e.g. +1 (555) 019-2834"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Registered Email ID</label>
                    <input
                      type="email"
                      value={mailId}
                      onChange={(e) => setMailId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      placeholder="e.g. email@provider.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Emergency Contact (Name & Phone)</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      placeholder="e.g. Sarah Doe (Mother): +1 (555) 012-3456"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 1.5: Security & Portal Login Password */}
              <div className="space-y-3 bg-slate-900/45 p-4 rounded-xl border border-slate-850">
                <h4 className="text-[11px] uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Account Security & Login Password
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Login Password</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors font-mono"
                      placeholder="e.g. welcome123"
                    />
                  </div>
                  <div className="text-[11px] text-slate-450 flex items-center bg-slate-950/45 p-3 rounded-lg border border-slate-850/80">
                    <p className="leading-relaxed">
                      This password allows the resident to securely sign in with matching Registered Email ID: <span className="font-mono text-blue-500 font-bold">{mailId || 'no email'}</span>.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Stay Details */}
              {!isTenant && (
                <div className="space-y-3 bg-slate-900/45 p-4 rounded-xl border border-slate-850">
                  <h4 className="text-[11px] uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                    <Home className="w-3.5 h-3.5" />
                    2. Room, Allotment & State Details
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Assigned Room
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors font-mono font-bold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Bed / Seat Number
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <input
                        type="text"
                        value={bedNumber}
                        onChange={(e) => setBedNumber(e.target.value)}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors font-mono font-semibold text-orange-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                        placeholder="e.g. Bed A, Seat 1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Bed/Sharing Type
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <select
                        value={sharingType}
                        onChange={(e) => setSharingType(e.target.value)}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      >
                        <option value="Single">Single Deluxe</option>
                        <option value="Double">Double Shared</option>
                        <option value="Triple">Triple Shared</option>
                        <option value="Quadruple">Quad Shared</option>
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Move-in Date
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <input
                        type="date"
                        value={residingSince}
                        onChange={(e) => setResidingSince(e.target.value)}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Presence Status</label>
                      <select
                        value={statusBadge}
                        onChange={(e) => setStatusBadge(e.target.value as 'hostel' | 'leave' | 'late')}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      >
                        <option value="hostel">🏠 In Hostel</option>
                        <option value="leave">✈ On Vacation</option>
                        <option value="late">⏰ Under Late curfew</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Resident Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1 col-span-2 lg:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Profile Photo Link</label>
                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Permanent Home Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter permanent residency details..."
                      rows={2}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none resize-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* SECTION 3: Financials */}
              {!isTenant && (
                <div className="space-y-3 bg-slate-900/45 p-4 rounded-xl border border-slate-850">
                  <h4 className="text-[11px] uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    3. Financial Agreement & Security Ledger
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Agreed Monthly Rent ($)
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <input
                        type="number"
                        value={rentAmount}
                        onChange={(e) => setRentAmount(Number(e.target.value))}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Rent Due Date
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none transition-colors font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      />
                    </div>
                    <div className="space-y-1 col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Rent Invoice Status
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value as 'paid' | 'pending' | 'overdue')}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      >
                        <option value="paid">✅ Paid (Clear)</option>
                        <option value="pending">⏳ Pending Clearance</option>
                        <option value="overdue">🚨 Overdue Penalty</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Security Deposit Amount ($)
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <input
                        type="number"
                        value={securityDepositAmount}
                        onChange={(e) => setSecurityDepositAmount(Number(e.target.value))}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Security Deposit Status
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <select
                        value={securityDepositStatus}
                        onChange={(e) => setSecurityDepositStatus(e.target.value as 'paid' | 'pending' | 'refunded')}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      >
                        <option value="paid">🟢 Fully Paid & Held</option>
                        <option value="pending">🟡 Pending Payment</option>
                        <option value="refunded">⚪ Refunded on Departure</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 4: Documents */}
              {!isTenant && (
                <div className="space-y-3 bg-slate-900/45 p-4 rounded-xl border border-slate-850">
                  <h4 className="text-[11px] uppercase font-extrabold text-blue-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800/60 pb-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    4. Verification Documents & Badges
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Government ID Proof Category</label>
                      <select
                        value={idProofType}
                        onChange={(e) => setIdProofType(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors"
                      >
                        <option value="Passport">Passport Identification</option>
                        <option value="National ID Card">National ID Card / Aadhaar</option>
                        <option value="Driving License">Driving License</option>
                        <option value="Social Security Card">Social Security Proof</option>
                        <option value="Student Card">University / Office ID Badge</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        Verification State
                        {isTenant && <span className="text-[8px] text-orange-400 lowercase font-normal">(manager only)</span>}
                      </label>
                      <select
                        value={idProofStatus}
                        onChange={(e) => setIdProofStatus(e.target.value as 'verified' | 'pending' | 'rejected')}
                        disabled={isTenant}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950/60"
                      >
                        <option value="verified">🛡️ Checked & Verified</option>
                        <option value="pending">⌛ Review In Progress</option>
                        <option value="rejected">❌ Verification Failed / Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Operations footer banner inside form */}
              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3 bg-[#090b1c]">
                <button
                  type="button"
                  id="edit-modal-cancel-btn"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-transparent border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="edit-modal-save-btn"
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-900/20 active:scale-95 flex items-center gap-1.5 cursor-pointer ml-1"
                >
                  <Save className="w-4 h-4" />
                  Save Resident Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
