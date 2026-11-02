import { createVerify, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { signMuxToken } from "./mux-token";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const pem = privateKey.export({ type: "pkcs1", format: "pem" }).toString();

describe("Mux signed playback token", () => {
  it("is a valid RS256 JWT bound to the playback id, audience and expiry", () => {
    const token = signMuxToken({ playbackId: "AbCdEf1234567890", keyId: "kid123", privateKeyPem: pem, audience: "v", ttlSeconds: 600, now: 1_800_000_000_000 });
    const [h, p, s] = token.split(".");
    const header = JSON.parse(Buffer.from(h!, "base64url").toString());
    const payload = JSON.parse(Buffer.from(p!, "base64url").toString());
    expect(header).toEqual({ alg: "RS256", typ: "JWT", kid: "kid123" });
    expect(payload).toEqual({ sub: "AbCdEf1234567890", aud: "v", exp: 1_800_000_600, kid: "kid123" });
    const ok = createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s!, "base64url"));
    expect(ok).toBe(true);
  });
  it("rejects malformed playback ids", () => {
    expect(() => signMuxToken({ playbackId: "../x", keyId: "k", privateKeyPem: pem, audience: "v", ttlSeconds: 60 })).toThrow();
  });
});
