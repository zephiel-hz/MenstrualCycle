"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __RICILS_PWA_PROMPT__?: BeforeInstallPromptEvent | null;
  }
}

export const PwaInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);

      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .register("/sw.js")
          .catch((err) => {
            console.warn("Service Worker registration error:", err);
          });
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      window.__RICILS_PWA_PROMPT__ = promptEvent;
      window.dispatchEvent(new CustomEvent("ricils:pwa-prompt-available"));

      // Check snooze (24 hours) instead of permanent dismissal
      const dismissedAt = localStorage.getItem("ricils_pwa_dismissed_at");
      if (dismissedAt) {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          return;
        }
      }

      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    const prompt = deferredPrompt || window.__RICILS_PWA_PROMPT__;
    if (!prompt) return;
    prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
      window.__RICILS_PWA_PROMPT__ = null;
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Snooze for 24 hours so it won't annoy, but won't be lost forever
    localStorage.setItem("ricils_pwa_dismissed_at", Date.now().toString());
  };

  if (isStandalone || !showBanner || !deferredPrompt) return null;

  return (
    <aside
      aria-label="Pemasangan Aplikasi Ricil's"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white/95 backdrop-blur-md border border-[#E8E0D5] p-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D8647F] to-[#F3A6B4] flex items-center justify-center text-white shrink-0 shadow-sm">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#221B1F]">Pasang Aplikasi Ricil&apos;s</h4>
            <p className="text-xs text-[#7A6E75] mt-0.5">
              Akses cepat tanpa browser bar, bekerja offline, dan lebih hemat baterai.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#7A6E75] hover:text-[#221B1F] p-1 rounded-full cursor-pointer transition-colors"
          aria-label="Tutup saran pemasangan aplikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs font-medium text-[#7A6E75] hover:bg-[#F2ECE4] rounded-xl transition-colors cursor-pointer"
        >
          Nanti Saja
        </button>
        <button
          onClick={handleInstallClick}
          className="px-4 py-1.5 text-xs font-semibold bg-[#D8647F] hover:bg-[#C5536D] text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
        >
          Pasang Sekarang
        </button>
      </div>
    </aside>
  );
};

