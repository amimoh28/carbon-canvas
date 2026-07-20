import Link from "next/link";

export default function Landing() {
  return (
    <main className="container" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <div style={{ maxWidth: 560 }}>
        <div style={{ fontWeight: 650, color: "var(--accent)", marginBottom: 18 }}>
          Carbon Canvas
        </div>
        <h1 style={{ fontSize: "2.2rem", lineHeight: 1.2 }}>
          AI is part of your day.
          <br />
          Now you can see it.
        </h1>
        <p className="muted" style={{ fontSize: "1.05rem", margin: "18px 0 28px" }}>
          Carbon Canvas quietly shows you how you use AI — and what it asks of
          the planet — without ever reading your conversations.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/register" className="btn">Create account</Link>
          <Link href="/login" className="btn secondary">Sign in</Link>
        </div>
        <div className="notice" style={{ marginTop: 40 }}>
          <strong>Private by design.</strong> The extension reads pages only in
          your browser to count activity, then discards the text. Only numbers —
          platform, duration, counts — ever leave your device. Never your words.
        </div>
      </div>
    </main>
  );
}
