import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const MONTH = 60 * 60 * 24 * 30;

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = req.nextUrl;

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const sb = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await sb.auth.getUser();
  }

  // Kwop tracked link (?k=), intended plan (?plan=) and utm_ params: first-party cookies
  const k = url.searchParams.get("k");
  if (k && /^[A-Za-z0-9]{1,12}$/.test(k)) res.cookies.set("kwop_k", k, { maxAge: MONTH, sameSite: "lax", path: "/" });
  const plan = url.searchParams.get("plan");
  if (plan && plan.length <= 40) res.cookies.set("vf_plan", plan, { maxAge: MONTH, sameSite: "lax", path: "/" });
  const utm = ["utm_source", "utm_medium", "utm_campaign"].map((p) => url.searchParams.get(p)).filter(Boolean).join("/");
  if (utm) res.cookies.set("vf_src", utm.slice(0, 120), { maxAge: MONTH, sameSite: "lax", path: "/" });

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest|.*\\.(?:png|jpg|svg|webp|mp4|ico|txt)$).*)"],
};
