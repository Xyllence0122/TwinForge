"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useSimulationLoop } from "@/hooks/useSimulationLoop";

/**
 * Console shell: fixed sidebar + sticky topbar. The simulation loop is
 * mounted here (once) so the factory keeps running across page changes.
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useSimulationLoop();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-16 lg:pl-60">
        <Topbar />
        <main className="mx-auto max-w-[1500px] p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
