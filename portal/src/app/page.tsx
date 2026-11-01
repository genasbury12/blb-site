import { ButtonLink } from "@/components/ui/button";
import { Wordmark } from "@/components/wordmark";

/**
 * Minimal portal entry. The public sales pages (/program, /pricing, /masterclass) are built in
 * Slice 7 behind FEATURE_MARKETING_PAGES until their copy and policies are approved.
 */
export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="px-6 py-6">
        <Wordmark />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">Member portal</p>
        <h1 className="mt-3 text-5xl sm:text-6xl">Know what to work on next.</h1>
        <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">
          Sign in to take your business audit, work through your training, and see your next three steps.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/login">Sign in</ButtonLink>
          <ButtonLink href="/signup" variant="secondary">
            Create an account
          </ButtonLink>
        </div>
      </main>
    </div>
  );
}
