import { currentUser } from "@/lib/auth";
import { getOverview } from "@/lib/queries";
import { TrendChart } from "@/components/TrendChart";
import { ConfidenceBadge } from "@/components/Confidence";
import Link from "next/link";
import { fmtWhRange } from "@/lib/format";

const PLATFORM_LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude" };

export default async function OverviewPage() {
  const user = (await currentUser())!;
  const data = await getOverview(user.id);

  if (data.totalSessions === 0) {
    // Empty state: anticipation, not absence (UX §9.1).
    return (
      <main>
        <h1>Your AI story starts now</h1>
        <p className="muted" style={{ maxWidth: 520 }}>
          Install the browser extension, then use ChatGPT or Claude the way you
          normally do. Your first insights will appear here — usually within a
          few minutes of your first session.
        </p>
        <div className="card" style={{ marginTop: 20, maxWidth: 520 }}>
          <h2>Set up in two steps</h2>
          <ol className="muted" style={{ paddingLeft: 20, margin: "8px 0 0" }}>
            <li>Load the Carbon Canvas extension in Chrome.</li>
            <li>
              Paste your sync token from{" "}
              <Link href="/dashboard/settings">Settings</Link> into the
              extension popup — or skip this to stay fully local.
            </li>
          </ol>
        </div>
        <div className="notice" style={{ marginTop: 16, maxWidth: 520 }}>
          Nothing is tracked until the extension is installed, and your
          conversations are never read either way.
        </div>
      </main>
    );
  }

  const maxSec = Math.max(...data.platformSplit.map((p) => p.seconds), 1);

  return (
    <main>
      <h1>Your AI this week</h1>
      <div className="grid grid-3" style={{ marginTop: 18 }}>
        <div className="card">
          <div className="stat-value">{data.weekSessions}</div>
          <div className="stat-label">sessions this week</div>
        </div>
        <div className="card">
          <div className="stat-value">
            {data.weekMinutes >= 60
              ? `${Math.floor(data.weekMinutes / 60)}h ${data.weekMinutes % 60}m`
              : `${data.weekMinutes}m`}
          </div>
          <div className="stat-label">time with AI</div>
        </div>
        <div className="card">
          <div className="stat-value">
            {data.weekDeltaPct === null ? "—" : `${data.weekDeltaPct > 0 ? "↑" : data.weekDeltaPct < 0 ? "↓" : ""} ${Math.abs(data.weekDeltaPct)}%`}
          </div>
          <div className="stat-label">vs last week</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Last 14 days</h2>
        <TrendChart points={data.trend} unit="sessions" />
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Platform mix</h2>
          {data.platformSplit.length === 0 && (
            <p className="faint">No sessions yet this week.</p>
          )}
          {data.platformSplit.map((p) => (
            <div key={p.platform} className="bar-row">
              <span className="bar-label">{PLATFORM_LABEL[p.platform] ?? p.platform}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.round((p.seconds / maxSec) * 100)}%` }}
                />
              </div>
              <span className="bar-value">{Math.round(p.seconds / 60)}m</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Environmental</h2>
          {data.energy ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span className="stat-value" style={{ fontSize: "1.4rem" }}>
                  ≈ {fmtWhRange(data.energy.whLow, data.energy.whHigh)}
                </span>
                <ConfidenceBadge level={data.energy.confidence} />
              </div>
              <p className="muted" style={{ margin: "6px 0 8px" }}>{data.energy.comparison}</p>
              <p className="faint">
                An honest range, not a precise number.{" "}
                <Link href="/dashboard/impact">See details</Link> ·{" "}
                <Link href="/dashboard/methodology">How was this calculated?</Link>
              </p>
            </>
          ) : (
            <p className="faint">
              We need a little more activity before estimating this reliably —
              check back after a few sessions.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
