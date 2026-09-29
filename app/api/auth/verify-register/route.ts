import { NextRequest, NextResponse } from "next/server";
import { verifyRegisterSchema } from "@/lib/validation/auth";
import { db, users, profiles, userSettings, emailVerificationCodes } from "@/lib/db";
import { hashOtp } from "@/lib/email/service";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = verifyRegisterSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp } = result.data;
    const codeHash = hashOtp(otp);

    // Find valid verification code
    const [record] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.type, "register"),
          eq(emailVerificationCodes.codeHash, codeHash),
          gt(emailVerificationCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      return NextResponse.json(
        { error: "Kode verifikasi salah atau telah kedaluwarsa. Silakan minta kode baru." },
        { status: 400 }
      );
    }

    if (!record.metadata || !record.metadata.passwordHash) {
      return NextResponse.json(
        { error: "Data pendaftaran tidak lengkap. Silakan ulangi proses pendaftaran." },
        { status: 400 }
      );
    }

    // Double-check if user was created in the meantime
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      await db
        .delete(emailVerificationCodes)
        .where(eq(emailVerificationCodes.id, record.id));

      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan langsung login." },
        { status: 409 }
      );
    }

    const displayName = record.metadata.displayName || email.split("@")[0];
    const timezone = record.metadata.timezone || "Asia/Jakarta";

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash: record.metadata.passwordHash,
      })
      .returning({ id: users.id, email: users.email });

    await db.insert(profiles).values({
      userId: newUser.id,
      displayName,
      timezone,
    });

    await db.insert(userSettings).values({
      userId: newUser.id,
      reminderPeriod: true,
      reminderLogging: true,
      reminderSymptoms: false,
      reminderPms: true,
      cycleLengthDefault: 28,
      periodDurationDefault: 5,
    });

    // Delete used verification code
    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.id, record.id));

    // Create session token and log in
    const token = await createSessionToken({
      userId: newUser.id,
      email: newUser.email,
      displayName,
    });

    const response = NextResponse.json(
      {
        message: "Akun berhasil diverifikasi & didaftarkan",
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName,
        },
      },
      { status: 201 }
    );

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Verify register error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memverifikasi akun. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
