"use client";

import { useState } from "react";

export function UpgradeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function upgrade() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Checkout is unavailable.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout is unavailable.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn" type="button" onClick={upgrade} disabled={loading}>
        {loading ? "Opening Stripe…" : "Upgrade to Pro — $9 CAD/month"}
      </button>
      {error && <p style={{ color: "#a04545", fontSize: ".85rem", marginBottom: 0 }}>{error}</p>}
    </div>
  );
}
