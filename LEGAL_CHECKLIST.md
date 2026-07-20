# Carbon Canvas — Legal & Business Setup Checklist

**Context:** Solo Canadian founder · pre-revenue · privacy-first browser extension (in Chrome Web Store review) + website (live) · no employees yet.
**Status meanings:** ✅ done · 🔲 to do · ⏳ triggered by a future event.

> **This is an organized starting point, not legal advice.** The items marked
> **[lawyer]** are worth an hour of a real Canadian startup lawyer's time —
> many offer free first consultations, and Canadian incubators (e.g., campus
> incubators, Futurpreneur) often have free legal clinics.

---

## Priority 1 — Now (before/at public launch)

### Business registration
- 🔲 **Decide: sole proprietorship vs. incorporation.** You can operate as a sole proprietor today with zero paperwork, but you personally carry all liability. For a product that *handles other people's usage data*, incorporation is the liability shield that matters. Practical rule: **incorporate before the extension has real public users or any revenue.** **[lawyer — or Ownr/similar online incorporation service, ~$300–800]**
- 🔲 **If incorporating, choose federal vs. provincial.** Federal (CBCA) gives Canada-wide name protection and looks standard to future investors; provincial is slightly simpler. Most Canadian startups that intend to raise money go **federal**.
- 🔲 **Register the business name** ("Carbon Canvas" or a numbered company operating as Carbon Canvas). A NUANS name search comes with this.
- 🔲 **Get a CRA Business Number** (comes automatically with incorporation).
- ⏳ **GST/HST registration** — mandatory only once revenue passes $30,000 over four quarters; you can register early voluntarily to claim input tax credits.

### Product legal documents
- ✅ **Privacy policy** — written, published, linked (required by Chrome Web Store and privacy law).
- 🔲 **Terms of Service** — you don't have one yet, and the moment strangers install the extension you want: limitation of liability, "estimates are estimates" disclaimer, acceptable use, governing law (your province), and termination. This is the highest-value missing document. I can draft a starting version for lawyer review.
- 🔲 **Estimates disclaimer language** — one consistent sentence used on the site, store listing, and dashboard: estimates are research-based approximations with stated uncertainty, not measurements. (The product already says this — make it uniform everywhere.)
- 🔲 **Chrome Web Store "Limited Use" compliance statement** — Google's User Data policy requires your listing/policy to affirm that use of collected data complies with their Limited Use requirements. Worth adding one explicit line to the privacy page.

### Environmental-claims compliance (specific to *this* product)
- 🔲 **Know the greenwashing rules.** Canada's Competition Act (post Bill C-59 amendments) now requires environmental claims to be substantiated by "adequate and proper" testing or internationally recognized methodology — with real penalties. The U.S. FTC Green Guides point the same direction. **Carbon Canvas's whole design (ranges, confidence scores, published methodology, "what we don't claim") is exactly the right defensive posture — keep it, and never let marketing copy make a precision claim the methodology page can't back.** Before any paid marketing that makes environmental claims, have the wording checked. **[lawyer, when marketing scales]**

### Practical hygiene
- 🔲 **Separate bank account** for the business (required once incorporated; good discipline even before).
- 🔲 **Domain email** (e.g., hello@carboncanvas.___) to replace the personal Gmail on the privacy page — cleaner, and keeps your personal inbox out of public scrapers. (Google Workspace or similar, ~$8/mo.)
- 🔲 **Simple bookkeeping from day one** — a spreadsheet is fine at this stage; every expense (Vercel, Chrome dev fee, incorporation) is a deductible startup cost.

---

## Priority 2 — Soon (first real users / first dollar)

### Intellectual property
- 🔲 **Trademark search before you fall further in love with the name.** Search CIPO (Canada) and USPTO (US) for "Carbon Canvas" in software classes — conflicts are possible with a name this evocative. Better to know now.
- ⏳ **File trademark** (Canada first, US when you have US users) — classes 9 (software) and 42 (SaaS). Roughly $500–1,000/class with a service, more with a firm. Trigger: name search comes back clean **and** the product has public traction. **[lawyer or trademark agent]**
- 🔲 **Copyright is automatic** — no registration needed for the code/site/docs. But:
- ⏳ **IP assignment to the corporation** — once incorporated, formally assign all the IP you created personally (code, brand, documents) to the company. Standard one-page founder IP assignment. Matters enormously for future fundraising/acquisition. **[lawyer — cheap, do it at incorporation]**
- 🔲 **Pick an open-source license for the extension** — the strategy docs recommend open-sourcing the extension as the privacy trust-proof. Apache-2.0 (patent-safe) or MIT (simplest) are the standard choices. Decide *before* publicizing the repo.
- ✅ **Patents: deliberately skipped for now** — consistent with the master doc's IP strategy (the methodology is open by design; the moat is trust + data, not patents).
- 🔲 **Lock down handles/domains** you care about (site domain, social handles) before the name is visible in the Chrome store.

### Privacy law readiness
- ✅ **Local-only by default, metadata-only, no sale of data** — the architecture already does the heavy lifting for compliance.
- 🔲 **PIPEDA basics (Canada):** your policy already covers most of it; add a named privacy contact (the domain email) and respond to access/deletion requests within 30 days.
- ⏳ **Quebec Law 25** — if you have Quebec users (you will): requires a designated privacy officer (can be you), and privacy-by-default (you already are). Add one line to the policy naming the responsible person. 
- ⏳ **GDPR (EU users arrive automatically via the Chrome store):** your local-first design means minimal exposure, but once *cloud sync* ships you'll want: lawful basis stated (consent), data-processing records, and EU user rights honored (export/delete — already built). Revisit properly when sync launches. **[lawyer at cloud-sync launch]**
- ⏳ **CCPA/CPRA (California):** below the revenue/volume thresholds you're exempt; revisit at scale.

---

## Priority 3 — Later (triggered by growth events)

| Trigger | To do |
|---|---|
| **Hiring the CTO / anyone** | Employment or contractor agreement with **IP assignment + confidentiality** clauses — non-negotiable, before any code is written by them. Founder vesting if they get equity. **[lawyer]** |
| **Advisors** | Simple advisor agreements (e.g., FAST template) with small equity + IP/confidentiality terms. |
| **Cloud sync launches** | Full privacy review (GDPR/Law 25 above), Data Processing Agreements with your hosting providers (Vercel/Supabase publish standard DPAs — sign them), breach-response plan. |
| **First paying customer** | Confirm ToS covers payments/refunds; sales tax registration check. |
| **Enterprise customers** | Their security questionnaires will ask for: insurance (E&O + cyber liability), SOC 2 roadmap, DPAs. Budget for insurance ~$1–3k/yr when this becomes real. |
| **Fundraising** | Clean cap table, IP assignments verified, SAFE or priced-round docs. **[lawyer, always]** |
| **Publishing research / the "index"** | Defamation/accuracy review before publicly ranking named companies' models — rankings of real companies invite legal attention; the confidence-interval approach helps here too. |

---

## The one-week action list (if you do nothing else)

1. **Draft Terms of Service** (I can produce a draft for lawyer review).
2. **Run the free trademark search** on CIPO + USPTO for "Carbon Canvas."
3. **Book one hour with a startup lawyer** about incorporation timing + the ToS draft.
4. **Set up the domain email** and swap it onto the privacy page.
5. **Open the separate bank account** the day incorporation papers arrive.

## Already covered (give yourself credit)

- ✅ Privacy policy written, published, and linkable (Chrome Web Store requirement)
- ✅ Privacy-by-architecture: metadata-only schema, local-first default, export + delete built in
- ✅ Honest-claims posture: ranges, confidence scores, published methodology, explicit "what we don't claim" — your best greenwashing-law defense
- ✅ Chrome Web Store developer registration ($5) — done, extension in review
- ✅ Patents consciously deferred per IP strategy
