/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, FileImage, ShieldAlert, CheckCircle, HelpCircle, MapPin, Calendar, Camera, Trash } from 'lucide-react';
import { LostFoundItem } from '../types';

interface RaiseLostFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    type: 'lost' | 'found';
    location: string;
    dateStr: string;
    photoUrl: string;
  }) => void;
}

export const RaiseLostFoundModal: React.FC<RaiseLostFoundModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [type, setType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Maximum file size is 2MB to ensure premium performance.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPhotoUrl(e.target.result as string);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setPhotoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify what item you have lost or found.");
      return;
    }
    if (title.length < 4) {
      setError("Title is too short. Please describe the item beautifully.");
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError("Please specify a description about the item (minimum 10 characters). Code of conduct requires proper details.");
      return;
    }
    if (!location.trim()) {
      setError("Please suggest a location where the item was lost or found.");
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      location: location.trim(),
      dateStr,
      photoUrl
    });

    // Reset state values
    setTitle('');
    setDescription('');
    setLocation('');
    setDateStr(new Date().toISOString().split('T')[0]);
    setPhotoUrl('');
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
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="bg-[#0A0B1A] border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col my-8"
          >
            {/* Header segment of Modal */}
            <div className="p-6 border-b border-[#1A1B35] bg-[#0E0F26] flex justify-between items-center">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-sans flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full animate-pulse blur-[1px] ${
                    type === 'lost' ? 'bg-orange-500' : 'bg-[#f6aa8e]'
                  }`}></span>
                  Broadcast Lost & Found Item
                </h3>
                <p className="text-[11px] text-slate-400 font-sans tracking-wide mt-1">
                  Keep your PG community securely sync'd about lost or found properties.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-450 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[72vh] space-y-5">
              {error && (
                <div className="p-3.5 bg-orange-950/20 border border-orange-500/20 rounded-xl text-orange-400 text-xs font-mono leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Type Switcher Picker */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                  Broadcast Classification Category
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setType('lost')}
                    className={`pyr-3 py-2.5 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      type === 'lost'
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-md shadow-orange-500/5'
                        : 'bg-slate-950/60 border-[#1A1B35] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Search className="w-4 h-4 text-orange-500" />
                    I Lost an Item 🚨
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('found')}
                    className={`pyr-3 py-2.5 px-4 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      type === 'found'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/5'
                        : 'bg-slate-950/60 border-[#1A1B35] text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    I Found an Item ✨
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                  Item Name / Short Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leather Wallet, Gold Chain, Laptop Charger, Gate Keys"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-slate-500 transition-colors"
                />
              </div>

              {/* Grid with Location & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                    Approximate Location Spot
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-550" />
                    <input
                      type="text"
                      placeholder="e.g. 2nd Floor Dining Lounge Area"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-700 outline-none focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                    Date of Occurrence
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-550" />
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-slate-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Long Description Text area */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                  Detailed Description & Identifying Marks
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the colors, logos, size, key accessories, or other identifiers to help verify ownership..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-755 outline-none focus:border-slate-500 transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Image drag and drop component */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono block">
                  Item Photograph / Picture (Supports Drag & Drop)
                </label>
                
                {photoUrl ? (
                  <div className="relative rounded-xl border border-slate-850 overflow-hidden bg-slate-950 h-44 flex items-center justify-center group">
                    <img
                      src={photoUrl}
                      alt="Lost found preview"
                      className="h-full w-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleSelectFileClick}
                        className="p-2.5 rounded-full bg-white/15 hover:bg-white/20 border border-white/20 text-white text-xs transition-colors cursor-pointer"
                        title="Upload alternative photo"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="p-2.5 rounded-full bg-red-800/80 hover:bg-red-850/95 border border-red-500/25 text-white text-xs transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={handleSelectFileClick}
                    className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                      dragActive
                        ? 'border-orange-500 bg-orange-500/5'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
                    }`}
                  >
                    <FileImage className="w-8 h-8 text-slate-600 mb-2.5 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-slate-350 block">
                      Drag & Drop image here or <span className="text-[#f6aa8e] underline">browse files</span>
                    </span>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">
                      PNG, JPG, or WEBP up to 2MB
                    </span>
                  </div>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-[#1A1B35] pt-5 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-[#1A1B35] rounded-xl text-slate-400 hover:bg-[#12132D] text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f05d24] to-[#f6aa8e] hover:brightness-105 text-white text-xs font-black uppercase tracking-wider shadow-md shadow-[#f05d24]/10 transition-all cursor-pointer"
                >
                  Submit Incident Post
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
