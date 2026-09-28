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
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-lg border-t border-[#E8E0D5] pb-safe">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto relative">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center w-14 py-1.5 transition-all active:scale-90 rounded-xl ${
                isActive ? "text-[#E07A5F] font-semibold" : "text-[#79716B] hover:text-[#2D2727]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        <div className="relative -top-3">
          <button
            onClick={onOpenQuickLog}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#E07A5F] to-[#F4A261] text-white flex items-center justify-center shadow-lg shadow-[#E07A5F]/35 hover:scale-105 active:scale-90 transition-all cursor-pointer"
            aria-label="Catat Hari Ini"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href === "/statistics" && pathname === "/insights");
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center w-14 py-1.5 transition-all active:scale-90 rounded-xl ${
                isActive ? "text-[#E07A5F] font-semibold" : "text-[#79716B] hover:text-[#2D2727]"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
