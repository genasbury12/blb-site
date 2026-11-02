/**
 * Upload validation (D15): allowlisted types per bucket, size limits, and content sniffing so a
 * renamed executable cannot pass as a PDF. Malware scanning needs an external service (see I-31).
 */
export type Bucket = "lesson-resources" | "student-evidence" | "feedback-files" | "elite-files";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const BUCKET_RULES: Record<Bucket, { maxBytes: number; types: string[] }> = {
  "lesson-resources": { maxBytes: 25 * 1024 * 1024, types: ["application/pdf", DOCX, XLSX, "text/plain"] },
  "student-evidence": { maxBytes: 10 * 1024 * 1024, types: ["application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain"] },
  "feedback-files": { maxBytes: 25 * 1024 * 1024, types: ["application/pdf", "image/png", "image/jpeg", "image/webp", DOCX, "text/plain"] },
  "elite-files": { maxBytes: 25 * 1024 * 1024, types: ["application/pdf", "image/png", "image/jpeg", "image/webp", DOCX, XLSX, "text/plain"] },
};

const EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  [DOCX]: "docx",
  [XLSX]: "xlsx",
  "text/plain": "txt",
};

/** Detect the real type from the first bytes. */
export function sniffType(bytes: Uint8Array): string | null {
  const b = (i: number) => bytes[i] ?? -1;
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return "application/pdf";
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 && b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50) return "image/webp";
  if (b(0) === 0x50 && b(1) === 0x4b && b(2) === 0x03 && b(3) === 0x04) return "zip";
  // Plain text: no NUL bytes and mostly printable in the first 512 bytes.
  const sample = bytes.slice(0, 512);
  if (sample.length > 0 && !sample.includes(0)) {
    const printable = sample.filter((c) => c === 9 || c === 10 || c === 13 || (c >= 32 && c !== 127)).length;
    if (printable / sample.length > 0.95) return "text/plain";
  }
  return null;
}

export type FileCheck = { ok: true; mime: string; extension: string } | { ok: false; error: string };

export function validateUpload(bucket: Bucket, declaredType: string, size: number, head: Uint8Array): FileCheck {
  const rules = BUCKET_RULES[bucket];
  if (size <= 0) return { ok: false, error: "The file is empty." };
  if (size > rules.maxBytes) return { ok: false, error: `Files can be up to ${Math.round(rules.maxBytes / 1024 / 1024)} MB.` };
  if (!rules.types.includes(declaredType)) return { ok: false, error: "That file type is not accepted here." };
  const sniffed = sniffType(head);
  const zipOk = sniffed === "zip" && (declaredType === DOCX || declaredType === XLSX);
  if (sniffed !== declaredType && !zipOk) return { ok: false, error: "The file contents do not match its type." };
  return { ok: true, mime: declaredType, extension: EXTENSIONS[declaredType]! };
}

/** Storage keys never contain user supplied names: owner folder plus random id plus extension. */
export function storageKey(ownerFolder: string, id: string, extension: string): string {
  if (!/^[a-z0-9-]{1,64}$/i.test(ownerFolder) || !/^[a-z0-9-]{8,64}$/i.test(id)) throw new Error("invalid storage key parts");
  return `${ownerFolder}/${id}.${extension}`;
}

export function safeDownloadName(name: string, extension: string): string {
  const base = name.replace(/\.[a-z0-9]{1,5}$/i, "").replace(/[^a-zA-Z0-9 _-]+/g, "").trim().slice(0, 80) || "download";
  return `${base}.${extension}`;
}
