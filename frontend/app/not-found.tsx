"use client";

import Link from "next/link";
import { Compass } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { dict } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-white/[0.03]">
        <Compass className="h-7 w-7 text-ink-faint" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-lg font-semibold text-ink">{dict.common.notFoundTitle}</h1>
      <p className="mt-2 max-w-md text-sm text-ink-faint">{dict.common.notFoundBody}</p>
      <Link href="/dashboard" className="mt-6">
        <Button variant="primary">{dict.common.backToDashboard}</Button>
      </Link>
    </div>
  );
}
