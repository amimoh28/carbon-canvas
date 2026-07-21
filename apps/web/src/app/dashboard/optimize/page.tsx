import { currentUser } from "@/lib/auth";
import { getOverview } from "@/lib/queries";
import { UpgradeButton } from "./UpgradeButton";

function recommendationCopy(data: Awaited<ReturnType<typeof getOverview>>) {
  const averageMinutes = data.weekSessions > 0 ? data.weekMinutes / data.weekSessions : 0;
  const topPlatform = [...data.platformSplit].sort((a, b) => b.seconds - a.seconds)[0];

  return [
    {
      label: "WORKFLOW",
      title: averageMinutes > 0 && averageMinutes < 8 ? "Bundle related questions into fewer sessions" : "Protect your strongest AI work blocks",
      body:
        averageMinutes > 0 && averageMinutes < 8
          ? `Your sessions average about ${Math.max(1, Math.round(averageMinutes))} minutes. Preparing context once and grouping related questions may reduce repeated setup and clarification turns.`
          : "Your usage already includes longer work blocks. Keep related research, drafting, and revision inside one planned session when it improves continuity.",
    },
    {
      label: "MODEL FIT",
      title: "Reserve high-capability models for high-value work",
      body: "Routine rewriting, classification, formatting, and extraction may not need the highest-capability model. Match model strength to task difficulty rather than using one model for everything.",
    },
    {
      label: "PROMPT QUALITY",
      title: "Front-load the constraints that cause follow-up turns",
      body: "Include the audience, desired output, useful source material, constraints, and definition of done in the first request when you already know them.",
    },
    {
      label: "PLATFORM MIX",
      title: topPlatform ? `Review what you rely on ${topPlatform.platform} for` : "Build enough history for platform recommendations",
      body: topPlatform
        ? `${topPlatform.platform} represents your largest share of AI time this week. Check whether that tool is genuinely the best fit for those tasks or simply the default tab you open.`
        : "Once Carbon Canvas has several sessions, it can identify platform concentration and suggest where a different tool or model may be a better fit.",
    },
  ];
}

export default async function OptimizePage({ searchParams }: { searchParams?: { checkout?: string } }) {
  const user = (await currentUser())!;
  const data = await getOverview(user.id);
  const isPro = user.plan === "pro" && user.stripeSubscriptionStatus !== "cancelled";
  const recommendations = recommendationCopy(data);

  return (
    <main>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
        <div>
          <h1>Optimize</h1>
          <p className="muted" style={{ maxWidth: 620, marginTop: 6 }}>
            Free accounts can see their usage. Pro turns those patterns into specific workflow, model, and prompting recommendations.
          </p>
        </div>
        <span className="notice" style={{ padding: "8px 12px" }}>{isPro ? "Pro active" : "Free plan"}</span>
      </div>

      {searchParams?.checkout === "success" && (
        <div className="notice" style={{ marginTop: 18 }}>
          Stripe received your payment. Your Pro access will appear as soon as the signed webhook confirms the subscription.
        </div>
      )}
      {searchParams?.checkout === "cancelled" && (
        <div className="notice warn" style={{ marginTop: 18 }}>
          Checkout was cancelled. Your free usage dashboard is unchanged.
        </div>
      )}

      {isPro ? (
        <>
          <div className="grid grid-2" style={{ marginTop: 20 }}>
            {recommendations.map((item) => (
              <article className="card" key={item.label}>
                <div style={{ color: "var(--accent)", fontSize: ".72rem", letterSpacing: ".12em", fontWeight: 700 }}>{item.label}</div>
                <h2 style={{ marginTop: 8 }}>{item.title}</h2>
                <p className="muted" style={{ marginBottom: 0 }}>{item.body}</p>
              </article>
            ))}
          </div>
          <div className="card" style={{ marginTop: 16 }}>
            <h2>Your next optimization goal</h2>
            <p className="muted" style={{ marginBottom: 0 }}>
              Reduce avoidable repeat turns without reducing the quality of your output. Carbon Canvas should compare your next four weeks with this baseline rather than treating “fewer prompts” as the goal by itself.
            </p>
          </div>
        </>
      ) : (
        <section style={{ position: "relative", marginTop: 22, overflow: "hidden", borderRadius: 14, border: "1px solid var(--line)", background: "var(--bg-raised)" }}>
          <div style={{ filter: "blur(5px)", opacity: 0.52, padding: 22, pointerEvents: "none" }} aria-hidden="true">
            <div className="grid grid-2">
              {recommendations.map((item) => (
                <article className="card" key={item.label}>
                  <div style={{ color: "var(--accent)", fontSize: ".72rem", letterSpacing: ".12em", fontWeight: 700 }}>{item.label}</div>
                  <h2 style={{ marginTop: 8 }}>{item.title}</h2>
                  <p className="muted" style={{ marginBottom: 0 }}>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "linear-gradient(to bottom, transparent, color-mix(in srgb, var(--bg) 88%, transparent))" }}>
            <div className="card" style={{ maxWidth: 460, textAlign: "center", boxShadow: "0 18px 50px rgba(35,40,46,.18)" }}>
              <div style={{ color: "var(--accent)", fontSize: ".72rem", letterSpacing: ".12em", fontWeight: 700 }}>PRO OPTIMIZATION</div>
              <h2 style={{ fontSize: "1.35rem", marginTop: 8 }}>Your usage stays free. The action plan is paid.</h2>
              <p className="muted">
                Unlock the exact workflow, model-fit, and prompt-quality recommendations generated from your own activity.
              </p>
              <UpgradeButton />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
