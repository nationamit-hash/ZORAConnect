/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { playCyberBlip, playBuzzer, playSuccessTone } from '../hooks/useSound';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationBannerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function requestPushPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log("Push notifications permitted.");
          playSuccessTone();
        }
      });
    }
  }
}

export function sendPushNotification(title: string, body: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico' });
    } catch (e) {
      // In some environments, Notification constructor fails. Use service worker fallback.
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, { body });
        });
      }
    }
  }
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          // Select colors based on type for "Dark Tech Living" theme
          let borderClass = "border-blue-500/30 bg-[#0F1026]/90 neon-glow-blue";
          let icon = <Info className="text-blue-400 w-5 h-5 flex-shrink-0" />;
          let glowDot = "bg-blue-500 text-glow-blue";

          if (toast.type === 'success') {
            borderClass = "border-emerald-500/30 bg-[#0B1C16]/90 neon-glow-emerald";
            icon = <CheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />;
            glowDot = "bg-emerald-500 text-glow-emerald";
          } else if (toast.type === 'warning') {
            borderClass = "border-amber-500/30 bg-[#241B0E]/90 neon-glow-amber";
            icon = <AlertTriangle className="text-amber-400 w-5 h-5 flex-shrink-0" />;
            glowDot = "bg-amber-500 text-glow-amber";
          } else if (toast.type === 'error') {
            borderClass = "border-orange-500/30 bg-[#240D0E]/90 neon-glow-orange";
            icon = <X className="text-orange-400 w-5 h-5 flex-shrink-0" />;
            glowDot = "bg-orange-500 text-glow-orange";
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl relative ${borderClass}`}
            >
              {/* Pulsing indicator dot */}
              <div className="absolute top-2 right-2 flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${glowDot}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${glowDot}`}></span>
              </div>

              {icon}

              <div className="flex-1 pr-6">
                <h4 className="text-sm font-semibold tracking-wide text-white font-sans">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-sans">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
