import { existsSync } from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { logEvent } from "@/lib/observability";

/**
 * Brand fonts for every portal PDF (audit report, worksheets): Cormorant Garamond for display, DM Sans for body.
 * Static Latin subsets of the Google Fonts releases (SIL Open Font License, see fonts/OFL-*.txt), read from disk so
 * rendering never needs the network. next.config.ts traces the files into the PDF routes. If the files are missing
 * the PDFs fall back to the PDF standard fonts instead of failing.
 */
const FONT_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");

const BRAND = {
  display: ["BOSS Display", "CormorantGaramond-Medium.ttf"],
  displayItalic: ["BOSS Display Italic", "CormorantGaramond-MediumItalic.ttf"],
  displayBold: ["BOSS Display SemiBold", "CormorantGaramond-SemiBold.ttf"],
  body: ["BOSS Body", "DMSans-Regular.ttf"],
  bodyItalic: ["BOSS Body Italic", "DMSans-Italic.ttf"],
  bodyBold: ["BOSS Body SemiBold", "DMSans-SemiBold.ttf"],
} as const;

const STANDARD: Record<keyof typeof BRAND, string> = {
  display: "Times-Roman",
  displayItalic: "Times-Italic",
  displayBold: "Times-Bold",
  body: "Helvetica",
  bodyItalic: "Helvetica-Oblique",
  bodyBold: "Helvetica-Bold",
};

function register(): Record<keyof typeof BRAND, string> {
  const missing = Object.values(BRAND).filter(([, file]) => !existsSync(path.join(FONT_DIR, file)));
  if (missing.length) {
    logEvent("error", "pdf brand fonts missing, using standard fonts", { missing: missing.length });
    return STANDARD;
  }
  const out = {} as Record<keyof typeof BRAND, string>;
  for (const [key, [family, file]] of Object.entries(BRAND) as [keyof typeof BRAND, readonly [string, string]][]) {
    Font.register({ family, src: path.join(FONT_DIR, file) });
    out[key] = family;
  }
  return out;
}

/** Font family names to use in PDF styles. */
export const PDF_FONTS = register();

// Break very long words (pasted links) so nothing runs past the page edge.
Font.registerHyphenationCallback((word) => (word.length > 28 ? (word.match(/.{1,20}/g) ?? [word]) : [word]));
