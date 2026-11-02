// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email";

vi.mock("server-only", () => ({}));

const email = { subject: "Hi", text: "Body" };
afterEach(() => vi.unstubAllEnvs());

describe("email adapter (D16)", () => {
  it("suppresses everything when sending is disabled", async () => {
    vi.stubEnv("EMAIL_SENDING_ENABLED", "false");
    const f = vi.fn();
    expect(await sendEmail("a@b.co", email, f)).toBe("suppressed");
    expect(f).not.toHaveBeenCalled();
  });
  it("outside production sends only to allowlisted addresses", async () => {
    vi.stubEnv("EMAIL_SENDING_ENABLED", "true");
    vi.stubEnv("APP_ENV", "staging");
    vi.stubEnv("EMAIL_TEST_ALLOWLIST", "qa@test.co");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "hello@test.co");
    const f = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await sendEmail("customer@real.co", email, f)).toBe("suppressed");
    expect(await sendEmail("qa@test.co", email, f)).toBe("sent");
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(JSON.parse(init.body as string)).toEqual({ from: "hello@test.co", to: ["qa@test.co"], subject: "Hi", text: "Body" });
  });
  it("reports failures without throwing", async () => {
    vi.stubEnv("EMAIL_SENDING_ENABLED", "true");
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("EMAIL_FROM", "hello@test.co");
    expect(await sendEmail("a@b.co", email, vi.fn(async () => new Response("", { status: 500 })))).toBe("failed");
  });
});
