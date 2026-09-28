import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { db, profiles, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.userId))
    .limit(1);

  const [settings] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.userId))
    .limit(1);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      displayName: profile?.displayName || session.displayName,
      timezone: profile?.timezone || "Asia/Jakarta",
      settings: settings || null,
    },
  });
}
