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
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Kalender", href: "/calendar", icon: Calendar },
    { label: "Riwayat Siklus", href: "/history", icon: History },
    { label: "Statistik & Wawasan", href: "/statistics", icon: BarChart3 },
    { label: "Pengaturan & Privasi", href: "/settings", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[#E8E0D5] bg-[#FAF8F5] p-5 shrink-0 min-h-[calc(100vh-4rem)]">
      <button
        onClick={onOpenQuickLog}
        className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#E07A5F] to-[#F4A261] text-white font-semibold text-sm shadow-md shadow-[#E07A5F]/20 hover:shadow-lg hover:shadow-[#E07A5F]/30 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        Catat Hari Ini
      </button>

      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#FCECE8] text-[#E07A5F] font-semibold"
                  : "text-[#79716B] hover:text-[#2D2727] hover:bg-[#F2ECE4]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#E07A5F]" : "text-[#79716B]"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-[#E8E0D5]/60">
        <div className="flex items-center gap-2 text-xs text-[#79716B]">
          <ShieldCheck className="w-4 h-4 text-[#81B29A]" />
          <span>Serverless & Privacy-First</span>
        </div>
      </div>
    </aside>
  );
};
