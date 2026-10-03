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
      if (cached && cached.length > 0) {
        setCycles(cached);
      }

      if (isOnline()) {
        const res = await fetch("/api/cycles", {
          headers: { "bypass-tunnel-reminder": "true" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cycles) {
            setCycles(data.cycles);
          }
        }
      }
    } catch {
      // Keep existing or cached state
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      hydrateLocalCache({ cycles: initialCycles });
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

