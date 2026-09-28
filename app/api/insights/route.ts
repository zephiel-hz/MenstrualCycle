import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, cycles, userSettings, dailyLogs } from "@/lib/db";
import { calculateCycleStats, generateCycleInsights } from "@/lib/calculations/cycle";
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

    const userLogs = await db
      .select()
      .from(dailyLogs)
      .where(eq(dailyLogs.userId, session.userId))
      .orderBy(desc(dailyLogs.date))
      .limit(100);

    const stats = calculateCycleStats(
      userCycles,
      settings?.cycleLengthDefault || 28,
      settings?.periodDurationDefault || 5
    );

    const insights = generateCycleInsights(userCycles, userLogs, stats);

    return NextResponse.json({
      insights,
      stats,
      disclaimer:
        "Informasi dan pola ini dibuat berdasarkan data yang kamu catat untuk keperluan edukasi dan pelacakan pribadi, bukan merupakan saran atau diagnosis medis profesional.",
    });
  } catch (error) {
    console.error("Get insights error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memuat wawasan siklus" }, { status: 500 });
  }
}
