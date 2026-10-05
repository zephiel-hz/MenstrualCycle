import { requireAuth } from "@/lib/auth/session";
import { db, profiles, userSettings } from "@/lib/db";
import { eq } from "drizzle-orm";
import { SettingsView } from "@/components/settings/SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireAuth();

  let profile: typeof profiles.$inferSelect | undefined = undefined;
  let settings: typeof userSettings.$inferSelect | undefined = undefined;

  try {
    const [[p], [s]] = await Promise.all([
      db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, session.userId))
        .limit(1),
      db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, session.userId))
        .limit(1),
    ]);
    profile = p;
    settings = s;
  } catch (err) {
    console.warn("Failed to load settings from DB (using defaults):", err);
  }

  const defaultSettings = {
    reminderPeriod: settings?.reminderPeriod ?? true,
    reminderLogging: settings?.reminderLogging ?? true,
    reminderSymptoms: settings?.reminderSymptoms ?? false,
    reminderPms: settings?.reminderPms ?? true,
    reminderDaily: settings?.reminderDaily ?? true,
    dailyReminderTime: settings?.dailyReminderTime || "12:00",
    cycleLengthDefault: settings?.cycleLengthDefault || 28,
    periodDurationDefault: settings?.periodDurationDefault || 5,
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
