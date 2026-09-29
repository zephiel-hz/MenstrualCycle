"use client";

import React from "react";
import { Clock, CalendarDays, TrendingUp } from "lucide-react";
import { CycleSummaryStats } from "@/lib/calculations/cycle";

interface QuickStatsCardProps {
  stats: CycleSummaryStats;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="surface-card p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-medium text-[#7D7277]">Rata-rata Siklus</span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#221B1F] tracking-tight font-editorial">
              {stats.averageCycleLength}
            </span>
            <span className="text-xs font-medium text-[#7D7277]">hari</span>
          </div>
          <span className="text-[10px] text-[#7D7277] block mt-1">
            {stats.isEstimateBasedOnDefaults ? "Acuan standar awal" : `Berdasarkan ${stats.totalCyclesLogged} siklus`}
          </span>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-5 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EBF4F0] text-[#588B76] flex items-center justify-center">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-medium text-[#7D7277]">Durasi Menstruasi</span>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#221B1F] tracking-tight font-editorial">
              {stats.averagePeriodDuration}
            </span>
            <span className="text-xs font-medium text-[#7D7277]">hari</span>
          </div>
          <span className="text-[10px] text-[#7D7277] block mt-1 truncate">
            {stats.shortestCycle && stats.longestCycle
              ? `Rentang ${stats.shortestCycle}–${stats.longestCycle} hr`
              : "Durasi normal"}
          </span>
        </div>
      </div>
    </div>
  );
};
