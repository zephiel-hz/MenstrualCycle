"use client";

import React, { useState } from "react";
import { Calendar, Trash2, Plus, Pencil } from "lucide-react";
import { formatShortDate, formatMonthYear } from "@/lib/utils";
import { EditCycleModal } from "./EditCycleModal";

interface CycleItem {
  id: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

interface CycleListProps {
  cycles: CycleItem[];
  onAddCycleClick: () => void;
  onRefresh: () => void;
}

export const CycleList: React.FC<CycleListProps> = ({
  cycles,
  onAddCycleClick,
  onRefresh,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCycle, setEditingCycle] = useState<CycleItem | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan siklus ini?")) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/cycles/${id}`, { method: "DELETE", headers: { "bypass-tunnel-reminder": "true" } });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      alert("Gagal menghapus siklus.");
    } finally {
      setDeletingId(null);
    }
  };

  const chronological = [...cycles].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const cycleLengthsMap: Record<string, number> = {};
  for (let i = 0; i < chronological.length - 1; i++) {
    const cur = new Date(chronological[i].startDate);
    const next = new Date(chronological[i + 1].startDate);
    const len = Math.round((next.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));
    cycleLengthsMap[chronological[i].id] = len;
  }

  const displayCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#2D2727]">Riwayat Siklus</h2>
          <p className="text-xs text-[#79716B]">Daftar seluruh siklus menstruasi yang tercatat</p>
        </div>
        <button
          onClick={onAddCycleClick}
          className="px-4 py-2 rounded-xl bg-[#E78895] hover:bg-[#d66d7d] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Siklus
        </button>
      </div>

      {displayCycles.length === 0 ? (
        <div className="card-soft p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FCEEF1] text-[#E78895] flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2D2727]">Belum ada siklus</h3>
          <p className="text-xs text-[#79716B] max-w-sm mx-auto mt-1 mb-4">
            Mulai catat siklus pertamamu untuk melihat riwayat, panjang siklus, dan statistik tubuhmu.
          </p>
          <button
            onClick={onAddCycleClick}
            className="px-5 py-2.5 rounded-full bg-[#E78895] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            Catat Siklus Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {displayCycles.map((cycle, index) => {
            const start = new Date(cycle.startDate);
            const duration = cycle.endDate
              ? Math.round(
                  (new Date(cycle.endDate).getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
                ) + 1
              : null;
            const cycleLength = cycleLengthsMap[cycle.id];

            return (
              <div
                key={cycle.id}
                className="card-soft p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[#E78895]/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#2D2727]">
                      {formatMonthYear(cycle.startDate)}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#FCEEF1] text-[#E78895]">
                        Siklus Terbaru
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#79716B] flex items-center gap-2">
                    <span>
                      Mulai: {formatShortDate(cycle.startDate)}
                      {cycle.endDate && ` • Selesai: ${formatShortDate(cycle.endDate)}`}
                    </span>
                  </div>
                  {cycle.notes && (
                    <p className="text-[11px] text-[#79716B] italic pt-1">&quot;{cycle.notes}&quot;</p>
                  )}
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F2ECE4]">
                  <div className="flex items-center gap-3 text-right">
                    {cycleLength ? (
                      <div className="text-left sm:text-right">
                        <span className="block text-xs font-bold text-[#2D2727]">
                          {cycleLength} Hari
                        </span>
                        <span className="block text-[10px] text-[#79716B]">Panjang Siklus</span>
                      </div>
                    ) : null}

                    {duration ? (
                      <div className="text-left sm:text-right">
                        <span className="block text-xs font-bold text-[#E78895]">
                          {duration} Hari
                        </span>
                        <span className="block text-[10px] text-[#79716B]">Durasi Haid</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#81B29A] font-medium">Sedang Berlangsung</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingCycle(cycle)}
                      className="p-2 text-[#79716B] hover:text-[#E78895] hover:bg-[#FCEEF1] rounded-xl transition-colors cursor-pointer"
                      aria-label="Edit Siklus"
                      title="Edit Siklus"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cycle.id)}
                      disabled={deletingId === cycle.id}
                      className="p-2 text-[#79716B] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      aria-label="Hapus Siklus"
                      title="Hapus Siklus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingCycle && (
        <EditCycleModal
          isOpen={Boolean(editingCycle)}
          onClose={() => setEditingCycle(null)}
          cycle={editingCycle}
          onCycleUpdated={() => {
            setEditingCycle(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
