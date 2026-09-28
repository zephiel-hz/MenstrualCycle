"use client";

import React, { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PwaInstaller: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered with scope:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = localStorage.getItem("lunara_pwa_dismissed");
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("lunara_pwa_dismissed", "true");
  };

  if (!showBanner || !deferredPrompt) return null;

  return (
    <aside
      aria-label="Pemasangan Aplikasi Lunara"
      className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white border border-[#E8E0D5] p-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] flex items-center justify-center text-white shrink-0 shadow-sm">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-[#2D2727]">Pasang Lunara App</h4>
            <p className="text-xs text-[#79716B] mt-0.5">
              Gunakan Lunara sebagai aplikasi mandiri di perangkatmu dengan akses cepat dan mulus.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-[#79716B] hover:text-[#2D2727] p-1 rounded-full cursor-pointer"
          aria-label="Tutup saran pemasangan aplikasi"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs font-medium text-[#79716B] hover:bg-[#F2ECE4] rounded-lg transition-colors cursor-pointer"
        >
          Nanti Saja
        </button>
        <button
          onClick={handleInstallClick}
          className="px-4 py-1.5 text-xs font-semibold bg-[#E07A5F] hover:bg-[#d0694e] text-white rounded-lg shadow-sm transition-all cursor-pointer"
        >
          Pasang Sekarang
        </button>
      </div>
    </aside>
  );
};
