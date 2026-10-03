"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CycleCalendar } from "@/components/calendar/CycleCalendar";
import { DailyLogModal } from "@/components/log/DailyLogModal";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import {
  hydrateLocalCache,
  getCachedCycles,
  getCachedLogs,
  getCachedSettings,
  SYNC_EVENTS,
  isOnline,
} from "@/lib/offline/syncManager";
import { calculateCycleStats, CycleData } from "@/lib/calculations/cycle";

interface CalendarClientProps {
  cycles: Array<{ id: string; startDate: string; endDate?: string | null }>;
  logs: Array<{
    id: string;
    date: string;
    flow: string;
    mood: string[];
    symptoms: string[];
    notes?: string | null;
  }>;
  estimatedNextPeriodDate?: string | null;
  averagePeriodDuration?: number;
}

export const CalendarClient: React.FC<CalendarClientProps> = ({
  cycles: initialCycles,
  logs: initialLogs,
  estimatedNextPeriodDate: initialEstimatedNextPeriodDate,
  averagePeriodDuration: initialAveragePeriodDuration,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [cycles, setCycles] = useState(initialCycles);
  const [logs, setLogs] = useState(initialLogs);
  const [estimatedNextPeriodDate, setEstimatedNextPeriodDate] = useState(
    initialEstimatedNextPeriodDate
  );
  const [averagePeriodDuration, setAveragePeriodDuration] = useState(
    initialAveragePeriodDuration
  );

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const recomputeFromLocal = useCallback(async () => {
    try {
      const [localCycles, localLogs, localSettings] = await Promise.all([
        getCachedCycles(),
        getCachedLogs(),
        getCachedSettings(),
      ]);

      const cycleLengthDefault = localSettings?.cycleLengthDefault || 28;
      const periodDurationDefault = localSettings?.periodDurationDefault || 5;

      if (Array.isArray(localCycles)) {
        setCycles(localCycles);

        const cycleDataList: CycleData[] = localCycles.map((c) => ({
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
        setEstimatedNextPeriodDate(computedStats.estimatedNextPeriodDate);
        setAveragePeriodDuration(computedStats.averagePeriodDuration);
      }

      if (Array.isArray(localLogs)) {
        setLogs(
          localLogs.map((l) => ({
            id: l.id || `log_${l.date}`,
            date: l.date,
            flow: l.flow || "none",
            mood: l.mood || [],
            symptoms: l.symptoms || [],
            notes: l.notes || null,
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to recompute calendar from local IndexedDB:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (isOnline() && (initialCycles?.length || initialLogs?.length)) {
        hydrateLocalCache({
          cycles: initialCycles,
          logs: initialLogs,
        });
      }

      recomputeFromLocal();

      const handleDataUpdated = () => {
        recomputeFromLocal();
      };

      window.addEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
      window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);

      return () => {
        window.removeEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
        window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);
      };
    }
  }, [initialCycles, initialLogs, recomputeFromLocal]);

  const handleOpenLogModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsLogModalOpen(true);
  };

  const handleSmoothRefresh = () => {
    recomputeFromLocal();
    if (isOnline()) {
      startTransition(() => {
        router.refresh();
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <CycleCalendar
        cycles={cycles}
        logs={logs}
        estimatedNextPeriodDate={estimatedNextPeriodDate}
        averagePeriodDuration={averagePeriodDuration}
        onOpenLogModal={handleOpenLogModal}
      />

      <MedicalDisclaimer />

      <DailyLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        initialDate={selectedDate}
        onLogSaved={handleSmoothRefresh}
      />
    </div>
  );
};

