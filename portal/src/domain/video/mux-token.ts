import { createSign } from "node:crypto";

/** Mux signed playback JWT (RS256). aud: v = video, t = thumbnail, s = storyboard, g = gif. */
export type MuxTokenAudience = "v" | "t" | "s" | "g";

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

export function signMuxToken(opts: {
  playbackId: string;
  keyId: string;
  privateKeyPem: string;
  audience: MuxTokenAudience;
  ttlSeconds: number;
  now?: number;
}): string {
  if (!/^[A-Za-z0-9]{10,80}$/.test(opts.playbackId)) throw new Error("invalid playback id");
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: opts.keyId };
  const payload = { sub: opts.playbackId, aud: opts.audience, exp: now + opts.ttlSeconds, kid: opts.keyId };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(opts.privateKeyPem);
  return `${unsigned}.${b64url(signature)}`;
}
