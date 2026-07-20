import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Reveal } from "@/components/landing/Reveal";
import { ReceiptDemo } from "@/components/landing/ReceiptDemo";

export default function Landing() {
  return (
    <main className="landing">
      {/* 1 — Editorial hero: pinned reveal */}
      <Hero />

      {/* 2 — Mission & philosophy: the promise, on deep earth */}
      <section className="section earth">
        <div className="section-inner">
          <Reveal from="up">
            <div className="section-kicker">Mission</div>
            <h2 className="section-h2">
              Understanding, not surveillance.
            </h2>
            <p className="section-lede">
              Every AI conversation runs on physical infrastructure you never
              see. Carbon Canvas makes that relationship visible — from the
              metadata alone. We count sessions, time, and activity size in
              your browser. The words themselves are discarded on the spot.
            </p>
          </Reveal>
          <Reveal from="up" delay={0.1}>
            <div className="ledger">
              <div>
                <h3>We measure</h3>
                <ul>
                  <li><span className="mark-see">—</span> Which AI tool, and when</li>
                  <li><span className="mark-see">—</span> How long, and how often</li>
                  <li><span className="mark-see">—</span> The model, when the page shows it</li>
                  <li><span className="mark-see">—</span> An estimate of activity size</li>
                </ul>
              </div>
              <div>
                <h3>We never touch</h3>
                <ul>
                  <li><span className="mark-never">—</span> Your prompts</li>
                  <li><span className="mark-never">—</span> The AI&apos;s replies</li>
                  <li><span className="mark-never">—</span> Your files and documents</li>
                  <li><span className="mark-never">—</span> Anything you type, anywhere</li>
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3 — Live demo: the collector's display */}
      <section className="section">
        <div className="section-inner">
          <Reveal from="up">
            <div className="section-kicker">The product</div>
            <h2 className="section-h2">One session, fully accounted for.</h2>
            <p className="section-lede">
              Every tracked session becomes a receipt: what ran, for how long,
              and what it likely cost the grid — always as an honest range,
              with the confidence to match.
            </p>
          </Reveal>
          <ReceiptDemo />
        </div>
      </section>

      {/* 4 — Transparency */}
      <section className="section" style={{ paddingTop: 40 }}>
        <div className="section-inner">
          <Reveal from="up">
            <div className="section-kicker">Transparency over simplicity</div>
            <h2 className="section-h2">Every number shows its work.</h2>
            <p className="section-lede">
              Our estimation pipeline is versioned, sourced, and public: energy
              bands anchored to peer-reviewed measurement, datacenter overhead
              from industry surveys, and a written record of what we
              deliberately don&apos;t claim. When the research moves, the
              version number moves with it.
            </p>
            <div className="hero-cta" style={{ marginTop: 24 }}>
              <Link href="/dashboard/methodology" className="btn secondary">
                Read the full methodology →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 5 — Footer */}
      <footer className="foot">
        <div className="foot-inner">
          <div>
            <div style={{ fontWeight: 650 }}>Carbon Canvas</div>
            <small>
              The transparency layer for the AI era. Private by architecture.
            </small>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/register" className="btn">Download the extension</Link>
            <Link href="/login" className="btn secondary">Sign in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
