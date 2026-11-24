import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { UnlockProvider } from "@/components/paywall/unlock-provider";
import { AppShell } from "@/components/app/shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const v = await getViewer();
  if (!v.id) redirect("/login");
  return (
    <UnlockProvider initialMe={{ id: v.id, email: v.email, paid: v.paid, tier: v.tier, plan: v.plan.plan, until: v.plan.until, status: v.plan.status }}>
      <AppShell>{children}</AppShell>
    </UnlockProvider>
  );
}
