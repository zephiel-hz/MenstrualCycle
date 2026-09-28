"use client";

import React from "react";
import {
  BarChart2,
  CheckCircle,
} from "lucide-react";
import { CycleSummaryStats, CycleInsight } from "@/lib/calculations/cycle";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { formatShortDate } from "@/lib/utils";

interface TrendPoint {
  cycleNumber: number;
  startDate: string;
  length?: number;
  duration?: number;
}

interface StatisticsViewProps {
  stats: CycleSummaryStats;
  cycleTrends: TrendPoint[];
  periodTrends: TrendPoint[];
  insights: CycleInsight[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  stats,
  cycleTrends,
  insights,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#2D2727]">Statistik & Wawasan Siklus</h2>
        <p className="text-xs text-[#79716B]">
          Ringkasan pola tubuh dan statistik berdasarkan data yang kamu catat
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-soft p-4">
          <span className="text-[11px] font-semibold text-[#79716B] block">Rata-rata Siklus</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#2D2727]">
              {stats.averageCycleLength}
            </span>
            <span className="text-xs text-[#79716B]">Hari</span>
          </div>
          <span className="text-[10px] text-[#79716B] mt-1 block">
            {stats.isEstimateBasedOnDefaults ? "Standar acuan" : "Berdasarkan catatan"}
          </span>
        </div>

        <div className="card-soft p-4">
          <span className="text-[11px] font-semibold text-[#79716B] block">Rata-rata Menstruasi</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#E07A5F]">
              {stats.averagePeriodDuration}
            </span>
            <span className="text-xs text-[#79716B]">Hari</span>
          </div>
          <span className="text-[10px] text-[#79716B] mt-1 block">Durasi pendarahan</span>
        </div>

        <div className="card-soft p-4">
          <span className="text-[11px] font-semibold text-[#79716B] block">Siklus Terpendek</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#81B29A]">
              {stats.shortestCycle ? stats.shortestCycle : "-"}
            </span>
            {stats.shortestCycle && <span className="text-xs text-[#79716B]">Hari</span>}
          </div>
          <span className="text-[10px] text-[#79716B] mt-1 block">Variasi minimum</span>
        </div>

        <div className="card-soft p-4">
          <span className="text-[11px] font-semibold text-[#79716B] block">Siklus Terpanjang</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-bold text-[#9B8EB9]">
              {stats.longestCycle ? stats.longestCycle : "-"}
            </span>
            {stats.longestCycle && <span className="text-xs text-[#79716B]">Hari</span>}
          </div>
          <span className="text-[10px] text-[#79716B] mt-1 block">Variasi maksimum</span>
        </div>
      </div>

      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#E07A5F]" />
            <h3 className="text-sm font-bold text-[#2D2727]">Grafik Panjang Siklus</h3>
          </div>
          <span className="text-xs text-[#79716B]">Riwayat Siklus Terakhir</span>
        </div>

        {cycleTrends.length < 2 ? (
          <div className="py-8 text-center text-xs text-[#79716B]">
            <p>Perlu minimal 2 siklus berurutan untuk menampilkan grafik tren panjang siklus.</p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="h-44 flex items-end justify-around gap-2 pt-6 pb-2 border-b border-[#F2ECE4]">
              {cycleTrends.map((point) => {
                const heightPercent = Math.min(Math.max(((point.length || 28) / 45) * 100, 20), 100);
                return (
                  <div
                    key={point.startDate}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                  >
                    <span className="text-[10px] font-bold text-[#2D2727] opacity-80 group-hover:opacity-100 transition-opacity">
                      {point.length} hr
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[36px] bg-gradient-to-t from-[#E07A5F] to-[#F4A261] rounded-t-lg transition-all group-hover:brightness-95"
                    />
                    <span className="text-[9px] text-[#79716B] truncate max-w-[48px]">
                      {formatShortDate(point.startDate)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-center text-[#79716B] mt-3">
              Panjang siklus dalam hari antar awal siklus
            </p>
          </div>
        )}
      </div>

      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-bold text-[#2D2727]">Wawasan Pola Siklusmu</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E0D5] space-y-1.5"
            >
              <h4 className="text-xs font-bold text-[#2D2727] flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-[#81B29A]" />
                {insight.title}
              </h4>
              <p className="text-xs text-[#79716B] leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      <MedicalDisclaimer />
    </div>
  );
};
