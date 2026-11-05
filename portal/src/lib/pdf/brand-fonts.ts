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

const FONT_FILES_PRESENT = Object.values(BRAND).every(([, file]) => existsSync(path.join(FONT_DIR, file)));
if (!FONT_FILES_PRESENT) logEvent("error", "pdf brand fonts missing, using standard fonts", {});

/** Font family names to use in PDF styles. */
export const PDF_FONTS: Record<keyof typeof BRAND, string> = FONT_FILES_PRESENT
  ? (Object.fromEntries(Object.entries(BRAND).map(([k, [family]]) => [k, family])) as Record<keyof typeof BRAND, string>)
  : STANDARD;

// Break very long words (pasted links) so nothing runs past the page edge.
const hyphenate = (word: string) => (word.length > 28 ? (word.match(/.{1,20}/g) ?? [word]) : [word]);

/**
 * Register fresh font objects. @react-pdf 4.9 keeps one loaded font object per registration for the life of the
 * process, and a second PDF that uses characters the first one did not can lose them (found 2026-11-04: question
 * numbers vanished from a Lesson 1 PDF made after a Lesson 2 PDF). Registering again gives each PDF its own objects.
 */
function registerFresh() {
  if (!FONT_FILES_PRESENT) return;
  // Drop only our families (the built in PDF fonts stay registered), then register them again from disk.
  const families = Font.getRegisteredFonts() as Record<string, unknown>;
  for (const [family] of Object.values(BRAND)) delete families[family];
  for (const [family, file] of Object.values(BRAND)) Font.register({ family, src: path.join(FONT_DIR, file) });
}
Font.registerHyphenationCallback(hyphenate);
registerFresh();

let queue: Promise<unknown> = Promise.resolve();

/**
 * Every PDF render goes through here: one at a time per server process, each with freshly registered fonts, so one
 * download can never change the fonts another download is using.
 */
export function renderWithFreshFonts<T>(render: () => Promise<T>): Promise<T> {
  const run = queue.then(() => {
    registerFresh();
    return render();
  });
  queue = run.catch(() => undefined);
  return run;
}
