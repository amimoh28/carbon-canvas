import { currentUser } from "@/lib/auth";
import { getSessionHistory } from "@/lib/queries";
import { ConfidenceBadge } from "@/components/Confidence";
import { fmtWhRange } from "@/lib/format";

const PLATFORM_LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude" };

function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

export default async function UsagePage() {
  const user = (await currentUser())!;
  const sessions = await getSessionHistory(user.id, 100);

  return (
    <main>
      <h1>Usage history</h1>
      <p className="muted">
        Every tracked session — metadata only. Unknown models are shown as
        unknown, never guessed.
      </p>

      {sessions.length === 0 ? (
        <div className="notice" style={{ marginTop: 16 }}>
          No sessions yet. Once the extension sees you using ChatGPT or Claude,
          they&apos;ll appear here.
        </div>
      ) : (
        <div className="card" style={{ marginTop: 16, overflowX: "auto" }}>
          <table className="plain">
            <thead>
              <tr>
                <th>When</th>
                <th>Platform</th>
                <th>Model</th>
                <th>Duration</th>
                <th>Prompts</th>
                <th>Est. activity</th>
                <th>Energy (range)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.startedAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    <span className="faint">
                      {s.startedAt.toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  <td>{PLATFORM_LABEL[s.platform] ?? s.platform}</td>
                  <td>{s.model ?? <span className="faint">unknown</span>}</td>
                  <td>{fmtDuration(s.durationSec)}</td>
                  <td>{s.turnCount}</td>
                  <td>
                    {s.estTokens !== null ? (
                      `~${s.estTokens.toLocaleString()} tokens`
                    ) : (
                      <span className="faint">—</span>
                    )}
                  </td>
                  <td>
                    {s.estimate ? (
                      <span>
                        {fmtWhRange(s.estimate.energyWhLow, s.estimate.energyWhHigh)}{" "}
                        <ConfidenceBadge level={s.estimate.confidence} />
                      </span>
                    ) : (
                      <span className="faint">pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
