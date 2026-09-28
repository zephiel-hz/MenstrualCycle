import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, dailyLogs } from "@/lib/db";
import { dailyLogSchema } from "@/lib/validation/log";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (dateParam) {
      const [log] = await db
        .select()
        .from(dailyLogs)
        .where(and(eq(dailyLogs.userId, session.userId), eq(dailyLogs.date, dateParam)))
        .limit(1);

      return NextResponse.json({ log: log || null });
    }

    const conditions = [eq(dailyLogs.userId, session.userId)];
    if (startDateParam) {
      conditions.push(gte(dailyLogs.date, startDateParam));
    }
    if (endDateParam) {
      conditions.push(lte(dailyLogs.date, endDateParam));
    }

    const logs = await db
      .select()
      .from(dailyLogs)
      .where(and(...conditions))
      .orderBy(desc(dailyLogs.date));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Get daily logs error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memuat catatan harian" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = dailyLogSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi data log gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { date, flow, mood, symptoms, notes } = result.data;

    const [existing] = await db
      .select()
      .from(dailyLogs)
      .where(and(eq(dailyLogs.userId, session.userId), eq(dailyLogs.date, date)))
      .limit(1);

    if (existing) {
      const [updated] = await db
        .update(dailyLogs)
        .set({
          flow,
          mood,
          symptoms,
          notes: notes || null,
          updatedAt: new Date(),
        })
        .where(eq(dailyLogs.id, existing.id))
        .returning();

      return NextResponse.json({
        message: "Catatan harian diperbarui",
        log: updated,
      });
    }

    const [newLog] = await db
      .insert(dailyLogs)
      .values({
        userId: session.userId,
        date,
        flow,
        mood,
        symptoms,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(
      { message: "Catatan harian berhasil disimpan", log: newLog },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save daily log error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menyimpan catatan harian" }, { status: 500 });
  }
}
