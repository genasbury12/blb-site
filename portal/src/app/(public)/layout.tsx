import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="px-6 py-6"><Wordmark /></header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">{children}</main>
    </div>
  );
}
