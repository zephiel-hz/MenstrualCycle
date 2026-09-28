import { requireAuth } from "@/lib/auth/session";
import { db, cycles } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { HistoryClient } from "./HistoryClient";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await requireAuth();

  const userCycles = await db
    .select()
    .from(cycles)
    .where(eq(cycles.userId, session.userId))
    .orderBy(desc(cycles.startDate));

  return <HistoryClient initialCycles={userCycles} />;
}
