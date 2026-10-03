"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CycleSummaryStats,
  DailyLogData,
  calculateCycleStats,
  CycleData,
} from "@/lib/calculations/cycle";
import { CycleCircle } from "@/components/dashboard/CycleCircle";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { DailyLogModal } from "@/components/log/DailyLogModal";
import { AddCycleModal } from "@/components/cycle/AddCycleModal";
import { EditCycleModal } from "@/components/cycle/EditCycleModal";
import { PlusCircle, CheckCircle2 } from "lucide-react";
import { formatShortDate, formatISODateOnly } from "@/lib/utils";
import {
  hydrateLocalCache,
  getCachedCycles,
  getCachedLogs,
  getCachedSettings,
  SYNC_EVENTS,
  isOnline,
} from "@/lib/offline/syncManager";

interface DashboardClientProps {
  stats: CycleSummaryStats;
  todayLog: DailyLogData | null;
  reminderPms?: boolean;
  latestCycle?: {
    id: string;
    startDate: string;
    endDate?: string | null;
    notes?: string | null;
  } | null;
  user: {
    displayName?: string | null;
  };
}

export const DashboardClient: React.FC<DashboardClientProps> = ({
  stats: initialStats,
  todayLog: initialTodayLog,
  reminderPms = true,
  latestCycle: initialLatestCycle,
  user,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [stats, setStats] = useState<CycleSummaryStats>(initialStats);
  const [todayLog, setTodayLog] = useState<DailyLogData | null>(initialTodayLog);
  const [latestCycle, setLatestCycle] = useState<{
    id: string;
    startDate: string;
    endDate?: string | null;
    notes?: string | null;
  } | null>(initialLatestCycle || null);

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isEditCycleModalOpen, setIsEditCycleModalOpen] = useState(false);

  // Recompute stats and view state from local IndexedDB data
  const recomputeFromLocal = useCallback(async () => {
    try {
      const [localCycles, localLogs, localSettings] = await Promise.all([
        getCachedCycles(),
        getCachedLogs(),
        getCachedSettings(),
      ]);

      const todayStr = formatISODateOnly(new Date());

      // Update today's log
      const foundTodayLog = localLogs.find((l) => l.date === todayStr);
      if (foundTodayLog) {
        setTodayLog({
          id: foundTodayLog.id || "local_today",
          date: foundTodayLog.date,
          flow: foundTodayLog.flow || "none",
          mood: foundTodayLog.mood || [],
          symptoms: foundTodayLog.symptoms || [],
          notes: foundTodayLog.notes || null,
        });
      } else if (localLogs.length > 0) {
        setTodayLog(null);
      }

      // Update cycles and stats
      if (localCycles && localCycles.length > 0) {
        const sortedCycles = [...localCycles].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
        );
        const latest = sortedCycles[0];
        setLatestCycle({
          id: latest.id,
          startDate: latest.startDate,
          endDate: latest.endDate,
          notes: latest.notes,
        });

        const cycleLengthDefault = localSettings?.cycleLengthDefault || 28;
        const periodDurationDefault = localSettings?.periodDurationDefault || 5;

        const cycleDataList: CycleData[] = sortedCycles.map((c) => ({
          id: c.id,
          startDate: c.startDate,
          endDate: c.endDate,
          notes: c.notes,
        }));

        const computedStats = calculateCycleStats(
          cycleDataList,
          cycleLengthDefault,
          periodDurationDefault
        );
        setStats(computedStats);
      }
    } catch (err) {
      console.warn("Failed to recompute from local IndexedDB:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 1. Hydrate cache with server-rendered initial data
      hydrateLocalCache({
        cycles: initialLatestCycle ? [initialLatestCycle] : [],
        logs: initialTodayLog ? [{ ...initialTodayLog, date: initialTodayLog.date || "" }] : [],
      });

      // 2. Initial check against local IndexedDB (which might contain offline changes)
      recomputeFromLocal();

      // 3. Listen for sync/mutation events
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
  }, [initialLatestCycle, initialTodayLog, recomputeFromLocal, router]);

  // PMS notification trigger
  useEffect(() => {
    if (typeof window === "undefined" || !reminderPms) return;
    if (!stats.isPmsPhase || !stats.estimatedNextPeriodDate) return;

    if ("Notification" in window && Notification.permission === "granted") {
      const storageKey = `ricils_pms_notified_${stats.estimatedNextPeriodDate}`;
      const alreadyNotified = localStorage.getItem(storageKey);
      if (!alreadyNotified) {
        const daysLeft = stats.daysUntilNextPeriod ?? 0;
        const title = "🌸 Ricil's - Fase PMS";
        const body = `Kamu diperkirakan telah memasuki fase PMS (${daysLeft} hari lagi menuju haid). Tetap terhidrasi, istirahat cukup, dan jaga kenyamanan tubuhmu hari ini! ✨`;

        let sentViaSw = false;
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .getRegistration()
            .then((reg) => {
              if (reg && reg.showNotification) {
                reg.showNotification(title, {
                  body,
                  icon: "/icons/icon-192.svg",
                  tag: `ricils-pms-${stats.estimatedNextPeriodDate}`,
                });
                sentViaSw = true;
              }
            })
            .catch(() => {});
        }

        if (!sentViaSw) {
          try {
            new Notification(title, {
              body,
              icon: "/icons/icon-192.svg",
              tag: `ricils-pms-${stats.estimatedNextPeriodDate}`,
            });
          } catch (e) {
            console.warn("Direct PMS notification error:", e);
          }
        }

        localStorage.setItem(storageKey, "true");
      }
    }
  }, [stats.isPmsPhase, stats.estimatedNextPeriodDate, stats.daysUntilNextPeriod, reminderPms]);

  const handleSmoothRefresh = () => {
    recomputeFromLocal();
    if (isOnline()) {
      startTransition(() => {
        router.refresh();
      });
    }
  };

  const isOngoingPeriod = latestCycle && !latestCycle.endDate;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#221B1F] tracking-tight font-editorial">
            Halo, {user.displayName || "Cantik"}
          </h1>
          <p className="text-xs text-[#7D7277] mt-1">
            Ringkasan siklus biologi dan kondisi kesehatanmu hari ini.
          </p>
        </div>

        <button
          onClick={() => setIsCycleModalOpen(true)}
          className="self-start sm:self-auto px-4 py-2 rounded-full border border-[#EFE9E2] bg-white hover:border-[#D8647F]/40 active:scale-95 text-xs font-semibold text-[#221B1F] flex items-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#D8647F]" />
          Catat Siklus Baru
        </button>
      </div>

      {/* Ongoing Period Notification Banner */}
      {isOngoingPeriod && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#FAF0F2] to-[#FAF6F3] border border-[#D8647F]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D8647F] animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#221B1F]">
                Menstruasi Sedang Berlangsung
              </p>
              <p className="text-[11px] text-[#7D7277] mt-0.5">
                Dimulai sejak {formatShortDate(latestCycle.startDate)}. Haid sudah selesai?
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditCycleModalOpen(true)}
            className="self-start sm:self-auto px-4 py-1.5 rounded-full bg-white hover:bg-[#FAF6F3] active:scale-95 border border-[#D8647F]/30 text-xs font-semibold text-[#D8647F] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesaikan / Edit Haid
          </button>
        </div>
      )}

      {/* Main Cycle Dial */}
      <CycleCircle stats={stats} onLogClick={() => setIsLogModalOpen(true)} />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <DailySummaryCard
          todayLog={todayLog}
          onEditClick={() => setIsLogModalOpen(true)}
        />
        <QuickStatsCard stats={stats} />
      </div>

      {/* Medical Disclaimer */}
      <MedicalDisclaimer />

      {/* Modals */}
      <DailyLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onLogSaved={handleSmoothRefresh}
      />
      <AddCycleModal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        onCycleAdded={handleSmoothRefresh}
      />
      {latestCycle && (
        <EditCycleModal
          isOpen={isEditCycleModalOpen}
          onClose={() => setIsEditCycleModalOpen(false)}
          cycle={latestCycle}
          onCycleUpdated={handleSmoothRefresh}
        />
      )}
    </div>
  );
};

