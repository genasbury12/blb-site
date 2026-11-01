import type { ReactNode } from "react";
import { Wordmark } from "@/components/wordmark";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="px-6 py-6">
        <Wordmark />
      </header>
      <main id="main" className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-16">
        {children}
      </main>
    </div>
  );
}
