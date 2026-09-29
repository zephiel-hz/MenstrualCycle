"use client";

import React from "react";
import { Droplet, Smile, Activity, Edit3, Plus, Heart } from "lucide-react";
import { DailyLogData } from "@/lib/calculations/cycle";

interface DailySummaryCardProps {
  todayLog: DailyLogData | null;
  onEditClick: () => void;
}

const FLOW_LABELS: Record<string, { label: string; badge: string }> = {
  none: { label: "Tidak Ada", badge: "bg-[#F3ECE5] text-[#7D7277]" },
  light: { label: "Ringan / Flek", badge: "bg-[#FAF0F2] text-[#D8647F] border border-[#D8647F]/20" },
  medium: { label: "Sedang", badge: "bg-[#FAF0F2] text-[#D8647F] font-semibold border border-[#D8647F]/30" },
  heavy: { label: "Banyak", badge: "bg-[#D8647F] text-white font-semibold" },
};

const MOOD_NAMES: Record<string, string> = {
  senang: "Senang & Nyaman",
  baik: "Baik & Tenang",
  netral: "Netral",
  sedih: "Sensitif / Sedih",
  stres: "Stres / Lelah",
  mudah_marah: "Mudah Terpancing",
  cemas: "Cemas",
  berenergi: "Penuh Energi",
};

const SYMPTOM_LABELS: Record<string, string> = {
  kram: "Kram Perut",
  sakit_kepala: "Sakit Kepala",
  kembung: "Kembung",
  jerawat: "Jerawat Hormonal",
  nyeri_punggung: "Nyeri Punggung",
  lelah: "Kelelahan",
  mual: "Mual",
  payudara_sensitif: "Payudara Sensitif",
  insomnia: "Sulit Tidur",
  nafsu_makan_naik: "Nafsu Makan Naik",
};

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  todayLog,
  onEditClick,
}) => {
  const hasLog = todayLog !== null;

  return (
    <div className="surface-card p-5 sm:p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#EFE9E2]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF0F2] flex items-center justify-center text-[#D8647F]">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-semibold text-[#221B1F]">Catatan Hari Ini</h3>
        </div>
        <button
          onClick={onEditClick}
          className="text-xs font-semibold text-[#D8647F] hover:text-[#C5536D] flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1 rounded-full hover:bg-[#FAF0F2]"
        >
          {hasLog ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Catat</span>
            </>
          )}
        </button>
      </div>

      {!hasLog ? (
        <div className="py-7 text-center text-xs text-[#7D7277] space-y-2">
          <p className="leading-relaxed">Belum ada catatan fisik atau mood untuk hari ini.</p>
          <button
            onClick={onEditClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF0F2] text-[#D8647F] text-xs font-semibold hover:bg-[#F6E2E7] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Isi Jurnal Hari Ini
          </button>
        </div>
      ) : (
        <div className="py-3 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#7D7277] flex items-center gap-1.5 text-xs">
              <Droplet className="w-3.5 h-3.5 text-[#D8647F]" />
              Aliran Menstruasi
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                FLOW_LABELS[todayLog.flow]?.badge || "bg-[#F3ECE5] text-[#7D7277]"
              }`}
            >
              {FLOW_LABELS[todayLog.flow]?.label || todayLog.flow}
            </span>
          </div>

          <div className="flex items-start justify-between gap-2">
            <span className="text-[#7D7277] flex items-center gap-1.5 text-xs pt-0.5">
              <Smile className="w-3.5 h-3.5 text-[#588B76]" />
              Suasana Hati
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {todayLog.mood && todayLog.mood.length > 0 ? (
                todayLog.mood.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-md bg-[#EBF4F0] text-[#588B76] font-medium text-[11px] border border-[#588B76]/15"
                  >
                    {MOOD_NAMES[m] || m}
                  </span>
                ))
              ) : (
                <span className="text-[#7D7277] text-[11px]">-</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[#7D7277] block text-[11px] font-medium mb-1.5">
              Gejala Tubuh:
            </span>
            {todayLog.symptoms && todayLog.symptoms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {todayLog.symptoms.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-[#F2EEF7] text-[#8E78A5] font-medium text-[11px] border border-[#8E78A5]/15"
                  >
                    {SYMPTOM_LABELS[s] || s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#7D7277] italic text-[11px]">Tidak ada keluhan dicatat</span>
            )}
          </div>

          {todayLog.notes && (
            <div className="pt-2.5 border-t border-[#EFE9E2]">
              <p className="text-[#5C5458] line-clamp-2 italic text-[11px] leading-relaxed bg-[#FAF6F3] p-2 rounded-xl border border-[#EFE9E2]">
                &ldquo;{todayLog.notes}&rdquo;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
