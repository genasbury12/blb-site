import { describe, expect, it } from "vitest";
import { safeDownloadName, sniffType, storageKey, validateUpload } from "./files";

const pdf = new TextEncoder().encode("%PDF-1.7\n...");
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0]);
const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);

describe("file validation (D15)", () => {
  it("sniffs real content", () => {
    expect(sniffType(pdf)).toBe("application/pdf");
    expect(sniffType(png)).toBe("image/png");
    expect(sniffType(new TextEncoder().encode("hello world\nline two"))).toBe("text/plain");
    expect(sniffType(exe)).toBeNull();
  });
  it("accepts matching types within limits", () => {
    expect(validateUpload("lesson-resources", "application/pdf", 1000, pdf)).toMatchObject({ ok: true, extension: "pdf" });
    expect(validateUpload("lesson-resources", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1000, zip)).toMatchObject({ ok: true, extension: "docx" });
  });
  it("rejects disguised, oversized, empty, and disallowed files", () => {
    expect(validateUpload("lesson-resources", "application/pdf", 1000, exe).ok).toBe(false);
    expect(validateUpload("student-evidence", "application/pdf", 11 * 1024 * 1024, pdf).ok).toBe(false);
    expect(validateUpload("student-evidence", "application/pdf", 0, pdf).ok).toBe(false);
    expect(validateUpload("lesson-resources", "image/png", 100, png).ok).toBe(false);
    expect(validateUpload("student-evidence", "image/png", 100, pdf).ok).toBe(false);
  });
  it("builds storage keys without user supplied names", () => {
    expect(storageKey("lessons", "3f1c2a90-aaaa-bbbb-cccc-1234567890ab", "pdf")).toBe("lessons/3f1c2a90-aaaa-bbbb-cccc-1234567890ab.pdf");
    expect(() => storageKey("../etc", "3f1c2a90aaaa", "pdf")).toThrow();
    expect(safeDownloadName("../../Workbook: Week 1!.pdf", "pdf")).toBe("Workbook Week 1.pdf");
  });
});
