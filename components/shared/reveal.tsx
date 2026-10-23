"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** Standard fade-up reveal used across public pages. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

/** Parent container that staggers its children's reveal. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

/** Motion config for scroll-triggered reveals (runs once, cheap). */
export const viewportOnce = { once: true, margin: "-60px" as const };

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "span";
}

/**
 * Lightweight scroll-reveal wrapper. Uses `whileInView` with `once: true` so
 * elements animate in as they enter the viewport and never animate again —
 * keeps re-renders and layout work minimal (no lag).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewportOnce}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
