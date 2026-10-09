"use client";

import React, { useState, useEffect, useCallback } from "react";
import { CycleList } from "@/components/cycle/CycleList";
import { AddCycleModal } from "@/components/cycle/AddCycleModal";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";
import {
  hydrateLocalCache,
  getCachedCycles,
  SYNC_EVENTS,
  isOnline,
} from "@/lib/offline/syncManager";

interface HistoryClientProps {
  initialCycles: Array<{
    id: string;
    startDate: string;
    endDate?: string | null;
    notes?: string | null;
  }>;
}

export const HistoryClient: React.FC<HistoryClientProps> = ({ initialCycles }) => {
  const [cycles, setCycles] = useState(initialCycles);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchCycles = useCallback(async () => {
    try {
      const cached = await getCachedCycles();
      if (Array.isArray(cached)) {
        setCycles((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(cached)) return prev;
          return cached;
        });
      }
    } catch {
      // Keep existing or cached state
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (initialCycles && initialCycles.length > 0 && isOnline()) {
        hydrateLocalCache({ cycles: initialCycles });
      }
      fetchCycles();

      const handleDataUpdated = () => {
        fetchCycles();
      };

      window.addEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
      window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);

      return () => {
        window.removeEventListener(SYNC_EVENTS.DATA_UPDATED, handleDataUpdated);
        window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleDataUpdated);
      };
    }
  }, [initialCycles, fetchCycles]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <CycleList
        cycles={cycles}
        onAddCycleClick={() => setIsAddModalOpen(true)}
        onRefresh={fetchCycles}
      />

      <MedicalDisclaimer />

      <AddCycleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCycleAdded={fetchCycles}
      />
    </div>
  );
};

