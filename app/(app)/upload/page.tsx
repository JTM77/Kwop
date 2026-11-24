import type { Metadata } from "next";
import { UploadView } from "@/components/app/upload-view";
export const metadata: Metadata = { title: "Upload" };
export default function Page() { return <UploadView />; }
