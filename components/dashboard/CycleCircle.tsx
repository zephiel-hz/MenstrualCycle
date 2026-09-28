"use client";

import React from "react";
import { Sparkles, HeartHandshake } from "lucide-react";
import { CycleSummaryStats } from "@/lib/calculations/cycle";
import { formatShortDate } from "@/lib/utils";

interface CycleCircleProps {
  stats: CycleSummaryStats;
  onLogClick: () => void;
}

export const CycleCircle: React.FC<CycleCircleProps> = ({ stats, onLogClick }) => {
  const currentDay = stats.currentCycleDay;
  const daysUntilNext = stats.daysUntilNextPeriod;
  const avgCycle = stats.averageCycleLength || 28;

  const percent = currentDay ? Math.min(Math.round((currentDay / avgCycle) * 100), 100) : 0;
  const strokeDashoffset = 440 - (440 * percent) / 100;

  return (
    <div className="card-soft p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white via-white to-[#FAF8F5]">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#E07A5F]/10 rounded-full blur-3xl pointer-events-none" />

      <p className="text-xs font-semibold uppercase tracking-widest text-[#E07A5F] mb-4">
        Siklus Kamu
      </p>

      <div className="relative w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center my-2">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="#F2ECE4"
            strokeWidth="10"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="url(#cycleGradient)"
            strokeWidth="10"
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="cycleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E07A5F" />
              <stop offset="100%" stopColor="#F4A261" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
          {currentDay !== null ? (
            <>
              <span className="text-4xl sm:text-5xl font-extrabold text-[#2D2727] tracking-tight">
                {currentDay}
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-[#79716B] mt-1">
                Hari Siklus
              </span>
            </>
          ) : (
            <>
              <HeartHandshake className="w-10 h-10 text-[#E07A5F] mb-1" />
              <span className="text-sm font-semibold text-[#2D2727]">Mulai Siklus</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-[#79716B] max-w-xs">
        {stats.totalCyclesLogged === 0 ? (
          <p>Belum ada siklus aktif. Catat hari pertama menstruasi kamu untuk memulai pelacakan.</p>
        ) : daysUntilNext !== null ? (
          daysUntilNext > 0 ? (
            <p>
              Perkiraan menstruasi berikutnya sekitar{" "}
              <strong className="text-[#2D2727] font-semibold">{daysUntilNext} hari lagi</strong>
              {stats.estimatedNextPeriodDate && (
                <span className="block text-xs text-[#79716B] mt-0.5">
                  ({formatShortDate(stats.estimatedNextPeriodDate)})
                </span>
              )}
            </p>
          ) : daysUntilNext === 0 ? (
            <p className="text-[#E07A5F] font-semibold">Perkiraan menstruasi dimulai hari ini.</p>
          ) : (
            <p>
              Melewati perkiraan siklus sekitar{" "}
              <strong className="text-[#E07A5F] font-semibold">
                {Math.abs(daysUntilNext)} hari
              </strong>
              .
            </p>
          )
        ) : (
          <p>Lanjutkan mencatat siklus harianmu secara berkala.</p>
        )}
      </div>

      <button
        onClick={onLogClick}
        className="mt-6 px-6 py-3 rounded-full bg-[#E07A5F] hover:bg-[#d0694e] text-white text-sm font-semibold shadow-md shadow-[#E07A5F]/25 hover:shadow-lg hover:shadow-[#E07A5F]/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        + Catat Hari Ini
      </button>
    </div>
  );
};
