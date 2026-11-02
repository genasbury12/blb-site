import "server-only";
import { signMuxToken, type MuxTokenAudience } from "@/domain/video/mux-token";

/**
 * Mux signed playback (D03). Tokens are issued only after the page has authorized the viewer,
 * expire quickly, and are bound to one playback id. Returns null when Mux is not configured.
 */
export function muxPlaybackTokens(playbackId: string, ttlSeconds = 60 * 60 * 4) {
  const keyId = process.env.MUX_SIGNING_KEY_ID;
  const keyB64 = process.env.MUX_SIGNING_PRIVATE_KEY;
  if (!keyId || !keyB64) return null;
  const privateKeyPem = Buffer.from(keyB64, "base64").toString("utf8");
  const sign = (aud: MuxTokenAudience) => signMuxToken({ playbackId, keyId, privateKeyPem, audience: aud, ttlSeconds });
  return { playback: sign("v"), thumbnail: sign("t"), storyboard: sign("s") };
}
