"use client";

import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Droplet, Smile, Activity, Edit3, Plus } from "lucide-react";

interface CycleCalendarProps {
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
  onOpenLogModal: (dateStr: string) => void;
}

const FLOW_LABELS: Record<string, { label: string; color: string }> = {
  none: { label: "Tidak Ada", color: "bg-[#F2ECE4] text-[#79716B]" },
  light: { label: "Ringan", color: "bg-[#FCECE8] text-[#E07A5F]" },
  medium: { label: "Sedang", color: "bg-[#FCECE8] text-[#E07A5F] font-semibold" },
  heavy: { label: "Berat", color: "bg-[#E07A5F] text-white font-semibold" },
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

export const CycleCalendar: React.FC<CycleCalendarProps> = ({
  cycles,
  logs,
  estimatedNextPeriodDate,
  averagePeriodDuration = 5,
  onOpenLogModal,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const isPeriodDay = (day: Date): boolean => {
    const dayStr = format(day, "yyyy-MM-dd");
    for (const c of cycles) {
      if (c.endDate) {
        if (dayStr >= c.startDate && dayStr <= c.endDate) return true;
      } else {
        if (dayStr === c.startDate) return true;
      }
    }
    const log = logs.find((l) => l.date === dayStr);
    if (log && log.flow && log.flow !== "none") return true;

    return false;
  };

  const isEstimatedPeriodDay = (day: Date): boolean => {
    if (!estimatedNextPeriodDate) return false;
    const dayStr = format(day, "yyyy-MM-dd");
    const estStart = parseISO(estimatedNextPeriodDate);
    const estEnd = new Date(estStart);
    estEnd.setDate(estEnd.getDate() + averagePeriodDuration - 1);
    const estEndStr = format(estEnd, "yyyy-MM-dd");

    return dayStr >= estimatedNextPeriodDate && dayStr <= estEndStr;
  };

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedLog = logs.find((l) => l.date === selectedDateStr);
  const hasLog = Boolean(selectedLog);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    setSelectedDate(now);
  };

  const weekDays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  return (
    <div className="space-y-6">
      <div className="card-soft p-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-[#2D2727] capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
            </h2>
            <p className="text-xs text-[#79716B]">Kalender siklus & gejala harian</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#FAF8F5] border border-[#E8E0D5] hover:border-[#E07A5F] text-[#2D2727] transition-colors cursor-pointer mr-1"
            >
              Hari Ini
            </button>
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E0D5] text-[#2D2727] transition-colors cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-[#FAF8F5] border border-transparent hover:border-[#E8E0D5] text-[#2D2727] transition-colors cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-[11px] font-bold text-[#79716B] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const dayPeriod = isPeriodDay(day);
            const dayEstimated = isEstimatedPeriodDay(day);
            const dayStr = format(day, "yyyy-MM-dd");
            const dayHasLog = logs.some((l) => l.date === dayStr);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-xl text-xs transition-all cursor-pointer ${
                  !isCurrentMonth ? "opacity-30 text-[#79716B]" : "text-[#2D2727]"
                } ${
                  isSelected
                    ? "ring-2 ring-[#E07A5F] font-bold z-10 scale-105"
                    : "hover:bg-[#FAF8F5]"
                } ${
                  dayPeriod
                    ? "bg-[#FCECE8] text-[#E07A5F] font-semibold"
                    : dayEstimated
                    ? "border border-dashed border-[#E07A5F]/60 text-[#E07A5F]"
                    : ""
                }`}
              >
                <span>{format(day, "d")}</span>

                {dayHasLog && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#81B29A]" />
                )}

                {isTodayDate && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2D2727]" />
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-[#F2ECE4] flex flex-wrap items-center justify-center gap-4 text-xs text-[#79716B]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FCECE8] border border-[#E07A5F]" />
            <span>Menstruasi</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border border-dashed border-[#E07A5F]" />
            <span>Perkiraan</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#81B29A]" />
            <span>Ada Catatan Log</span>
          </div>
        </div>
      </div>

      {/* Selected Date Summary Card - Matches Dashboard DailySummaryCard styling */}
      <div className="card-soft p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-[#F2ECE4]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#E07A5F]" />
            <div>
              <h3 className="text-sm font-semibold text-[#2D2727] capitalize">
                Catatan: {format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
              </h3>
            </div>
          </div>
          <button
            onClick={() => onOpenLogModal(selectedDateStr)}
            className="text-xs font-semibold text-[#E07A5F] hover:text-[#d0694e] flex items-center gap-1 cursor-pointer transition-colors"
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

        {!selectedLog ? (
          <div className="py-6 text-center text-xs text-[#79716B]">
            <p>Belum ada catatan untuk tanggal ini.</p>
            <button
              onClick={() => onOpenLogModal(selectedDateStr)}
              className="mt-2 text-xs font-semibold text-[#E07A5F] underline hover:no-underline cursor-pointer"
            >
              Tambahkan catatan harian
            </button>
          </div>
        ) : (
          <div className="py-3 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#79716B] flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-[#E07A5F]" />
                Aliran Darah
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] ${
                  FLOW_LABELS[selectedLog.flow]?.color || "bg-[#F2ECE4] text-[#79716B]"
                }`}
              >
                {FLOW_LABELS[selectedLog.flow]?.label || selectedLog.flow}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#79716B] flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-[#81B29A]" />
                Suasana Hati
              </span>
              <div className="flex flex-wrap gap-1 justify-end">
                {selectedLog.mood && selectedLog.mood.length > 0 ? (
                  selectedLog.mood.map((m) => (
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
              {selectedLog.symptoms && selectedLog.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLog.symptoms.map((s) => (
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

            {selectedLog.notes && (
              <div className="pt-2 border-t border-[#F2ECE4]">
                <p className="text-[#79716B] line-clamp-2 italic text-[11px]">
                  &quot;{selectedLog.notes}&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
