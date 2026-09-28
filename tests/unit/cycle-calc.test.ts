import { describe, it, expect } from "vitest";
import {
  calculateCycleStats,
  generateCycleInsights,
  CycleData,
  DailyLogData,
} from "@/lib/calculations/cycle";

describe("Cycle & PMS Calculations", () => {
  it("should return default stats when no cycles are present", () => {
    const stats = calculateCycleStats([]);
    expect(stats.averageCycleLength).toBe(28);
    expect(stats.averagePeriodDuration).toBe(5);
    expect(stats.totalCyclesLogged).toBe(0);
    expect(stats.currentCycleDay).toBeNull();
    expect(stats.isPmsPhase).toBe(false);
  });

  it("should calculate correct cycle stats and PMS window for logged cycles", () => {
    const cycles: CycleData[] = [
      { id: "1", startDate: "2026-08-01", endDate: "2026-08-06" },
      { id: "2", startDate: "2026-08-29", endDate: "2026-09-03" },
      { id: "3", startDate: "2026-09-26", endDate: null },
    ];

    const refDate = new Date(2026, 8, 28); // Sept 28, 2026 (day 3)
    const stats = calculateCycleStats(cycles, 28, 5, refDate);

    expect(stats.totalCyclesLogged).toBe(3);
    expect(stats.averageCycleLength).toBe(28);
    expect(stats.averagePeriodDuration).toBe(6);
    expect(stats.currentCycleDay).toBe(3);
    expect(stats.currentPhase).toBe("menstrual");
    expect(stats.estimatedPmsWindow).toBeDefined();
    expect(stats.estimatedPmsWindow?.start).toBe("2026-10-17");
  });

  it("should detect PMS phase when within 7 days of estimated next period", () => {
    const cycles: CycleData[] = [
      { id: "1", startDate: "2026-08-01", endDate: "2026-08-05" },
      { id: "2", startDate: "2026-08-29", endDate: "2026-09-02" },
    ];

    // Estimated next period: Sept 26. Reference date: Sept 22 (4 days before next period)
    const refDate = new Date(2026, 8, 22);
    const stats = calculateCycleStats(cycles, 28, 5, refDate);

    expect(stats.isPmsPhase).toBe(true);
    expect(stats.currentPhase).toBe("luteal_pms");
    expect(stats.currentPhaseTitle).toContain("PMS");
  });

  it("should generate PMS symptom insights correctly", () => {
    const cycles: CycleData[] = [
      { id: "1", startDate: "2026-08-01", endDate: "2026-08-05" },
      { id: "2", startDate: "2026-08-29", endDate: "2026-09-02" },
    ];

    const logs: DailyLogData[] = [
      // 3 days before cycle 2 start (Aug 26): PMS symptoms
      { id: "l1", date: "2026-08-26", flow: "none", mood: ["mudah_marah"], symptoms: ["payudara_sensitif", "kembung"] },
      // 2 days before cycle 2 start (Aug 27): PMS symptoms
      { id: "l2", date: "2026-08-27", flow: "none", mood: ["stres"], symptoms: ["payudara_sensitif"] },
    ];

    const stats = calculateCycleStats(cycles);
    const insights = generateCycleInsights(cycles, logs, stats);

    const pmsInsight = insights.find((i) => i.type === "pms");
    expect(pmsInsight).toBeDefined();
    expect(pmsInsight?.title).toContain("Pola Gejala PMS: Payudara sensitif");
  });
});
