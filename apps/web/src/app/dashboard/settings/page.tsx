import Link from "next/link";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsActions } from "./SettingsActions";
import { BillingButton } from "./BillingButton";

export default async function SettingsPage() {
  const user = (await currentUser())!;
  const syncToken = await prisma.syncToken.findFirst({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  const isPro = user.plan === "pro" && user.stripeSubscriptionStatus !== "cancelled";

  return (
    <main>
      <h1>Settings &amp; privacy</h1>

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
          <div>
            <h2>Plan</h2>
            <p className="muted" style={{ marginBottom: 4 }}>
              <strong>{isPro ? "Personal Pro" : "Personal Free"}</strong>
            </p>
            <p className="faint" style={{ marginTop: 0 }}>
              {isPro
                ? "Optimization recommendations, reports, goals, and exports are unlocked."
                : "Usage tracking and impact insights are free. Optimization remains visible but locked."}
            </p>
          </div>
          {isPro ? <BillingButton /> : <Link className="btn" href="/dashboard/optimize">Upgrade to Pro</Link>}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>Connect your extension</h2>
        <p className="muted">
          Paste this token into the Carbon Canvas extension popup to sync your
          usage metadata to this dashboard. Without it, the extension runs in
          local-only mode — a completely valid way to use Carbon Canvas.
        </p>
        <code
          style={{
            display: "block",
            background: "var(--bg-sunken)",
            padding: "10px 12px",
            borderRadius: 8,
            fontSize: "0.85rem",
            wordBreak: "break-all",
            marginTop: 8,
          }}
        >
          {syncToken?.token ?? "No active token"}
        </code>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h2>What we collect — and what we never touch</h2>
        <div className="grid grid-2" style={{ marginTop: 8 }}>
          <div>
            <h3>We see ✓</h3>
            <ul className="muted" style={{ paddingLeft: 18, margin: "6px 0" }}>
              <li>Which AI tool (ChatGPT, Claude)</li>
              <li>How long and how often</li>
              <li>The model, if the page shows it</li>
              <li>An estimate of activity size</li>
            </ul>
          </div>
          <div>
            <h3>We never touch ✗</h3>
            <ul className="muted" style={{ paddingLeft: 18, margin: "6px 0" }}>
              <li>Your prompts</li>
              <li>The AI&apos;s replies</li>
              <li>Your files or documents</li>
              <li>Anything you type</li>
            </ul>
          </div>
        </div>
        <p className="faint">
          Pages are read only inside your browser to count activity; the text is
          discarded immediately. There is no database column that could store a
          conversation — by design.
        </p>
      </div>

      <SettingsActions />
    </main>
  );
}
