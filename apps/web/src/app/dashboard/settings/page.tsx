import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SettingsActions } from "./SettingsActions";

export default async function SettingsPage() {
  const user = (await currentUser())!;
  const syncToken = await prisma.syncToken.findFirst({
    where: { userId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <h1>Settings &amp; privacy</h1>

      <div className="card" style={{ marginTop: 18 }}>
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
