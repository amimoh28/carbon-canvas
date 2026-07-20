"use client";

/**
 * The Collector's Display — a single, beautifully rendered AI Receipt
 * beside a Today's Glance card. The numbers mirror the real product's
 * honesty rules: ranges, confidence with reasons, no false precision.
 * The confidence dot breathes softly on hover (CSS .conf-pulse).
 */

import { Reveal } from "./Reveal";

export function ReceiptDemo() {
  return (
    <div className="collector">
      <Reveal from="left">
        <div className="receipt" aria-label="Example AI receipt (simulated)">
          <div className="receipt-head">
            <span className="receipt-brand">Carbon Canvas · AI Receipt</span>
            <span className="receipt-date">Tuesday, 3:14 PM</span>
          </div>
          <div className="receipt-row"><span className="k">Platform</span><span>Claude</span></div>
          <div className="receipt-row"><span className="k">Model</span><span>Claude Sonnet</span></div>
          <div className="receipt-row"><span className="k">Duration</span><span>18 min</span></div>
          <div className="receipt-row"><span className="k">Prompts</span><span>12</span></div>
          <div className="receipt-row"><span className="k">Est. activity</span><span>~11,500 tokens</span></div>
          <div className="receipt-divider" />
          <div className="receipt-row receipt-total">
            <span>Estimated energy</span>
            <span>1.5–13 Wh</span>
          </div>
          <div className="receipt-row">
            <span className="k">Confidence</span>
            <span className="conf conf-medium conf-pulse">
              <span className="conf-dot" aria-hidden /> Medium
            </span>
          </div>
          <div className="receipt-divider" />
          <div style={{ fontSize: "0.85rem" }}>
            <div className="reason ok"><span className="mark">✓</span> Platform and session observed directly</div>
            <div className="reason ok"><span className="mark">✓</span> Model identified</div>
            <div className="reason caveat"><span className="mark">△</span> Data-center location unknown</div>
          </div>
          <div className="receipt-foot">
            A range, never a single number — uncertainty compounds honestly
            through every layer of the estimate.
          </div>
        </div>
      </Reveal>

      <Reveal from="right" delay={0.15}>
        <div className="glance-card" aria-label="Today's glance (simulated)">
          <div className="section-kicker" style={{ marginBottom: 10 }}>Today&apos;s glance</div>
          <div className="glance-value">≈ 20–203 Wh</div>
          <p className="muted" style={{ margin: "6px 0 10px" }}>
            Roughly 7 phone charges — across 10 sessions this week.
          </p>
          <span className="conf conf-medium conf-pulse">
            <span className="conf-dot" aria-hidden /> Medium confidence
          </span>
          <p className="faint" style={{ marginTop: 14 }}>
            Simulated data. Your real dashboard is built from your own
            metadata — and only your metadata.
          </p>
        </div>
      </Reveal>
    </div>
  );
}
