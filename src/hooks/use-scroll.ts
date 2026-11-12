"use client";

import { useEffect, useState } from "react";

/**
 * Hook to track scroll threshold with hysteresis to prevent flickering
 * Source: @efferd/use-scroll
 */
export function useScroll(downThreshold: number = 10, upThreshold?: number) {
  const [scrolled, setScrolled] = useState(false);
  const scrollUpThreshold = upThreshold ?? downThreshold / 2;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      setScrolled((prev) => {
        if (prev) {
          // Currently scrolled - only unscroll when below lower threshold
          return y > scrollUpThreshold;
        }
        // Currently not scrolled - only scroll when above higher threshold
        return y > downThreshold;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [downThreshold, scrollUpThreshold]);

  return scrolled;
}

