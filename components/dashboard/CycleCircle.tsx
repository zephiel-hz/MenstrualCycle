"use client";

import React from "react";
import { Sparkles, Moon, Sun, Feather, Zap, Heart, PlusCircle, ArrowRight } from "lucide-react";
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
  // Radius = 68 -> Circumference = 2 * PI * 68 = ~427.25
  const circumference = 427;
  const strokeDashoffset = circumference - (circumference * percent) / 100;

  // Phase specific color tokens and styling
  const phaseConfig: Record<
    string,
    {
      badgeBg: string;
      badgeText: string;
      badgeBorder: string;
      glowColor: string;
      accentColor: string;
      gradientId: string;
      startColor: string;
      endColor: string;
      icon: React.ReactNode;
    }
  > = {
    menstrual: {
      badgeBg: "bg-[#FAF0F2]",
      badgeText: "text-[#D8647F]",
      badgeBorder: "border-[#D8647F]/20",
      glowColor: "rgba(216, 100, 127, 0.12)",
      accentColor: "#D8647F",
      gradientId: "gradMenstrual",
      startColor: "#D8647F",
      endColor: "#F3A6B4",
      icon: <Moon className="w-3.5 h-3.5 text-[#D8647F]" />,
    },
    follicular: {
      badgeBg: "bg-[#EBF4F0]",
      badgeText: "text-[#588B76]",
      badgeBorder: "border-[#588B76]/20",
      glowColor: "rgba(88, 139, 118, 0.12)",
      accentColor: "#588B76",
      gradientId: "gradFollicular",
      startColor: "#588B76",
      endColor: "#81B29A",
      icon: <Zap className="w-3.5 h-3.5 text-[#588B76]" />,
    },
    ovulation: {
      badgeBg: "bg-[#E6F5F2]",
      badgeText: "text-[#3D9988]",
      badgeBorder: "border-[#3D9988]/20",
      glowColor: "rgba(61, 153, 136, 0.14)",
      accentColor: "#3D9988",
      gradientId: "gradOvulation",
      startColor: "#3D9988",
      endColor: "#62C4B2",
      icon: <Sun className="w-3.5 h-3.5 text-[#3D9988]" />,
    },
    luteal_pms: {
      badgeBg: "bg-[#F8EEF1]",
      badgeText: "text-[#BA7588]",
      badgeBorder: "border-[#BA7588]/20",
      glowColor: "rgba(186, 117, 136, 0.14)",
      accentColor: "#BA7588",
      gradientId: "gradPms",
      startColor: "#BA7588",
      endColor: "#D89BAA",
      icon: <Feather className="w-3.5 h-3.5 text-[#BA7588]" />,
    },
    luteal: {
      badgeBg: "bg-[#FCF4EB]",
      badgeText: "text-[#C68246]",
      badgeBorder: "border-[#C68246]/20",
      glowColor: "rgba(198, 130, 70, 0.12)",
      accentColor: "#C68246",
      gradientId: "gradLuteal",
      startColor: "#C68246",
      endColor: "#E0A36E",
      icon: <Sparkles className="w-3.5 h-3.5 text-[#C68246]" />,
    },
  };

  const currentConfig = phaseConfig[stats.currentPhase] || phaseConfig.follicular;

  // 4 Main Phase segments for the journey timeline
  const phaseSegments = [
    { key: "menstrual", label: "Menstruasi", short: "Haid" },
    { key: "follicular", label: "Folikuler", short: "Energi" },
    { key: "ovulation", label: "Ovulasi", short: "Subur" },
    { key: "luteal", label: "Luteal / PMS", short: "Luteal" },
  ];

  return (
    <div className="surface-elevated p-6 sm:p-8 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">
      {/* Ambient Phase Halo */}
      <div
        className="absolute -top-28 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: currentConfig.glowColor }}
      />

      {/* Phase Status Capsule */}
      <div className="flex items-center gap-2 mb-3 z-10">
        <span
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${currentConfig.badgeBg} ${currentConfig.badgeText} ${currentConfig.badgeBorder} shadow-2xs transition-all`}
        >
          {currentConfig.icon}
          <span>{stats.currentPhaseTitle}</span>
        </span>
      </div>

      {/* Bespoke Organic Cycle Dial */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center my-3 z-10">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="dialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentConfig.startColor} />
              <stop offset="100%" stopColor={currentConfig.endColor} />
            </linearGradient>
            <filter id="dialGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor={currentConfig.accentColor} floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r="68"
            stroke="#F5EFEB"
            strokeWidth="9"
            fill="transparent"
          />

          {/* Active Phase Progress Ring */}
          <circle
            cx="80"
            cy="80"
            r="68"
            stroke="url(#dialGrad)"
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            filter="url(#dialGlow)"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Dial Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 select-none">
          {currentDay !== null ? (
            <>
              <span className="text-4xl sm:text-5xl font-extrabold text-[#221B1F] tracking-tight font-editorial">
                {currentDay}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#7D7277] mt-1">
                Hari Siklus
              </span>
              <span className="text-[11px] text-[#7D7277] mt-0.5">
                dari {avgCycle} hari
              </span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-[#FAF0F2] flex items-center justify-center mb-2 shadow-2xs">
                <Heart className="w-6 h-6 text-[#D8647F]" />
              </div>
              <span className="text-sm font-semibold text-[#221B1F]">Mulai Siklus</span>
              <span className="text-xs text-[#7D7277] mt-0.5">Catat hari pertama haid</span>
            </>
          )}
        </div>
      </div>

      {/* 4-Phase Journey Segment Bar */}
      <div className="w-full max-w-sm mt-2 mb-4 z-10">
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#FAF6F3] border border-[#EFE9E2]">
          {phaseSegments.map((seg) => {
            const isSegActive =
              (seg.key === "menstrual" && stats.currentPhase === "menstrual") ||
              (seg.key === "follicular" && stats.currentPhase === "follicular") ||
              (seg.key === "ovulation" && stats.currentPhase === "ovulation") ||
              (seg.key === "luteal" &&
                (stats.currentPhase === "luteal" || stats.currentPhase === "luteal_pms"));

            return (
              <div
                key={seg.key}
                className={`py-1.5 px-1 rounded-xl text-center transition-all ${
                  isSegActive
                    ? "bg-white text-[#221B1F] shadow-xs font-bold border border-[#EFE9E2]"
                    : "text-[#7D7277] text-[11px]"
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 transition-colors ${
                    isSegActive ? "bg-[#D8647F]" : "bg-[#E5DCD4]"
                  }`}
                />
                <p className="text-[10px] sm:text-[11px] font-medium leading-none truncate">
                  {seg.short}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast & Cycle Message */}
      <div className="mt-1 text-xs text-[#7D7277] max-w-sm z-10 space-y-3">
        {stats.totalCyclesLogged === 0 ? (
          <p className="leading-relaxed">
            Belum ada siklus aktif. Catat hari pertama menstruasi kamu untuk memulai pelacakan otomatis.
          </p>
        ) : daysUntilNext !== null ? (
          <div className="p-3 rounded-2xl bg-white border border-[#EFE9E2] shadow-2xs">
            {daysUntilNext > 0 ? (
              <p className="text-[#221B1F]">
                Perkiraan menstruasi berikutnya sekitar{" "}
                <strong className="text-[#D8647F] font-bold">{daysUntilNext} hari lagi</strong>
                {stats.estimatedNextPeriodDate && (
                  <span className="block text-[11px] text-[#7D7277] mt-0.5">
                    ({formatShortDate(stats.estimatedNextPeriodDate)})
                  </span>
                )}
              </p>
            ) : daysUntilNext === 0 ? (
              <p className="text-[#D8647F] font-bold">
                🌸 Perkiraan menstruasi dimulai hari ini. Jaga kenyamanan tubuhmu!
              </p>
            ) : (
              <p className="text-[#221B1F]">
                Melewati perkiraan siklus sekitar{" "}
                <strong className="text-[#D8647F] font-bold">
                  {Math.abs(daysUntilNext)} hari
                </strong>
                .
              </p>
            )}
          </div>
        ) : null}

        {/* Phase Wisdom Box */}
        {stats.currentPhaseTips && (
          <div className="p-4 rounded-2xl bg-[#FAF6F3] border border-[#EFE9E2] text-left text-xs leading-relaxed text-[#5C5458] space-y-1.5 shadow-2xs">
            <span className="font-semibold text-[#221B1F] flex items-center gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D8647F]" />
              Panduan Tubuh Saat Ini
            </span>
            <p className="text-[11px] leading-relaxed text-[#7D7277]">
              {stats.currentPhaseTips}
            </p>
          </div>
        )}

        {/* Quick Log Action Pill */}
        <div className="pt-2">
          <button
            onClick={onLogClick}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF0F2] hover:bg-[#F6E2E7] active:scale-98 border border-[#D8647F]/20 text-[#D8647F] font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Gejala & Mood Hari Ini
          </button>
        </div>
      </div>
    </div>
  );
};
