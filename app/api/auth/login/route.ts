import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import { db, users, profiles } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Format data tidak valid", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai" },
        { status: 401 }
      );
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Email atau kata sandi tidak sesuai" },
        { status: 401 }
      );
    }

    const [profile] = await db
      .select({ displayName: profiles.displayName })
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    const displayName = profile?.displayName || user.email.split("@")[0];

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      displayName,
    });

    const response = NextResponse.json({
      message: "Login berhasil",
      user: {
        id: user.id,
        email: user.email,
        displayName,
      },
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login" },
      { status: 500 }
    );
  }
}
