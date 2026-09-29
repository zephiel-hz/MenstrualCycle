"use client";

import React from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  Heart,
  Calendar,
  Feather,
  Flame,
  Activity,
} from "lucide-react";
import { CycleSummaryStats, CycleInsight } from "@/lib/calculations/cycle";
import { formatShortDate } from "@/lib/utils";

interface StatisticsViewProps {
  stats: CycleSummaryStats;
  insights: CycleInsight[];
  cycleTrends: Array<{
    cycleNumber: number;
    startDate: string;
    length: number;
  }>;
  periodTrends: Array<{
    cycleNumber: number;
    startDate: string;
    duration: number;
  }>;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  stats,
  insights,
  cycleTrends,
  periodTrends,
}) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#D8647F] uppercase mb-1 block">
            Analisis Siklus & Pola Tubuh
          </span>
          <h1 className="font-editorial text-2xl sm:text-3xl font-normal text-[#221B1F] tracking-tight">
            Statistik & Wawasan
          </h1>
          <p className="text-xs text-[#7A6E75] mt-1">
            Keteraturan ritme biologis, pola durasi, dan observasi fase PMS berdasarkan catatan historismu.
          </p>
        </div>
      </div>

      {/* Key Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Average Cycle Length */}
        <div className="surface-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#D8647F]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7A6E75]">Rata-rata Siklus</span>
            <div className="w-7 h-7 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-3xl sm:text-4xl text-[#221B1F] font-normal">
                {stats.averageCycleLength}
              </span>
              <span className="text-xs font-medium text-[#7A6E75]">hari</span>
            </div>
            <p className="text-[10px] text-[#A3969F] mt-1">Acuan ritme ovulasi</p>
          </div>
        </div>

        {/* Average Period Duration */}
        <div className="surface-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#588B76]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7A6E75]">Durasi Haid</span>
            <div className="w-7 h-7 rounded-full bg-[#EBF4F0] text-[#588B76] flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-3xl sm:text-4xl text-[#221B1F] font-normal">
                {stats.averagePeriodDuration}
              </span>
              <span className="text-xs font-medium text-[#7A6E75]">hari</span>
            </div>
            <p className="text-[10px] text-[#A3969F] mt-1">Rata-rata pendarahan</p>
          </div>
        </div>

        {/* Cycle Range */}
        <div className="surface-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#8E78A5]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7A6E75]">Rentang Variasi</span>
            <div className="w-7 h-7 rounded-full bg-[#F4EFF7] text-[#8E78A5] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-2xl sm:text-3xl text-[#221B1F] font-normal">
                {stats.shortestCycle && stats.longestCycle
                  ? `${stats.shortestCycle}–${stats.longestCycle}`
                  : "—"}
              </span>
              <span className="text-xs font-medium text-[#7A6E75]">hari</span>
            </div>
            <p className="text-[10px] text-[#A3969F] mt-1">Terpendek vs terpanjang</p>
          </div>
        </div>

        {/* Total Cycles Logged */}
        <div className="surface-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#D8647F]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7A6E75]">Total Siklus</span>
            <div className="w-7 h-7 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-3xl sm:text-4xl text-[#221B1F] font-normal">
                {stats.totalCyclesLogged}
              </span>
              <span className="text-xs font-medium text-[#7A6E75]">tercatat</span>
            </div>
            <p className="text-[10px] text-[#A3969F] mt-1">Data historis akun</p>
          </div>
        </div>
      </div>

      {/* Body & PMS Insights */}
      <div className="surface-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FAF0F2] flex items-center justify-center text-[#D8647F]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-[#221B1F] tracking-tight">
              Wawasan Ritme & Observasi PMS
            </h2>
          </div>
          <span className="text-[11px] font-medium text-[#7A6E75]">
            {insights.length} Analisis
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                ins.type === "pms"
                  ? "bg-[#FAF5FB] border-[#8E78A5]/25"
                  : ins.type === "regularity"
                  ? "bg-[#F3F8F5] border-[#588B76]/25"
                  : ins.type === "symptom"
                  ? "bg-[#FCF4F6] border-[#D8647F]/25"
                  : "bg-white border-[#EFE8DE]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {ins.type === "pms" ? (
                  <span className="w-6 h-6 rounded-full bg-[#F4EFF7] text-[#8E78A5] flex items-center justify-center">
                    <Feather className="w-3 h-3" />
                  </span>
                ) : ins.type === "regularity" ? (
                  <span className="w-6 h-6 rounded-full bg-[#EBF4F0] text-[#588B76] flex items-center justify-center">
                    <Activity className="w-3 h-3" />
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
                    <Flame className="w-3 h-3" />
                  </span>
                )}
                <h3 className="text-xs font-semibold text-[#221B1F]">{ins.title}</h3>
              </div>
              <p className="text-xs text-[#7A6E75] leading-relaxed pl-8">
                {ins.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Cycle Length History */}
      {cycleTrends.length > 0 && (
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EBF4F0] flex items-center justify-center text-[#588B76]">
                <BarChart3 className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#221B1F] tracking-tight">
                Riwayat Panjang Siklus
              </h2>
            </div>
            <span className="text-[11px] font-medium text-[#7A6E75]">
              {cycleTrends.length} siklus terakhir
            </span>
          </div>

          <div className="space-y-3.5">
            {cycleTrends.map((c) => {
              const maxScale = Math.max(...cycleTrends.map((t) => t.length), 40);
              const barWidthPercent = Math.min(Math.round((c.length / maxScale) * 100), 100);

              return (
                <div key={c.cycleNumber} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-[#221B1F]">
                      Siklus #{c.cycleNumber}{" "}
                      <span className="text-[#A3969F] font-normal">
                        ({formatShortDate(c.startDate)})
                      </span>
                    </span>
                    <span className="font-semibold text-[#588B76]">
                      {c.length} Hari
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F4EFEA] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#588B76] to-[#7BB29D] transition-all duration-500"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Period Duration History */}
      {periodTrends.length > 0 && (
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FAF0F2] flex items-center justify-center text-[#D8647F]">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <h2 className="text-sm font-semibold text-[#221B1F] tracking-tight">
                Riwayat Durasi Haid
              </h2>
            </div>
            <span className="text-[11px] font-medium text-[#7A6E75]">
              {periodTrends.length} catatan
            </span>
          </div>

          <div className="space-y-3.5">
            {periodTrends.map((p) => {
              const maxScale = Math.max(...periodTrends.map((t) => t.duration), 10);
              const barWidthPercent = Math.min(Math.round((p.duration / maxScale) * 100), 100);

              return (
                <div key={p.cycleNumber} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-[#221B1F]">
                      Haid #{p.cycleNumber}{" "}
                      <span className="text-[#A3969F] font-normal">
                        ({formatShortDate(p.startDate)})
                      </span>
                    </span>
                    <span className="font-semibold text-[#D8647F]">
                      {p.duration} Hari
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#F4EFEA] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D8647F] to-[#EAA1B2] transition-all duration-500"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
