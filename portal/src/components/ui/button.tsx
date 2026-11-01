import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-plum text-white hover:bg-plum-deep",
        secondary: "border border-mauve bg-white text-ink hover:bg-rose-soft",
        quiet: "text-plum underline-offset-4 hover:underline",
      },
      size: { md: "", sm: "min-h-9 px-4 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Variants = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ComponentProps<"button"> & Variants) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export function ButtonLink({ className, variant, size, ...props }: ComponentProps<typeof Link> & Variants) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
