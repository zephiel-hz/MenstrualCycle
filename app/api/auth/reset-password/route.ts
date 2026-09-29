import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { db, users, emailVerificationCodes } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { hashOtp } from "@/lib/email/service";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Data reset tidak valid", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = result.data;
    const codeHash = hashOtp(otp);

    // Verify OTP
    const [tokenRecord] = await db
      .select()
      .from(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.type, "forgot_password"),
          eq(emailVerificationCodes.codeHash, codeHash),
          gt(emailVerificationCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Kode verifikasi salah atau telah kedaluwarsa." },
        { status: 400 }
      );
    }

    // Find user
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna dengan email ini tidak ditemukan." },
        { status: 404 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.id, tokenRecord.id));

    return NextResponse.json({
      message: "Kata sandi berhasil diperbarui. Silakan masuk menggunakan kata sandi baru Anda.",
    });
  } catch (error) {
    console.error("Reset password error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Gagal mereset kata sandi. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
