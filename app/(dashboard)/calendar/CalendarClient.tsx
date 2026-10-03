"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CycleCalendar } from "@/components/calendar/CycleCalendar";
import { DailyLogModal } from "@/components/log/DailyLogModal";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import { hydrateLocalCache, SYNC_EVENTS } from "@/lib/offline/syncManager";

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
  cycles,
  logs,
  estimatedNextPeriodDate,
  averagePeriodDuration,
}) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window !== "undefined") {
      hydrateLocalCache({
        cycles,
        logs,
      });

      const handleDataUpdated = () => {
        startTransition(() => {
          router.refresh();
        });
      };

      window.addEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
      window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);

      return () => {
        window.removeEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
        window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);
      };
    }
  }, [cycles, logs, router]);

  const handleOpenLogModal = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsLogModalOpen(true);
  };

  const handleSmoothRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
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
