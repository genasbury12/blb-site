import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Wordmark } from "@/components/wordmark";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="px-6 py-6"><Wordmark /></header>
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        <Alert tone="warning" title="Draft pending legal review" className="mb-8">
          This page summarizes approved business policy for review. It is not final legal language and must be approved before launch (D08). Nothing here limits rights you have under applicable law.
        </Alert>
        <div className="space-y-5 leading-relaxed [&_h1]:font-display [&_h1]:text-5xl [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
      </main>
    </div>
  );
}
