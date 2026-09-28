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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2727] tracking-tight">
          Statistik & Wawasan Siklus
        </h1>
        <p className="text-xs text-[#79716B] mt-0.5">
          Pola tubuh, keteraturan siklus, fase PMS, dan estimasi periode mendatang.
        </p>
      </div>

      {/* Ringkasan Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="card-soft p-4">
          <div className="w-8 h-8 rounded-xl bg-[#FCEEF1] text-[#E78895] flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xl font-extrabold text-[#2D2727]">
            {stats.averageCycleLength}
          </span>
          <span className="text-xs text-[#79716B] ml-1">hari</span>
          <p className="text-[11px] text-[#79716B] mt-0.5">Rata-rata Siklus</p>
        </div>

        <div className="card-soft p-4">
          <div className="w-8 h-8 rounded-xl bg-[#EBF4F0] text-[#81B29A] flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-xl font-extrabold text-[#2D2727]">
            {stats.averagePeriodDuration}
          </span>
          <span className="text-xs text-[#79716B] ml-1">hari</span>
          <p className="text-[11px] text-[#79716B] mt-0.5">Rata-rata Durasi Haid</p>
        </div>

        <div className="card-soft p-4">
          <div className="w-8 h-8 rounded-xl bg-[#F1EFF7] text-[#9B8EB9] flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <span className="text-xl font-extrabold text-[#2D2727]">
            {stats.shortestCycle && stats.longestCycle
              ? `${stats.shortestCycle}–${stats.longestCycle}`
              : "-"}
          </span>
          <span className="text-xs text-[#79716B] ml-1">hari</span>
          <p className="text-[11px] text-[#79716B] mt-0.5">Rentang Terpendek–Terpanjang</p>
        </div>

        <div className="card-soft p-4">
          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] text-[#2D2727] border border-[#E8E0D5] flex items-center justify-center mb-2">
            <Heart className="w-4 h-4 text-[#E78895]" />
          </div>
          <span className="text-xl font-extrabold text-[#2D2727]">
            {stats.totalCyclesLogged}
          </span>
          <span className="text-xs text-[#79716B] ml-1">siklus</span>
          <p className="text-[11px] text-[#79716B] mt-0.5">Total Tercatat</p>
        </div>
      </div>

      {/* Wawasan Pola & PMS */}
      <div className="card-soft p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#F2ECE4]">
          <Sparkles className="w-4 h-4 text-[#E78895]" />
          <h2 className="text-sm font-bold text-[#2D2727]">Wawasan Tubuh & Fase PMS</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`p-4 rounded-2xl border transition-all ${
                ins.type === "pms"
                  ? "bg-[#F5EEF8] border-[#9B59B6]/30 text-[#2D2727]"
                  : ins.type === "regularity"
                  ? "bg-[#EBF4F0] border-[#81B29A]/30 text-[#2D2727]"
                  : ins.type === "symptom"
                  ? "bg-[#FCEEF1] border-[#E78895]/30 text-[#2D2727]"
                  : "bg-[#FAF8F5] border-[#E8E0D5] text-[#2D2727]"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {ins.type === "pms" ? (
                  <Feather className="w-3.5 h-3.5 text-[#9B59B6]" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#E78895]" />
                )}
                <h3 className="font-bold text-xs text-[#2D2727]">{ins.title}</h3>
              </div>
              <p className="text-xs text-[#79716B] leading-relaxed mt-1">
                {ins.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Riwayat Variasi Panjang Siklus */}
      {cycleTrends.length > 0 && (
        <div className="card-soft p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#81B29A]" />
              <h2 className="text-sm font-bold text-[#2D2727]">Riwayat Panjang Siklus</h2>
            </div>
            <span className="text-xs text-[#79716B]">{cycleTrends.length} siklus terakhir</span>
          </div>

          <div className="space-y-3">
            {cycleTrends.map((c) => {
              const maxScale = Math.max(...cycleTrends.map((t) => t.length), 40);
              const barWidthPercent = Math.min(Math.round((c.length / maxScale) * 100), 100);

              return (
                <div key={c.cycleNumber} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#2D2727]">
                      Siklus #{c.cycleNumber} ({formatShortDate(c.startDate)})
                    </span>
                    <span className="font-bold text-[#2D2727]">{c.length} Hari</span>
                  </div>
                  <div className="w-full h-3 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8E0D5]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#81B29A] to-[#A8D5BA] transition-all duration-500"
                      style={{ width: `${barWidthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Riwayat Durasi Haid */}
      {periodTrends.length > 0 && (
        <div className="card-soft p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F2ECE4]">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E78895]" />
              <h2 className="text-sm font-bold text-[#2D2727]">Riwayat Durasi Haid</h2>
            </div>
            <span className="text-xs text-[#79716B]">{periodTrends.length} catatan</span>
          </div>

          <div className="space-y-3">
            {periodTrends.map((p) => {
              const maxScale = Math.max(...periodTrends.map((t) => t.duration), 10);
              const barWidthPercent = Math.min(Math.round((p.duration / maxScale) * 100), 100);

              return (
                <div key={p.cycleNumber} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#2D2727]">
                      Haid #{p.cycleNumber} ({formatShortDate(p.startDate)})
                    </span>
                    <span className="font-bold text-[#E78895]">{p.duration} Hari</span>
                  </div>
                  <div className="w-full h-3 bg-[#FAF8F5] rounded-full overflow-hidden border border-[#E8E0D5]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E78895] to-[#F3A6B4] transition-all duration-500"
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
