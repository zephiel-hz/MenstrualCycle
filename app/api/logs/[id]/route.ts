import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, dailyLogs } from "@/lib/db";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(dailyLogs)
      .where(and(eq(dailyLogs.id, id), eq(dailyLogs.userId, session.userId)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Catatan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ message: "Catatan harian berhasil dihapus" });
  } catch (error) {
    console.error("Delete daily log error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal menghapus catatan harian" }, { status: 500 });
  }
}
