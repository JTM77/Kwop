import type { Metadata } from "next";
import { ClipsList } from "@/components/app/clips-list";
export const metadata: Metadata = { title: "Clips" };
export default function Page() { return <ClipsList />; }
