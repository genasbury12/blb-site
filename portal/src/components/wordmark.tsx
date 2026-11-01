import Link from "next/link";

/** Text wordmark until an approved logo is supplied (D01). */
export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
      The BOSS Business System
    </Link>
  );
}
