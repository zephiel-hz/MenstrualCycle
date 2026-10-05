"use client";

import React, { useEffect, useRef } from "react";
import { getCachedSettings, getCachedLogs, SYNC_EVENTS } from "@/lib/offline/syncManager";
import { formatISODateOnly } from "@/lib/utils";

const REMINDER_STORAGE_KEY = "ricils_last_daily_reminder_date";

export const DailyReminderScheduler: React.FC = () => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const scheduleReminder = async () => {
      // Clear existing scheduled timer
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Check notification permission
      if (Notification.permission !== "granted") {
        return;
      }

      // Read current settings
      const settings = await getCachedSettings();
      const isEnabled = settings?.reminderDaily ?? true;
      if (!isEnabled) {
        return;
      }

      const reminderTime = settings?.dailyReminderTime || "12:00";
      const [hourStr, minStr] = reminderTime.split(":");
      const targetHour = parseInt(hourStr || "12", 10);
      const targetMin = parseInt(minStr || "00", 10);

      const now = new Date();
      const todayStr = formatISODateOnly(now);
      const lastSentDate = localStorage.getItem(REMINDER_STORAGE_KEY);

      // Target Date today
      const targetTimeToday = new Date(now);
      targetTimeToday.setHours(targetHour, targetMin, 0, 0);

      const diffMs = targetTimeToday.getTime() - now.getTime();

      if (diffMs > 0) {
        // Target is later today
        timeoutRef.current = setTimeout(async () => {
          await triggerReminder(todayStr);
          // After firing, schedule for tomorrow
          scheduleReminder();
        }, diffMs);
      } else {
        // Target time has already passed today
        if (lastSentDate !== todayStr) {
          // If not sent today, check if log was already recorded
          const logs = await getCachedLogs();
          const hasTodayLog = logs.some((l) => l.date === todayStr);

          if (!hasTodayLog) {
            await triggerReminder(todayStr);
          } else {
            // Mark as sent so we don't nag
            localStorage.setItem(REMINDER_STORAGE_KEY, todayStr);
          }
        }

        // Schedule for tomorrow at target time
        const targetTimeTomorrow = new Date(targetTimeToday);
        targetTimeTomorrow.setDate(targetTimeTomorrow.getDate() + 1);
        const msUntilTomorrow = targetTimeTomorrow.getTime() - now.getTime();

        timeoutRef.current = setTimeout(() => {
          scheduleReminder();
        }, Math.min(msUntilTomorrow, 2147483647)); // ensure safe 32-bit int
      }
    };

    const triggerReminder = async (todayStr: string) => {
      localStorage.setItem(REMINDER_STORAGE_KEY, todayStr);

      const title = "🌸 Waktunya Catat Kondisi Hari Ini — Ricil's";
      const options: NotificationOptions = {
        body: "Halo! Luangkan sejenak untuk mencatat mood, keluhan, atau perkembangan siklusmu hari ini.",
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        tag: "ricils-daily-reminder",
        data: { url: "/dashboard" },
      };

      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, options);
            return;
          }
        }
        new Notification(title, options);
      } catch (err) {
        console.warn("Failed to fire daily reminder notification:", err);
      }
    };

    scheduleReminder();

    const handleUpdate = () => {
      scheduleReminder();
    };

    window.addEventListener(SYNC_EVENTS.DATA_UPDATED, handleUpdate);
    window.addEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleUpdate);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener(SYNC_EVENTS.DATA_UPDATED, handleUpdate);
      window.removeEventListener(SYNC_EVENTS.SYNC_COMPLETED, handleUpdate);
    };
  }, []);

  return null;
};
