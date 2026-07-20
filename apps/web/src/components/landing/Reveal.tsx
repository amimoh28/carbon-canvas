"use client";

/** Gallery-style entrance: children slide in from the side with a stagger
 *  when they scroll into view. Direction alternates per instance for the
 *  editorial 'hung in a gallery' rhythm. */

import { motion } from "framer-motion";

export function Reveal({
  children,
  from = "left",
  delay = 0,
}: {
  children: React.ReactNode;
  from?: "left" | "right" | "up";
  delay?: number;
}) {
  const x = from === "left" ? -36 : from === "right" ? 36 : 0;
  const y = from === "up" ? 30 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children }: { children: React.ReactNode[] }) {
  return (
    <>
      {children.map((child, i) => (
        <Reveal key={i} from={i % 2 === 0 ? "left" : "right"} delay={i * 0.12}>
          {child}
        </Reveal>
      ))}
    </>
  );
}
