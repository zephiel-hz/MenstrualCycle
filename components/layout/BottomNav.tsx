"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, History, BarChart3, Plus } from "lucide-react";

interface BottomNavProps {
  onOpenQuickLog: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickLog }) => {
  const pathname = usePathname();

  const navItems = [
    { label: "Beranda", href: "/dashboard", icon: Home },
    { label: "Kalender", href: "/calendar", icon: Calendar },
    { label: "Riwayat", href: "/history", icon: History },
    { label: "Wawasan", href: "/statistics", icon: BarChart3 },
  ];

  return (
    <nav
      aria-label="Navigasi Utama"
      className="md:hidden fixed bottom-4 left-4 right-4 z-40 max-w-sm mx-auto pointer-events-auto"
    >
      <div className="glass-panel rounded-full px-3 py-2 flex items-center justify-between shadow-lg shadow-[#D8647F]/10 border border-[#EFE9E2]/80">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              replace={pathname !== "/dashboard" && item.href !== "/dashboard"}
              prefetch={true}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-full transition-all duration-200 active:scale-90 ${
                isActive
                  ? "text-[#D8647F] font-semibold"
                  : "text-[#7D7277] hover:text-[#221B1F]"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  isActive ? "bg-[#FAF0F2]" : ""
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.3]" : "stroke-[1.7]"}`} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Center Tactile Log Button */}
        <div className="relative -my-1">
          <button
            onClick={onOpenQuickLog}
            className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#D8647F] via-[#E27D95] to-[#F3A6B4] text-white flex items-center justify-center shadow-md shadow-[#D8647F]/30 hover:scale-105 active:scale-90 transition-all cursor-pointer"
            aria-label="Catat Kondisi Hari Ini"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || (item.href === "/statistics" && pathname === "/insights");
          return (
            <Link
              key={item.href}
              href={item.href}
              replace={pathname !== "/dashboard" && item.href !== "/dashboard"}
              prefetch={true}
              className={`flex flex-col items-center justify-center w-14 py-1 rounded-full transition-all duration-200 active:scale-90 ${
                isActive
                  ? "text-[#D8647F] font-semibold"
                  : "text-[#7D7277] hover:text-[#221B1F]"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  isActive ? "bg-[#FAF0F2]" : ""
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.3]" : "stroke-[1.7]"}`} />
              </div>
              <span className="text-[10px] font-medium tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
