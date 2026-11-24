import { cn } from "@/lib/utils";
export function SectionLabel({ children, className, dark = true }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return <p className={cn("label", dark ? "text-lime" : "text-zinc-500", className)}>[ {children} ]</p>;
}
