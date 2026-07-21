"use client";

import { useState } from "react";

export function BillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Billing portal is unavailable.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Billing portal is unavailable.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn secondary" type="button" onClick={openPortal} disabled={loading}>
        {loading ? "Opening billing…" : "Manage billing"}
      </button>
      {error && <p style={{ color: "#a04545", fontSize: ".85rem", marginBottom: 0 }}>{error}</p>}
    </div>
  );
}
