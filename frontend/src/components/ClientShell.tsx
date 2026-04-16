"use client";

import dynamic from "next/dynamic";

const AnalyticsInit = dynamic(() => import("@/components/AnalyticsInit").then(mod => mod.AnalyticsInit), { ssr: false });
const ServiceWorkerRegister = dynamic(() => import("@/components/ServiceWorkerRegister").then(mod => mod.ServiceWorkerRegister), { ssr: false });

/**
 * Client-side shell that wraps components requiring `ssr: false` dynamic imports.
 * Must be a Client Component because `next/dynamic` with `ssr: false` is not
 * allowed in Server Components (Next.js 16+).
 */
export function ClientShell() {
  return (
    <>
      <AnalyticsInit />
      <ServiceWorkerRegister />
    </>
  );
}
