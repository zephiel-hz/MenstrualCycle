"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CycleSummaryStats, DailyLogData } from "@/lib/calculations/cycle";
import { CycleCircle } from "@/components/dashboard/CycleCircle";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { QuickStatsCard } from "@/components/dashboard/QuickStatsCard";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { DailyLogModal } from "@/components/log/DailyLogModal";
import { AddCycleModal } from "@/components/cycle/AddCycleModal";
import { EditCycleModal } from "@/components/cycle/EditCycleModal";
import { PlusCircle, CheckCircle2 } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

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
  stats,
  todayLog,
  reminderPms = true,
  latestCycle,
  user,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [isEditCycleModalOpen, setIsEditCycleModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !reminderPms) return;
    if (!stats.isPmsPhase || !stats.estimatedNextPeriodDate) return;

    if ("Notification" in window && Notification.permission === "granted") {
      const storageKey = `lunara_pms_notified_${stats.estimatedNextPeriodDate}`;
      const alreadyNotified = localStorage.getItem(storageKey);
      if (!alreadyNotified) {
        const daysLeft = stats.daysUntilNextPeriod ?? 0;
        const title = "🌸 Lunara - Fase PMS";
        const body = `Kamu diperkirakan telah memasuki fase PMS (${daysLeft} hari lagi menuju haid). Tetap terhidrasi, istirahat cukup, dan jaga kenyamanan tubuhmu hari ini! ✨`;

        let sentViaSw = false;
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (reg && reg.showNotification) {
              reg.showNotification(title, {
                body,
                icon: "/icon-192.png",
                tag: `lunara-pms-${stats.estimatedNextPeriodDate}`,
              });
              sentViaSw = true;
            }
          }).catch(() => {});
        }

        if (!sentViaSw) {
          try {
            new Notification(title, {
              body,
              icon: "/icon-192.png",
              tag: `lunara-pms-${stats.estimatedNextPeriodDate}`,
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
    startTransition(() => {
      router.refresh();
    });
  };

  const isOngoingPeriod = latestCycle && !latestCycle.endDate;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#2D2727] tracking-tight">
            Halo, {user.displayName || "Cantik"} ✨
          </h1>
          <p className="text-xs text-[#79716B] mt-0.5">
            Berikut ringkasan siklus dan kondisi tubuhmu hari ini.
          </p>
        </div>

        <button
          onClick={() => setIsCycleModalOpen(true)}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-full border border-[#E8E0D5] bg-white hover:border-[#E78895] active:scale-95 text-xs font-semibold text-[#2D2727] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
        >
          <PlusCircle className="w-3.5 h-3.5 text-[#E78895]" />
          Catat Siklus Baru
        </button>
      </div>

      {isOngoingPeriod && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FCEEF1] to-[#FFF0F3] border border-[#E78895]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E78895] animate-pulse shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#2D2727]">
                Menstruasi sedang berlangsung
              </p>
              <p className="text-[11px] text-[#79716B]">
                Dimulai sejak {formatShortDate(latestCycle.startDate)}. Haid sudah selesai?
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditCycleModalOpen(true)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] active:scale-95 border border-[#E78895]/40 text-xs font-semibold text-[#E78895] flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Selesaikan / Edit Haid
          </button>
        </div>
      )}

      <CycleCircle stats={stats} onLogClick={() => setIsLogModalOpen(true)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <DailySummaryCard
          todayLog={todayLog}
          onEditClick={() => setIsLogModalOpen(true)}
        />
        <QuickStatsCard stats={stats} />
      </div>

      <MedicalDisclaimer />

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
