import type { Metadata } from "next";
import { PricingView } from "@/components/app/pricing-view";
export const metadata: Metadata = { title: "Plans" };
export default function Page() { return <PricingView />; }
