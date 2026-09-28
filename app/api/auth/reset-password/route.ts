import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { db, users, passwordResetTokens } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";

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

    const { token, newPassword } = result.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [tokenRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Token reset tidak valid atau telah kedaluwarsa." },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(users.id, tokenRecord.userId));

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.id, tokenRecord.id));

    return NextResponse.json({
      message: "Kata sandi berhasil diperbarui. Silakan login dengan kata sandi baru.",
    });
  } catch (error) {
    console.error("Reset password error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Gagal mereset kata sandi. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
