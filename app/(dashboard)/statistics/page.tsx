import { requireAuth } from "@/lib/auth/session";
import { db, cycles, userSettings, dailyLogs } from "@/lib/db";
import { calculateCycleStats, generateCycleInsights } from "@/lib/calculations/cycle";
import { eq, desc } from "drizzle-orm";
import { StatisticsView } from "@/components/analytics/StatisticsView";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const session = await requireAuth();

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

  const userLogs = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, session.userId))
    .orderBy(desc(dailyLogs.date))
    .limit(100);

  const defaultCycleLength = settings?.cycleLengthDefault || 28;
  const defaultPeriodDuration = settings?.periodDurationDefault || 5;

  const stats = calculateCycleStats(userCycles, defaultCycleLength, defaultPeriodDuration);
  const insights = generateCycleInsights(userCycles, userLogs, stats);

  const chronological = [...userCycles].reverse();
  const cycleTrends = [];
  for (let i = 0; i < chronological.length - 1; i++) {
    const cur = new Date(chronological[i].startDate);
    const next = new Date(chronological[i + 1].startDate);
    const len = Math.round((next.getTime() - cur.getTime()) / (1000 * 60 * 60 * 24));
    if (len >= 15 && len <= 90) {
      cycleTrends.push({
        cycleNumber: i + 1,
        startDate: chronological[i].startDate,
        length: len,
      });
    }
  }

  const periodTrends = chronological
    .filter((c) => c.endDate)
    .map((c, i) => {
      const start = new Date(c.startDate);
      const end = new Date(c.endDate!);
      const dur = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        cycleNumber: i + 1,
        startDate: c.startDate,
        duration: dur > 0 && dur <= 20 ? dur : defaultPeriodDuration,
      };
    });

  return (
    <div className="max-w-4xl mx-auto">
      <StatisticsView
        stats={stats}
        cycleTrends={cycleTrends}
        periodTrends={periodTrends}
        insights={insights}
      />
    </div>
  );
}
