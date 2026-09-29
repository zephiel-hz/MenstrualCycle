"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Moon, LogOut, Settings, Sparkles } from "lucide-react";

interface NavbarProps {
  user?: {
    email: string;
    displayName?: string | null;
  } | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST", headers: { "bypass-tunnel-reminder": "true" } });
      router.push("/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FBF9F6]/85 backdrop-blur-xl border-b border-[#EFE9E2]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D8647F] via-[#E27D95] to-[#F3A6B4] flex items-center justify-center text-white shadow-sm shadow-[#D8647F]/25 group-hover:scale-105 transition-all duration-200">
            <Moon className="w-4 h-4 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg text-[#221B1F] tracking-tight font-editorial">
                Lunara
              </span>
              <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0F2] text-[#D8647F] border border-[#D8647F]/15">
                WELLNESS
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#EFE9E2] hover:border-[#D8647F]/40 transition-all text-xs font-medium text-[#221B1F] cursor-pointer shadow-xs active:scale-95"
                aria-expanded={dropdownOpen}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#FAF0F2] to-[#F6E2E7] text-[#D8647F] border border-[#D8647F]/20 flex items-center justify-center text-xs font-bold shadow-2xs">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-medium">
                  {user.displayName || user.email.split("@")[0]}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-[#EFE9E2] py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-[#F5EFEB]">
                      <p className="text-[11px] font-medium text-[#7D7277]">Masuk sebagai</p>
                      <p className="text-xs font-semibold text-[#221B1F] truncate mt-0.5">
                        {user.displayName || user.email}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      replace={pathname !== "/dashboard"}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#221B1F] hover:bg-[#FAF6F3] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#7D7277]" />
                      Pengaturan & Privasi
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#D8647F] hover:bg-[#FAF0F2] transition-colors text-left cursor-pointer disabled:opacity-50"
                    >
                      <LogOut className="w-4 h-4" />
                      {isLoggingOut ? "Keluar..." : "Keluar"}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-[#221B1F] hover:text-[#D8647F] transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-medium text-white bg-[#D8647F] hover:bg-[#C5536D] rounded-full shadow-sm shadow-[#D8647F]/20 transition-all active:scale-95"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
