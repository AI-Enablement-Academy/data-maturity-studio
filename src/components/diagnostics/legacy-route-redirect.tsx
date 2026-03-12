"use client";

import { useEffect } from "react";

export function LegacyRouteRedirect({ targetPath }: { targetPath: string }) {
  useEffect(() => {
    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = targetPath;
    window.location.replace(nextUrl.toString());
  }, [targetPath]);

  return (
    <div className="rounded-[2rem] border border-white/50 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
      <h1 className="text-2xl font-semibold text-slate-950">Redirecting...</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">Sending you to the current route.</p>
    </div>
  );
}
