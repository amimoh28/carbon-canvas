"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsActions() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteAll() {
    const res = await fetch("/api/account/delete-data", { method: "POST" });
    if (res.ok) {
      const j = await res.json();
      setMessage(
        `Done. ${j.deletedSessions} session${j.deletedSessions === 1 ? "" : "s"} and all related estimates were permanently deleted.`,
      );
      setConfirming(false);
      router.refresh();
    } else {
      setMessage("Something went wrong — please try again.");
    }
  }

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2>Your data, your call</h2>
      <p className="muted">
        Export everything we hold about you, or delete it permanently. No dark
        patterns, no guilt — it&apos;s your data.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <a className="btn secondary" href="/api/account/export">
          Export my data (JSON)
        </a>
        {!confirming ? (
          <button className="btn secondary" onClick={() => setConfirming(true)}>
            Delete all my data…
          </button>
        ) : (
          <button className="btn danger" onClick={deleteAll}>
            Yes, permanently delete everything
          </button>
        )}
      </div>
      {confirming && (
        <p className="faint" style={{ marginTop: 10 }}>
          This removes all your usage data and estimates from our servers.
          It can&apos;t be undone.{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); setConfirming(false); }}>
            Never mind
          </a>
        </p>
      )}
      {message && (
        <p className="muted" role="status" style={{ marginTop: 10 }}>{message}</p>
      )}
    </div>
  );
}
