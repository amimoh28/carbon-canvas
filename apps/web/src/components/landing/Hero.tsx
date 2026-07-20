"use client";

/**
 * Editorial Hero — the 'Reveal' scroll effect.
 * The headline stays pinned (sticky) while an abstract architectural
 * wireframe fades in behind it as the user scrolls; key terms drift at
 * different speeds (parallax typography) for editorial depth.
 * Respects prefers-reduced-motion via framer-motion's defaults + CSS.
 */

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

function Wireframe({ progress }: { progress: any }) {
  // Abstract architectural render: perspective grid + layered ridge lines.
  // Sand/slate strokes, one restrained green horizon. Inline SVG — no assets.
  return (
    <motion.div className="hero-wire" style={{ opacity: progress }} aria-hidden>
      <svg viewBox="0 0 1200 640" fill="none">
        {/* perspective grid */}
        {Array.from({ length: 13 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={600 + (i - 6) * 40} y1={240}
            x2={600 + (i - 6) * 230} y2={640}
            stroke="var(--line)" strokeWidth="1"
          />
        ))}
        {[252, 268, 290, 320, 360, 412, 478, 560].map((y, i) => (
          <line key={`h${i}`} x1={0} y1={y} x2={1200} y2={y} stroke="var(--line)" strokeWidth="1" />
        ))}
        {/* ridge lines — the landscape */}
        <path
          d="M0 300 L140 268 L300 292 L470 238 L640 276 L820 230 L990 268 L1200 244"
          stroke="var(--ink-faint)" strokeWidth="1.5"
        />
        <path
          d="M0 330 L180 300 L360 322 L560 274 L760 312 L960 270 L1200 296"
          stroke="var(--ink-faint)" strokeWidth="1" opacity="0.6"
        />
        {/* green horizon — the single accent */}
        <path
          d="M0 258 L200 236 L420 252 L620 214 L840 246 L1040 218 L1200 236"
          stroke="var(--accent)" strokeWidth="1.5" opacity="0.85"
        />
        {/* structure: a minimal monolith */}
        <g stroke="var(--ink-soft)" strokeWidth="1.2">
          <path d="M520 214 L520 120 L600 96 L600 190" />
          <path d="M600 96 L664 118 L664 208" />
          <path d="M520 120 L600 142 L600 190 M600 142 L664 118" opacity="0.5" />
        </g>
      </svg>
    </motion.div>
  );
}

export function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // Wireframe fades in across the first two-thirds of the pinned scroll.
  const wireOpacity = useTransform(scrollYProgress, [0.05, 0.6], [0, 1]);
  // Parallax typography: the two lines drift horizontally at different
  // speeds (opposite directions) — editorial depth with no risk of the
  // lines colliding vertically.
  const driftSlow = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -30]);
  const driftFast = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 42]);
  const subFade = useTransform(scrollYProgress, [0.15, 0.7], [1, reduced ? 1 : 0.3]);

  return (
    <div className="hero" ref={ref}>
      <div className="hero-pin">
        <Wireframe progress={wireOpacity} />
        <div className="hero-copy">
          <motion.div
            className="hero-kicker"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Carbon Canvas
          </motion.div>
          <h1 className="hero-h1">
            <motion.span className="drift" style={{ x: driftSlow }}>
              The future of AI
            </motion.span>
            <br />
            <motion.span className="drift" style={{ x: driftFast }}>
              is transparent.
            </motion.span>
          </h1>
          <motion.p className="hero-sub" style={{ opacity: subFade }}>
            An architectural view of your digital habits. Private, precise
            intelligence for the tools that shape our world.
          </motion.p>
          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/register" className="btn">Get the extension</Link>
            <Link href="/dashboard/methodology" className="btn secondary">
              Read the methodology
            </Link>
          </motion.div>
        </div>
        <div className="hero-scrollhint">Scroll</div>
      </div>
    </div>
  );
}
