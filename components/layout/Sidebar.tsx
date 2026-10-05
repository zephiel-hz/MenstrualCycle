"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  History,
  BarChart3,
  Settings,
  Plus,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  onOpenQuickLog: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenQuickLog }) => {
  const pathname = usePathname();

  const navItems = [
    { label: "Beranda", href: "/dashboard", icon: Home },
    { label: "Kalender Siklus", href: "/calendar", icon: Calendar },
    { label: "Riwayat Menstruasi", href: "/history", icon: History },
    { label: "Statistik & Wawasan", href: "/statistics", icon: BarChart3 },
    { label: "Pengaturan & Akun", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#EFE9E2] bg-[#FBF9F6] p-5 shrink-0 min-h-[calc(100vh-4rem)]">
      <button
        onClick={onOpenQuickLog}
        className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#D8647F] via-[#E27D95] to-[#F3A6B4] text-white font-medium text-xs shadow-sm shadow-[#D8647F]/25 hover:shadow-md hover:shadow-[#D8647F]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
        Catat Kondisi Hari Ini
      </button>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              replace={pathname !== "/dashboard" && item.href !== "/dashboard"}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#FAF0F2] text-[#D8647F] font-semibold border border-[#D8647F]/15 shadow-2xs"
                  : "text-[#7D7277] hover:text-[#221B1F] hover:bg-[#FAF6F3]"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "text-[#D8647F] stroke-[2.2]" : "text-[#7D7277] stroke-[1.8]"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-[#EFE9E2]/80">
        <div className="flex items-center gap-2 text-[11px] text-[#7D7277]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#588B76]" />
          <span>Privacy-First & Terenkripsi</span>
        </div>
      </div>
    </aside>
  );
};
