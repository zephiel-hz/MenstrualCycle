"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { DailyLogModal } from "@/components/log/DailyLogModal";
import { PwaInstaller } from "@/components/pwa/PwaInstaller";
import { NotificationPermissionPrompt } from "@/components/notifications/NotificationPermissionPrompt";

interface DashboardShellProps {
  user: {
    email: string;
    displayName?: string | null;
  };
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ user, children }) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedLogDate, setSelectedLogDate] = useState<string | undefined>(undefined);

  const openLogModal = (date?: string) => {
    setSelectedLogDate(date);
    setIsLogModalOpen(true);
  };

  const closeLogModal = () => {
    setIsLogModalOpen(false);
    setSelectedLogDate(undefined);
  };

  const handleSmoothRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar user={user} />
      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        <Sidebar onOpenQuickLog={() => openLogModal()} />
        <main className="flex-1 p-4 sm:p-6 pb-24 md:pb-8 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      <BottomNav onOpenQuickLog={() => openLogModal()} />

      <DailyLogModal
        isOpen={isLogModalOpen}
        onClose={closeLogModal}
        initialDate={selectedLogDate}
        onLogSaved={handleSmoothRefresh}
      />

      <PwaInstaller />
      <NotificationPermissionPrompt />
    </div>
  );
};
