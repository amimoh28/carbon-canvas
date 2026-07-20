/** The transparency spine (UX §4: "Research / Methodology — can I trust
 *  these numbers?"). Rendered from the research DB, so what users read is
 *  exactly what the engine uses. */

import { prisma } from "@/lib/db";
import { METHODOLOGY_VERSION } from "@carbon-canvas/estimation";

interface Assumption {
  key: string;
  value: string;
  rationale: string;
  sourceIds: string[];
}

export default async function MethodologyPage() {
  const version = await prisma.methodologyVersion.findUnique({
    where: { version: METHODOLOGY_VERSION },
  });
  const sources = await prisma.researchSource.findMany({ orderBy: { year: "desc" } });
  const assumptions: Assumption[] = version ? JSON.parse(version.assumptionsJson) : [];
  const sourceById = new Map(sources.map((s) => [s.id, s]));

  return (
    <main>
      <h1>How we calculate</h1>
      <p className="muted" style={{ maxWidth: 620 }}>
        Every estimate you see is produced by a versioned, deterministic
        pipeline built on published research — never a black box. This page is
        generated from the same data the engine uses.
      </p>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Current methodology — version {METHODOLOGY_VERSION}</h2>
        <p className="muted">{version?.summary ?? "Run the seed script to load methodology metadata."}</p>
        <div
          style={{
            background: "var(--bg-sunken)",
            borderRadius: 8,
            padding: "12px 16px",
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.85rem",
            marginTop: 10,
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          estimated tokens → × energy per 1k tokens (model-class band) → × datacenter
          overhead (PUE band) → energy range (Wh) → confidence score
        </div>
        <p className="faint" style={{ marginTop: 10 }}>
          Low bounds multiply with low bounds and high with high, so the final
          range honestly compounds every layer of uncertainty. The engine can
          never emit a single number.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Assumptions</h2>
        <p className="faint" style={{ marginBottom: 8 }}>
          Everything we assume, why, and where it comes from. When an
          assumption changes, the version number changes and past sessions can
          be recomputed.
        </p>
        <table className="plain">
          <thead>
            <tr>
              <th>Assumption</th>
              <th>Value</th>
              <th>Why</th>
              <th>Sources</th>
            </tr>
          </thead>
          <tbody>
            {assumptions.map((a) => (
              <tr key={a.key}>
                <td style={{ fontWeight: 550 }}>{a.key}</td>
                <td style={{ whiteSpace: "nowrap" }}>{a.value}</td>
                <td className="muted">{a.rationale}</td>
                <td className="faint">
                  {a.sourceIds
                    .map((id) => sourceById.get(id)?.org ?? id)
                    .join(", ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Research sources</h2>
        <table className="plain">
          <thead>
            <tr>
              <th>Source</th>
              <th>Organization</th>
              <th>Year</th>
              <th>Used for</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.id}>
                <td>
                  <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                  <div className="faint">{s.note}</div>
                </td>
                <td>{s.org}</td>
                <td>{s.year}</td>
                <td className="muted">{s.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>What we deliberately don&apos;t claim</h2>
        <ul className="muted" style={{ paddingLeft: 20, margin: "6px 0" }}>
          <li>
            <strong>No exact emissions per prompt.</strong> The exact hardware,
            batching, and datacenter serving a request are not public.
            Anyone offering a precise number is guessing without saying so.
          </li>
          <li>
            <strong>No carbon or water figures yet.</strong> Converting energy
            to carbon requires grid-location assumptions we can&apos;t verify.
            Those layers ship only after this methodology survives external
            review.
          </li>
          <li>
            <strong>No hidden-token visibility.</strong> Reasoning models think
            in tokens we cannot see; where that applies, we say so in the
            confidence notes and the true energy may be higher.
          </li>
        </ul>
        <p className="faint">
          Prototype note: the current bands are placeholders within the ranges
          reported by the cited literature. They must be re-reviewed with
          researchers before any public launch — honesty about that is part of
          the methodology too.
        </p>
      </div>
    </main>
  );
}
