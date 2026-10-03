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
        }, 3500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncComplete);
    return () => {
      window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleSyncComplete);
    };
  }, []);

  // When completely online with 0 pending items and not syncing/success, hide banner
  if (isOnline && !isSyncing && !showSyncSuccess && pendingCount === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-18 md:top-20 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-3 duration-250 pointer-events-auto"
    >
      {!isOnline ? (
        <div className="px-4 py-2.5 rounded-2xl bg-[#221B1F]/90 text-white backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
            <div>
              <span className="font-semibold">Mode Offline</span>
              <span className="text-[#D3CBCF] block text-[11px]">
                {pendingCount > 0
                  ? `${pendingCount} perubahan tersimpan lokal`
                  : "Data tersimpan di perangkat"}
              </span>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#FAF6F3]">
            Auto-sync saat online
          </span>
        </div>
      ) : isSyncing ? (
        <div className="px-4 py-2.5 rounded-2xl bg-[#FAF0F2] text-[#8B263E] border border-[#D8647F]/30 shadow-md backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-[#D8647F] animate-spin shrink-0" />
            <div>
              <span className="font-semibold">Menyinkronkan Perubahan...</span>
              <span className="text-[#8B263E]/80 block text-[11px]">
                Mengirim {pendingCount} data lokal ke server
              </span>
            </div>
          </div>
        </div>
      ) : showSyncSuccess ? (
        <div className="px-4 py-2.5 rounded-2xl bg-[#EBF4F0] text-[#2E5E4E] border border-[#588B76]/30 shadow-md backdrop-blur-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#588B76] shrink-0" />
            <div>
              <span className="font-semibold">Sinkronisasi Berhasil</span>
              <span className="text-[#2E5E4E]/80 block text-[11px]">
                Data lokal telah tersinkron dengan server
              </span>
            </div>
          </div>
        </div>
      ) : pendingCount > 0 ? (
        <div className="px-4 py-2.5 rounded-2xl bg-white text-[#221B1F] border border-[#EFE9E2] shadow-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-[#D8647F] shrink-0" />
            <span className="font-medium text-[11px]">
              {pendingCount} perubahan belum terkirim
            </span>
          </div>
          <button
            onClick={() => triggerSync()}
            className="px-3 py-1 bg-[#D8647F] hover:bg-[#C5536D] active:scale-95 text-white text-[11px] font-semibold rounded-full shadow-2xs transition-all cursor-pointer"
          >
            Sinkronkan Sekarang
          </button>
        </div>
      ) : null}
    </div>
  );
};

