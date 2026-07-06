"use client";

import { useEffect, useState } from "react";

/**
 * True after first client render. Used to gate hydration-sensitive UI
 * (live numbers, localStorage-backed preferences) behind skeletons so the
 * server- and client-rendered markup never mismatch.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
