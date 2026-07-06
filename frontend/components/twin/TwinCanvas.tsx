"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/lib/i18n";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Client-only wrapper around the WebGL scene. `ssr: false` keeps three.js
 * out of the server bundle entirely; the loading fallback keeps layout
 * stable while the scene chunk streams in.
 */
const FactoryScene = dynamic(() => import("./FactoryScene"), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <Skeleton className="h-40 w-2/3 max-w-md" />
      <LoadingLabel />
    </div>
  );
}

function LoadingLabel() {
  const { dict } = useI18n();
  return <span className="text-xs text-ink-faint">{dict.twin.sceneLoading}</span>;
}

export function TwinCanvas() {
  return <FactoryScene />;
}
