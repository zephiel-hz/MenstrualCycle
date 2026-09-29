import { NextRequest, NextResponse } from "next/server";
import { sendOtpSchema } from "@/lib/validation/auth";
import { db, users, emailVerificationCodes } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { generateOtp, hashOtp, sendVerificationEmail } from "@/lib/email/service";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = sendOtpSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, type, displayName, password } = result.data;

    // Check existing user
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (type === "register") {
      if (existingUser) {
        return NextResponse.json(
          { error: "Email sudah terdaftar. Silakan login atau gunakan email lain." },
          { status: 409 }
        );
      }
      if (!password) {
        return NextResponse.json(
          { error: "Kata sandi diperlukan untuk pendaftaran akun." },
          { status: 400 }
        );
      }
    } else if (type === "forgot_password") {
      if (!existingUser) {
        // Return standard response for security
        return NextResponse.json({
          message: "Jika email terdaftar, kode verifikasi pemulihan telah dikirim.",
        });
      }
    }

    // Clean up old verification codes for this email and type
    await db
      .delete(emailVerificationCodes)
      .where(
        and(
          eq(emailVerificationCodes.email, email),
          eq(emailVerificationCodes.type, type)
        )
      );

    // Generate 6-digit OTP
    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    let metadata: { displayName?: string; passwordHash?: string; timezone?: string } | undefined;
    if (type === "register" && password) {
      const passwordHash = await hashPassword(password);
      metadata = {
        displayName: displayName || email.split("@")[0],
        passwordHash,
        timezone: "Asia/Jakarta",
      };
    }

    await db.insert(emailVerificationCodes).values({
      email,
      codeHash,
      type,
      metadata,
      expiresAt,
    });

    // Send email
    await sendVerificationEmail({
      email,
      code: otp,
      type,
      displayName: displayName || email.split("@")[0],
    });

    return NextResponse.json({
      message: `Kode verifikasi 6 digit telah dikirim ke ${email}.`,
      ...(process.env.NODE_ENV !== "production" ? { devOtp: otp } : {}),
    });
  } catch (error) {
    console.error("Send OTP error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Gagal mengirim kode verifikasi. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
