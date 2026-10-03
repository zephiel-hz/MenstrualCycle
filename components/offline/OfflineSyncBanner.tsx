"use client";

import React, { useState, useEffect } from "react";
import { useOfflineSync } from "@/lib/offline/useOfflineSync";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";
import { SYNC_EVENTS } from "@/lib/offline/syncManager";

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, isSyncing, pendingCount, triggerSync } = useOfflineSync();
  const [showSyncSuccess, setShowSyncSuccess] = useState(false);

  useEffect(() => {
    const handleSyncComplete = (e: Event) => {
      const detail = (e as CustomEvent<{ syncedCount?: number }>).detail;
      if (detail && detail.syncedCount && detail.syncedCount > 0) {
        setShowSyncSuccess(true);
        const timer = setTimeout(() => {
          setShowSyncSuccess(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncComplete);
    return () => {
      window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncComplete);
    };
  }, []);

  // When online, not syncing, no recent sync message, and no pending mutations, hide
  if (isOnline && !isSyncing && !showSyncSuccess && pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-3 sm:right-6 z-40 max-w-fit animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto select-none"
    >
      {!isOnline ? (
        <div className="px-2.5 py-1 rounded-full bg-[#221B1F]/90 text-white backdrop-blur-md border border-white/15 shadow-md flex items-center gap-2 text-[11px] font-medium">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <WifiOff className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <span>Offline</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] text-white">
              {pendingCount}
            </span>
          )}
        </div>
      ) : isSyncing ? (
        <div className="px-2.5 py-1 rounded-full bg-[#FAF0F2]/95 text-[#8B263E] border border-[#D8647F]/30 shadow-md backdrop-blur-md flex items-center gap-1.5 text-[11px] font-medium">
          <RefreshCw className="w-3.5 h-3.5 text-[#D8647F] animate-spin shrink-0" />
          <span>Menyinkronkan...</span>
        </div>
      ) : showSyncSuccess ? (
        <div className="px-2.5 py-1 rounded-full bg-[#EBF4F0]/95 text-[#2E5E4E] border border-[#588B76]/30 shadow-md backdrop-blur-md flex items-center gap-1.5 text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#588B76] shrink-0" />
          <span>Tersinkron</span>
        </div>
      ) : pendingCount > 0 ? (
        <button
          onClick={() => triggerSync()}
          className="px-2.5 py-1 rounded-full bg-white text-[#221B1F] border border-[#EFE9E2] shadow-md hover:border-[#D8647F]/40 active:scale-95 flex items-center gap-1.5 text-[11px] font-medium cursor-pointer transition-all"
        >
          <CloudUpload className="w-3.5 h-3.5 text-[#D8647F] shrink-0" />
          <span>{pendingCount} tertunda</span>
          <span className="text-[10px] text-[#D8647F] font-semibold underline ml-0.5">
            Sync
          </span>
        </button>
      ) : null}
    </div>
  );
};

