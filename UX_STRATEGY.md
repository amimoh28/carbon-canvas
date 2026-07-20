# Carbon Canvas — UX Strategy & Design Direction

**Author:** Founding Senior UX Designer & Product Research Lead
**Inputs:** Master Product Document; Product Strategy Review; Technical Feasibility Assessment; MVP Development Plan; PRD (all in repo)
**Status:** Foundational UX strategy. No code.
**Design north star:** *"I finally understand what is happening behind the AI tools I use every day."*

---

## 0. Foundation — who, why, what, and how it should feel

Before a single screen, the design is anchored to five research-level answers. Everything downstream must serve these.

### 0.1 Who the user is (MVP)
The **AI power user who is curious about themselves** — the student, knowledge worker, or founder who already uses ChatGPT and Claude daily and has a low-grade, unanswered question: *"How much of this am I actually doing?"* They are technically comfortable, privacy-aware, and allergic to being lectured. They are **not** primarily an environmentalist; sustainability is an interesting lens, not their reason for showing up. (This directly reflects the retention risk in the Strategy Review — we design for *self-knowledge first, environment as a meaningful layer*.)

### 0.2 Why they install
Curiosity buys the install. Self-insight earns the return. The environmental angle provides *meaning and shareability*, not the core hook. The design must therefore deliver a **"huh, interesting" moment within 60 seconds** and a **reason to return within a week** — or it fails regardless of polish.

### 0.3 The problem they're solving
Not "reduce my carbon." It's *"make the invisible visible"* — turn an ambient, un-examined habit into something they can see, understand, and feel a little more in control of. The emotional job is closer to a **fitness tracker's "oh, that's my week"** than to a carbon calculator's verdict.

### 0.4 The emotional experience we are designing for
| Moment | Feeling we engineer | Feeling we forbid |
|---|---|---|
| First value | Curiosity satisfied — *"oh, neat"* | Confusion, "so what?" |
| Environmental view | Calm understanding — *"now I get it"* | Guilt, alarm, being judged |
| Transparency panel | Respect / trust — *"they're being honest with me"* | Being sold false precision |
| Privacy moment | Relief — *"they really don't read my chats"* | Suspicion, creepiness |
| Long-term | Quiet self-awareness — *"this is my relationship with AI"* | Nagging, obligation |

The dominant emotion is **calm clarity**, never anxiety. This is the single most important design constraint and it overrides visual ambition everywhere they conflict.

### 0.5 What information they actually need (ruthlessly prioritized)
1. **How much** am I using AI (and is it going up)?
2. **Where** — which tools, in what mix?
3. **What does that mean** — one honest, human-scaled impact figure.
4. **Can I trust this** — how was it calculated, and are my chats private?

Everything else (receipts, profiles, scores) is secondary and, per the PRD, mostly post-MVP. The IA below reflects that hierarchy even though it maps the full vision.

### 0.6 The three-way brand tension, resolved into a design rule
Technology · Nature · Trust must coexist without becoming a green cliché.
- **Technology** owns the *structure*: clean grid, data clarity, precise typography, responsive feel (Linear/Stripe DNA).
- **Nature** owns the *soul*: organic motion, seasonal/growth metaphors, breathing space, a calm palette (Apple Health / National Geographic restraint — never clip-art leaves).
- **Trust** owns the *voice*: plain language, visible uncertainty, "how was this calculated?" everywhere.

**Rule:** Nature is expressed through *motion, space, and metaphor* — not through green color and leaf icons. If a design element could appear on a generic ESG brochure, it's wrong.

---

## 1. User journey

For each stage: **goal · emotion · friction · design solution.** This is the spine; §§2–9 detail the surfaces it touches.

### 1.1 Discovery
- **Goal:** Understand in one glance what this is and whether it's for them.
- **Emotion:** Curious, mildly skeptical ("another tracker?").
- **Friction:** The identity ambiguity (sustainability vs. self-knowledge) can confuse the pitch; "carbon" in the name may mis-signal.
- **Solution:** Lead the landing page with **self-knowledge** ("See how you actually use AI — privately"), with environmental insight as the intriguing second beat. A/B test framing per the MVP plan. Show a real dashboard preview, not abstract eco-art.

### 1.2 Installation
- **Goal:** Add the extension with minimal thought.
- **Emotion:** Slight caution at "add to Chrome."
- **Friction:** Chrome Web Store trust threshold; unknown brand.
- **Solution:** Store listing emphasizes *metadata-only, open-source, no conversation access*. Screenshots show the calm dashboard. Keep the ask small: "Install — set up takes 30 seconds."

### 1.3 First launch
- **Goal:** Know what just happened and what's next.
- **Emotion:** "Okay, now what?"
- **Friction:** Extensions often do nothing visible after install → drop-off.
- **Solution:** Auto-open a single welcome tab (not the popup) with a 3-beat intro (see §3). No wall of text. One clear primary action.

### 1.4 Account creation
- **Goal:** Start using it; optionally save data across devices.
- **Emotion:** Resistance to yet another signup.
- **Friction:** Signup is the classic drop point; conflicts with privacy expectations.
- **Solution:** **Offer local-only mode as a first-class, non-penalized choice.** "Try it with nothing leaving your device" builds trust and lowers friction; account is framed as "sync + history," opt-in later. This is a differentiator, not a fallback.

### 1.5 Permission requests — *the make-or-break moment*
- **Goal:** Feel safe granting access to AI sites.
- **Emotion:** This is the anxiety spike. Chrome will say "read and change your data on chatgpt.com, claude.ai."
- **Friction:** The exact privacy-conscious user we want is the one most likely to balk here (Feasibility §1, PRD FR-1).
- **Solution:** A **pre-permission explainer that pre-empts the scary prompt** — in plain language, *before* Chrome's dialog: "To count your sessions, we read the page in your browser. We never store or send your messages. Here's exactly what we collect." Visual: a two-column "We see ✓ / We never touch ✗" card. Link to the open-source code. Only then trigger Chrome's prompt.

### 1.6 First AI usage tracking
- **Goal:** See that it's working, invisibly.
- **Emotion:** Reassurance, mild delight.
- **Friction:** Nothing appears to happen (tracking is silent by design).
- **Solution:** A gentle, one-time signal — the extension icon subtly animates the first time a session is detected; the popup shows "First session tracked ✓ — on ChatGPT." No interruption to their actual work.

### 1.7 First dashboard visit — *the value moment*
- **Goal:** Get the "oh, interesting" payoff.
- **Emotion:** Curiosity → satisfaction (or disappointment if empty/thin).
- **Friction:** Cold-start: little data on day one; the honest energy number may feel trivially small (the Strategy Review's paradox).
- **Solution:** Design for **thin-data grace** (see §9 empty states): show what exists, frame it as "your first data point," emphasize *trend-to-come* over absolute numbers. Frame the small energy figure with **comparison and trajectory**, not a lone tiny number. Lead with usage insight; environment is the meaningful second panel.

### 1.8 Long-term engagement
- **Goal:** A light, recurring reason to check in.
- **Emotion:** Should feel like a calm weekly ritual, never nagging.
- **Friction:** Novelty fades; this is the retention cliff the whole business rests on.
- **Solution:** A **weekly rhythm** — an opt-in gentle summary ("Your AI week") that surfaces one interesting change ("You leaned on Claude more this week"). Progress/streak-*free* by default (streaks create obligation and guilt — off-brand). Introduce receipts/profile as *depth for the curious*, not as engagement bait.

---

## 2. Browser extension experience

The extension is the primary entry point and lives in a **~360×500px popup**. Ruthless prioritization required.

### 2.1 Icon concept
- **Concept:** A minimal **cloud-meets-horizon** mark — a soft cloud form whose lower edge becomes a simple landscape line (the oak/river/deer of the Master Doc are brand storytelling, far too detailed for a 16px icon).
- **At small sizes:** reduce to a single recognizable silhouette — a cloud with a subtle leaf/hill negative space. Strong shape over detail.
- **States:** neutral (idle), subtle accent (actively tracking a session), muted/greyed (paused or adapter down — ties to §9 error states).

### 2.2 Popup layout (default, has data)
```
┌───────────────────────────────┐
│ Carbon Canvas        ● tracking│  ← status dot, honest + calm
├───────────────────────────────┤
│  Today                        │
│  ┌──────────┐  ┌──────────┐   │
│  │ 4        │  │ 32 min   │   │  ← sessions · active time
│  │ sessions │  │ on AI    │   │
│  └──────────┘  └──────────┘   │
│                               │
│  ChatGPT  ▓▓▓▓▓▓░░  Claude ▓▓ │  ← platform split, one glance
│                               │
│  ~ small energy today · Low●  │  ← honest, humble, confidence dot
│                               │
│  [ Open dashboard →         ] │  ← primary action
│  Pause tracking · Privacy     │  ← quick controls
└───────────────────────────────┘
```
**Priority order in the popup:** (1) am I being tracked / is it working, (2) today's usage at a glance, (3) a way into the dashboard, (4) instant privacy control. Environmental detail is *deliberately downplayed* here — the popup is for reassurance and access, not analysis.

### 2.3 First-time setup (in popup or welcome tab)
Three taps max: acknowledge what's tracked → choose account or local-only → done. (Detailed in §3.)

### 2.4 Permission explanation
The pre-permission card from §1.5 — the most carefully designed screen in the product. Two-column "see / never touch," plain voice, open-source link, single "Continue" that then triggers Chrome's native prompt.

### 2.5 Active tracking experience
Invisible by design. The only feedback: the icon's subtle tracking accent and a first-session confirmation. Never interrupt the user's actual AI work. "Invisible when unnecessary, transparent when needed" (Master Doc §18).

### 2.6 Quick insights
One line, humble: *"You've used AI 4 times today — a bit more than your daily average."* No verdicts, no alarms. Insight, not judgment.

### 2.7 Dashboard transition
The popup's primary button opens the full dashboard in a new tab with a smooth, calm transition (no jarring reload feel). Context carries over — the dashboard opens on Overview, reflecting the same "today" the popup showed.

---

## 3. Onboarding experience

**Goal: build trust and reach first value fast. Three beats, skippable, no jargon, no fear.**

### Beat 1 — Welcome (mission in one breath)
> **"AI is part of your day. Now you can see it."**
> Carbon Canvas quietly shows you how you use AI — and what it costs the planet — without ever reading your conversations.

Visual: calm, spacious, a single soft cloud-to-landscape motif animating gently. One button: **"Show me how it works."**

### Beat 2 — The privacy promise (the trust core)
A two-column card, the emotional heart of onboarding:

| **We see** ✓ | **We never touch** ✗ |
|---|---|
| Which AI tool (ChatGPT, Claude) | Your prompts |
| How long / how often | The AI's replies |
| The model, if shown | Your files or documents |
| An estimate of activity size | Anything you type |

Caption: *"Everything is processed in your browser. Only these numbers ever leave your device — and you can see the code."*

### Beat 3 — First value setup
"Use AI like you normally do. We'll show you your first insights here." Choose **Create account (sync)** or **Just local (nothing leaves my device)** — both presented as equal, valid choices. Then done.

**Onboarding rules:** ≤3 screens, each ≤2 short sentences, all skippable, zero technical terms ("metadata" → "these numbers"), zero fear ("AI is destroying the planet" → never). The tone is a knowledgeable, calm friend.

---

## 4. Dashboard information architecture

Navigation maps the full product vision but **visually prioritizes MVP sections**; post-MVP items appear as calm "coming soon" or are hidden until built (per PRD scope).

| Section | Purpose | User question answered | Key metrics | Visual presentation | MVP? |
|---|---|---|---|---|---|
| **Overview** | The one-glance home | "What's my AI life right now?" | Sessions, active time, trend, platform split, one energy line | Calm summary cards + one hero trend chart | **MVP** |
| **AI Usage** | Depth on behavior | "How exactly do I use AI?" | Trends over time, platform/model breakdown, session history | Time-series + comparison bars + list | **MVP** |
| **Environmental Impact** | The meaning layer | "What does my usage cost, honestly?" | Energy (range + confidence); carbon/water later | Nature-inspired viz + comparisons + explainer (see §5) | **MVP (energy)** |
| **AI Receipts** | Session-level transparency | "What happened in that session?" | Per-session metadata + estimate + confidence | Receipt cards (see §6) | Post-MVP |
| **Profile** | Identity & journey | "What kind of AI user am I?" | User type, adoption timeline, style | Narrative profile card | Post-MVP |
| **Research / Methodology** | Credibility spine | "Can I trust these numbers?" | Formulas, assumptions, sources, versions, confidence model | Readable research pages, not dense tables | **MVP (lightweight)** |
| **Settings / Privacy** | Control | "How do I stay in control?" | Tracking toggles, export, delete, account | Clear, reversible controls (see §8) | **MVP** |

**IA principles:** Overview answers 90% of curiosity; everything else is opt-in depth. "Simple first, deep second" (Master Doc §13). Methodology is always one tap from any number.

### Dashboard home wireframe (Overview)
```
┌────────────────────────────────────────────────────────────┐
│ Carbon Canvas      Overview  Usage  Impact  Research   ⚙︎    │
├────────────────────────────────────────────────────────────┤
│  Your AI this week                                         │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐                │
│  │ 28        │ │ 3h 42m    │ │ ↑ 18%     │                │
│  │ sessions  │ │ active    │ │ vs last wk│                │
│  └───────────┘ └───────────┘ └───────────┘                │
│                                                            │
│  ┌──────────────── usage trend (hero chart) ───────────┐  │
│  │   calm area/line chart, organic easing              │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  Platform mix     ChatGPT ▓▓▓▓▓▓  Claude ▓▓▓▓             │
│                                                            │
│  ┌── Environmental (calm, humble) ──────────────────────┐ │
│  │  This week ≈ [range] energy   ● Medium confidence     │ │
│  │  About the same as [human comparison]                 │ │
│  │  How was this calculated? →                           │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

---

## 5. AI footprint visualization

**The hardest design problem, because honesty and impact pull in opposite directions** (Strategy Review's small-numbers paradox). The design's job: make a *scientifically humble, often-small* number feel *meaningful and calm* — never inflated, never guilt-inducing.

### 5.1 Guiding decisions
- **Trend and comparison over absolute magnitude.** Humans can't feel "6 grams CO₂." They *can* feel "your AI use grew 20% this month" and "about like [relatable thing]." Lead with those.
- **Human-scaled comparisons, chosen honestly.** e.g., "≈ streaming a few minutes of video," "≈ a phone charge." Comparisons must be accurate and never manipulative (no "= X trees screaming"). Include a "why this comparison?" note.
- **Confidence is always visible** (see §7) — the honesty *is* the feature.
- **Energy first at MVP;** carbon/water added only when they survive review (PRD NFR-9). Don't crowd the view with low-confidence water numbers early.

### 5.2 Nature-inspired visualization (not green cliché)
- **A "living" motif that grows with cumulative usage** — e.g., an abstract landscape or organic form that gains subtle detail as the user's tracked history deepens. This rewards *return visits* (retention) and expresses nature through *growth and time*, not leaf icons.
- **Seasonal/temporal framing** rather than gauges: "your AI spring/summer" as history accumulates — long-term thinking made visual.
- **Palette:** muted earth-and-sky tones (soft slate, warm sand, dawn blue, a single restrained living-green accent) — Apple Health calm, National Geographic restraint. *No* highlighter green, *no* CO₂-cloud clip art.
- **Charts:** soft area/line forms with organic easing; generous whitespace; no dense multi-axis scientific plots on the main view (those live in Methodology for the curious).

### 5.3 Progress systems — carefully
- **Awareness, not gamified guilt.** No streaks-by-default, no "you're worse than average" leaderboards.
- Optional, gentle: personal-trajectory framing ("your efficiency trend"), never competitive shaming. Any comparison to others is opt-in and anonymized.

### 5.4 Educational explanations
Every impact element has a one-tap "what is this?" that teaches in plain language ("When you send a prompt, servers do work; that work uses electricity; here's how we estimate it"). Education over judgment (Master Doc §13).

---

## 6. AI receipt experience

*(Post-MVP per PRD, but designed here so the system is coherent when built.)*

### 6.1 Why receipts exist
To make a single AI session **concrete and trustworthy** — the "financial receipt for your AI use" metaphor. They turn an abstract monthly number into understandable, itemized moments, and they are the clearest place to *show our work* per session. They deepen trust and give the curious user something tactile to explore.

### 6.2 What appears
Session metadata only (never content): date, platform, model-if-known, duration, turn count, estimated activity size, the impact estimate as a range, and the confidence with its reasons. Plus the ever-present "how was this calculated?"

### 6.3 How users interpret & trust them
The receipt format is instantly legible (everyone knows receipts). Showing *confidence and its reasons on every line* signals honesty rather than false authority — a receipt that admits "△ model unknown, so this is an estimate" earns more trust than a confident-looking fake-precise one.

### 6.4 Example receipt design
```
┌──────────────────────────────────┐
│  Carbon Canvas · AI Receipt      │
│  Tuesday, 3:14 PM                │
├──────────────────────────────────┤
│  Platform      Claude            │
│  Model         Claude (Sonnet)   │
│  Duration      18 min            │
│  Turns         12                │
│  Est. activity ~11k–14k tokens   │
├──────────────────────────────────┤
│  Estimated energy   [range]      │
│  Confidence         ● Medium     │
│    ✓ platform known              │
│    ✓ model known                 │
│    △ data-center location unknown│
├──────────────────────────────────┤
│  How was this calculated?  →     │
└──────────────────────────────────┘
```
Tone: neutral, itemized, humble. A calm artifact, not a scorecard.

---

## 7. Confidence score experience — *the core differentiator*

This is where "scientific credibility" becomes a *felt* experience. If we get this right, it's our moat; if we hide it or make it confusing, we've lost the one thing that separates us from every false-precision calculator.

### 7.1 The model (from PRD/Master Doc)
High = 80–100% · Medium = 50–80% · Low = <50%. But **numbers alone confuse** — pair every score with a **color-coded dot + word + a plain reason.**

### 7.2 Visual language
- **A three-level dot system:** ● High (calm confident tone), ● Medium (neutral), ● Low (soft, honest — *not* alarm red; low confidence is normal and okay, not a failure).
- **Never rely on color alone** (accessibility, NFR-8): always dot + label + reason.
- Confidence appears **inline next to every estimate**, everywhere a number lives — Overview, Impact, Receipts.

### 7.3 Communicating uncertainty without confusing
- **Always a range, never a lone number** ("[low]–[high]"), with the point estimate de-emphasized.
- **"Why this confidence?"** expands to a checklist: `✓ platform known · ✓ model known · △ location unknown`. This turns uncertainty into *understanding* rather than doubt.
- **Reframe low confidence positively:** "We're honest when we're guessing" — a low score is proof of integrity, not a bug. Microcopy: *"This is a rough estimate — here's why."*
- **Avoid:** overwhelming users with statistics; making Low feel like an error state; changing the confidence model's meaning across screens.

### 7.4 Where it lives
Inline with every metric; expanded in the transparency panel; itemized in receipts; explained once, thoroughly, in Methodology.

---

## 8. Privacy experience

Privacy is the emotional bedrock. The design must make the promise *felt and verifiable*, delivering: **"We understand your AI usage without reading your private conversations."**

### 8.1 Data permissions
The pre-permission explainer (§1.5, §3 Beat 2) is the primary privacy surface. The "see ✓ / never touch ✗" card reappears in Settings anytime, so the promise is always re-checkable.

### 8.2 Tracking controls
- **Pause tracking** — one tap, obvious, reversible (popup + settings).
- **Per-platform toggles** — track ChatGPT but not Claude, user's choice.
- **Local-only mode** — the strongest proof: "nothing leaves this device," presented as a respected choice, not a downgrade.

### 8.3 Data deletion
- **Delete everything** — prominent, honest, immediate, with plain confirmation ("This removes all your data from our servers and this browser. This can't be undone.") No dark patterns, no guilt-tripping to stay.

### 8.4 Export
- **Export my data** — machine-readable, one click. Ownership made real.

### 8.5 Transparency explanations
- A calm, jargon-free privacy page (not a legal wall) explaining what's collected, why, where it's processed (locally), and a link to the **open-source extension** — the ultimate "don't trust us, verify us."
- Microcopy throughout reinforces it lightly ("Processed in your browser — never stored").

---

## 9. States

Great products are defined by their non-happy states. These carry the brand's calm honesty under stress.

### 9.1 Empty states
- **New user, no data yet:** Not a blank page. A warm "Your AI story starts now — use ChatGPT or Claude and your first insights appear here." Show the empty chart *shape* so the payoff is legible. Frame as anticipation, not absence.
- **No AI usage detected (quiet day):** "No AI sessions today — that's perfectly fine." Never imply they *should* use more (that would betray "never shame," Master Doc §13).
- **No data for a view (e.g., Environmental before enough sessions):** "We need a little more activity to estimate this reliably — check back soon." Ties honesty to confidence philosophy.

### 9.2 Error states
- **Platform not yet supported:** "We don't track [Gemini] yet — it's on our list." Honest about coverage limits (Feasibility §3), never pretending completeness.
- **Tracking failure / adapter down (the common one):** *This is where most products lie; we won't.* If an adapter breaks (selector drift), the kill switch (PRD FR-18) shows: "Tracking for [ChatGPT] is paused while we fix a recent change on their site. Your existing data is safe." **Show honest silence, never fabricated data.** Icon goes muted (§2.1).
- **Sync/connection issue:** "We can't reach your data right now — your tracking is still saved locally and will sync when we reconnect." Reassure, don't alarm.
- **Low-confidence-everywhere degradation:** rather than an error, the confidence system (§7) gracefully communicates "we're estimating loosely right now."

**State design principle:** every non-happy state maintains *calm honesty* — the product would rather admit a limitation than fake a result. This consistency *is* the trust brand.

---

## 10. Design system direction

Benchmark feel: **Apple Health** (calm data, human framing), **Notion** (approachable structure), **Linear** (precision, speed), **Arc** (personality, delight), **Stripe** (trustworthy clarity). Explicitly avoid: generic green ESG, corporate sustainability dashboards, climate-fear aesthetics.

### 10.1 Typography
- **A modern, humanist sans** (e.g., Inter / Geist family feel) — precise but warm. Technology's clarity, not coldness.
- Strong type scale for glanceable hierarchy; generous line-height; numbers get their own tabular, confident treatment (data deserves respect).
- Restraint: few sizes, clear hierarchy — Linear/Stripe discipline.

### 10.2 Layout principles
- **Whitespace as a feature** — space communicates calm and premium (Apple Health). Never dense.
- **Card-based, progressive disclosure** — glance value on top, depth on demand ("simple first, deep second").
- **One hero element per screen** — a single focal insight, not a wall of equal charts.
- Responsive, light/dark from day one (PRD NFR-8).

### 10.3 Component philosophy
- Built on **shadcn/ui + Radix** (PRD stack) for accessibility and speed, *restyled* to the Carbon Canvas soul so it never looks like default shadcn.
- **Confidence and "how calculated" are first-class components**, reusable everywhere a number appears — the honesty system is componentized, not bolted on.
- Consistency over cleverness; every component works in empty, loading, error, and low-confidence variants.

### 10.4 Visual language
- **Palette:** calm neutrals (slate/sand/off-white), a dawn-sky accent, one restrained living-green used *sparingly* as an accent — never the dominant color. Dark mode is first-class and gorgeous.
- **Nature via texture and form**, not iconography: soft gradients evoking sky/horizon, organic shapes, a subtle grain — never literal leaves/globes/trees in the UI chrome (save the rich landscape for brand/marketing moments).
- **Data viz:** soft, rounded, breathing charts (dataviz discipline — accessible in light/dark, color never the only signal).

### 10.5 Animation philosophy
- **Nature's calm, not app-store bounce.** Organic easing (gentle, slightly asymmetric curves), slow reveals, "breathing" idle states. Motion should feel like *weather and growth*, not UI flexing.
- **Purposeful:** animation guides attention and rewards return (the "living" footprint growing) — never decorative noise.
- **Respect reduced-motion** preferences (accessibility).
- Framer Motion (PRD stack), used with restraint.

---

## Final deliverables (as requested)

### D1. UX strategy document
Sections 0–10 above. Anchored on *self-knowledge first, environment as meaning, trust as voice*, and the emotional target of **calm clarity**.

### D2. User flows
- **Onboarding flow:** Discover → Install → Welcome (3 beats) → Pre-permission explainer → Chrome prompt → Account/Local choice → First-session confirmation.
- **Core loop:** Use AI (silent) → icon signal → Popup glance → Dashboard Overview → optional depth (Usage/Impact/Methodology).
- **Trust flow:** Any number → confidence dot → "why?" checklist → Methodology page.
- **Control flow:** Settings → pause / per-platform toggle / export / delete.
- **Breakage flow:** adapter down → muted icon → honest "paused while we fix" state (never fake data).

### D3. Information architecture
The §4 nav map: **Overview · AI Usage · Environmental Impact · (Receipts) · (Profile) · Research/Methodology · Settings/Privacy** — MVP-prioritized, methodology one tap from every metric, Overview answering most curiosity.

### D4. Screen-by-screen descriptions
Provided as wireframes/specs for: extension icon & states (§2.1), popup (§2.2), pre-permission card (§1.5/§2.4), onboarding beats (§3), dashboard Overview (§4), environmental viz (§5), receipt (§6), confidence system (§7), privacy controls (§8), and all empty/error states (§9).

### D5. Design principles (the ten commitments)
1. **Calm over everything** — clarity, never anxiety.
2. **Self-knowledge first**, environment as meaning, not lecture.
3. **Never shame the user** — awareness, not judgment.
4. **Honesty is the feature** — confidence and uncertainty are always visible.
5. **Transparency one tap away** — "how was this calculated?" everywhere.
6. **Privacy felt and verifiable** — see/never-touch, local-only, open-source.
7. **Simple first, deep second** — progressive disclosure.
8. **Nature via motion, space, and metaphor** — never green cliché.
9. **Graceful under stress** — empty/error states stay calm and honest.
10. **Premium restraint** — whitespace, one hero, no noise.

### D6. MVP UX recommendations
- Build only: Overview, AI Usage, lightweight Methodology, Settings/Privacy, and an **energy-only** Environmental panel.
- Nail the **pre-permission explainer** and **onboarding trust card** — highest-leverage screens for adoption.
- Ship **local-only mode** as a first-class choice from day one.
- Componentize **confidence + "how calculated"** first; they touch every number.
- Design **thin-data and breakage states early** — they define first impressions and trust.
- Defer receipts, profile, scores, carbon/water viz, gamification.
- Frame the small energy number with **trend + comparison**, and user-test whether an honest "your footprint is small" still feels valuable (the paradox must be validated in UI).

### D7. Future UX opportunities
- **The "living footprint"** growing richer over time as a signature retention mechanic.
- **AI Receipts** as a delightful, tactile transparency layer.
- **Personal AI Profile** ("what kind of AI user are you?") — high shareability, identity value.
- **Weekly "AI story"** narrative summaries as a calm ritual.
- **Opt-in anonymous comparisons** ("users like you") — done without shame.
- **Seasonal/annual "AI in review"** — long-term-thinking made emotional.
- **Carbon & water layers** once methodology earns them.
- **Cross-device / mobile companion** as usage leaves the browser (addresses the coverage-decay risk long-term).

---

## Closing note

The design succeeds only if it makes a scientifically humble, often-small set of numbers feel **meaningful, trustworthy, and calm** — turning an invisible daily habit into gentle self-understanding. The emotional destination is not guilt and not gamified dopamine; it is the quiet line at the top of this document: *"I finally understand what is happening behind the AI tools I use every day."* Every screen, every state, every animation is in service of that sentence.
