import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, userSettings } from "@/lib/db";
import { userSettingsSchema } from "@/lib/validation/settings";
import { eq } from "drizzle-orm";

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

    if (!settings) {
      const [newSettings] = await db
        .insert(userSettings)
        .values({
          userId: session.userId,
          reminderPeriod: true,
          reminderLogging: true,
          reminderSymptoms: false,
          cycleLengthDefault: 28,
          periodDurationDefault: 5,
        })
        .returning();

      return NextResponse.json({ settings: newSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Get settings error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = userSettingsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Format pengaturan tidak valid", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      reminderPeriod,
      reminderLogging,
      reminderSymptoms,
      cycleLengthDefault,
      periodDurationDefault,
    } = result.data;

    const [updated] = await db
      .insert(userSettings)
      .values({
        userId: session.userId,
        reminderPeriod,
        reminderLogging,
        reminderSymptoms,
        cycleLengthDefault,
        periodDurationDefault,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          reminderPeriod,
          reminderLogging,
          reminderSymptoms,
          cycleLengthDefault,
          periodDurationDefault,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({
      message: "Pengaturan berhasil disimpan",
      settings: updated,
    });
  } catch (error) {
    console.error("Update settings error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memperbarui pengaturan" }, { status: 500 });
  }
}
