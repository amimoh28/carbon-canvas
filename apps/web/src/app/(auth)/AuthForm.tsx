"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Something went wrong — please try again.");
      setBusy(false);
    }
  }

  return (
    <main className="container" style={{ paddingTop: 70, maxWidth: 420 }}>
      <div style={{ fontWeight: 650, color: "var(--accent)", marginBottom: 16 }}>Carbon Canvas</div>
      <div className="card">
        <h1 style={{ fontSize: "1.3rem" }}>
          {mode === "register" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="faint" style={{ margin: "4px 0 10px" }}>
          {mode === "register"
            ? "An account syncs your usage metadata — numbers only, never conversations."
            : "Sign in to see your AI usage."}
        </p>
        <form onSubmit={submit}>
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" />
          <label htmlFor="password">Password {mode === "register" && <span className="faint">(8+ characters)</span>}</label>
          <input
            id="password" name="password" type="password" required
            minLength={mode === "register" ? 8 : 1}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          {error && (
            <p role="alert" style={{ color: "#a04545", fontSize: "0.88rem", margin: "10px 0 0" }}>
              {error}
            </p>
          )}
          <button className="btn" style={{ width: "100%", marginTop: 18 }} disabled={busy}>
            {busy ? "One moment…" : mode === "register" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>
      <p className="faint" style={{ marginTop: 14, textAlign: "center" }}>
        {mode === "register" ? (
          <>Already have an account? <Link href="/login">Sign in</Link></>
        ) : (
          <>New here? <Link href="/register">Create an account</Link></>
        )}
      </p>
    </main>
  );
}
