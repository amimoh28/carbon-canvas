/** The confidence system as a reusable component (UX §7): dot + word +
 *  expandable plain-language reasons. Never color alone; low confidence is
 *  presented as honesty, not error. */

export interface Reason {
  ok: boolean;
  label: string;
}

export function ConfidenceBadge({ level }: { level: string }) {
  const word = level.charAt(0).toUpperCase() + level.slice(1);
  return (
    <span className={`conf conf-${level}`}>
      <span className="conf-dot" aria-hidden />
      {word} confidence
    </span>
  );
}

export function ConfidenceDetail({
  level,
  reasons,
  methodologyVersion,
}: {
  level: string;
  reasons: Reason[];
  methodologyVersion?: string;
}) {
  return (
    <details>
      <summary>
        Why {level} confidence?
      </summary>
      <div>
        {reasons.map((r, i) => (
          <div key={i} className={`reason ${r.ok ? "ok" : "caveat"}`}>
            <span className="mark" aria-hidden>{r.ok ? "✓" : "△"}</span>
            <span>{r.label}</span>
          </div>
        ))}
        <p className="faint" style={{ marginTop: 8 }}>
          We show what we know and what we&apos;re assuming — a low score means
          we&apos;re being honest about guessing, not that something is broken.{" "}
          <a href="/dashboard/methodology">Full methodology</a>
          {methodologyVersion ? <> · version {methodologyVersion}</> : null}
        </p>
      </div>
    </details>
  );
}
