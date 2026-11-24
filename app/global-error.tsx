"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en"><body style={{ background: "#060606", color: "#fff", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
      <div style={{ textAlign: "center" }}><p style={{ fontSize: 28, fontWeight: 700 }}>Something broke on our side.</p><button onClick={reset} style={{ marginTop: 16, background: "#c8ff3d", border: 0, borderRadius: 999, padding: "12px 22px", fontWeight: 600 }}>Try again</button></div>
    </body></html>
  );
}
