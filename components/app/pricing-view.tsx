"use client";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { PageTitle } from "@/components/app/shell";
import { useUnlock } from "@/components/paywall/unlock-provider";
import { MainButton } from "@/components/ui/main-button";
import { shortName } from "@/lib/plans";

// The paywall also lives here for logged-in users (checkout pages send canceled buyers back to /pricing).
export function PricingView() {
  const { me, openPaywall, upgrade } = useUnlock();
  useEffect(() => {
    const t = setTimeout(() => (me?.paid ? upgrade("Change plan") : openPaywall()), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <PageTitle title="Plans" sub={me?.paid ? `You're on ${shortName(me.plan?.name ?? "")}.` : "Unlock every clip, every caption style and HD export."} />
      <MainButton size="md" onClick={() => (me?.paid ? upgrade("Change plan") : openPaywall())}><Sparkles className="mr-1 inline h-4 w-4" />{me?.paid ? "Change plan" : "See plans"}</MainButton>
    </div>
  );
}
