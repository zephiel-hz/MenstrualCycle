import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, cycles, userSettings, dailyLogs } from "@/lib/db";
import { calculateCycleStats } from "@/lib/calculations/cycle";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1);

    const userCycles = await db
      .select()
      .from(cycles)
      .where(eq(cycles.userId, session.userId))
      .orderBy(desc(cycles.startDate));

    const defaultCycleLength = settings?.cycleLengthDefault || 28;
    const defaultPeriodDuration = settings?.periodDurationDefault || 5;

    const stats = calculateCycleStats(userCycles, defaultCycleLength, defaultPeriodDuration);

    const chronologicalCycles = [...userCycles].reverse();
    const cycleTrends = [];
    for (let i = 0; i < chronologicalCycles.length - 1; i++) {
      const currentStart = new Date(chronologicalCycles[i].startDate);
      const nextStart = new Date(chronologicalCycles[i + 1].startDate);
      const lengthInDays = Math.round(
        (nextStart.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (lengthInDays >= 15 && lengthInDays <= 90) {
        cycleTrends.push({
          cycleNumber: i + 1,
          startDate: chronologicalCycles[i].startDate,
          length: lengthInDays,
        });
      }
    }

    const periodTrends = chronologicalCycles
      .filter((c) => c.endDate)
      .map((c, i) => {
        const start = new Date(c.startDate);
        const end = new Date(c.endDate!);
        const duration =
          Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
          cycleNumber: i + 1,
          startDate: c.startDate,
          duration: duration > 0 && duration <= 20 ? duration : defaultPeriodDuration,
        };
      });

    return NextResponse.json({
      stats,
      cycleTrends,
      periodTrends,
      disclaimer: "Berdasarkan data yang kamu catat. Lunara bukan diagnosis medis.",
    });
  } catch (error) {
    console.error("Get statistics error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menghitung statistik" }, { status: 500 });
  }
}
