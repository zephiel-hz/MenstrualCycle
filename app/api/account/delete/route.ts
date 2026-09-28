import { NextRequest, NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth/session";
import { db, users } from "@/lib/db";
import { deleteAccountSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = deleteAccountSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi konfirmasi gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { password } = result.data;

    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Kata sandi yang dimasukkan salah" }, { status: 403 });
    }

    await db.delete(users).where(eq(users.id, session.userId));

    const response = NextResponse.json({
      message: "Akun dan semua data terkait berhasil dihapus secara permanen.",
    });

    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("Delete account error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Gagal memproses penghapusan akun" }, { status: 500 });
  }
}
