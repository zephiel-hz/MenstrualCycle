import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, profiles, userSettings, cycles, dailyLogs } from "@/lib/db";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.userId))
      .limit(1);

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

    const exportData = {
      exportedAt: new Date().toISOString(),
      app: "Lunara - Personal Cycle Companion",
      user: {
        email: session.email,
        displayName: profile?.displayName || session.displayName,
        timezone: profile?.timezone || "Asia/Jakarta",
      },
      settings: settings || null,
      cycles: userCycles.map((c) => ({
        id: c.id,
        startDate: c.startDate,
        endDate: c.endDate,
        notes: c.notes,
        createdAt: c.createdAt,
      })),
      dailyLogs: userLogs.map((l) => ({
        id: l.id,
        date: l.date,
        flow: l.flow,
        mood: l.mood,
        symptoms: l.symptoms,
        notes: l.notes,
        createdAt: l.createdAt,
      })),
    };

    if (format === "csv") {
      let csvContent = `=== DATA SIKLUS (CYCLES) ===\n`;
      csvContent += `"ID","Tanggal Mulai","Tanggal Selesai","Catatan"\n`;
      for (const c of userCycles) {
        const notesEscaped = (c.notes || "").replace(/"/g, '""');
        csvContent += `"${c.id}","${c.startDate}","${c.endDate || ""}","${notesEscaped}"\n`;
      }

      csvContent += `\n=== CATATAN HARIAN (DAILY LOGS) ===\n`;
      csvContent += `"ID","Tanggal","Aliran Darah","Suasana Hati","Gejala","Catatan"\n`;
      for (const l of userLogs) {
        const moodStr = Array.isArray(l.mood) ? l.mood.join("; ") : "";
        const symptomsStr = Array.isArray(l.symptoms) ? l.symptoms.join("; ") : "";
        const notesEscaped = (l.notes || "").replace(/"/g, '""');
        csvContent += `"${l.id}","${l.date}","${l.flow}","${moodStr}","${symptomsStr}","${notesEscaped}"\n`;
      }

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="lunara-data-${session.userId.slice(0, 8)}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lunara-data-${session.userId.slice(0, 8)}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 });
  }
}
