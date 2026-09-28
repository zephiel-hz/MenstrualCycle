"use client";

import React from "react";
import { Sparkles, HeartHandshake, Feather, Zap, Moon, Sun } from "lucide-react";
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

  // Phase icon and color styling
  const phaseStyles: Record<string, { badgeColor: string; icon: React.ReactNode }> = {
    menstrual: {
      badgeColor: "bg-[#FCEEF1] text-[#E78895] border-[#E78895]/30",
      icon: <Moon className="w-3.5 h-3.5 text-[#E78895]" />,
    },
    follicular: {
      badgeColor: "bg-[#EBF4F0] text-[#81B29A] border-[#81B29A]/30",
      icon: <Zap className="w-3.5 h-3.5 text-[#81B29A]" />,
    },
    ovulation: {
      badgeColor: "bg-[#E8F3F1] text-[#2A9D8F] border-[#2A9D8F]/30",
      icon: <Sun className="w-3.5 h-3.5 text-[#2A9D8F]" />,
    },
    luteal_pms: {
      badgeColor: "bg-[#F5EEF8] text-[#9B59B6] border-[#9B59B6]/30",
      icon: <Feather className="w-3.5 h-3.5 text-[#9B59B6]" />,
    },
    luteal: {
      badgeColor: "bg-[#FDF2E9] text-[#E67E22] border-[#E67E22]/30",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#E67E22]" />,
    },
  };

  const currentStyle = phaseStyles[stats.currentPhase] || phaseStyles.follicular;

  return (
    <div className="card-soft p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden bg-gradient-to-b from-white via-white to-[#FAF8F5]">
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#E78895]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentStyle.badgeColor}`}>
          {currentStyle.icon}
          {stats.currentPhaseTitle}
        </span>
      </div>

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
              <stop offset="0%" stopColor="#E78895" />
              <stop offset="100%" stopColor="#F3A6B4" />
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
              <HeartHandshake className="w-10 h-10 text-[#E78895] mb-1" />
              <span className="text-sm font-semibold text-[#2D2727]">Mulai Siklus</span>
            </>
          )}
        </div>
      </div>

      {/* Cycle Forecast & PMS Guide */}
      <div className="mt-4 text-sm text-[#79716B] max-w-sm">
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
            <p className="text-[#E78895] font-semibold">Perkiraan menstruasi dimulai hari ini.</p>
          ) : (
            <p>
              Melewati perkiraan siklus sekitar{" "}
              <strong className="text-[#E78895] font-semibold">
                {Math.abs(daysUntilNext)} hari
              </strong>
              .
            </p>
          )
        ) : null}

        {/* Phase Wisdom Box */}
        {stats.currentPhaseTips && (
          <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E0D5] text-left text-xs leading-relaxed text-[#79716B]">
            <span className="font-bold text-[#2D2727] block mb-1 flex items-center gap-1.5">
              💡 Panduan Tubuh Saat Ini:
            </span>
            {stats.currentPhaseTips}
          </div>
        )}
      </div>
    </div>
  );
};
