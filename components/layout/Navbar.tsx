"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Moon, LogOut, Settings } from "lucide-react";

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
    <header className="sticky top-0 z-30 w-full bg-[#FAF8F5]/85 backdrop-blur-md border-b border-[#E8E0D5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#E78895] to-[#F3A6B4] flex items-center justify-center text-white shadow-sm shadow-[#E78895]/20 group-hover:scale-105 transition-transform">
            <Moon className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-[#2D2727] tracking-tight">Lunara</span>
              <span className="text-[10px] uppercase font-semibold tracking-widest px-1.5 py-0.5 rounded-full bg-[#FCEEF1] text-[#E78895]">
                PWA
              </span>
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#E8E0D5] hover:border-[#E78895] transition-colors text-sm font-medium text-[#2D2727] cursor-pointer shadow-2xs"
                aria-expanded={dropdownOpen}
              >
                <div className="w-6 h-6 rounded-full bg-[#EBF4F0] text-[#81B29A] flex items-center justify-center text-xs font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
                <span className="hidden sm:inline-block max-w-[120px] truncate text-xs">
                  {user.displayName || user.email.split("@")[0]}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E8E0D5] py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                    <div className="px-4 py-2 border-b border-[#F2ECE4]">
                      <p className="text-xs text-[#79716B]">Masuk sebagai</p>
                      <p className="text-sm font-semibold text-[#2D2727] truncate">
                        {user.displayName || user.email}
                      </p>
                    </div>
                    <Link
                      href="/settings"
                      replace={pathname !== "/dashboard"}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#2D2727] hover:bg-[#FAF8F5] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[#79716B]" />
                      Pengaturan & Privasi
                    </Link>
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#E78895] hover:bg-[#FCEEF1] transition-colors text-left cursor-pointer"
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
                className="px-4 py-2 text-xs font-semibold text-[#2D2727] hover:text-[#E78895] transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-[#E78895] hover:bg-[#d66d7d] rounded-full shadow-sm shadow-[#E78895]/20 transition-all"
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
