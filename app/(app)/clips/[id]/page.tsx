import type { Metadata } from "next";
import { ClipStudio } from "@/components/app/clip-studio";
export const metadata: Metadata = { title: "Your clips" };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClipStudio id={id} />;
}
