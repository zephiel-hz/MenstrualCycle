import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth";
import { db, users, profiles, userSettings } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, displayName, timezone } = result.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan gunakan email lain atau login." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
      })
      .returning({ id: users.id, email: users.email });

    await db.insert(profiles).values({
      userId: newUser.id,
      displayName: displayName || email.split("@")[0],
      timezone: timezone || "Asia/Jakarta",
    });

    await db.insert(userSettings).values({
      userId: newUser.id,
      reminderPeriod: true,
      reminderLogging: true,
      reminderSymptoms: false,
      cycleLengthDefault: 28,
      periodDurationDefault: 5,
    });

    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      displayName: displayName || email.split("@")[0],
    });

    const response = NextResponse.json(
      {
        message: "Registrasi berhasil",
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: displayName || email.split("@")[0],
        },
      },
      { status: 201 }
    );

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Register error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi." },
      { status: 500 }
    );
  }
}
