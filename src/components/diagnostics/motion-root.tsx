"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useMemo, useState } from "react";

function useReducedMotionPreference() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return prefersReducedMotion;
}

export function MotionRoot({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotionPreference();
  const options = useMemo(
    () =>
      prefersReducedMotion
        ? { autoRaf: true, duration: 0 }
        : {
            autoRaf: true,
            smoothWheel: true,
            lerp: 0.2,
            wheelMultiplier: 1.28,
            touchMultiplier: 1,
            syncTouch: false,
            gestureOrientation: "vertical" as const,
          },
    [prefersReducedMotion],
  );

  return <ReactLenis root options={options}>{children}</ReactLenis>;
}
