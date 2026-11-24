// Vidflow's logo ("Clip Cut"): a play button sliced into three clips — one long video in, short clips out.
// Drawn as three plain slices (no SVG mask), so the same artwork works in the app, in next/og share
// images and in the generated PNG icons. Coordinates are on a 64×64 grid.

export const BRAND = { lime: "#C8FF3D", ink: "#0A0A0A", tileTop: "#1A1A1D", tileBottom: "#050505" } as const;

/** The three slices of the play button, left to right. */
export const SLICES = [
  "19,12 28.2,17.58 28.2,46.42 19,52",
  "32.6,20.24 39,24.12 39,39.88 32.6,43.76",
  "43.4,26.79 52,32 43.4,37.21",
] as const;

/** The mark alone (lime slices), as SVG elements on a 64×64 grid. */
export const markSvg = (color: string = BRAND.lime) =>
  SLICES.map((p) => `<polygon points="${p}" fill="${color}" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/>`).join("");

/** The full app icon as an SVG document: the mark on a black rounded tile. */
export function iconSvg({ size = 64, rounded = true, inset = 0 }: { size?: number; rounded?: boolean; inset?: number } = {}) {
  // inset scales the mark toward the center (for Android "maskable" icons, which crop the edges)
  const s = 1 - inset;
  const o = (64 * inset) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
<defs><linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BRAND.tileTop}"/><stop offset="1" stop-color="${BRAND.tileBottom}"/></linearGradient></defs>
<rect width="64" height="64" rx="${rounded ? 15 : 0}" fill="url(#t)"/>
${rounded ? `<rect x=".5" y=".5" width="63" height="63" rx="14.5" fill="none" stroke="rgba(255,255,255,.14)"/>` : ""}
<g transform="translate(${o} ${o}) scale(${s})">${markSvg()}</g>
</svg>`;
}
