"use client";

import React from "react";
import { Clock, CalendarDays } from "lucide-react";
import { CycleSummaryStats } from "@/lib/calculations/cycle";

interface QuickStatsCardProps {
  stats: CycleSummaryStats;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      <div className="card-soft p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#79716B]">
          <CalendarDays className="w-4 h-4 text-[#E07A5F]" />
          <span>Rata-rata Siklus</span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#2D2727]">
              {stats.averageCycleLength}
            </span>
            <span className="text-xs text-[#79716B]">Hari</span>
          </div>
          <span className="text-[10px] text-[#79716B] block mt-0.5">
            {stats.isEstimateBasedOnDefaults ? "Estimasi standar" : `Berdasarkan ${stats.totalCyclesLogged} siklus`}
          </span>
        </div>
      </div>

      <div className="card-soft p-4 flex flex-col justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#79716B]">
          <Clock className="w-4 h-4 text-[#81B29A]" />
          <span>Durasi Menstruasi</span>
        </div>
        <div className="mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#2D2727]">
              {stats.averagePeriodDuration}
            </span>
            <span className="text-xs text-[#79716B]">Hari</span>
          </div>
          <span className="text-[10px] text-[#79716B] block mt-0.5">
            {stats.shortestCycle && stats.longestCycle
              ? `Rentang ${stats.shortestCycle}–${stats.longestCycle} hr`
              : "Estimasi normal"}
          </span>
        </div>
      </div>
    </div>
  );
};
