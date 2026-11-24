import { ImageResponse } from "next/og";

// Branded share image: the RESULT (a clip) with its virality score.
export async function ogImage({ kicker, title, score, sub }: { kicker: string; title: string; score?: number | null; sub?: string }) {
  const font = await fetch("https://fonts.gstatic.com/s/spacegrotesk/v16/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVksj.ttf").then((r) => (r.ok && !(r.headers.get("content-type") ?? "").includes("html") ? r.arrayBuffer() : null)).catch(() => null);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#060606", color: "#fff", padding: 72, fontFamily: "SG", position: "relative" }}>
        <div style={{ position: "absolute", top: -200, left: 200, width: 900, height: 600, borderRadius: 600, background: "radial-gradient(closest-side, rgba(255,61,127,.45), transparent)" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#c8ff3d", display: "flex", alignItems: "center", justifyContent: "center", color: "#060606", fontSize: 34, fontWeight: 700 }}>V</div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>Vidflow</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: 24, color: "#c8ff3d", letterSpacing: 5, textTransform: "uppercase" }}>{kicker}</div>
            <div style={{ fontSize: title.length > 48 ? 64 : 80, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, maxWidth: 1000 }}>{title}</div>
            {sub && <div style={{ fontSize: 28, color: "#a1a1aa" }}>{sub}</div>}
          </div>
          {score != null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ fontSize: 26, color: "#a1a1aa" }}>Virality score</div>
              <div style={{ display: "flex", width: 420, height: 16, borderRadius: 10, background: "rgba(255,255,255,.12)" }}>
                <div style={{ width: `${score}%`, height: 16, borderRadius: 10, background: "linear-gradient(90deg,#ff3d7f,#ff8a3d)" }} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 700 }}>{score}</div>
            </div>
          ) : <div style={{ fontSize: 26, color: "#a1a1aa" }}>1 podcast in. 30 faceless TikToks out.</div>}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: font ? [{ name: "SG", data: font, weight: 700 }] : undefined },
  );
}
