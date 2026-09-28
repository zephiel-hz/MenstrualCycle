import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, cycles } from "@/lib/db";
import { updateCycleSchema } from "@/lib/validation/cycle";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [cycle] = await db
      .select()
      .from(cycles)
      .where(and(eq(cycles.id, id), eq(cycles.userId, session.userId)))
      .limit(1);

    if (!cycle) {
      return NextResponse.json({ error: "Data siklus tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ cycle });
  } catch (error) {
    console.error("Get cycle by id error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memuat detail siklus" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const result = updateCycleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { startDate, endDate, notes } = result.data;

    const [updated] = await db
      .update(cycles)
      .set({
        ...(startDate ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate: endDate || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(cycles.id, id), eq(cycles.userId, session.userId)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Data siklus tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Siklus berhasil diperbarui", cycle: updated });
  } catch (error) {
    console.error("Update cycle error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memperbarui siklus" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(cycles)
      .where(and(eq(cycles.id, id), eq(cycles.userId, session.userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Data siklus tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Siklus berhasil dihapus" });
  } catch (error) {
    console.error("Delete cycle error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menghapus siklus" }, { status: 500 });
  }
}
