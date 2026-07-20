import { currentUser } from "@/lib/auth";
import { getSessionHistory } from "@/lib/queries";
import { aggregateEstimates, humanComparison } from "@carbon-canvas/estimation";
import { ConfidenceBadge, ConfidenceDetail, type Reason } from "@/components/Confidence";
import Link from "next/link";
import { fmtWhRange } from "@/lib/format";

const PLATFORM_LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude" };

export default async function ImpactPage() {
  const user = (await currentUser())!;
  const sessions = await getSessionHistory(user.id, 200);
  const withEstimates = sessions.filter((s) => s.estimate);

  if (withEstimates.length === 0) {
    return (
      <main>
        <h1>Environmental impact</h1>
        <div className="notice" style={{ marginTop: 16 }}>
          We need a little more tracked activity before estimating your energy
          footprint reliably. Use AI as you normally would and check back soon.
        </div>
      </main>
    );
  }

  const agg = aggregateEstimates(
    withEstimates.map((s) => ({
      energyWhLow: s.estimate!.energyWhLow,
      energyWhHigh: s.estimate!.energyWhHigh,
      confidenceScore: s.estimate!.confidenceScore,
    })),
  );

  // The most recent session's reasons illustrate what drives confidence.
  const latest = withEstimates[0]!;
  const latestReasons = JSON.parse(latest.estimate!.reasonsJson) as Reason[];

  return (
    <main>
      <h1>Environmental impact</h1>
      <p className="muted" style={{ maxWidth: 560 }}>
        Estimated energy behind your tracked AI use. Always a range — the exact
        infrastructure serving your requests isn&apos;t public, and we won&apos;t
        pretend otherwise.
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>All tracked sessions ({withEstimates.length})</h2>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
          <span className="stat-value">≈ {fmtWhRange(agg.energyWhLow, agg.energyWhHigh)}</span>
          <ConfidenceBadge level={agg.confidence} />
        </div>
        <p className="muted" style={{ margin: "6px 0 2px" }}>
          {humanComparison(agg.energyWhLow, agg.energyWhHigh)}
        </p>
        <p className="faint" style={{ marginBottom: 12 }}>
          For scale: streaming video for an hour uses roughly 75&nbsp;Wh
          <em> at the data center</em>, and charging a phone about 15&nbsp;Wh.
          Understanding beats guilt — this number is for perspective, not alarm.
        </p>
        <ConfidenceDetail
          level={agg.confidence}
          reasons={latestReasons}
          methodologyVersion={latest.estimate!.methodologyVersion}
        />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Recent sessions</h2>
        <table className="plain">
          <thead>
            <tr>
              <th>When</th>
              <th>Platform</th>
              <th>Energy (range)</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {withEstimates.slice(0, 10).map((s) => (
              <tr key={s.id}>
                <td>
                  {s.startedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td>{PLATFORM_LABEL[s.platform] ?? s.platform}</td>
                <td>{fmtWhRange(s.estimate!.energyWhLow, s.estimate!.energyWhHigh)}</td>
                <td><ConfidenceBadge level={s.estimate!.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="faint" style={{ marginTop: 10 }}>
          Carbon and water estimates are deliberately not shown yet: our energy
          methodology needs external review before we convert it into further
          claims. <Link href="/dashboard/methodology">Read why</Link>.
        </p>
      </div>
    </main>
  );
}
