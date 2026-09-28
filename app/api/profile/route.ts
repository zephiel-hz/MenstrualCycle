import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, profiles } from "@/lib/db";
import { updateProfileSchema } from "@/lib/validation/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.userId))
      .limit(1);

    return NextResponse.json({
      profile: profile || {
        displayName: session.displayName,
        timezone: "Asia/Jakarta",
      },
    });
  } catch (error) {
    console.error("Get profile error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memuat profil" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { displayName, timezone } = result.data;

    const [updated] = await db
      .update(profiles)
      .set({
        ...(displayName !== undefined ? { displayName } : {}),
        ...(timezone !== undefined ? { timezone } : {}),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, session.userId))
      .returning();

    return NextResponse.json({
      message: "Profil berhasil diperbarui",
      profile: updated,
    });
  } catch (error) {
    console.error("Update profile error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }
}
