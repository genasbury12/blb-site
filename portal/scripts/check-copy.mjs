// Fails when user facing source contains em dashes, en dashes, or emojis (voice.md, D05 design system copy rules).
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOTS = ["src/app", "src/components", "src/domain"];
const EXT = new Set([".ts", ".tsx", ".json", ".md"]);
const DASH = /[–—]/;
const EMOJI = /\p{Extended_Pictographic}/u;

const problems = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (EXT.has(path.extname(p)) && !p.endsWith(".test.ts") && !p.endsWith(".test.tsx")) {
      readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        if (DASH.test(line)) problems.push(`${p}:${i + 1}: em or en dash`);
        if (EMOJI.test(line)) problems.push(`${p}:${i + 1}: emoji`);
      });
    }
  }
}
for (const r of ROOTS) if (existsSync(r)) walk(r);
if (problems.length) {
  console.error("Copy rule violations:\n" + problems.join("\n"));
  process.exit(1);
}
console.log("Copy rules OK");
