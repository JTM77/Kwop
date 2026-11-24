import type { Metadata } from "next";
import Script from "next/script";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { AuthPage } from "@/components/auth/auth-page";

export const metadata: Metadata = { title: "Sign up", description: "Create your free Vidflow account and turn long videos into faceless clips." };

export default async function Page() {
  if (await getUser()) redirect("/dashboard");
  return (<><Script src="https://kwop.io/flow.js" data-site="s_7eb31daa9a" strategy="lazyOnload" /><AuthPage mode="signup" /></>);
}
