/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, ClipboardPaste, UserPlus, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Tenant } from '../types';

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: Tenant) => void;
  onBatchUpload: (tenants: Tenant[]) => void;
}

export const AddTenantModal: React.FC<AddTenantModalProps> = ({ isOpen, onClose, onAddTenant, onBatchUpload }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Single Tenant Form States
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [bedNumber, setBedNumber] = useState('');
  const [sharingType, setSharingType] = useState('Double');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mailId, setMailId] = useState('');
  const [password, setPassword] = useState('welcome123');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('Male');
  const [residingSince, setResidingSince] = useState(new Date().toISOString().split('T')[0]);

  // Batch CSV Paste State
  const [csvContent, setCsvContent] = useState('');

  const resetForm = () => {
    setName('');
    setRoomNumber('');
    setBedNumber('');
    setSharingType('Double');
    setPhoneNumber('');
    setMailId('');
    setPassword('welcome123');
    setAddress('');
    setGender('Male');
    setResidingSince(new Date().toISOString().split('T')[0]);
    setCsvContent('');
    setError('');
    setSuccess('');
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomNumber.trim() || !phoneNumber.trim() || !mailId.trim()) {
      setError('Please fill in all core credentials (Name, Room, Phone, Mail).');
      return;
    }

    const uniqueId = "T" + Math.floor(100 + Math.random() * 900);
    // Assign custom avatars based on gender
    const defaultAvatar = gender.toLowerCase() === 'female'
      ? "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";

    const newTenant: Tenant = {
      tenantId: uniqueId,
      name: name.trim(),
      roomNumber: roomNumber.trim(),
      bedNumber: bedNumber.trim() || undefined,
      sharingType,
      phoneNumber: phoneNumber.trim(),
      mailId: mailId.trim(),
      password: password || 'welcome123',
      address: address.trim() || 'Not specified',
      gender,
      residingSince,
      photoUrl: defaultAvatar,
      createdAt: new Date().toISOString(),
      statusBadge: 'hostel',
      rentAmount: sharingType === 'Single' ? 15000 : sharingType === 'Double' ? 11000 : 8500,
      paymentStatus: 'pending',
      dueDate: '2026-06-05'
    };

    onAddTenant(newTenant);
    setSuccess(`Successfully premium enrolled: ${name}`);
    setTimeout(() => {
      resetForm();
      onClose();
    }, 1500);
  };

  const handleBatchParse = () => {
    if (!csvContent.trim()) {
      setError('Please paste your CSV data.');
      return;
    }

    try {
      // CSV parser logic
      const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        throw new Error('CSV is empty or invalid.');
      }

      // Check header or parse lines directly
      const parsedTenants: Tenant[] = [];
      let startIdx = 0;

      // Determine if there is a header match (helpful for skipping Headers)
      if (lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('room')) {
        startIdx = 1;
      }

      for (let i = startIdx; i < lines.length; i++) {
        // Handle split by comma, handling potential quotes
        const columns = lines[i].split(',').map(col => col.replace(/^["']|["']$/g, '').trim());
        if (columns.length < 4) {
          throw new Error(`Line ${i + 1} has insufficient columns. Required format: Name, Room, Phone, Email, [Gender], [Sharing], [Since], [Address], [Password], [BedNumber]`);
        }

        const rawName = columns[0];
        const rawRoom = columns[1];
        const rawPhone = columns[2];
        const rawEmail = columns[3];
        const rawGender = columns[4] || 'Male';
        const rawSharing = columns[5] || 'Double';
        const rawSince = columns[6] || new Date().toISOString().split('T')[0];
        const rawAddr = columns[7] || 'Not specified';
        const rawPwd = columns[8] || 'welcome123';
        const rawBed = columns[9] || '';

        const uniqueId = "T" + Math.floor(1000 + Math.random() * 9000);
        const avatar = rawGender.toLowerCase() === 'female'
          ? "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150"
          : "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150";

        const rentAmt = rawSharing === 'Single' ? 15000 : rawSharing === 'Double' ? 11000 : 8500;
        parsedTenants.push({
          tenantId: uniqueId,
          name: rawName,
          roomNumber: rawRoom,
          bedNumber: rawBed || undefined,
          sharingType: rawSharing,
          phoneNumber: rawPhone,
          mailId: rawEmail,
          gender: rawGender,
          residingSince: rawSince,
          address: rawAddr,
          password: rawPwd,
          photoUrl: avatar,
          createdAt: new Date().toISOString(),
          statusBadge: 'hostel',
          rentAmount: rentAmt,
          paymentStatus: 'pending',
          dueDate: '2026-06-05'
        });
      }

      if (parsedTenants.length === 0) {
        throw new Error('No valid tenant structures parsed.');
      }

      onBatchUpload(parsedTenants);
      setSuccess(`Parsed and imported total ${parsedTenants.length} tenants successfully!`);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1800);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error parsing CSV records. Make sure values are separated by commas.');
    }
  };

  const loadCsvTemplate = () => {
    setCsvContent(
      `Name, Room, Phone, Email, Gender, SharingType, ResidingSince, PermanentAddress, Password\n` +
      `Sienna Miller, 401C, +1 555-5231, sienna@zora.com, Female, Single, 2025-04-12, 102 Westside Dr NY, sienna99\n` +
      `Devan Patel, 203B, +1 555-9081, devan@zora.com, Male, Double, 2025-05-01, 45 Central Ring Rd Mumbai, dev123`
    );
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
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#080816] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative z-10 flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-800 bg-[#0C0D26] flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide font-sans flex items-center gap-2">
                  <UserPlus className="text-blue-400 w-5 h-5" />
                  Roster Enrollment Console
                </h3>
                <p className="text-xs text-slate-400 mt-1">Register new residents into Zora Smart Portal</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-850 bg-slate-950/40 p-2">
              <button
                onClick={() => { setActiveTab('single'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'single'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Single Residence Entry
              </button>
              <button
                onClick={() => { setActiveTab('batch'); setError(''); setSuccess(''); }}
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all ${
                  activeTab === 'batch'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                CSV Batch Upload
              </button>
            </div>

            {/* Inner Content */}
            <div className="p-6 overflow-y-auto max-h-[65vh]">
              {error && (
                <div className="mb-4 flex gap-2 p-3 bg-red-950/20 border border-red-550/30 rounded-xl text-red-400 text-xs items-center">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              {success && (
                <div className="mb-4 flex gap-2 p-3 bg-emerald-950/20 border border-emerald-550/30 rounded-xl text-emerald-400 text-xs items-center">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {activeTab === 'single' ? (
                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full Guest Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Elena Rostova"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Room Number</label>
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g., 302A"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bed / Seat Number</label>
                      <input
                        type="text"
                        value={bedNumber}
                        onChange={(e) => setBedNumber(e.target.value)}
                        placeholder="e.g., Bed A, Seat 1"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sharing Type</label>
                      <select
                        value={sharingType}
                        onChange={(e) => setSharingType(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="Single">Single Room</option>
                        <option value="Double">Double Sharing</option>
                        <option value="Triple">Triple Sharing</option>
                        <option value="Quadruple">Quad Sharing</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+1 555-0391"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</label>
                      <input
                        type="email"
                        value={mailId}
                        onChange={(e) => setMailId(e.target.value)}
                        placeholder="elena@mail.com"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Default password</label>
                      <input
                        type="text"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="welcome123"
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Residing Since</label>
                      <input
                        type="date"
                        value={residingSince}
                        onChange={(e) => setResidingSince(e.target.value)}
                        className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Permanent Address</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, City, State, ZIP details..."
                      rows={2}
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none resize-none"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 text-slate-500 hover:text-slate-350 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-900/10 active:scale-95 cursor-pointer"
                    >
                      Enroll Resident
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-950/15 border border-blue-500/20 rounded-xl flex gap-2.5 text-xs text-blue-300">
                    <Info className="w-5 h-5 flex-shrink-0 text-blue-400" />
                    <div>
                      <p className="font-semibold">CSV Roster Import Guide</p>
                      <p className="mt-0.5 text-slate-400">
                        Paste comma-separated rows. Required values: <code className="font-mono text-[10px] text-blue-200 bg-slate-900 px-1 py-0.5 rounded">Name, Room, Phone, Email</code>.
                        Additional values include Gender, SharingType, Date, PermanentAddress, and Password.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Paste CSV Rows Below</span>
                    <button
                      onClick={loadCsvTemplate}
                      className="text-[10px] flex items-center gap-1.5 text-slate-400 hover:text-blue-400 font-bold tracking-wider uppercase underline decoration-blue-500/30 font-sans cursor-pointer transition-colors"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      Load Dummy CSV Template
                    </button>
                  </div>

                  <textarea
                    value={csvContent}
                    onChange={(e) => setCsvContent(e.target.value)}
                    placeholder={`e.g.,\nElena Rostova, 302A, +1 555-0192, elena@zora.com, Female, Single, 2025-01-15\nMarcus Vance, 105B, +1 555-0143, marcus@zora.com, Male, Double, 2025-02-10`}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl p-4 text-[11px] font-mono text-slate-300 leading-relaxed outline-none"
                  />

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-800 text-slate-500 hover:text-slate-350 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBatchParse}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-md shadow-blue-900/10 active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      Bulk Import
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
