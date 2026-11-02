import "server-only";
import { randomUUID } from "node:crypto";
import { storageKey, validateUpload, type Bucket } from "@/domain/files";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { IntegrationNotConfigured } from "./integrations";

export const SIGNED_URL_SECONDS = 300; // D15: signed download links expire after five minutes

function admin() {
  try {
    return createSupabaseAdminClient();
  } catch {
    throw new IntegrationNotConfigured("supabase-service-role");
  }
}

/** Call only after the caller has authorized access to the parent record. */
export async function signedDownloadUrl(bucket: Bucket, key: string, downloadName?: string): Promise<string> {
  const { data, error } = await admin().storage.from(bucket).createSignedUrl(key, SIGNED_URL_SECONDS, downloadName ? { download: downloadName } : undefined);
  if (error || !data) throw new Error(`Could not sign download: ${error?.message ?? "unknown"}`);
  return data.signedUrl;
}

export type StoredFile = { key: string; mime: string; size: number; extension: string };

/** Validate (type, size, content) and store under a server generated key. */
export async function storeUpload(bucket: Bucket, folder: string, file: File): Promise<StoredFile | { error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateUpload(bucket, file.type, file.size, bytes.slice(0, 1024));
  if (!check.ok) return { error: check.error };
  const key = storageKey(folder, randomUUID(), check.extension);
  const { error } = await admin().storage.from(bucket).upload(key, bytes, { contentType: check.mime, upsert: false });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return { key, mime: check.mime, size: file.size, extension: check.extension };
}

export async function removeObject(bucket: Bucket, key: string) {
  await admin().storage.from(bucket).remove([key]);
}
