"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function AnimatedShell({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const context = gsap.context(() => {
      const navTargets = gsap.utils.toArray("[data-reveal='nav']", containerRef.current);
      const heroTargets = gsap.utils.toArray("[data-reveal='hero']", containerRef.current);
      const cardTargets = gsap.utils.toArray("[data-reveal='card']", containerRef.current);
      const chartTargets = gsap.utils.toArray("[data-reveal='chart']", containerRef.current);

      const timeline = gsap.timeline({
        defaults: { duration: 0.82, ease: "power3.out" },
      });

      if (navTargets.length > 0) {
        timeline.from(navTargets, { y: -18, opacity: 0, scale: 0.992, ease: "back.out(1.04)" });
      }

      if (heroTargets.length > 0) {
        timeline.from(
          heroTargets,
          { y: 32, opacity: 0, scale: 0.986, stagger: 0.08, ease: "back.out(1.08)" },
          navTargets.length > 0 ? "-=0.56" : undefined,
        );
      }

      if (cardTargets.length > 0) {
        timeline.from(
          cardTargets,
          { y: 24, opacity: 0, scale: 0.988, stagger: 0.06, ease: "back.out(1.06)" },
          heroTargets.length > 0 || navTargets.length > 0 ? "-=0.48" : undefined,
        );
      }

      if (chartTargets.length > 0) {
        timeline.from(
          chartTargets,
          { y: 26, opacity: 0, scale: 0.989, stagger: 0.08, ease: "back.out(1.08)" },
          cardTargets.length > 0 || heroTargets.length > 0 || navTargets.length > 0 ? "-=0.42" : undefined,
        );
      }
    }, containerRef);

    return () => context.revert();
  }, []);

  return (
    <div ref={containerRef} suppressHydrationWarning>
      {children}
    </div>
  );
}
