<!--
  DRAFT — content-bridge library article. Not yet published.
  Hand to: the library publisher (see publisher-brief.md for wiring + blockers).
  The body below goes inside <article class="article-body" id="post-body">.
  Copy the surrounding chrome (<head> + JSON-LD @graph, nav, breadcrumb, hero,
  footer, scripts) VERBATIM from the exemplar
  library/how-to-tell-if-a-restaurant-tool-is-safe/index.html and swap only the
  values in the "Boilerplate swaps" table at the bottom.
-->

# Front-matter

- **Title:** Privacy-Forward Restaurant Bookkeeping: What a Digital Ledger Should Never Do
- **H1:** Privacy-forward restaurant bookkeeping: what a digital ledger should never do with your numbers
- **Slug (final-forever):** `privacy-forward-restaurant-bookkeeping`  → `library/privacy-forward-restaurant-bookkeeping/index.html`
- **ES slug:** `contabilidad-de-restaurante-con-privacidad` → `es/library/contabilidad-de-restaurante-con-privacidad/index.html`
- **Byline:** The Muntin Desk (JSON-LD `author` references Don Goldstein)
- **Pillars:** `information-security` (primary) + `operations-margin` (secondary)
- **Meta description (≤155):** Privacy-forward restaurant bookkeeping: the five things a digital ledger should never do with your numbers — and how to verify each yourself.
- **Dek:** A digital ledger holds your most sensitive numbers — invoices, prime cost, the supplier list. Here is the line a privacy-forward tool never crosses: the five things it should never do with what you type, and how to verify each one yourself.
- **`data/library-tags.json` entry (blog_posts object):**
  ```json
  "privacy-forward-restaurant-bookkeeping": {
    "topics": ["information-security", "operations-margin"],
    "title": "Privacy-Forward Restaurant Bookkeeping: What a Digital Ledger Should Never Do",
    "dek": "The five things a restaurant's digital ledger should never do with your numbers — and how to verify each one yourself.",
    "date": "2026-05-29",
    "read_min": 10,
    "namespace": "library"
  }
  ```

---

# Article body (inside `#post-body`)

```html
<!-- esl-bridge:start -->
<p class="esl-bridge" style="font-size:14px;color:var(--ink-soft);margin:0 0 24px;padding:0;border-left:2px solid var(--teal);padding-left:12px"><a href="https://muntin.digital/es/library/contabilidad-de-restaurante-con-privacidad/" lang="es" hreflang="es">Leer este art&iacute;culo en espa&ntilde;ol &rarr;</a></p>
<!-- esl-bridge:end -->

<!-- article-tldr:start -->
<aside class="tldr" data-llm="tldr" aria-label="TL;DR">
  <p class="tldr__eyebrow">TL;DR</p>
  <ul class="tldr__list">
    <li>A restaurant&rsquo;s digital ledger holds the most sensitive numbers the business has &mdash; invoices, prime cost, the supplier list, payroll. Privacy-forward bookkeeping starts by treating those numbers as the asset, not the exhaust.</li>
    <li>There are five things a digital ledger should never do with your numbers: resell them, train a model on them, pool them into a benchmark, hold them hostage behind an export wall, or quietly widen who can read them.</li>
    <li>Each of the five has a verification step you can run in a browser, a contract, or an export &mdash; trust is an architecture you can check, not a promise you have to take on faith.</li>
    <li>The same four-tier data model that governs any restaurant tool governs the ledger: invoices and prime cost are Tier 2 and Tier 3 data, and they never flow up a tier to a platform or a benchmark without a contract.</li>
  </ul>
</aside>
<!-- article-tldr:end -->

<p>Privacy-forward restaurant bookkeeping begins with one reframe: the numbers in your ledger are the business, not the byproduct. A restaurant&rsquo;s digital ledger holds the supplier list, the real food cost, the labor line, the margin on every invoice that comes through the back door. That is exactly the data a competitor, a broker, or a model-training pipeline would most like to have. The question that separates a privacy-forward ledger from an extractive one is not how it looks. It is what it does with your numbers the moment you type them.</p>

<p>This is the companion to the tool-safety audit. <a href="/library/how-to-tell-if-a-restaurant-tool-is-safe/">How to tell if a restaurant tool is safe</a> covers the free tool you try once in a browser. A digital ledger is different: it is the tool you live in, the one that stores your numbers on purpose, across months, so you can read them back. The audit framework still applies, but the stakes are higher and the storage is the point. So the standard has to be sharper.</p>

<p>What follows is the line a privacy-forward digital ledger never crosses &mdash; five things it should never do with your numbers, each paired with the way you verify it yourself. Everything below is either generally true of how software handles data or labeled where a figure would be illustrative. The numbers in your ledger are yours; the burden of proof is the tool&rsquo;s.</p>

<h2 id="1-never-resell-or-broker-your-numbers">1. It should never resell or broker your numbers</h2>

<p>A privacy-forward ledger holds only what the engagement names, and brokers none of it. Your invoices, your covers, your prime cost, the email of the regular who left a one-star review &mdash; none of it gets aggregated into a data product, sold to a supplier, or handed to a marketing partner. The ledger is a place your numbers rest, not a supply chain that resells them.</p>

<p>This is the oldest pattern in &ldquo;free&rdquo; business software, and it is the one operators underprice. The reorder data a restaurant generates &mdash; which distributor, what volume, what price, how often &mdash; is commercially valuable to the people selling to that restaurant. A ledger that quietly monetizes it has turned the operator into the product, the same way a free margin audit does &mdash; only now it is doing it every month, with the full ledger, instead of once.</p>

<p>The verification is the contract, read in two places. First, the privacy policy and the data-processing terms: a privacy-forward tool names its sub-processors, states a retention window, and says in plain language that it does not sell or share your data for anyone else&rsquo;s commercial purpose. Second, the network tab: open the ledger, watch what leaves your browser, and confirm the only destinations are the tool&rsquo;s own infrastructure, not a roster of ad networks and data brokers. If the policy hedges and the network is busy, the ledger is brokering. That is the tell.</p>

<figure class="viz-figure article-figure" data-audio-alt="The five things a privacy-forward restaurant digital ledger should never do with your numbers, drawn as a sequence with the verification step beside each. One: never resell or broker your numbers — verify by reading the data-processing terms for a no-sale clause and watching the network tab for broker destinations. Two: never train a model on your invoices — verify by reading the AI or model-training clause and confirming an opt-out that is off by default. Three: never pool your numbers into a shared benchmark without consent — verify that any comparison feature is opt-in and that your raw figures, not just anonymized aggregates, never leave your account. Four: never hold your data hostage behind an export wall — verify by exporting a clean CSV or standard file on a free or trial account before you commit. Five: never quietly widen who can read your numbers — verify the access log and the default sharing scope, which should start closed. Each row pairs a never with a check you can run yourself.">
  <div class="viz-flow reveal">
    <ol class="viz-flow__list">
      <li class="viz-flow__step" data-state="bad" data-tone="rust"><span class="viz-flow__num">1</span><div class="viz-flow__body"><p class="viz-flow__title">Never resell or broker</p><p class="viz-flow__meta">No aggregation into a data product, no sale to suppliers or marketers. <strong>Verify:</strong> a no-sale clause in the data terms; a quiet network tab.</p></div></li>
      <li class="viz-flow__step" data-state="bad" data-tone="rust"><span class="viz-flow__num">2</span><div class="viz-flow__body"><p class="viz-flow__title">Never train a model on your invoices</p><p class="viz-flow__meta">Your numbers are not training data. <strong>Verify:</strong> a model-training clause that is off by default, with an opt-out you control.</p></div></li>
      <li class="viz-flow__step" data-state="bad" data-tone="rust"><span class="viz-flow__num">3</span><div class="viz-flow__body"><p class="viz-flow__title">Never pool into a benchmark without consent</p><p class="viz-flow__meta">Comparison features are opt-in. <strong>Verify:</strong> your raw figures &mdash; not just aggregates &mdash; never leave your account by default.</p></div></li>
      <li class="viz-flow__step" data-state="bad" data-tone="rust"><span class="viz-flow__num">4</span><div class="viz-flow__body"><p class="viz-flow__title">Never hold your data hostage</p><p class="viz-flow__meta">The exit ramp is part of the build. <strong>Verify:</strong> export a clean CSV or standard file on a trial account before you commit.</p></div></li>
      <li class="viz-flow__step" data-state="bad" data-tone="rust"><span class="viz-flow__num">5</span><div class="viz-flow__body"><p class="viz-flow__title">Never quietly widen access</p><p class="viz-flow__meta">Sharing starts closed. <strong>Verify:</strong> the access log names who can read your numbers, and the default scope is your account alone.</p></div></li>
    </ol>
  </div>
  <figcaption>Five nevers, five checks. A privacy-forward ledger lets you verify each one in the terms, the network tab, or the export &mdash; trust you can audit, not trust you have to assume.</figcaption>
</figure>

<h2 id="2-never-train-a-model-on-your-invoices">2. It should never train a model on your invoices without your say-so</h2>

<p>A privacy-forward digital ledger does not feed your numbers into a model as training data without explicit, off-by-default consent. Reading an invoice to extract its line items is one thing &mdash; that is the tool doing its job, once, on your behalf. Retaining your invoices to train a system that other businesses then benefit from is a different deal, and it is one you should have to opt into, never out of.</p>

<p>The distinction matters because the two get blurred on purpose. &ldquo;We use your data to improve our service&rdquo; is a sentence that can mean a bug fix or can mean your supplier pricing is now in a training set. A privacy-forward tool draws the line in writing: extraction is operational and necessary; model training on your content is separate, optional, and dark by default. If the only place the distinction lives is a brochure adjective, treat it as the brochure.</p>

<p>The verification is the model-training clause, read literally. Look for three things: a statement that your documents are not used to train models by default, a named retention window for any original you upload, and a control you can see and toggle &mdash; not a support ticket you have to file. A ledger that reads your invoice and then forgets the original, keeping only the structured numbers you confirmed, is handling your data the way a privacy-forward tool should. The mechanism is the message.</p>

<h2 id="3-never-pool-your-numbers-into-a-benchmark">3. It should never pool your numbers into a shared benchmark without consent</h2>

<p>A privacy-forward restaurant digital ledger never quietly folds your numbers into a pooled benchmark. Industry comparisons are seductive &mdash; every operator wants to know whether their food cost is high for their concept &mdash; but a benchmark is built from real restaurants&rsquo; real numbers, and yours should only join the pool if you said yes. Opt-in, not opt-out. Aggregate, not raw.</p>

<p>The trap is that a benchmark feels like a gift while it is taking inventory of your business. The moment your supplier costs become a row in someone&rsquo;s comparison dataset, they have left your control, and you cannot pull them back. This is the four-tier model from the <a href="/library/how-to-tell-if-a-restaurant-tool-is-safe/#2-the-four-tier-model-what-to-share-where">tool-safety audit</a> applied to bookkeeping: your monthly P&amp;L and food-cost percentage are Tier 3, operational-confidential data; your supplier list and real cost of goods are Tier 2. Neither flows up a tier into a shared benchmark just because the feature exists.</p>

<p>The verification has two parts. First, the default: a privacy-forward ledger ships comparison features off, and turning one on is a deliberate choice with a clear statement of what leaves your account. Second, the shape of what travels: even in an opt-in benchmark, what should leave is an anonymized aggregate, never your raw line items. If a tool&rsquo;s pitch leads with &ldquo;see how you stack up against other restaurants&rdquo; and you never agreed to contribute, your numbers are already in the pool. The honest version of the feature says, plainly, that your data stays yours and the benchmark is something you join, not something done to you.</p>

<figure class="viz-figure article-figure" data-audio-alt="A before-and-after contrast of one line in a restaurant digital ledger's privacy terms, rewritten from extractive to privacy-forward. The before version reads: we may use and share your business data, including invoices and financial figures, with partners and to improve and benchmark our services. That single sentence bundles resale, model training, and pooled benchmarking into a vague grant the operator cannot verify. The after version reads: your invoices and figures stay in your account; we read each document once to extract the numbers you confirm, then we do not train models on it; comparison benchmarks are opt-in and share only anonymized aggregates, never your raw line items; you can export everything as CSV at any time. The rewrite names the mechanism for each promise so the operator can check it rather than trust it. This is illustrative contract language, not a quote from any specific product.">
  <div class="viz-ba reveal">
    <div class="viz-ba__col viz-ba__col--before" data-tone="rust">
      <p class="viz-ba__label">Extractive clause</p>
      <blockquote class="viz-ba__quote">&ldquo;We may use and share your business data, including invoices and financial figures, with partners and to improve and benchmark our services.&rdquo;</blockquote>
      <p class="viz-ba__note">One sentence bundles resale, model training, and pooled benchmarking into a grant you cannot verify or unwind.</p>
    </div>
    <div class="viz-ba__col viz-ba__col--after" data-tone="teal">
      <p class="viz-ba__label">Privacy-forward clause</p>
      <blockquote class="viz-ba__quote">&ldquo;Your invoices and figures stay in your account. We read each document once to extract the numbers you confirm, then do not train models on it. Benchmarks are opt-in and share only anonymized aggregates &mdash; never your raw line items. Export everything as CSV anytime.&rdquo;</blockquote>
      <p class="viz-ba__note">Each promise names the mechanism behind it, so you can check it instead of trusting it.</p>
    </div>
  </div>
  <figcaption>The same data clause, extractive and privacy-forward. The privacy-forward version is longer because it names a mechanism for every promise &mdash; illustrative contract language, not a quote from any product.</figcaption>
</figure>

<h2 id="4-never-hold-your-data-hostage">4. It should never hold your numbers hostage behind an export wall</h2>

<p>A privacy-forward digital ledger treats the exit ramp as part of the build. Your numbers go in, and they come back out in a clean, standard format whenever you ask &mdash; a CSV, a documented schema, a file your accountant or the next tool can read. Data you cannot export is data you do not really control; it is leverage the vendor holds over you, repriced at renewal.</p>

<p>Lock-in by export wall is quieter than resale, and it compounds. A ledger that makes it trivial to get your data in and painful to get it out is betting that the cost of leaving rises faster than your patience. The privacy-forward posture is the opposite: the day you decide to leave, you take everything, with no &ldquo;migration package&rdquo; line item and no proprietary format that only the vendor can open. This is the same promise the studio behind this library keeps in writing &mdash; see <a href="/never/">what this studio never does</a>, where &ldquo;never lock you in&rdquo; is the first line.</p>

<p>The verification is the cheapest one on this list: export before you commit. On a free tier or a trial, put in a few invoices and pull them back out. A privacy-forward ledger hands you a CSV you can open in a spreadsheet, with your line items intact and a schema your bookkeeper recognizes. A tool that buries export three menus deep, gates it behind a paid plan, or returns a format nothing else can read is telling you what leaving will cost &mdash; before you have even arrived.</p>

<h2 id="5-never-quietly-widen-who-can-read-your-numbers">5. It should never quietly widen who can read your numbers</h2>

<p>A privacy-forward restaurant digital ledger starts access closed and changes it only when you say so, visibly. Who can read your numbers should be a setting you control and an event you can see in a log &mdash; not a default that drifts wider with each feature release, and not a sharing scope that a new integration silently expands. The principle from the four-tier model holds: data never flows up a tier to a wider audience without a deliberate decision.</p>

<p>This is where a ledger quietly betrays the operator most often, because access creep does not feel like a breach. A new &ldquo;team&rdquo; feature defaults to sharing the whole ledger. An accountant integration gets read access to everything instead of the one report it needs. A support tool can see your originals. None of it is malicious; all of it widens the circle of people who can read your most sensitive numbers, one convenient default at a time. Across years on restaurant floors I have watched the same drift happen with shared spreadsheets &mdash; the file that started with two readers and ended with the whole staff and a former vendor still on the share list.</p>

<p>The verification is the access log and the default scope. A privacy-forward ledger can show you who has read or changed what, and a privacy-forward integration asks for the narrowest access that does the job &mdash; not blanket read on the whole account. Check the default when you add a teammate or connect a tool: does it share everything, or the minimum. Tier 4 data &mdash; anything regulated, like an EIN or payroll detail &mdash; should sit behind the tightest access of all, with a log that records every look. If the tool cannot tell you who can see your numbers, the honest answer is that you do not know.</p>

<figure class="viz-figure article-figure" data-audio-alt="A decision tree for choosing a restaurant digital ledger on privacy grounds, walking the operator from the top question down to a verdict. Start: does the tool's data-processing terms include a plain no-sale, no-broker clause? If no, stop — it fails the first never; walk away. If yes, ask: is model training on your documents off by default with a visible opt-out? If no, treat the tool as a training pipeline and walk away. If yes, ask: are comparison benchmarks opt-in, sharing only anonymized aggregates? If no, your raw numbers are being pooled; walk away. If yes, ask: can you export a clean CSV on a free or trial account right now? If no, it is an export wall; walk away. If yes, ask: does access start closed, with a log of who can read your numbers? If no, access will creep wider quietly; proceed only with caution. If yes to all five, the ledger is privacy-forward and you can verify each promise yourself. Any single no ends the evaluation, the same logic as the tool-safety audit.">
  <div class="viz-tree reveal">
    <ul class="viz-tree__list">
      <li class="viz-tree__node" data-tone="teal"><p class="viz-tree__q">No-sale, no-broker clause in the data terms?</p><p class="viz-tree__a"><strong>No &rarr;</strong> fails the first never. Walk away.</p></li>
      <li class="viz-tree__node" data-tone="teal"><p class="viz-tree__q">Model training off by default, with a visible opt-out?</p><p class="viz-tree__a"><strong>No &rarr;</strong> treat it as a training pipeline. Walk away.</p></li>
      <li class="viz-tree__node" data-tone="teal"><p class="viz-tree__q">Benchmarks opt-in, sharing only anonymized aggregates?</p><p class="viz-tree__a"><strong>No &rarr;</strong> your raw numbers are being pooled. Walk away.</p></li>
      <li class="viz-tree__node" data-tone="teal"><p class="viz-tree__q">Clean CSV export on a free or trial account, right now?</p><p class="viz-tree__a"><strong>No &rarr;</strong> it is an export wall. Walk away.</p></li>
      <li class="viz-tree__node" data-tone="teal"><p class="viz-tree__q">Access starts closed, with a log of who can read?</p><p class="viz-tree__a"><strong>No &rarr;</strong> access will creep wider quietly. Proceed only with caution.</p></li>
      <li class="viz-tree__node viz-tree__node--leaf" data-tone="teal"><p class="viz-tree__q">Five yeses?</p><p class="viz-tree__a"><strong>The ledger is privacy-forward &mdash; and you can prove it yourself.</strong></p></li>
    </ul>
  </div>
  <figcaption>The privacy-forward ledger decision tree. Any single no ends the evaluation &mdash; the same any-failure-stops logic as the tool-safety audit, pointed at the tool you live in instead of the one you try once.</figcaption>
</figure>

<h2 id="6-the-privacy-forward-ledger-in-practice">6. What a privacy-forward ledger looks like in practice</h2>

<p>A privacy-forward digital ledger is one where every promise on this page is a mechanism you can check, not an adjective you have to believe. It reads your invoice once and keeps the numbers you confirm; it does not sell, broker, or train on your data; benchmarks are something you opt into; export is a CSV away; and access starts closed with a log. The pattern is verifiable trust, end to end.</p>

<p>That standard is exactly why the studio behind this library built one. <a href="https://ledger.muntin.digital">Muntin Ledger</a> is the privacy-forward extension of the same posture the free tools take: it reads a vendor invoice to extract the line items, files them in a ledger you can search across devices, and lets you export a clean CSV or post to your existing books when you are ready. Originals can be locked so only your recovery phrase reopens them; the data terms name the sub-processors and the retention window; and the promises are published claim by claim, the way <a href="/never/">the studio&rsquo;s never page</a> publishes the studio&rsquo;s. It is not the only way to keep a ledger. It is what it looks like when the five nevers are the spec.</p>

<p>Whatever you choose, choose it the same way you would audit any tool that touches your numbers: read the terms, watch the network, run the export, check the access log. A digital ledger holds the data that is hardest to get back once it leaves. The operator who treats their numbers as the asset &mdash; and the tool as something that has to earn the right to hold them &mdash; is the one who still owns those numbers a year from now.</p>

<!-- article-takeaways:start -->
<aside class="key-takeaways" data-llm="takeaways" aria-label="Key takeaways">
  <p class="key-takeaways__eyebrow">Key takeaways</p>
  <ul class="key-takeaways__list">
    <li>Treat the numbers in your ledger as the asset, not the exhaust. A privacy-forward tool earns the right to hold them.</li>
    <li>Five nevers: no resale, no model training without consent, no pooled benchmark without consent, no export wall, no quiet access creep.</li>
    <li>Each never has a check &mdash; the data terms, the network tab, the model-training clause, a trial export, the access log.</li>
    <li>Invoices and prime cost are Tier 2 and Tier 3 data. They never flow up a tier to a platform or benchmark without a contract.</li>
    <li>Trust is an architecture you can verify, not a promise you take on faith. If the only proof is the brochure, treat it as the brochure.</li>
  </ul>
</aside>
<!-- article-takeaways:end -->

<!-- field-notes:start --><!-- field-notes:end -->
<!-- post-end-cta:start -->
<aside class="post-end-cta" aria-label="Workshop next step">
  <p class="post-end-cta-headline">Audit the ledger you use now against the five nevers.</p>
  <p class="post-end-cta-body">Open your current bookkeeping tool. Read its data-processing terms for a no-sale clause, watch the network tab while you work, and try to export a clean CSV. Walk the decision tree above and see where your tool stops.</p>
  <a class="btn btn-primary" href="/learn/checklists/audit-any-tool/?from=library%2Fprivacy-forward-restaurant-bookkeeping">Open the audit checklist<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg></a>
</aside>
<!-- post-end-cta:end -->

<!-- smart-next:start -->
<aside class="smart-next" aria-labelledby="smart-next-h">
  <p class="smart-next__eyebrow" id="smart-next-h">What to do next</p>
  <ol class="smart-next__list">
    <li class="smart-next__item smart-next__read"><span class="smart-next__verb">Read:</span> <a href="/glossary/margin/">the related glossary term &rarr;</a></li>
    <li class="smart-next__item smart-next__try"><span class="smart-next__verb">Try:</span> <a href="/library/how-to-tell-if-a-restaurant-tool-is-safe/">the 5-test tool-safety audit &rarr;</a></li>
    <li class="smart-next__item smart-next__note"><span class="smart-next__verb">Or send Don a note:</span> <a href="/window/?topic=privacy-forward-restaurant-bookkeeping">The Window &rarr;</a></li>
  </ol>
</aside>
<!-- smart-next:end -->
```

After `smart-next`, close the body with the **post-end-mark, see-also, sources, and
author-card** blocks copied structurally from the exemplar.

## Sources section (name-only `<details class="cite">` drawers — no deep links, per the fact gate)

```html
<section class="sources" aria-labelledby="sources-heading">
  <p class="sources-label" id="sources-heading">Sources &amp; further reading</p>
  <details class="cite">
    <summary>NIST data classification frameworks</summary>
    <div class="cite-body"><p><span class="cite-source">NIST</span> &mdash; The four-tier data model (Public / Competitive-sensitive / Operational / Regulated) is an operator-friendly framing of NIST SP 800-60&rsquo;s federal data-classification approach. The vocabulary differs; the principle &mdash; data never flows up a tier without a contract &mdash; is the same.</p></div>
  </details>
  <details class="cite">
    <summary>GDPR / data-processing principles — purpose limitation &amp; data portability</summary>
    <div class="cite-body"><p><span class="cite-source">EU GDPR principles</span> &mdash; &ldquo;Never train without consent&rdquo; and &ldquo;never repurpose beyond the stated use&rdquo; track the purpose-limitation principle; &ldquo;never hold your data hostage&rdquo; tracks the data-portability right. Cited as widely-adopted principles, not as legal advice.</p></div>
  </details>
  <details class="cite">
    <summary>OWASP — client-side data exposure</summary>
    <div class="cite-body"><p><span class="cite-source">OWASP</span> &mdash; The network-tab verification (watch what leaves your browser, and to where) rests on OWASP&rsquo;s guidance that any data reachable by third-party origins should be treated as exposed.</p></div>
  </details>
</section>
```

## See-also (3 cards, real internal targets — reuse the exemplar's `see-also-card` markup)
- `/library/how-to-tell-if-a-restaurant-tool-is-safe/` (Article — the companion audit)
- `/tools/cost-pulse/` (Tool — "your data only, no pooled benchmarks")
- `/never/` (the studio trust page)

---

# Boilerplate swaps (everything outside `#post-body` — copy from the exemplar, change only these)

| Element | New value |
|---|---|
| `<title>` | `Privacy-Forward Restaurant Bookkeeping: What a Digital Ledger Should Never Do \| Muntin Digital` (trim to ≤60 rendered) |
| `<meta name="description">` | the ≤155 string in the front-matter |
| `<link rel="canonical">` + all hreflang/`og:url` | `https://muntin.digital/library/privacy-forward-restaurant-bookkeeping/` |
| `es` hreflang + lang-switch + esl-bridge + lang-hint | `https://muntin.digital/es/library/contabilidad-de-restaurante-con-privacidad/` |
| JSON-LD `@graph` `headline` / `@id` / `url` / `name` / `mainEntityOfPage` / `audio` `@id` / `contentUrl` | swap slug; `author` stays the Muntin Desk Organization block (Don is the human in the author card) |
| `datePublished` / `article:published_time` | `2026-05-29` |
| `dateModified` | publish date |
| `article:section` | `Information Security` |
| `article:tag` | `Data privacy`, `Bookkeeping`, `Operator security` |
| `og:image` | `/brand/og/library-privacy-forward-bookkeeping.png` — **must be produced (see b-landing-brief.md); do not ship a 404 path** |
| `<!-- article-abstract-mentions … -->` `mentions[]` | `/glossary/margin/`, `/glossary/food-cost/` (both exist; linked in-body via build-library autolinks) |
| breadcrumb leaf | `Privacy-forward bookkeeping` |
| listen-btn `data-audio-src` | rendered MP3 (see audio blocker in publisher-brief.md) |

---

# Flagged for the publisher
- **No invented numbers, cohorts, restaurant names, or deep-link URLs** appear in this draft. The Sources drawers cite NIST / GDPR-principles / OWASP **by name only** (no deep links) — this satisfies the fact gate without a `sourced-claims.json` entry.
- The §5 operator anecdote has been **recast non-numerically** ("Across years on restaurant floors…") so it can't conflict with the registered operator bio or trip the fact gate. Restore a specific figure only if it matches the registered claim.
- The `viz-ba` figure is **explicitly labeled illustrative contract language** ("not a quote from any product") in both its `data-audio-alt` and figcaption — keep that labeling in the ES translation and the audio script.
