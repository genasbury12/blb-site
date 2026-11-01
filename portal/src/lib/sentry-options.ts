import type { ErrorEvent } from "@sentry/nextjs";
import { scrub } from "./observability";

/** Shared Sentry options. sendDefaultPii is off and every event is scrubbed (D03, D15). */
export function sentryOptions(dsn: string | undefined) {
  return {
    dsn,
    enabled: Boolean(dsn),
    environment: process.env.APP_ENV ?? "local",
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event: ErrorEvent) {
      if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.data;
        delete event.request.query_string;
      }
      if (event.extra) event.extra = scrub(event.extra);
      if (event.message) event.message = scrub(event.message);
      if (event.exception?.values) {
        for (const ex of event.exception.values) if (ex.value) ex.value = scrub(ex.value);
      }
      return event;
    },
  };
}
