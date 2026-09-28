import { requireAuth } from "@/lib/auth/session";
import { db, cycles, userSettings, dailyLogs } from "@/lib/db";
import { calculateCycleStats } from "@/lib/calculations/cycle";
import { eq, desc } from "drizzle-orm";
import { CalendarClient } from "./CalendarClient";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
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
    .orderBy(desc(dailyLogs.date));

  const stats = calculateCycleStats(
    userCycles,
    settings?.cycleLengthDefault || 28,
    settings?.periodDurationDefault || 5
  );

  return (
    <CalendarClient
      cycles={userCycles}
      logs={userLogs}
      estimatedNextPeriodDate={stats.estimatedNextPeriodDate}
      averagePeriodDuration={stats.averagePeriodDuration}
    />
  );
}
