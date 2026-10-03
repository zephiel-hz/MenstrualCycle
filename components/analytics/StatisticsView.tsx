"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Clock,
  Sparkles,
  Heart,
  Calendar,
  Feather,
  Flame,
  Activity,
} from "lucide-react";
import {
  CycleSummaryStats,
  CycleInsight,
  calculateCycleStats,
  generateCycleInsights,
  CycleData,
  DailyLogData,
} from "@/lib/calculations/cycle";
import { formatShortDate } from "@/lib/utils";
import {
  getCachedCycles,
  getCachedLogs,
  getCachedSettings,
  SYNC_EVENTS,
  isOnline,
} from "@/lib/offline/syncManager";

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

function computeTrends(cycles: CycleData[]) {
  const chronological = [...cycles].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const cycleTrends = [];
  for (let i = 0; i < chronological.length - 1; i++) {
    const cur = new Date(chronological[i].startDate);
    const next = new Date(chronological[i + 1].startDate);
    const len = Math.round((next.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));
    if (len >= 15 && len <= 90) {
      cycleTrends.push({
        cycleNumber: i + 1,
        startDate: chronological[i].startDate,
        length: len,
      });
    }
  }

  const periodTrends = chronological
    .filter((c) => c.endDate)
    .map((c, i) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate!);
      const dur = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        cycleNumber: i + 1,
        startDate: c.startDate,
        duration: dur,
      };
    });

  return { cycleTrends, periodTrends };
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  stats: initialStats,
  insights: initialInsights,
  cycleTrends: initialCycleTrends,
  periodTrends: initialPeriodTrends,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [stats, setStats] = useState<CycleSummaryStats>(initialStats);
  const [insights, setInsights] = useState<CycleInsight[]>(initialInsights);
  const [cycleTrends, setCycleTrends] = useState(initialCycleTrends);
  const [periodTrends, setPeriodTrends] = useState(initialPeriodTrends);

  const recomputeFromLocal = useCallback(async () => {
    try {
      const [localCycles, localLogs, localSettings] = await Promise.all([
        getCachedCycles(),
        getCachedLogs(),
        getCachedSettings(),
      ]);

      if (localCycles && localCycles.length > 0) {
        const cycleDataList: CycleData[] = localCycles.map((c) => ({
          id: c.id,
          startDate: c.startDate,
          endDate: c.endDate,
          notes: c.notes,
        }));

        const logDataList: DailyLogData[] = (localLogs || []).map((l) => ({
          id: l.id || `log_${l.date}`,
          date: l.date,
          flow: l.flow || "none",
          mood: l.mood || [],
          symptoms: l.symptoms || [],
          notes: l.notes || null,
        }));

        const defaultCycleLength = localSettings?.cycleLengthDefault || 28;
        const defaultPeriodDuration = localSettings?.periodDurationDefault || 5;

        const computedStats = calculateCycleStats(
          cycleDataList,
          defaultCycleLength,
          defaultPeriodDuration
        );
        const computedInsights = generateCycleInsights(
          cycleDataList,
          logDataList,
          computedStats
        );
        const { cycleTrends: cTrends, periodTrends: pTrends } = computeTrends(cycleDataList);

        setStats(computedStats);
        setInsights(computedInsights);
        setCycleTrends(cTrends);
        setPeriodTrends(pTrends);
      }
    } catch (err) {
      console.warn("Failed to recompute statistics from local IndexedDB:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      recomputeFromLocal();

      const handleDataUpdated = () => {
        recomputeFromLocal();
        if (isOnline()) {
          startTransition(() => {
            router.refresh();
          });
        }
      };

      window.addEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
      window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);

      return () => {
        window.removeEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
        window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);
      };
    }
  }, [recomputeFromLocal, router]);

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
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-2xl sm:text-3xl text-[#221B1F] font-normal">
                {stats.shortestCycle && stats.longestCycle
                  ? `${stats.shortestCycle}–${stats.longestCycle}`
                  : `${stats.averageCycleLength}`}
              </span>
              <span className="text-xs font-medium text-[#7A6E75]">hari</span>
            </div>
            <p className="text-[10px] text-[#A3969F] mt-1">Min – Maks tercatat</p>
          </div>
        </div>

        {/* Total Cycles Logged */}
        <div className="surface-card p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[#D8647F]/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-[#7A6E75]">Total Siklus</span>
            <div className="w-7 h-7 rounded-full bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-editorial text-3xl sm:text-4xl text-[#221B1F] font-normal">
                {stats.totalCyclesLogged}
              </span>
              <span className="text-xs font-medium text-[#7A6E75]">siklus</span>
            </div>
            <p className="text-[10px] text-[#A3969F] mt-1">
              {stats.isEstimateBasedOnDefaults ? "Menggunakan acuan standar" : "Akurasi data personal"}
            </p>
          </div>
        </div>
      </div>

      {/* Health Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FAF0F2] flex items-center justify-center text-[#D8647F]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-semibold text-[#221B1F] tracking-tight">
              Wawasan & Observasi Pola Tubuh
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {insights.map((insight, idx) => {
              const isRegularity = insight.type === "regularity";
              const isPms = insight.type === "pms";
              const isSymptom = insight.type === "symptom";

              return (
                <div
                  key={idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isPms
                      ? "bg-[#FCF5F7] border-[#D8647F]/25 hover:border-[#D8647F]/40"
                      : isRegularity
                      ? "bg-[#F3F8F5] border-[#588B76]/25 hover:border-[#588B76]/40"
                      : isSymptom
                      ? "bg-[#F6F3F9] border-[#8E78A5]/25 hover:border-[#8E78A5]/40"
                      : "bg-[#FAF9F6] border-[#EFE8DE] hover:border-[#D8647F]/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isPms
                          ? "bg-[#D8647F]/15 text-[#D8647F]"
                          : isRegularity
                          ? "bg-[#588B76]/15 text-[#588B76]"
                          : isSymptom
                          ? "bg-[#8E78A5]/15 text-[#8E78A5]"
                          : "bg-[#221B1F]/10 text-[#221B1F]"
                      }`}
                    >
                      {isPms ? (
                        <Flame className="w-3.5 h-3.5" />
                      ) : isRegularity ? (
                        <Heart className="w-3.5 h-3.5" />
                      ) : isSymptom ? (
                        <Activity className="w-3.5 h-3.5" />
                      ) : (
                        <Feather className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xs font-bold text-[#221B1F] leading-snug">
                        {insight.title}
                      </h3>
                      <p className="text-xs text-[#7A6E75] leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cycle Length History */}
      {cycleTrends.length > 0 && (
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#EBF4F0] flex items-center justify-center text-[#588B76]">
                <Clock className="w-3.5 h-3.5" />
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

