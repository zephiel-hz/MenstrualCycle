"use client";

import React, { useEffect, useState } from "react";
import { Bell, X, CheckCircle2 } from "lucide-react";

export const NotificationPermissionPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [justGranted, setJustGranted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    // If permission is already granted or denied, do not show prompt
    if (Notification.permission === "granted" || Notification.permission === "denied") {
      return;
    }

    // Try requesting permission immediately on first app open
    const tryImmediateRequest = async () => {
      try {
        let perm: NotificationPermission = Notification.permission;
        if (perm === "default") {
          try {
            perm = await Notification.requestPermission();
          } catch {
            perm = await new Promise((resolve) => Notification.requestPermission(resolve));
          }
        }

        if (perm === "granted") {
          sendWelcomeNotification();
          return;
        }
      } catch (err) {
        // Some browsers (e.g. Safari / strict user-gesture policies) require user interaction
        console.warn("Direct notification request requires user interaction:", err);
      }

      // If still default, check snooze and show interactive banner prompt
      const dismissedAt = localStorage.getItem("ricils_notif_prompt_dismissed_at");
      if (dismissedAt) {
        const timeDiff = Date.now() - parseInt(dismissedAt, 10);
        if (timeDiff < 24 * 60 * 60 * 1000) {
          return;
        }
      }

      setShowPrompt(true);
    };

    // Small delay to ensure smooth page render
    const timer = setTimeout(tryImmediateRequest, 800);
    return () => clearTimeout(timer);
  }, []);

  const sendWelcomeNotification = () => {
    const title = "🌸 Notifikasi Ricil's Aktif";
    const body = "Pengingat siklus menstruasi dan fase PMS Anda siap memberi tahu tepat waktu!";

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg && reg.showNotification) {
          reg.showNotification(title, {
            body,
            icon: "/icons/icon-192.svg",
            tag: "ricils-welcome-notif",
          });
        } else {
          new Notification(title, { body, icon: "/icons/icon-192.svg" });
        }
      }).catch(() => {
        new Notification(title, { body, icon: "/icons/icon-192.svg" });
      });
    } else {
      new Notification(title, { body, icon: "/icons/icon-192.svg" });
    }
  };

  const handleRequestPermission = async () => {
    try {
      setIsRequesting(true);
      let perm: NotificationPermission = Notification.permission;

      try {
        perm = await Notification.requestPermission();
      } catch {
        perm = await new Promise((resolve) => Notification.requestPermission(resolve));
      }

      if (perm === "granted") {
        setJustGranted(true);
        sendWelcomeNotification();
        setTimeout(() => {
          setShowPrompt(false);
        }, 2500);
      } else {
        setShowPrompt(false);
      }
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      setShowPrompt(false);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("ricils_notif_prompt_dismissed_at", Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Permintaan Izin Notifikasi Ricil's"
      className="fixed bottom-24 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 bg-white/95 backdrop-blur-md border border-[#E8E0D5] p-4 rounded-2xl shadow-xl z-50 animate-in slide-in-from-bottom duration-300"
    >
      {justGranted ? (
        <div className="flex items-center gap-3 text-green-700 py-1">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[#2D2727]">Notifikasi Diaktifkan!</h4>
            <p className="text-[11px] text-[#79716B] mt-0.5">
              Anda akan menerima pengingat saat fase PMS dan siklus haid tiba.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E78895] to-[#F3A6B4] flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#2D2727]">Aktifkan Pengingat Siklus</h4>
                <p className="text-xs text-[#79716B] mt-0.5">
                  Dapatkan notifikasi otomatis saat memasuki fase PMS dan saat mendekati jadwal haidmu.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-[#79716B] hover:text-[#2D2727] p-1 rounded-full cursor-pointer transition-colors"
              aria-label="Tutup saran notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex gap-2 justify-end">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs font-medium text-[#79716B] hover:bg-[#F2ECE4] rounded-xl transition-colors cursor-pointer"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="px-4 py-1.5 text-xs font-semibold bg-[#E78895] hover:bg-[#d66d7d] text-white rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-60"
            >
              {isRequesting ? "Memproses..." : "Aktifkan Sekarang"}
            </button>
          </div>
        </>
      )}
    </aside>
  );
};
