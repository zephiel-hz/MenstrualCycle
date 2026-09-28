import { describe, it, expect } from "vitest";
import { calculateCycleStats, generateCycleInsights } from "@/lib/calculations/cycle";

describe("Cycle Calculation & Prediction Engine", () => {
  it("should return default values when no cycles are recorded", () => {
    const stats = calculateCycleStats([], 28, 5, new Date("2026-09-28"));
    expect(stats.totalCyclesLogged).toBe(0);
    expect(stats.currentCycleDay).toBeNull();
    expect(stats.estimatedNextPeriodDate).toBeNull();
    expect(stats.averageCycleLength).toBe(28);
    expect(stats.isEstimateBasedOnDefaults).toBe(true);
  });

  it("should calculate current cycle day and next estimate correctly for 1 cycle", () => {
    const cycles = [
      { id: "1", startDate: "2026-09-20", endDate: "2026-09-25", notes: "Normal" },
    ];
    const stats = calculateCycleStats(cycles, 28, 5, new Date("2026-09-28"));
    expect(stats.totalCyclesLogged).toBe(1);
    expect(stats.currentCycleDay).toBe(9);
    expect(stats.isEstimateBasedOnDefaults).toBe(true);
    expect(stats.estimatedNextPeriodDate).toBe("2026-10-18");
  });

  it("should calculate accurate average length and durations for multiple cycles", () => {
    const cycles = [
      { id: "3", startDate: "2026-09-01", endDate: "2026-09-06" },
      { id: "2", startDate: "2026-08-03", endDate: "2026-08-08" },
      { id: "1", startDate: "2026-07-04", endDate: "2026-07-09" },
    ];
    const stats = calculateCycleStats(cycles, 28, 5, new Date("2026-09-15"));
    expect(stats.totalCyclesLogged).toBe(3);
    expect(stats.averageCycleLength).toBe(30);
    expect(stats.averagePeriodDuration).toBe(6);
    expect(stats.shortestCycle).toBe(29);
    expect(stats.longestCycle).toBe(30);
    expect(stats.isEstimateBasedOnDefaults).toBe(false);
  });

  it("should generate proper non-diagnostic insights", () => {
    const cycles = [
      { id: "3", startDate: "2026-09-01", endDate: "2026-09-05" },
      { id: "2", startDate: "2026-08-03", endDate: "2026-08-07" },
      { id: "1", startDate: "2026-07-05", endDate: "2026-07-09" },
    ];
    const logs = [
      { id: "l1", date: "2026-09-01", flow: "medium", mood: ["senang"], symptoms: ["kram"] },
      { id: "l2", date: "2026-09-02", flow: "heavy", mood: ["baik"], symptoms: ["kram", "sakit_kepala"] },
    ];
    const stats = calculateCycleStats(cycles, 28, 5, new Date("2026-09-15"));
    const insights = generateCycleInsights(cycles, logs, stats);

    expect(insights.length).toBeGreaterThan(0);
    const hasSymptomInsight = insights.some((i) => i.type === "symptom" && i.description.includes("Kram perut"));
    expect(hasSymptomInsight).toBe(true);
  });
});
