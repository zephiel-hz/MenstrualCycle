import { requireAuth } from "@/lib/auth/session";
import { db, cycles, userSettings, dailyLogs } from "@/lib/db";
import { calculateCycleStats } from "@/lib/calculations/cycle";
import { eq, desc, and } from "drizzle-orm";
import { DashboardClient } from "./DashboardClient";
import { formatISODateOnly } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuth();
  const todayStr = formatISODateOnly(new Date());

  // Execute all 3 database queries concurrently in parallel to reduce server latency
  const [[settings], userCycles, [todayLog]] = await Promise.all([
    db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, session.userId))
      .limit(1),
    db
      .select()
      .from(cycles)
      .where(eq(cycles.userId, session.userId))
      .orderBy(desc(cycles.startDate)),
    db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, session.userId), eq(dailyLogs.date, todayStr)))
      .limit(1),
  ]);

  const defaultCycleLength = settings?.cycleLengthDefault || 28;
  const defaultPeriodDuration = settings?.periodDurationDefault || 5;

  const stats = calculateCycleStats(userCycles, defaultCycleLength, defaultPeriodDuration);
  const latestCycle = userCycles[0] || null;

  return (
    <DashboardClient
      stats={stats}
      todayLog={todayLog || null}
      reminderPms={settings?.reminderPms ?? true}
      allCycles={userCycles}
      latestCycle={
        latestCycle
          ? {
              id: latestCycle.id,
              startDate: latestCycle.startDate,
              endDate: latestCycle.endDate,
              notes: latestCycle.notes,
            }
          : null
      }
      user={{ displayName: session.displayName }}
    />
  );
}
