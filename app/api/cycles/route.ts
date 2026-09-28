import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, cycles } from "@/lib/db";
import { createCycleSchema } from "@/lib/validation/cycle";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userCycles = await db
      .select()
      .from(cycles)
      .where(eq(cycles.userId, session.userId))
      .orderBy(desc(cycles.startDate));

    return NextResponse.json({ cycles: userCycles });
  } catch (error) {
    console.error("Get cycles error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memuat data siklus" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = createCycleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi data siklus gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { startDate, endDate, notes } = result.data;

    const [newCycle] = await db
      .insert(cycles)
      .values({
        userId: session.userId,
        startDate,
        endDate: endDate || null,
        notes: notes || null,
      })
      .returning();

    return NextResponse.json(
      { message: "Siklus berhasil dicatat", cycle: newCycle },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create cycle error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menyimpan data siklus" }, { status: 500 });
  }
}
