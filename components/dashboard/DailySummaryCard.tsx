"use client";

import React from "react";
import { Droplet, Smile, Activity, Edit3, Plus } from "lucide-react";
import { DailyLogData } from "@/lib/calculations/cycle";

interface DailySummaryCardProps {
  todayLog: DailyLogData | null;
  onEditClick: () => void;
}

const FLOW_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "Tidak Ada", color: "bg-[#F2ECE4] text-[#79716B]" },
  light: { label: "Ringan", color: "bg-[#FCEEF1] text-[#E78895]" },
  medium: { label: "Sedang", color: "bg-[#FCEEF1] text-[#E78895] font-semibold" },
  heavy: { label: "Berat", color: "bg-[#E78895] text-white font-semibold" },
};

const MOOD_LABELS: Record<string, { label: string; emoji: string }> = {
  senang: { label: "Senang", emoji: "😊" },
  baik: { label: "Baik", emoji: "🙂" },
  netral: { label: "Netral", emoji: "😐" },
  sedih: { label: "Sedih", emoji: "😔" },
  stres: { label: "Stres", emoji: "😫" },
  mudah_marah: { label: "Sensitif", emoji: "😤" },
  cemas: { label: "Cemas", emoji: "😰" },
  berenergi: { label: "Berenergi", emoji: "✨" },
};

const SYMPTOM_LABELS: Record<string, string> = {
  kram: "Kram",
  sakit_kepala: "Sakit Kepala",
  kembung: "Kembung",
  jerawat: "Jerawat",
  nyeri_punggung: "Nyeri Punggung",
  lelah: "Lelah",
  mual: "Mual",
  payudara_sensitif: "Payudara Sensitif",
  insomnia: "Insomnia",
  nafsu_makan_naik: "Nafsu Makan",
};

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  todayLog,
  onEditClick,
}) => {
  const hasLog = todayLog !== null;

  return (
    <div className="card-soft p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#E78895]" />
          <h3 className="text-sm font-semibold text-[#2D2727]">Catatan Hari Ini</h3>
        </div>
        <button
          onClick={onEditClick}
          className="text-xs font-semibold text-[#E78895] hover:text-[#d66d7d] flex items-center gap-1 cursor-pointer transition-colors"
        >
          {hasLog ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              Ubah
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Catat
            </>
          )}
        </button>
      </div>

      {!hasLog ? (
        <div className="py-6 text-center text-xs text-[#79716B]">
          <p>Belum ada catatan untuk hari ini.</p>
          <button
            onClick={onEditClick}
            className="mt-2 text-xs font-semibold text-[#E78895] underline hover:no-underline cursor-pointer"
          >
            Tambahkan catatan harian
          </button>
        </div>
      ) : (
        <div className="py-3 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#79716B] flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 text-[#E78895]" />
              Aliran Darah
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] ${
                FLOW_LABELS[todayLog.flow]?.color || "bg-[#F2ECE4] text-[#79716B]"
              }`}
            >
              {FLOW_LABELS[todayLog.flow]?.label || todayLog.flow}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#79716B] flex items-center gap-1.5">
              <Smile className="w-3.5 h-3.5 text-[#81B29A]" />
              Suasana Hati
            </span>
            <div className="flex flex-wrap gap-1 justify-end">
              {todayLog.mood && todayLog.mood.length > 0 ? (
                todayLog.mood.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded-md bg-[#EBF4F0] text-[#81B29A] font-medium text-[11px]"
                  >
                    {MOOD_LABELS[m]?.emoji} {MOOD_LABELS[m]?.label || m}
                  </span>
                ))
              ) : (
                <span className="text-[#79716B]">-</span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[#79716B] block mb-1.5">Gejala:</span>
            {todayLog.symptoms && todayLog.symptoms.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {todayLog.symptoms.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-[#F1EFF7] text-[#9B8EB9] font-medium text-[11px]"
                  >
                    {SYMPTOM_LABELS[s] || s}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[#79716B] italic">Tidak ada gejala dicatat</span>
            )}
          </div>

          {todayLog.notes && (
            <div className="pt-2 border-t border-[#F2ECE4]">
              <p className="text-[#79716B] line-clamp-2 italic text-[11px]">
                &quot;{todayLog.notes}&quot;
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
