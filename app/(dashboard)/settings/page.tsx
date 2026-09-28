import { requireAuth } from "@/lib/auth/session";
import { db, profiles, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SettingsView } from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();

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

  const defaultSettings = settings || {
    reminderPeriod: true,
    reminderLogging: true,
    reminderSymptoms: false,
    cycleLengthDefault: 28,
    periodDurationDefault: 5,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SettingsView
        user={{
          email: session.email,
          displayName: profile?.displayName || session.displayName,
          timezone: profile?.timezone || "Asia/Jakarta",
        }}
        settings={defaultSettings}
      />
    </div>
  );
}
