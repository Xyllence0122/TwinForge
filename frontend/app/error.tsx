"use client";

import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/Button";

/** Global error boundary — keeps failures inside the branded shell. */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const { dict } = useI18n();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-critical/30 bg-critical/10">
        <AlertTriangle className="h-7 w-7 text-critical" strokeWidth={1.5} />
      </div>
      <h1 className="mt-6 text-lg font-semibold text-ink">{dict.common.errorTitle}</h1>
      <p className="mt-2 max-w-md text-sm text-ink-faint">{dict.common.errorBody}</p>
      <p className="mt-1 font-mono text-xs text-ink-faint/60">{error.message}</p>
      <Button variant="primary" className="mt-6" onClick={reset}>
        {dict.common.retry}
      </Button>
    </div>
  );
}
