import { differenceInDays, addDays, parseISO, format } from "date-fns";

export interface CycleData {
  id: string;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
}

export interface DailyLogData {
  id: string;
  date: string;
  flow: string;
  mood: string[];
  symptoms: string[];
  notes?: string | null;
}

export interface CycleSummaryStats {
  currentCycleDay: number | null;
  estimatedNextPeriodDate: string | null;
  daysUntilNextPeriod: number | null;
  averageCycleLength: number;
  averagePeriodDuration: number;
  shortestCycle: number | null;
  longestCycle: number | null;
  totalCyclesLogged: number;
  isEstimateBasedOnDefaults: boolean;
  estimatedOvulationDate: string | null;
  estimatedFertileWindow: {
    start: string;
    end: string;
  } | null;
}

export interface CycleInsight {
  title: string;
  description: string;
  type: "info" | "regularity" | "symptom" | "wellness";
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function calculateCycleStats(
  cycles: CycleData[],
  defaultCycleLength: number = 28,
  defaultPeriodDuration: number = 5,
  referenceDate: Date = new Date()
): CycleSummaryStats {
  const sortedCycles = [...cycles].sort(
    (a, b) => parseLocalDate(b.startDate).getTime() - parseLocalDate(a.startDate).getTime()
  );

  const totalCycles = sortedCycles.length;

  if (totalCycles === 0) {
    return {
      currentCycleDay: null,
      estimatedNextPeriodDate: null,
      daysUntilNextPeriod: null,
      averageCycleLength: defaultCycleLength,
      averagePeriodDuration: defaultPeriodDuration,
      shortestCycle: null,
      longestCycle: null,
      totalCyclesLogged: 0,
      isEstimateBasedOnDefaults: true,
      estimatedOvulationDate: null,
      estimatedFertileWindow: null,
    };
  }

  const cycleLengths: number[] = [];
  const chronological = [...sortedCycles].reverse();

  for (let i = 0; i < chronological.length - 1; i++) {
    const currentStart = parseLocalDate(chronological[i].startDate);
    const nextStart = parseLocalDate(chronological[i + 1].startDate);
    const length = differenceInDays(nextStart, currentStart);
    if (length >= 15 && length <= 90) {
      cycleLengths.push(length);
    }
  }

  const periodDurations: number[] = [];
  for (const c of sortedCycles) {
    if (c.endDate) {
      const start = parseLocalDate(c.startDate);
      const end = parseLocalDate(c.endDate);
      const duration = differenceInDays(end, start) + 1;
      if (duration >= 1 && duration <= 20) {
        periodDurations.push(duration);
      }
    }
  }

  const avgCycleLength =
    cycleLengths.length > 0
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : defaultCycleLength;

  const avgPeriodDuration =
    periodDurations.length > 0
      ? Math.round(periodDurations.reduce((a, b) => a + b, 0) / periodDurations.length)
      : defaultPeriodDuration;

  const shortestCycle = cycleLengths.length > 0 ? Math.min(...cycleLengths) : null;
  const longestCycle = cycleLengths.length > 0 ? Math.max(...cycleLengths) : null;

  const latestCycle = sortedCycles[0];
  const latestStart = parseLocalDate(latestCycle.startDate);
  const currentCycleDay = differenceInDays(referenceDate, latestStart) + 1;

  const predictedNextStart = addDays(latestStart, avgCycleLength);
  const daysUntilNext = differenceInDays(predictedNextStart, referenceDate);

  const estimatedOvulation = addDays(predictedNextStart, -14);
  const fertileStart = addDays(estimatedOvulation, -5);
  const fertileEnd = addDays(estimatedOvulation, 1);

  const isEstimateBasedOnDefaults = cycleLengths.length === 0;

  return {
    currentCycleDay: currentCycleDay > 0 ? currentCycleDay : 1,
    estimatedNextPeriodDate: format(predictedNextStart, "yyyy-MM-dd"),
    daysUntilNextPeriod: daysUntilNext,
    averageCycleLength: avgCycleLength,
    averagePeriodDuration: avgPeriodDuration,
    shortestCycle,
    longestCycle,
    totalCyclesLogged: totalCycles,
    isEstimateBasedOnDefaults,
    estimatedOvulationDate: format(estimatedOvulation, "yyyy-MM-dd"),
    estimatedFertileWindow: {
      start: format(fertileStart, "yyyy-MM-dd"),
      end: format(fertileEnd, "yyyy-MM-dd"),
    },
  };
}

export function generateCycleInsights(
  cycles: CycleData[],
  logs: DailyLogData[],
  stats: CycleSummaryStats
): CycleInsight[] {
  const insights: CycleInsight[] = [];

  if (stats.totalCyclesLogged < 2) {
    insights.push({
      title: "Mulai Membangun Pola",
      description:
        "Catat minimal 2 hingga 3 siklus untuk mendapatkan perkiraan dan wawasan pola tubuh yang lebih akurat.",
      type: "info",
    });
  } else {
    if (stats.shortestCycle && stats.longestCycle) {
      const diff = stats.longestCycle - stats.shortestCycle;
      if (diff <= 3) {
        insights.push({
          title: "Pola Siklus Sangat Teratur",
          description: `Dalam catatanmu, panjang siklus berada di rentang stabil ${stats.shortestCycle}–${stats.longestCycle} hari dengan rata-rata ${stats.averageCycleLength} hari.`,
          type: "regularity",
        });
      } else if (diff <= 7) {
        insights.push({
          title: "Variasi Siklus Wajar",
          description: `Panjang siklusmu bervariasi antara ${stats.shortestCycle} hingga ${stats.longestCycle} hari. Variasi beberapa hari adalah hal yang normal pada tubuh manusia.`,
          type: "regularity",
        });
      } else {
        insights.push({
          title: "Variasi Siklus Luas",
          description: `Tercatat perbedaan hingga ${diff} hari antara siklus terpendek (${stats.shortestCycle} hari) dan terpanjang (${stats.longestCycle} hari). Jika terjadi perubahan drastis berkelanjutan, pertimbangkan untuk berkonsultasi dengan dokter.`,
          type: "wellness",
        });
      }
    }
  }

  const symptomCounts: Record<string, number> = {};
  logs.forEach((log) => {
    if (Array.isArray(log.symptoms)) {
      log.symptoms.forEach((s) => {
        symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      });
    }
  });

  const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
  if (sortedSymptoms.length > 0) {
    const topSymptom = sortedSymptoms[0];
    const symptomLabels: Record<string, string> = {
      kram: "Kram perut",
      sakit_kepala: "Sakit kepala",
      kembung: "Kembung",
      jerawat: "Jerawat",
      nyeri_punggung: "Nyeri punggung",
      lelah: "Rasa lelah",
      mual: "Mual",
      payudara_sensitif: "Payudara sensitif",
      insomnia: "Sulit tidur",
      nafsu_makan_naik: "Nafsu makan bertambah",
    };

    const label = symptomLabels[topSymptom[0]] || topSymptom[0];
    insights.push({
      title: `Gejala Paling Sering: ${label}`,
      description: `Gejala "${label}" tercatat sebanyak ${topSymptom[1]} kali dalam catatan harianmu. Mengetahui pola ini membantu persiapan kenyamanan harian.`,
      type: "symptom",
    });
  }

  const moodCounts: Record<string, number> = {};
  logs.forEach((log) => {
    if (Array.isArray(log.mood)) {
      log.mood.forEach((m) => {
        moodCounts[m] = (moodCounts[m] || 0) + 1;
      });
    }
  });

  const sortedMoods = Object.entries(moodCounts).sort((a, b) => b[1] - a[1]);
  if (sortedMoods.length > 0) {
    const topMood = sortedMoods[0];
    const moodLabels: Record<string, string> = {
      senang: "Senang",
      baik: "Baik",
      netral: "Netral",
      sedih: "Sedih",
      stres: "Stres",
      mudah_marah: "Sensitif / Mudah Marah",
      cemas: "Cemas",
      berenergi: "Berenergi",
    };
    insights.push({
      title: "Suasana Hati Dominan",
      description: `Suasana hati "${moodLabels[topMood[0]] || topMood[0]}" paling banyak tercatat (${topMood[1]} catatan).`,
      type: "wellness",
    });
  }

  return insights;
}
