"use client";

import React, { useState } from "react";
import { CycleList } from "@/components/cycle/CycleList";
import { AddCycleModal } from "@/components/cycle/AddCycleModal";
import { MedicalDisclaimer } from "@/components/ui/MedicalDisclaimer";

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

  const fetchCycles = async () => {
    try {
      const res = await fetch("/api/cycles");
      if (res.ok) {
        const data = await res.json();
        setCycles(data.cycles || []);
      }
    } catch {
      // ignore
    }
  };

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
