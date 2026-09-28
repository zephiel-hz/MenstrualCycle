import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { db, users, passwordResetTokens } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = forgotPasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Format email tidak valid", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json({
        message: "Jika email terdaftar, instruksi pemulihan kata sandi telah disiapkan.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return NextResponse.json({
      message: "Instruksi pemulihan kata sandi telah disiapkan.",
      ...(process.env.NODE_ENV !== "production" ? { devResetToken: rawToken } : {}),
    });
  } catch (error) {
    console.error("Forgot password error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses permintaan reset password." },
      { status: 500 }
    );
  }
}
