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
import { ChevronLeft, ChevronRight, Droplet, Smile, Activity, Edit3, Plus, Calendar as CalendarIcon, Sparkles } from "lucide-react";

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

const FLOW_LABELS: Record<string, { label: string; badge: string }> = {
  none: { label: "Tidak Ada", badge: "bg-[#F3ECE5] text-[#7D7277]" },
  light: { label: "Ringan / Flek", badge: "bg-[#FAF0F2] text-[#D8647F] border border-[#D8647F]/20" },
  medium: { label: "Sedang", badge: "bg-[#FAF0F2] text-[#D8647F] font-semibold border border-[#D8647F]/30" },
  heavy: { label: "Banyak", badge: "bg-[#D8647F] text-white font-semibold" },
};

const MOOD_NAMES: Record<string, string> = {
  senang: "Senang & Gembira",
  baik: "Tenang & Santai",
  netral: "Netral",
  sedih: "Sensitif / Sedih",
  stres: "Stres / Lelah",
  mudah_marah: "Mudah Terpancing",
  cemas: "Cemas",
  berenergi: "Penuh Energi ✨",
};

const SYMPTOM_LABELS: Record<string, string> = {
  kram: "Kram Perut",
  sakit_kepala: "Sakit Kepala",
  kembung: "Kembung",
  jerawat: "Jerawat",
  nyeri_punggung: "Nyeri Punggung",
  lelah: "Lelah",
  mual: "Mual",
  payudara_sensitif: "Payudara Nyeri",
  insomnia: "Sulit Tidur",
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

  const isPmsDay = (day: Date): boolean => {
    if (!estimatedNextPeriodDate) return false;
    const dayStr = format(day, "yyyy-MM-dd");
    const estPeriod = parseISO(estimatedNextPeriodDate);
    const pmsStart = new Date(estPeriod);
    pmsStart.setDate(pmsStart.getDate() - 7);
    const pmsEnd = new Date(estPeriod);
    pmsEnd.setDate(pmsEnd.getDate() - 1);

    const startStr = format(pmsStart, "yyyy-MM-dd");
    const endStr = format(pmsEnd, "yyyy-MM-dd");
    return dayStr >= startStr && dayStr <= endStr;
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
    <div className="space-y-6 max-w-4xl mx-auto pb-6">
      {/* Calendar Card */}
      <div className="surface-card p-5 sm:p-7">
        {/* Month Navigation Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#EFE9E2]">
          <div>
            <h2 className="text-xl font-bold text-[#221B1F] capitalize font-editorial">
              {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
            </h2>
            <p className="text-xs text-[#7D7277] mt-0.5">Peta fase haid, PMS, dan catatan harian</p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={goToToday}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#FAF6F3] border border-[#EFE9E2] hover:border-[#D8647F]/40 text-[#221B1F] transition-all cursor-pointer mr-1 active:scale-95"
            >
              Hari Ini
            </button>
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-[#FAF6F3] border border-transparent hover:border-[#EFE9E2] text-[#221B1F] transition-colors cursor-pointer"
              aria-label="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-[#FAF6F3] border border-transparent hover:border-[#EFE9E2] text-[#221B1F] transition-colors cursor-pointer"
              aria-label="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {weekDays.map((d) => (
            <div key={d} className="text-[11px] font-semibold text-[#7D7277] py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = isSameDay(day, selectedDate);
            const isTodayDate = isToday(day);
            const dayPeriod = isPeriodDay(day);
            const dayEstimated = isEstimatedPeriodDay(day);
            const dayPms = isPmsDay(day);
            const dayStr = format(day, "yyyy-MM-dd");
            const dayHasLog = logs.some((l) => l.date === dayStr);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                  !isCurrentMonth ? "opacity-25 text-[#7D7277]" : "text-[#221B1F]"
                } ${
                  isSelected
                    ? "ring-2 ring-[#D8647F] font-bold z-10 shadow-xs scale-105"
                    : "hover:bg-[#FAF6F3]"
                } ${
                  dayPeriod
                    ? "bg-[#FAF0F2] text-[#D8647F] font-bold border border-[#D8647F]/30"
                    : dayEstimated
                    ? "border border-dashed border-[#D8647F]/60 text-[#D8647F] bg-[#FAF0F2]/50"
                    : dayPms
                    ? "bg-[#F8EEF1] text-[#BA7588] font-medium border border-[#BA7588]/25"
                    : ""
                }`}
              >
                <span className="font-editorial">{format(day, "d")}</span>

                {/* Log indicator dot */}
                {dayHasLog && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#588B76]" />
                )}

                {/* Today indicator line */}
                {isTodayDate && !isSelected && (
                  <span className="absolute bottom-1.5 w-3 h-0.5 rounded-full bg-[#D8647F]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-[#EFE9E2] flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#7D7277]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FAF0F2] border border-[#D8647F]" />
            <span>Haid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#D8647F]" />
            <span>Perkiraan Haid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F8EEF1] border border-[#BA7588]" />
            <span>Fase PMS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#588B76]" />
            <span>Ada Jurnal Log</span>
          </div>
        </div>
      </div>

      {/* Selected Date Inspector Card */}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#EFE9E2]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF0F2] text-[#D8647F] flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#221B1F]">
                {format(selectedDate, "EEEE, d MMMM yyyy", { locale: idLocale })}
              </h3>
              <p className="text-[11px] text-[#7D7277]">
                {isPeriodDay(selectedDate)
                  ? "Hari menstruasi"
                  : isPmsDay(selectedDate)
                  ? "Diperkirakan fase PMS"
                  : isEstimatedPeriodDay(selectedDate)
                  ? "Diperkirakan haid"
                  : "Fase siklus reguler"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenLogModal(selectedDateStr)}
            className="px-3.5 py-1.5 rounded-full bg-[#FAF0F2] hover:bg-[#F6E2E7] text-[#D8647F] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {hasLog ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Ubah Jurnal</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Hari Ini</span>
              </>
            )}
          </button>
        </div>

        {!selectedLog ? (
          <div className="py-6 text-center text-xs text-[#7D7277] space-y-2">
            <p>Belum ada catatan fisik, aliran, atau suasana hati untuk tanggal ini.</p>
            <button
              onClick={() => onOpenLogModal(selectedDateStr)}
              className="text-xs font-semibold text-[#D8647F] hover:underline cursor-pointer"
            >
              + Tambah catatan kondisi tubuh
            </button>
          </div>
        ) : (
          <div className="py-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[#7D7277] flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-[#D8647F]" />
                Aliran Menstruasi:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                  FLOW_LABELS[selectedLog.flow]?.badge || "bg-[#F3ECE5] text-[#7D7277]"
                }`}
              >
                {FLOW_LABELS[selectedLog.flow]?.label || selectedLog.flow}
              </span>
            </div>

            <div className="flex items-start justify-between gap-2">
              <span className="text-[#7D7277] flex items-center gap-1.5 pt-0.5">
                <Smile className="w-3.5 h-3.5 text-[#588B76]" />
                Suasana Hati:
              </span>
              <div className="flex flex-wrap gap-1 justify-end">
                {selectedLog.mood && selectedLog.mood.length > 0 ? (
                  selectedLog.mood.map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md bg-[#EBF4F0] text-[#588B76] font-medium text-[11px] border border-[#588B76]/15"
                    >
                      {MOOD_NAMES[m] || m}
                    </span>
                  ))
                ) : (
                  <span className="text-[#7D7277]">-</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[#7D7277] block text-[11px] font-medium mb-1">
                Gejala Tubuh:
              </span>
              {selectedLog.symptoms && selectedLog.symptoms.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLog.symptoms.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md bg-[#F2EEF7] text-[#8E78A5] font-medium text-[11px] border border-[#8E78A5]/15"
                    >
                      {SYMPTOM_LABELS[s] || s}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[#7D7277] italic text-[11px]">Tidak ada gejala</span>
              )}
            </div>

            {selectedLog.notes && (
              <div className="pt-2 border-t border-[#EFE9E2]">
                <p className="text-[#5C5458] italic text-[11px] leading-relaxed bg-[#FAF6F3] p-2.5 rounded-xl border border-[#EFE9E2]">
                  &ldquo;{selectedLog.notes}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
