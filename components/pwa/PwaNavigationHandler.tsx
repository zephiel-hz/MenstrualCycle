"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export const PwaNavigationHandler: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showExitToast, setShowExitToast] = useState(false);
  const lastBackPressRef = useRef<number>(0);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (pathname === "/dashboard") {
      // When on dashboard, ensure a guard state exists so back press can be intercepted
      try {
        if (!window.history.state?.lunaraGuard) {
          window.history.pushState({ lunaraGuard: true }, "", "/dashboard");
        }
      } catch (err) {
        console.warn("History pushState error:", err);
      }
    }

    const handlePopState = () => {
      // If user is on any subpage (/calendar, /history, /statistics, /settings, /insights),
      // pressing back immediately jumps directly to /dashboard in 1 step!
      if (pathname !== "/dashboard") {
        router.replace("/dashboard");
        return;
      }

      // If user is already on /dashboard and presses back:
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        // Double-back within 2s -> allow exit
        setShowExitToast(false);
        window.history.back();
      } else {
        // First back press on dashboard -> intercept and show prompt
        lastBackPressRef.current = now;
        try {
          window.history.pushState({ lunaraGuard: true }, "", "/dashboard");
        } catch (err) {
          console.warn("History pushState error:", err);
        }

        setShowExitToast(true);
        if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = setTimeout(() => {
          setShowExitToast(false);
          lastBackPressRef.current = 0;
        }, 2000);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
    };
  }, [pathname, router]);

  if (!showExitToast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#2D2727]/90 text-white backdrop-blur-md shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in-50 zoom-in-95 duration-200 pointer-events-none"
    >
      <LogOut className="w-3.5 h-3.5 text-[#E78895]" />
      <span>Tekan sekali lagi untuk keluar</span>
    </div>
  );
};
