import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry-options";

export async function register() {
  if (process.env.SENTRY_DSN) {
    Sentry.init(sentryOptions(process.env.SENTRY_DSN));
  }
}

export const onRequestError = Sentry.captureRequestError;
