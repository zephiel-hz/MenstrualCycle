import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={{
        email: session.email,
        displayName: session.displayName,
      }}
    >
      {children}
    </DashboardShell>
  );
}
