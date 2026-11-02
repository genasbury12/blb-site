/** Brand tokens (D01). Keep in sync with app/globals.css. */
export const COLORS = {
  rose: "#E8C8CB",
  mauve: "#A56C78",
  mauveInk: "#80505B",
  ivory: "#F7EEE9",
  plum: "#65474F",
  plumDeep: "#4E363D",
  ink: "#30282C",
  inkMuted: "#5A4A50",
  white: "#FFFFFF",
  danger: "#8E2A35",
  success: "#2F5D3A",
} as const;

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(v.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}
