#!/usr/bin/env node
/**
 * build-open-recalls-page.mjs — generate open/recalls/index.html, "The Recall Record" explorer
 * (spec-corpus-explorers.md §1.2). Reads the CC-BY by-ingredient recall index + the CC0 raw feed and
 * emits a standalone /open explorer page authored against open/landings/index.html's shell.
 *
 * HONESTY (ADR-011/ADR-015): a dated, documented FDA food recall surfaced ON ITS OWN — co-occurrence,
 * never a cause, never a magnitude, NEVER joined to a price. There is NO price token anywhere on this
 * page (asserted at build). The slug tag is a whole-word product-text match, not a supply or price link.
 * The honest headline is DISTINCT EVENTS (event_id), not raw notices. FDA-regulated foods only —
 * USDA/FSIS meat, poultry, and egg recalls are structurally absent.
 *
 *   node scripts/build-open-recalls-page.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'open/recalls/index.html';
const IDX = 'cost-index/food-recalls-by-ingredient.json';
const RAW = 'data/food-recalls.json';
const ISR = 'cost-index/ingredient-state-record.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));

// Neutral, no-price framing string — reused verbatim in the mast, the footer schema note, and the gate.
const FRAMING = 'A documented food-safety record surfaced on its own — a whole-word text match on the product, not a supply or price link. Co-occurrence, never a cause, never a magnitude, never joined to a price.';

function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function clsShare(ci, events) { return events > 0 ? Math.round((ci / events) * 100) : 0; }

// ---- derive the page model from the three inputs ------------------------------------------------
function model() {
  const idx = rd(IDX);
  const raw = (rd(RAW).recalls) || [];
  const isr = rd(ISR);
  const trackedTotal = (isr.ingredients || isr).length;
  const asOf = raw.reduce((m, r) => (r.report_date && r.report_date > m ? r.report_date : m), '');
  // biggest single event by notice count (for the correctly-dated onion aha) — from the raw CC0 feed
  const byEv = {};
  for (const r of raw) {
    const ev = r.event_id || `_${r.recall_number}`;
    const g = byEv[ev] || (byEv[ev] = { event_id: r.event_id || null, n: 0, date: null, firm: r.firm, classI: false, slugs: new Set() });
    g.n++;
    if (r.report_date && (!g.date || r.report_date < g.date)) g.date = r.report_date; // earliest notice in the event
    if (r.classification === 'Class I') g.classI = true;
    for (const s of (r.slugs || [])) g.slugs.add(s);
  }
  const biggest = Object.values(byEv).sort((a, b) => b.n - a.n)[0];
  const rows = Object.values(idx.index)
    .map((e) => ({ slug: e.slug, n: e.n, events: e.events, ci: e.class_i_events, cii: e.class_ii_events, ciii: e.class_iii_events, share: clsShare(e.class_i_events, e.events), latest: e.latest, order_key: e.order_key, recent: e.recent }))
    .sort((a, b) => String(b.order_key).localeCompare(String(a.order_key)) || b.events - a.events || a.slug.localeCompare(b.slug));
  return { summary: idx.summary, trackedTotal, asOf, biggest, rows, license: idx.license };
}

// pretty ingredient label from slug (title-case, keep it plain — no data invented)
function label(slug) { return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }

// ---- the page ------------------------------------------------------------------------------------
function page(m) {
  const s = m.summary;
  const title = 'The Recall Record — FDA Food Recalls, Tagged to Tracked Ingredients';
  const desc = 'Dated FDA food recalls tagged to the ingredients named in the product text — co-occurrence, never a cause, never joined to a price.';
  // server-rendered table rows (the no-JS source of record) — 96 ingredients, most-recent-Class-I first
  const tbody = m.rows.map((r) => `          <tr><td class="l"><button type="button" data-id="${esc(r.slug)}">${esc(label(r.slug))}</button></td><td class="mono">${r.events}</td><td class="mono">${r.n}</td><td class="mono">${r.ci}</td><td class="mono">${r.share}%</td><td class="mono">${esc(r.latest || '—')}</td></tr>`).join('\n');
  // the data island — no price fields exist in the index; carry only the documented recall record
  const data = {
    meta: {
      dataset: 'Muntin Cost Index — FDA food recalls tagged to tracked ingredients',
      raw_url: 'https://muntin.digital/data/food-recalls.json',
      csv_url: 'https://muntin.digital/cost-index/food-recalls.csv',
      derived_url: 'https://muntin.digital/cost-index/food-recalls-by-ingredient.json',
      catalog_url: 'https://muntin.digital/open/',
      license_raw: 'CC0 1.0', license_derived: 'CC BY 4.0',
      note: FRAMING,
      as_of: m.asOf, since: '2020-01-01',
      recalls: s.recalls, tagged_ingredients: s.tagged_ingredients, tracked_total: m.trackedTotal,
      distinct_events: s.distinct_events, class_i_recalls: s.class_i_recalls, ongoing: s.ongoing,
    },
    biggest: { event_id: m.biggest.event_id, notices: m.biggest.n, date: m.biggest.date, firm: m.biggest.firm, class_i: m.biggest.classI },
    rows: m.rows.map((r) => ({ slug: r.slug, label: label(r.slug), n: r.n, events: r.events, class_i_events: r.ci, class_ii_events: r.cii, class_iii_events: r.ciii, share: r.share, latest: r.latest, recent: r.recent })),
  };
  const dataJson = JSON.stringify(data);

  const breadcrumb = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://muntin.digital/' },
    { '@type': 'ListItem', position: 2, name: 'Open data', item: 'https://muntin.digital/open/' },
    { '@type': 'ListItem', position: 3, name: 'The Recall Record', item: 'https://muntin.digital/open/recalls/' },
  ] });
  const dataset = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Dataset',
    name: 'FDA food recalls tagged to tracked ingredients',
    description: 'openFDA Food Enforcement recalls since 2020 whose product text names a tracked ingredient, indexed per ingredient by distinct recall events and FDA severity class. Co-occurrence, never a cause, never joined to a price.',
    url: 'https://muntin.digital/open/recalls/',
    creator: { '@type': 'Organization', name: 'Muntin Cost Index', url: 'https://muntin.digital/' },
    isBasedOn: { '@type': 'Dataset', name: 'openFDA Food Enforcement', creator: { '@type': 'GovernmentOrganization', name: 'US Food and Drug Administration' } },
    license: CCBY,
    temporalCoverage: `2020-01-01/${m.asOf}`,
    spatialCoverage: { '@type': 'Place', name: 'United States' },
    keywords: ['food recalls', 'openFDA', 'food safety', 'FDA enforcement', 'co-occurrence'],
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'recall_notices', description: 'Count of recall notices tagged to the ingredient — notices, not situations; never sum across ingredients.' },
      { '@type': 'PropertyValue', name: 'distinct_events', description: 'Count of distinct recall events (event_id) — the honest headline count, not the notice count.' },
      { '@type': 'PropertyValue', name: 'class_i_events', description: 'Distinct recall events whose most-severe FDA class is Class I. Documented recall events, never a price or volume.' },
    ],
    distribution: [
      { '@type': 'DataDownload', name: 'Raw recall rows (CC0)', encodingFormat: 'text/csv', contentUrl: 'https://muntin.digital/cost-index/food-recalls.csv', license: CC0 },
      { '@type': 'DataDownload', name: 'By-ingredient index (CC-BY 4.0)', encodingFormat: 'application/json', contentUrl: 'https://muntin.digital/cost-index/food-recalls-by-ingredient.json', license: CCBY },
    ],
  });

  return `${HEAD(title, desc, breadcrumb)}${STYLE}

<div class="wrap">
<body>
<a class="skip-link" href="#main">Skip to content</a>
<!-- batch-banner:start --><!-- batch-banner:end -->
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="/" class="logo" aria-label="Muntin Digital">
      <img class="logo-mark" src="/brand/mark/mark-square-ink.svg" alt="" width="36" height="36" />
      <span class="logo-text">Muntin Digital</span>
    </a>
    <nav class="nav-links" aria-label="Primary"><a href="/open/">Open data</a><a href="/cost-index/">Cost Index</a></nav>
  </div>
</header>
<header class="mast">
  <div class="mast-top">
    <div>
      <p class="kick">
        <span>Muntin Open Data · Explorer</span>
        <span class="lic" data-lic="cc0" role="img" aria-label="Raw recall rows are Creative Commons Zero, public domain">CC0 raw</span>
        <span class="lic" data-lic="cc-by" role="img" aria-label="The by-ingredient index is Creative Commons Attribution 4.0">CC-BY derived</span>
      </p>
      <h1>The Recall Record</h1>
    </div>
    <button class="themebtn" id="themeBtn" aria-label="Switch color theme" title="Switch light / dark theme">◐</button>
    <span id="themeLive" class="sr-only" role="status" aria-live="polite"></span>
  </div>
  <p class="lede">Dated FDA food recalls, tagged to the ingredients whose names appear in the recalled product's text. A documented food-safety record — surfaced on its own, <b>never joined to a price</b>, <b>never a cause</b>, never a magnitude. The tag is a whole-word product-text match, not a sourcing signal. FDA-regulated foods only. No prices appear on this page.<span class="honest" style="margin-top:8px">The honest headline is distinct recall <em>events</em>, not the raw notice count: one firm recalling seventy lots in a single event is one event, not seventy shocks. A whole-word text match on the product, not a supply or price link.</span></p>
</header>

<main id="main">

  <section class="panel rc-lane" aria-label="How to read this page">
    <p style="margin:0"><b>A food-safety and supplier-diligence lane.</b> Every recall here is a dated, documented FDA action shown as co-occurrence — <b>never a cause</b>, never a magnitude, and <b>never joined to a price</b>. There is no price anywhere on this page. The slug tag is a whole-word text match on the product, not a supply or price link.</p>
  </section>

  <h2>The documented record, at a glance</h2>
  <p class="beat-sub">Counts of documented recall actions since 2020 — a food-safety record, <b>documented recall events, never a price or volume</b>.</p>
  <div class="statgrid">
    <div class="stat"><div class="k">Recall notices</div><div class="v mono">${s.recalls}</div><div class="honest" data-audio-alt="A documented recall count, not a supply or price measure: ${s.recalls} FDA food-recall notices since 2020 name a tracked ingredient in their product text.">since 2020, naming a tracked ingredient</div></div>
    <div class="stat"><div class="k">Tracked ingredients hit</div><div class="v mono">${s.tagged_ingredients} / ${m.trackedTotal}</div><div class="honest" data-audio-alt="A documented recall count, not a supply or price measure: ${s.tagged_ingredients} of the ${m.trackedTotal} tracked ingredients appear in at least one recalled product's text.">of the tracked ingredients appear ≥1×</div></div>
    <div class="stat"><div class="k">Class-I recalls (deduped)</div><div class="v mono">${s.class_i_recalls}</div><div class="honest" data-audio-alt="A documented recall count, not a supply or price measure: ${s.class_i_recalls} distinct Class-I recall notices, deduped by recall number, the most-severe FDA class.">distinct notices, most-severe FDA class</div></div>
    <div class="stat"><div class="k">Ongoing</div><div class="v mono">${s.ongoing}</div><div class="honest" data-audio-alt="A documented recall count, not a supply or price measure: ${s.ongoing} of the deduped recalls are still marked Ongoing as of ${esc(m.asOf)}.">still marked Ongoing, as of ${esc(m.asOf)}</div></div>
  </div>

  <h2>Every tagged ingredient, as data</h2>
  <p class="nojs-note">This table is the source of record — it works with no JavaScript, and the chart below is an enhancement of it. Column headers sort; the ingredient name opens its recent-recall detail. <b>Documented recall events, never a price or volume.</b></p>
  <div class="tablewrap">
    <table class="data" id="tbl">
      <caption>FDA food recalls per tracked ingredient since 2020, most-recent Class-I event first. <b>Events</b> = distinct recall events (<code>event_id</code>) — the honest count. <b>Notices</b> = raw recall notices, not situations; never sum across ingredients (${s.recalls} recalls carry ${s.total_tags} tags). <b>Class-I events</b> = distinct events whose most-severe class is Class I.</caption>
      <thead>
        <tr>
          <th scope="col" class="l sortable" aria-sort="none" data-k="label"><button type="button">Ingredient <span class="sortglyph" aria-hidden="true">↕</span></button></th>
          <th scope="col" class="sortable" aria-sort="none" data-k="events"><button type="button">Documented events <span class="sortglyph" aria-hidden="true">↕</span></button></th>
          <th scope="col" class="sortable" aria-sort="none" data-k="n"><button type="button">Recall notices <span class="sortglyph" aria-hidden="true">↕</span></button></th>
          <th scope="col" class="sortable" aria-sort="none" data-k="ci"><button type="button">Class-I events <span class="sortglyph" aria-hidden="true">↕</span></button></th>
          <th scope="col" class="sortable" aria-sort="none" data-k="share"><button type="button">Class-I share <span class="sortglyph" aria-hidden="true">↕</span></button></th>
          <th scope="col" class="sortable" aria-sort="descending" data-k="order_key"><button type="button">Latest documented <span class="sortglyph" aria-hidden="true">▼</span></button></th>
        </tr>
      </thead>
      <tbody id="tbody">
${tbody}
      </tbody>
    </table>
  </div>
  <p class="honest">Notices are not situations: a single recall event can span dozens of lot-level notices. Variant slugs (e.g. shrimp / shrimp-pd / shrimp-head-on) count the same product family more than once. Never sum a column across ingredients.</p>

  <h2>Recall events by severity class</h2>
  <p class="beat-sub">For the sixteen ingredients with the most distinct recall events, the mix of those <b>distinct events</b> by FDA severity class — Class I (most severe), II, III. This stacks real per-class distinct events, never notice counts, and carries no price and no second axis.</p>
  <figure class="panel">
    <div class="legend" aria-hidden="true">
      <span class="sw"><span class="rc-box rc-i"></span> Class I events</span>
      <span class="sw"><span class="rc-box rc-ii"></span> Class II events</span>
      <span class="sw"><span class="rc-box rc-iii"></span> Class III events</span>
    </div>
    <div class="rc-scroll">
      <svg id="bars" role="img" width="960" aria-labelledby="bars-t bars-d">
        <title id="bars-t">Distinct recall events by FDA severity class, for the sixteen most-recalled tracked ingredients.</title>
        <desc id="bars-d">A horizontal stacked bar per ingredient, showing its count of distinct recall events split into Class I, Class II and Class III. Onion, cucumber and the shrimp family carry the most distinct events; onion's are overwhelmingly Class I. These are documented recall events, never a price or volume, shown as co-occurrence and never a cause.</desc>
      </svg>
    </div>
    <figcaption class="honest" data-audio-alt="Distinct recall events by FDA severity class for the sixteen most-recalled tracked ingredients, stacked Class I, II and III — documented recall events, never a price or a volume.">Distinct recall events by class — a food-safety record, <b>documented recall events, never a price or volume</b>.</figcaption>
  </figure>

  <!-- detail view (island only) -->
  <section id="detail" aria-label="Recent recalls for the selected ingredient">
    <div class="detail-head">
      <button class="backbtn" id="backBtn" type="button">← All ingredients</button>
    </div>
    <h2 id="detailTitle" style="margin-top:14px"></h2>
    <p class="honest" id="detailSub"></p>
    <div id="detailList"></div>
  </section>

  <section class="panel rc-lookup" aria-label="Reference lookup">
    <h2 style="margin-top:0">Look up an ingredient in the Cost Index</h2>
    <p class="beat-sub" style="margin-bottom:10px">A reference lookup, not a consequence — a recall is never a price signal. Open any tracked ingredient's price-history page in the Cost Index.</p>
    <div class="controls">
      <div class="search">
        <label class="sr-only" for="lk">Choose an ingredient to open in the Cost Index</label>
        <input id="lk" list="lk-list" type="text" placeholder="Type an ingredient (onion, cucumber, shrimp…)" autocomplete="off">
        <datalist id="lk-list"></datalist>
      </div>
      <button class="dl" id="lkGo" type="button">Open in the Cost Index →</button>
    </div>
    <p class="honest" style="margin-top:8px">No JavaScript? Browse every tracked ingredient at <a href="/cost-index/">the Cost Index index →</a></p>
  </section>

  <p class="aha" id="aha">The single largest recall event on record here — <span class="mono">event ${esc(m.biggest.event_id)}</span>, first reported <span class="mono">${esc(m.biggest.date)}</span> (${esc(m.biggest.firm)}) — spans roughly <b>${m.biggest.n} recall notices</b> across onion and its neighbors. One event, ${m.biggest.n} notices: exactly why this page counts distinct events, not notices.
    <span class="honest" style="display:block;margin-top:6px">A documented Class-I recall event, shown as co-occurrence — never a cause, never a magnitude, never joined to a price.</span>
  </p>

  <h2>What this can't tell you</h2>
  <section class="panel">
    <ul style="margin:0;padding-left:20px;line-height:1.7">
      <li><b>Notices are not events.</b> The notice count is lot-level paperwork; a single situation can be dozens of notices. Lead with distinct events.</li>
      <li><b>Never sum across ingredients.</b> ${s.recalls} recalls carry ${s.total_tags} ingredient tags — one recall can name several ingredients.</li>
      <li><b>Variant slugs triple-count.</b> shrimp / shrimp-pd / shrimp-head-on are the same product family listed under separate tracked slugs.</li>
      <li><b>The matcher is text, not sourcing.</b> A whole-word product-text match pulls in composite and store-brand products that merely name the ingredient — the tag is not a supply or price link.</li>
      <li><b>FDA jurisdiction only.</b> These are <b>FDA-regulated foods only</b>; USDA/FSIS meat, poultry and egg recalls are structurally absent, so the lane is not complete.</li>
      <li><b>A record, not a forecast.</b> Every row is a documented past action; nothing here predicts a future recall — and nothing here is a price.</li>
    </ul>
  </section>

  <footer class="prov">
    <h2>Provenance &amp; license</h2>
    <div class="provgrid">
      <div><b>Raw record · CC0</b><br>openFDA Food Enforcement (US FDA), public domain. <a href="/data/food-recalls.json">data/food-recalls.json</a> · <a href="/cost-index/food-recalls.csv">food-recalls.csv</a></div>
      <div><b>By-ingredient index · CC-BY 4.0</b><br>Compiled onto Muntin's tracked-ingredient taxonomy. <a href="/cost-index/food-recalls-by-ingredient.json">food-recalls-by-ingredient.json</a></div>
      <div><b>What this is</b><br>${esc(FRAMING)}</div>
      <div><b>Catalog</b><br><a href="/open/">Full open-data catalog →</a></div>
    </div>
  </footer>

</main>

<script type="application/ld+json">${dataset}</script>
<script type="application/json" id="recalls-data">${dataJson}</script>
<script>
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("recalls-data").textContent);
  var ROWS = DATA.rows, META = DATA.meta;
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function el(tag,attrs,txt){ var e=document.createElementNS("http://www.w3.org/2000/svg",tag); if(attrs) for(var k in attrs) e.setAttribute(k,attrs[k]); if(txt!=null) e.textContent=txt; return e; }
  function clearDraw(svg){ var k=[].slice.call(svg.childNodes); for(var i=0;i<k.length;i++){ var t=k[i].tagName; if(t!=="title"&&t!=="desc") svg.removeChild(k[i]); } }

  // ---------- sortable table ----------
  var tbody=document.getElementById("tbody");
  var sortState={k:"order_key",dir:-1};
  function val(r,k){ if(k==="label") return r.label.toLowerCase(); if(k==="order_key") return r.latest||""; return r[k==="ci"?"class_i_events":k]; }
  function render(){
    var rows=ROWS.slice().sort(function(a,b){
      var va=val(a,sortState.k), vb=val(b,sortState.k), c;
      if(typeof va==="string"||typeof vb==="string") c=String(va).localeCompare(String(vb)); else c=va-vb;
      if(c===0) c=String(b.latest).localeCompare(String(a.latest)); else c*=sortState.dir;
      return c;
    });
    var html="";
    for(var i=0;i<rows.length;i++){ var r=rows[i];
      html+='<tr'+(r.slug===currentId?' aria-current="true"':'')+'><td class="l"><button type="button" data-id="'+esc(r.slug)+'">'+esc(r.label)+'</button></td><td class="mono">'+r.events+'</td><td class="mono">'+r.n+'</td><td class="mono">'+r.class_i_events+'</td><td class="mono">'+r.share+'%</td><td class="mono">'+esc(r.latest||"—")+'</td></tr>';
    }
    tbody.innerHTML=html;
    wireRowButtons();
  }
  function updateHeaders(){
    var ths=document.querySelectorAll("#tbl th.sortable");
    ths.forEach(function(th){ var k=th.getAttribute("data-k"); var g=th.querySelector(".sortglyph");
      if(k===sortState.k){ th.setAttribute("aria-sort",sortState.dir<0?"descending":"ascending"); if(g) g.textContent=sortState.dir<0?"▼":"▲"; }
      else { th.setAttribute("aria-sort","none"); if(g) g.textContent="↕"; }
    });
  }
  document.querySelectorAll("#tbl th.sortable button").forEach(function(btn){
    btn.addEventListener("click",function(){ var k=btn.parentNode.getAttribute("data-k");
      if(sortState.k===k) sortState.dir*=-1; else { sortState.k=k; sortState.dir=(k==="label")?1:-1; }
      updateHeaders(); render();
    });
  });

  // ---------- stacked severity bars (top 16 by distinct events) ----------
  var SVGNS="http://www.w3.org/2000/svg";
  function drawBars(){
    var svg=document.getElementById("bars"); clearDraw(svg);
    var data=ROWS.slice().sort(function(a,b){ return b.events-a.events || String(b.latest).localeCompare(String(a.latest)); }).slice(0,16);
    var W=960, padL=150, padR=48, padT=8, rowH=26, gap=8, maxV=Math.max.apply(null,data.map(function(d){return d.events;}));
    var innerW=W-padL-padR, H=padT+data.length*(rowH+gap);
    svg.setAttribute("viewBox","0 0 "+W+" "+H); svg.setAttribute("height",H);
    var sc=function(v){ return maxV>0? v/maxV*innerW : 0; };
    var classes=[["class_i_events","rc-i"],["class_ii_events","rc-ii"],["class_iii_events","rc-iii"]];
    for(var i=0;i<data.length;i++){ var d=data[i], y=padT+i*(rowH+gap), x=padL;
      svg.appendChild(el("text",{x:padL-10,y:y+rowH*0.68,"text-anchor":"end",class:"rc-lab"},d.label));
      for(var c=0;c<classes.length;c++){ var v=d[classes[c][0]]; if(v<=0) continue; var w=sc(v);
        var rect=el("rect",{x:x,y:y,width:Math.max(w-1.5,0),height:rowH,rx:3,class:classes[c][1]});
        rect.appendChild(el("title",null,d.label+" — "+v+" Class "+["I","II","III"][c]+" event"+(v===1?"":"s")));
        svg.appendChild(rect); x+=w;
      }
      svg.appendChild(el("text",{x:x+8,y:y+rowH*0.68,class:"rc-val"},d.events+" event"+(d.events===1?"":"s")));
    }
  }

  // ---------- detail view ----------
  var currentId=null;
  function wireRowButtons(){ tbody.querySelectorAll("button[data-id]").forEach(function(b){ b.addEventListener("click",function(){ location.hash=b.getAttribute("data-id"); }); }); }
  function showDetail(r){
    document.getElementById("detail").classList.add("on");
    document.getElementById("main").setAttribute("data-detail","on");
    document.getElementById("detailTitle").textContent=r.label+" — recent recalls";
    document.getElementById("detailSub").textContent=r.events+" distinct recall event"+(r.events===1?"":"s")+" across "+r.n+" notice"+(r.n===1?"":"s")+" · "+r.class_i_events+" Class-I event"+(r.class_i_events===1?"":"s")+". Documented around these times — co-occurrence, never a cause, never joined to a price.";
    var list=document.getElementById("detailList"); list.innerHTML="";
    (r.recent||[]).forEach(function(x){
      var d=document.createElement("div"); d.className="ci-events__ctx rc-ctx";
      d.innerHTML='<p class="rc-ctx-when"><b>Documented around this time</b> — co-occurrence, never a cause.</p>'+
        '<p class="rc-ctx-meta"><span class="mono">'+esc(x.date||"—")+'</span> · '+esc(x.classification||"—")+' · '+esc(x.status||"—")+(x.firm?' · '+esc(x.firm):"")+(x.states?' · '+esc(x.states):"")+'</p>'+
        '<p class="rc-ctx-prod">'+esc(x.product||"")+'</p>';
      list.appendChild(d);
    });
    document.querySelectorAll("#main > section, #main > h2, #main > p, #main > figure, #main > .statgrid, #main > .tablewrap, #main > footer").forEach(function(node){ if(node.id!=="detail") node.classList.add("rc-hidden"); });
    window.scrollTo(0,0);
  }
  function closeDetail(){
    document.getElementById("detail").classList.remove("on");
    document.getElementById("main").removeAttribute("data-detail");
    document.querySelectorAll(".rc-hidden").forEach(function(n){ n.classList.remove("rc-hidden"); });
    currentId=null; render();
  }
  document.getElementById("backBtn").addEventListener("click",function(){ if(location.hash){ location.hash=""; } else closeDetail(); });
  function routeFromHash(){
    var id=location.hash.replace(/^#/,"");
    var r=ROWS.find(function(x){return x.slug===id;});
    if(r){ currentId=id; showDetail(r); } else { closeDetail(); }
  }
  window.addEventListener("hashchange",routeFromHash);

  // ---------- reference lookup (decoupled from any Class-I number) ----------
  var dl=document.getElementById("lk-list");
  ROWS.slice().sort(function(a,b){return a.label.localeCompare(b.label);}).forEach(function(r){ var o=document.createElement("option"); o.value=r.label; o.setAttribute("data-slug",r.slug); dl.appendChild(o); });
  function lookup(){
    var v=document.getElementById("lk").value.trim().toLowerCase();
    var r=ROWS.find(function(x){return x.label.toLowerCase()===v||x.slug===v;});
    if(r) location.href="/cost-index/"+r.slug+"/";
  }
  document.getElementById("lkGo").addEventListener("click",lookup);
  document.getElementById("lk").addEventListener("keydown",function(e){ if(e.key==="Enter") lookup(); });

  // ---------- theme toggle ----------
  var tb=document.getElementById("themeBtn");
  function curTheme(){ return document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"); }
  tb.addEventListener("click",function(){
    var next=curTheme()==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme",next);
    tb.setAttribute("aria-label","Switch to "+(next==="dark"?"light":"dark")+" theme");
    try{ localStorage.setItem("muntin-theme",next); }catch(e){}
    var live=document.getElementById("themeLive"); if(live) live.textContent=(next==="dark"?"Dark":"Light")+" theme on.";
    drawBars();
  });

  // ---------- init ----------
  try{ var st=localStorage.getItem("muntin-theme"); if(st==="dark"||st==="light"){ document.documentElement.setAttribute("data-theme",st); tb.setAttribute("aria-label","Switch to "+(st==="dark"?"light":"dark")+" theme"); } }catch(e){}
  updateHeaders(); render(); drawBars(); routeFromHash();
})();
</script>
`;
}

// ES alternates are emitted ONLY when the Spanish page actually exists. A dangling
// hreflang tells crawlers a translation is available and then 404s (ADR-020 thread,
// 2026-07-28). This self-heals: land es/open/recalls/index.html and the tags return.
const ES_EXISTS = fs.existsSync(path.join(repo, 'es/open/recalls/index.html'));
const ES_ALT = ES_EXISTS ? '<link rel="alternate" hreflang="es" href="https://muntin.digital/es/open/recalls/" />\n' : '';
const ES_OG_ALT = ES_EXISTS ? '<meta property="og:locale:alternate" content="es_US" />\n' : '';

// ---- head + style (byte-mirror the landings shell; only the page-specific block differs) ----------
function HEAD(title, desc, breadcrumb) {
  return `<title>${title}</title>
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="https://muntin.digital/open/recalls/" />
<link rel="alternate" hreflang="en" href="https://muntin.digital/open/recalls/" />
${ES_ALT}<link rel="alternate" hreflang="x-default" href="https://muntin.digital/open/recalls/" />
<meta property="og:locale" content="en_US" />
${ES_OG_ALT}<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="https://muntin.digital/open/recalls/" />
<meta property="og:site_name" content="Muntin Digital" />
<meta property="og:image" content="https://muntin.digital/brand/og/tool-cost-pulse.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="https://muntin.digital/brand/og/tool-cost-pulse.png" />
<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />
<script type="application/ld+json">${breadcrumb}</script>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-v38-latin-500.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-v20-latin-regular.woff2" crossorigin>
<link rel="stylesheet" href="/assets/site-core.css" />
`;
}

const STYLE = `<style>
/* === MUNTIN OPEN-DATA EXPLORER · shared token block === */
:root{
  --paper:#f7f4ee; --surface:#fffdf9; --surface-2:#f1ece2;
  --ink:#1b1f24; --ink-soft:#4a525a; --muted:#676b66;
  --line:#e5ddce; --line-soft:#efe9dc;
  --teal:#2f7d78; --teal-ink:#215a56; --teal-wash:#e4efed;
  --gold:#8a6216; --rust:#a8442d;
  --up:var(--rust); --dn:var(--teal-ink); --flat:var(--muted);
  --focus:#1b6be0; --focus-ring:0 0 0 3px rgba(27,107,224,.55);
  --ok-badge-bd:var(--teal); --ok-badge-ink:var(--teal-ink);
  --font-display:'Iowan Old Style','Palatino Linotype',Palatino,'Book Antiqua',Georgia,serif;
  --font-sans:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  --font-mono:ui-monospace,'SF Mono','Cascadia Code',Menlo,Consolas,monospace;
  --sh:0 1px 2px rgba(20,24,29,.05),0 8px 24px rgba(20,24,29,.07);
  --tap:44px;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
  --paper:#13161a; --surface:#1a1e23; --surface-2:#222831;
  --ink:#eef1f0; --ink-soft:#b7bec3; --muted:#8b949c;
  --line:#2b3138; --line-soft:#242a30;
  --teal:#57b7af; --teal-ink:#7fcfc7; --teal-wash:#16302e;
  --gold:#d3a44c; --rust:#e08a72;
  --focus:#7ab6ff; --focus-ring:0 0 0 3px rgba(122,182,255,.6);
  --sh:0 1px 2px rgba(0,0,0,.3),0 10px 28px rgba(0,0,0,.4);
}}
:root[data-theme="dark"]{ --paper:#13161a;--surface:#1a1e23;--surface-2:#222831;--ink:#eef1f0;--ink-soft:#b7bec3;--muted:#8b949c;--line:#2b3138;--line-soft:#242a30;--teal:#57b7af;--teal-ink:#7fcfc7;--teal-wash:#16302e;--gold:#d3a44c;--rust:#e08a72;--focus:#7ab6ff;--focus-ring:0 0 0 3px rgba(122,182,255,.6);--sh:0 1px 2px rgba(0,0,0,.3),0 10px 28px rgba(0,0,0,.4); }
:root[data-theme="light"]{ --paper:#f7f4ee;--surface:#fffdf9;--surface-2:#f1ece2;--ink:#1b1f24;--ink-soft:#4a525a;--muted:#676b66;--line:#e5ddce;--line-soft:#efe9dc;--teal:#2f7d78;--teal-ink:#215a56;--teal-wash:#e4efed;--gold:#8a6216;--rust:#a8442d;--focus:#1b6be0;--focus-ring:0 0 0 3px rgba(27,107,224,.55); }
*{box-sizing:border-box}
html{color-scheme:light dark}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--font-sans);line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:1000px;margin:0 auto;padding:clamp(18px,3.5vw,44px) clamp(14px,4vw,30px) 90px}
.mono{font-family:var(--font-mono);font-variant-numeric:tabular-nums}
h1{font-family:var(--font-display);font-weight:600;line-height:1.03;letter-spacing:-.01em;text-wrap:balance}
h2,h3{font-family:var(--font-display);font-weight:600;letter-spacing:-.01em}
a{color:var(--teal-ink)} a:hover{text-decoration:underline}
svg{display:block;max-width:100%;height:auto}
figure{margin:0}
:where(a,button,select,input,summary,[tabindex]):focus-visible{outline:2px solid var(--focus);outline-offset:2px;box-shadow:var(--focus-ring);border-radius:6px}
button,select,input{min-height:var(--tap);font:inherit}
button,[role=button]{min-width:var(--tap)}
input,select{background:var(--surface);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:11px 14px}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.lic{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--ok-badge-bd);color:var(--ok-badge-ink);border-radius:5px;padding:1px 7px;font:600 10.5px/1.4 var(--font-mono);letter-spacing:.06em}
.lic::before{content:'\\2713'} .lic[data-lic="cc-by"]::before{content:'\\24B8'}
.honest{display:block;font:400 11.5px/1.4 var(--font-sans);color:var(--muted);font-style:italic}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
@media (forced-colors:active){.lic,.chip{border:1px solid CanvasText}.rc-i,.rc-ii,.rc-iii{forced-color-adjust:none}}

/* === page-specific (.rc-*) === */
header.mast{border-bottom:2px solid var(--ink);padding-bottom:18px;margin-bottom:8px}
.kick{font-family:var(--font-mono);font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--teal-ink);margin:0 0 12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.mast-top{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}
h1{font-size:clamp(28px,5.4vw,50px);margin:0 0 12px}
.lede{font-size:clamp(15px,2.1vw,18px);color:var(--ink-soft);max-width:64ch;margin:0}
.lede b{color:var(--ink);font-weight:600}
.themebtn{background:var(--surface);border:1px solid var(--line);border-radius:10px;width:var(--tap);height:var(--tap);display:inline-grid;place-items:center;cursor:pointer;font-size:17px;flex:none}
h2{font-size:clamp(20px,3.2vw,27px);margin:36px 0 4px}
h2:first-of-type{margin-top:24px}
.beat-sub{color:var(--ink-soft);margin:2px 0 16px;max-width:66ch}
.panel{border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--sh);padding:clamp(12px,2.4vw,20px);margin:14px 0}
.rc-lane{border-left:3px solid var(--gold)}
.legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--ink-soft);margin:0 0 10px}
.legend .sw{display:inline-flex;align-items:center;gap:6px}
.rc-box{width:22px;height:12px;border-radius:3px;display:inline-block}
.rc-box.rc-i{background:var(--teal-ink)} .rc-box.rc-ii{background:var(--teal)} .rc-box.rc-iii{background:var(--teal-wash);border:1px solid var(--teal)}
.statgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:14px 0}
.stat{border:1px solid var(--line);border-radius:12px;background:var(--surface);padding:12px 14px}
.stat .k{font:600 11px/1.3 var(--font-mono);letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.stat .v{font:600 24px/1.15 var(--font-display);margin:3px 0 1px}
.nojs-note{background:var(--surface-2);border:1px dashed var(--line);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--ink-soft);margin:10px 0}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--sh)}
table.data{border-collapse:collapse;width:100%;font-size:13.5px}
table.data caption{text-align:left;padding:12px 14px 4px;color:var(--ink-soft);font-size:13px}
table.data th,table.data td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--line-soft);white-space:nowrap}
table.data th[scope=col]{position:sticky;top:0;background:var(--surface-2);z-index:1}
table.data th.l,table.data td.l{text-align:left}
table.data td.l button{background:none;border:0;color:var(--teal-ink);font:inherit;font-weight:600;cursor:pointer;padding:2px 0;text-align:left;min-height:var(--tap);text-decoration:underline;text-underline-offset:2px}
table.data tbody tr[aria-current=true]{background:var(--teal-wash)}
th.sortable button{background:none;border:0;color:inherit;font:inherit;font-weight:700;cursor:pointer;display:inline-flex;gap:5px;align-items:center;justify-content:flex-end;width:100%;min-height:38px}
th.l.sortable button{justify-content:flex-start}
.sortglyph{font-size:10px;color:var(--muted)}
th[aria-sort=ascending] .sortglyph,th[aria-sort=descending] .sortglyph{color:var(--teal-ink)}
.rc-scroll{overflow-x:auto}
.rc-lab{fill:var(--ink);font:600 12.5px var(--font-sans)}
.rc-val{fill:var(--ink-soft);font:11.5px var(--font-mono)}
.rc-i{fill:var(--teal-ink)} .rc-ii{fill:var(--teal)} .rc-iii{fill:var(--teal-wash);stroke:var(--teal);stroke-width:1}
.controls{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 6px;align-items:center}
.search{position:relative;flex:1;min-width:220px}
.search input{width:100%;font-size:15px}
.dl{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--teal);color:var(--teal-ink);background:var(--surface);border-radius:10px;padding:9px 14px;font-weight:600;cursor:pointer;text-decoration:none}
#detail{display:none}
#detail.on{display:block}
.rc-hidden{display:none!important}
.detail-head{display:flex;align-items:flex-start;gap:12px;justify-content:space-between;flex-wrap:wrap}
.backbtn{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 14px;cursor:pointer;font-weight:600;color:var(--teal-ink)}
.rc-ctx{border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:12px;background:var(--surface);padding:12px 14px;margin:10px 0}
.rc-ctx p{margin:2px 0}
.rc-ctx-when{font-size:12px;color:var(--gold);font-weight:600}
.rc-ctx-meta{font-size:12.5px;color:var(--ink-soft)}
.rc-ctx-prod{font-size:13.5px;color:var(--ink)}
.provgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
footer.prov{margin-top:40px;border-top:1px solid var(--line);padding-top:20px;color:var(--ink-soft);font-size:13.5px}
footer.prov h2{font-size:17px;margin:0 0 8px}
footer.prov a{word-break:break-word}
.aha{border-left:3px solid var(--gold);padding:6px 0 6px 16px;margin:22px 0;font-family:var(--font-display);font-size:clamp(17px,2.6vw,22px);line-height:1.3;color:var(--ink)}
.aha b{font-weight:700}
@media (max-width:560px){ h2{margin-top:28px} .stat .v{font-size:20px} }
</style>
`;

// ---- honesty self-guard: the structural no-price + required-literal contract -----------------------
const REQUIRED_LITERALS = [
  'never joined to a price',
  'never a cause',
  'whole-word text match on the product, not a supply or price link',
  'documented recall events, never a price or volume',
  'FDA-regulated foods only',
];
function guardHtml(html) {
  const errs = [];
  if (/\$/.test(html)) errs.push('a "$" (price) token appears on the no-price recall page');
  for (const lit of REQUIRED_LITERALS) if (!html.includes(lit)) errs.push(`missing required honesty literal: "${lit}"`);
  if (!html.includes('co-occurrence, never a cause')) errs.push('missing the co-occurrence-never-a-cause phrase');
  // every detail context block must wear the co-occurrence tag (rendered client-side from this literal)
  if (!/Documented around this time.*co-occurrence, never a cause/.test(html)) errs.push('detail context blocks missing the co-occurrence tag');
  return errs;
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  eq('label from slug', label('shrimp-head-on'), 'Shrimp Head On');
  eq('class-I share rounds', clsShare(28, 33), 85);
  eq('class-I share of zero events is 0', clsShare(0, 0), 0);
  // fixture model → page, then run the honesty guard
  const fake = {
    summary: { recalls: 4, tagged_ingredients: 2, total_tags: 3, distinct_events: 3, class_i_recalls: 2, ongoing: 1 },
    trackedTotal: 169, asOf: '2026-06-10', license: CCBY,
    biggest: { event_id: '93290', n: 70, date: '2023-11-15', firm: 'Gills Onions, LLC', classI: true },
    rows: [
      { slug: 'onion', n: 3, events: 2, ci: 1, cii: 1, ciii: 0, share: 50, latest: '2026-02-04', order_key: '2025-10-22', recent: [{ date: '2026-02-04', classification: 'Class I', status: 'Ongoing', product: 'Fresh Onion 5lb', firm: 'A', states: 'MD' }] },
      { slug: 'cucumber', n: 1, events: 1, ci: 1, cii: 0, ciii: 0, share: 100, latest: '2025-05-19', order_key: '2025-05-19', recent: [{ date: '2025-05-19', classification: 'Class I', status: 'Completed', product: 'Whole Cucumbers', firm: 'B', states: 'VA' }] },
    ],
  };
  const html = page(fake);
  const errs = guardHtml(html);
  eq('page passes the no-price + required-literal guard', errs, []);
  eq('page carries no dollar token', /\$/.test(html), false);
  eq('page has the dual license chips', html.includes('CC0 raw') && html.includes('CC-BY derived'), true);
  eq('mast frames it as never joined to a price', html.includes('never joined to a price'), true);
  eq('the biggest-event aha is data-dated, no year hardcode', html.includes('event 93290') && html.includes('2023-11-15') && !/salmonella/i.test(html), true);
  eq('the table has no cost-index price link in a row', /<tr>(?:(?!<\/tr>).)*cost-index\/[a-z]/is.test(html), false);
  eq('server table renders one row per ingredient', (html.match(/<tr><td class="l"><button/g) || []).length, 2);
  eq('data island carries no price field', /"price"|"usd"|"\$"/.test(html.split('id="recalls-data">')[1] || ''), false);
  // live guard
  if (fs.existsSync(path.join(repo, IDX)) && fs.existsSync(path.join(repo, RAW)) && fs.existsSync(path.join(repo, ISR))) {
    const liveErrs = guardHtml(page(model()));
    eq('LIVE page passes the honesty guard', liveErrs, []);
  }
  console.log(`build-open-recalls-page self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
for (const f of [IDX, RAW, ISR]) if (!fs.existsSync(path.join(repo, f))) {
  console.error(`build-open-recalls-page: ${f} not found — run the fetch/build chain first.`);
  process.exit(args.has('--check') ? 0 : 1);
}
const html = page(model());
const errs = guardHtml(html);
if (errs.length) { console.error('build-open-recalls-page: honesty guard failed:\n  ' + errs.join('\n  ')); process.exit(1); }
if (args.has('--check')) {
  const p = path.join(repo, OUT);
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  // Compare only the generator-owned body (<header class="mast"> … </main>): the
  // deploy chain injects the canonical nav/footer (sync-includes) + dark-mode +
  // css-cache-bust around and above this body AFTER generation, so a full-string
  // compare would always drift post-inject. The body is injector-untouched — it
  // is the real "stale" signal (data/content freshness).
  const body = (s) => { if (s == null) return s; const a = s.indexOf('<header class="mast">'); const b = s.lastIndexOf('</main>'); return (a >= 0 && b > a) ? s.slice(a, b) : s; };
  if (body(cur) !== body(html)) { console.error(`✗ ${OUT} is stale — run: node scripts/build-open-recalls-page.mjs`); process.exit(1); }
  console.log(`✓ ${OUT} in sync.`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(path.join(repo, OUT)), { recursive: true });
fs.writeFileSync(path.join(repo, OUT), html);
console.log(`Wrote ${OUT} — ${model().rows.length} ingredients, no-price recall record.`);
