#!/usr/bin/env node
/**
 * build-open-demand-page.mjs — generate open/demand/index.html, "The Sector Demand Backdrop" explorer
 * (spec-corpus-explorers.md §1.4). Reads the CC0 MARTS passthrough and emits a standalone /open page.
 *
 * HONESTY (ADR-013): OBSERVED monthly food-services sales — never a demand forecast; the most recent
 * month is a PROVISIONAL advance estimate, subject to revision. NEVER blended into the food index, the
 * pressure math, or the Vendor Benchmark reference. The latest-month value is only ever rendered with
 * the "provisional advance estimate" marker adjacent (asserted at build).
 *
 *   node scripts/build-open-demand-page.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'open/demand/index.html';
const SRC = 'cost-index/marts-sales.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function ym(d) { const [y, m] = String(d).split('-'); return ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m] + ' ' + y; }

const FENCE = 'never blended into the food index, the pressure math, or the Vendor Benchmark';
const OBSERVED = 'observed sales, never a forecast';
const PROV = 'provisional advance estimate';

function model() {
  const src = rd(SRC);
  const months = (src.months || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const provDate = src.provisional_month || (months.length ? months[months.length - 1].date : null);
  // COVID trough endpoints, from data (the last SETTLED peak-to-trough, NOT the provisional latest month)
  const at = (d) => months.find((m) => m.date === d);
  const feb20 = at('2020-02-01'), apr20 = at('2020-04-01');
  const trough = feb20 && apr20 ? { fromDate: feb20.date, from: feb20.sales_sa_musd, toDate: apr20.date, to: apr20.sales_sa_musd } : null;
  const span = months.length ? { from: months[0].date, to: months[months.length - 1].date, y0: months[0].date.slice(0, 4), yN: months[months.length - 1].date.slice(0, 4) } : null;
  return { src, months, provDate, trough, span };
}

function page(m) {
  const months = m.months, sp = m.span, tr = m.trough;
  const title = 'The Sector Demand Backdrop — US Food-Services Monthly Sales (Census MARTS)';
  const desc = 'US Food Services & Drinking Places monthly sales, US$ millions (Census MARTS via FRED, NAICS 722). Observed sales, never a demand forecast.';
  const tbody = months.map((r) => `          <tr${r.provisional ? ' class="dm-prov-row"' : ''}><td class="l mono">${esc(r.date)}</td><td class="mono">${r.sales_sa_musd == null ? '—' : r.sales_sa_musd.toLocaleString('en-US')}</td><td class="mono">${r.sales_nsa_musd == null ? '—' : r.sales_nsa_musd.toLocaleString('en-US')}</td><td class="l">${r.provisional ? '<span class="dm-prov">provisional advance estimate</span>' : 'settled'}</td></tr>`).join('\n');
  const data = {
    meta: { dataset: 'Census MARTS — US food-services monthly sales (NAICS 722)', unit: m.src.unit || 'US$ millions', license: 'CC0 1.0', raw_url: 'https://muntin.digital/data/marts-sales.json', csv_url: 'https://muntin.digital/cost-index/marts-sales.csv', json_url: 'https://muntin.digital/cost-index/marts-sales.json', catalog_url: 'https://muntin.digital/open/', provisional_month: m.provDate, fence: `${OBSERVED}; ${FENCE}`, span: sp },
    months: months.map((r) => ({ date: r.date, sa: r.sales_sa_musd, nsa: r.sales_nsa_musd, provisional: !!r.provisional })),
  };
  const breadcrumb = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://muntin.digital/' },
    { '@type': 'ListItem', position: 2, name: 'Open data', item: 'https://muntin.digital/open/' },
    { '@type': 'ListItem', position: 3, name: 'The Sector Demand Backdrop', item: 'https://muntin.digital/open/demand/' },
  ] });
  const dataset = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Dataset',
    name: 'US food-services monthly retail sales (Census MARTS)',
    description: 'Monthly retail sales for Food Services & Drinking Places (NAICS 722), US$ millions, seasonally adjusted and not, via FRED. Observed sales, never a forecast; the most recent month is a provisional advance estimate. A descriptive demand backdrop, never in the food index.',
    url: 'https://muntin.digital/open/demand/',
    creator: { '@type': 'Organization', name: 'Muntin Cost Index', url: 'https://muntin.digital/' },
    isBasedOn: { '@type': 'Dataset', name: 'US Census Bureau Monthly Retail Trade Survey (MARTS)', creator: { '@type': 'GovernmentOrganization', name: 'US Census Bureau' } },
    license: CC0,
    temporalCoverage: sp ? `${sp.y0}/${sp.yN}` : undefined,
    spatialCoverage: { '@type': 'Place', name: 'United States' },
    keywords: ['food services sales', 'MARTS', 'retail trade', 'NAICS 722', 'demand backdrop', 'FRED'],
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'sales_sa_musd', description: 'Seasonally adjusted monthly food-services sales, US$ millions — observed sales, never a forecast; the latest month is a provisional advance estimate.' },
      { '@type': 'PropertyValue', name: 'sales_nsa_musd', description: 'Not-seasonally-adjusted monthly food-services sales, US$ millions — the raw seasonal shape; never blended into any price index or the Vendor Benchmark.' },
    ],
    distribution: [
      { '@type': 'DataDownload', name: 'MARTS sales CSV (CC0)', encodingFormat: 'text/csv', contentUrl: 'https://muntin.digital/cost-index/marts-sales.csv', license: CC0 },
      { '@type': 'DataDownload', name: 'MARTS sales JSON (CC0)', encodingFormat: 'application/json', contentUrl: 'https://muntin.digital/cost-index/marts-sales.json', license: CC0 },
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
        <span class="lic" data-lic="cc0" role="img" aria-label="This dataset is Creative Commons Zero, public domain">CC0</span>
      </p>
      <h1>The Sector Demand Backdrop</h1>
    </div>
    <button class="themebtn" id="themeBtn" aria-label="Switch color theme" title="Switch light / dark theme">◐</button>
    <span id="themeLive" class="sr-only" role="status" aria-live="polite"></span>
  </div>
  <p class="lede">US Food Services &amp; Drinking Places monthly sales, in US$ millions (Census MARTS via FRED, NAICS 722). <b>${OBSERVED}</b>. The most recent month is a <b>${PROV}</b>, subject to revision. <b>${FENCE}</b> reference.<span class="honest" style="margin-top:8px">The sell-side backdrop: what the sector takes in, set beside the cost data — never a demand forecast, and never inside any Muntin price index.</span></p>
</header>

<main id="main">

  <section class="panel dm-lane" aria-label="How to read this page">
    <p style="margin:0"><b>A separate descriptive lane (ADR-013).</b> These are observed sector sales — <b>${OBSERVED}</b> — set beside the cost data, never an input to any Muntin price index, pressure reading, or Vendor Benchmark reference. The newest month is always a <b>${PROV}</b>.</p>
  </section>

  <h2>Monthly food-service sales · ${sp ? ym(sp.from) + ' → ' + ym(sp.to) : ''}</h2>
  <p class="beat-sub"><b>SA</b> is the seasonally adjusted trend; <b>NSA</b> is the raw seasonal shape (the same demand, before the seasonal pattern is removed). The most recent month renders hollow — a <b>${PROV}</b>, not a settled point, never drawn as final.</p>
  <figure class="panel">
    <div class="legend" aria-hidden="true">
      <span class="sw"><span class="dm-box dm-sa"></span> SA — trend (seasonally adjusted)</span>
      <span class="sw"><span class="dm-box dm-nsa"></span> NSA — seasonal shape</span>
      <span class="sw"><span class="dm-dot-prov"></span> provisional advance estimate</span>
    </div>
    <div class="dm-scroll">
      <svg id="sales" role="img" width="960" height="360" aria-labelledby="sales-t sales-d">
        <title id="sales-t">US food-services monthly sales, seasonally adjusted and not, ${sp ? ym(sp.from) + ' to ' + ym(sp.to) : ''}.</title>
        <desc id="sales-d">A line chart of US Food Services and Drinking Places monthly sales in US dollars millions, from ${sp ? ym(sp.from) : ''} to ${sp ? ym(sp.to) : ''}. The seasonally adjusted trend rises over the decade, drops sharply in spring 2020, then recovers. The not-seasonally-adjusted line oscillates around it with the yearly seasonal shape. The most recent month is a provisional advance estimate, drawn hollow. Observed sales, never a forecast, and never blended into any price index or the Vendor Benchmark.</desc>
      </svg>
    </div>
    <figcaption class="honest" data-audio-alt="US food-services monthly sales, seasonally adjusted trend and the raw not-seasonally-adjusted seasonal shape, in US dollars millions — observed sales, never a forecast, the newest month a provisional advance estimate, never blended into any price index or the Vendor Benchmark.">Monthly sales, SA trend and NSA seasonal shape — <b>${OBSERVED}</b>; the newest month is a <b>${PROV}</b>.</figcaption>
  </figure>

${tr ? `  <p class="aha" id="aha">The documented COVID shock is the sharpest move on record: seasonally adjusted sales fell from <span class="mono">${tr.from.toLocaleString('en-US')}</span> in <span class="mono">${ym(tr.fromDate)}</span> to <span class="mono">${tr.to.toLocaleString('en-US')}</span> in <span class="mono">${ym(tr.toDate)}</span> — a documented past drop, both endpoints settled months.
    <span class="honest" style="display:block;margin-top:6px">Observed context, never a forecast. US$ millions, seasonally adjusted. The recovery since is real but nominal — dollars, not inflation-adjusted volume.</span>
  </p>` : ''}

  <h2>Every month, as data</h2>
  <p class="nojs-note">This table is the source of record — it works with no JavaScript, and the chart above is an enhancement of it. The newest month is flagged a provisional advance estimate.</p>
  <div class="tablewrap">
    <table class="data" id="tbl">
      <caption>Census MARTS monthly sales for Food Services &amp; Drinking Places (NAICS 722), US$ millions, ${sp ? ym(sp.from) + '–' + ym(sp.to) : ''}. <b>SA</b> = seasonally adjusted; <b>NSA</b> = not adjusted. The most recent month (${m.provDate ? ym(m.provDate) : ''}) is a provisional advance estimate, subject to revision. Observed sales, never a forecast.</caption>
      <thead>
        <tr>
          <th scope="col" class="l">Month</th>
          <th scope="col">Sales, SA ($M)</th>
          <th scope="col">Sales, NSA ($M)</th>
          <th scope="col" class="l">Status</th>
        </tr>
      </thead>
      <tbody>
${tbody}
      </tbody>
    </table>
  </div>

  <h2>What this can't tell you</h2>
  <section class="panel">
    <ul style="margin:0;padding-left:20px;line-height:1.7">
      <li><b>National, whole-sector.</b> This is all of US NAICS 722 — not the DMV, not fine dining, not one segment. A top-line, not your line.</li>
      <li><b>Nominal dollars.</b> Inflation is not removed; growth in the number mixes real volume with higher prices. It is not a real-demand index.</li>
      <li><b>The newest month is provisional.</b> The most recent month is a <b>${PROV}</b>, revised in later releases — read it as a first draft.</li>
      <li><b>Observed, not predicted.</b> Every point is a documented past month; <b>${OBSERVED}</b>.</li>
      <li><b>A backdrop, fenced off.</b> It is <b>${FENCE}</b> reference — set beside the cost data, never inside it.</li>
    </ul>
  </section>

  <footer class="prov">
    <h2>Provenance &amp; license</h2>
    <div class="provgrid">
      <div><b>Raw feed · CC0</b><br>Census MARTS via FRED (US Census Bureau), public domain. <a href="/data/marts-sales.json">data/marts-sales.json</a></div>
      <div><b>Published series · CC0</b><br>A straight reshape; the newest month flagged provisional. <a href="/cost-index/marts-sales.csv">marts-sales.csv</a> · <a href="/cost-index/marts-sales.json">marts-sales.json</a></div>
      <div><b>What this is</b><br>A descriptive demand backdrop — ${OBSERVED}, ${FENCE} reference. The newest month is a ${PROV}.</div>
      <div><b>Catalog</b><br><a href="/open/">Full open-data catalog →</a></div>
    </div>
  </footer>

</main>

<script type="application/ld+json">${dataset}</script>
<script type="application/json" id="demand-data">${JSON.stringify(data)}</script>
<script>
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("demand-data").textContent);
  var M = DATA.months;
  function el(tag,attrs,txt){ var e=document.createElementNS("http://www.w3.org/2000/svg",tag); if(attrs) for(var k in attrs) e.setAttribute(k,attrs[k]); if(txt!=null) e.textContent=txt; return e; }
  function clearDraw(svg){ var k=[].slice.call(svg.childNodes); for(var i=0;i<k.length;i++){ var t=k[i].tagName; if(t!=="title"&&t!=="desc") svg.removeChild(k[i]); } }
  function mkey(d){ var p=d.split("-"); return (+p[0])+(+p[1]-1)/12; }

  function draw(){
    var svg=document.getElementById("sales"); clearDraw(svg);
    var W=960,H=360,padL=58,padR=18,padT=16,padB=30;
    var xs=M.map(function(r){return mkey(r.date);}), x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
    var vals=[]; M.forEach(function(r){ if(r.sa!=null)vals.push(r.sa); if(r.nsa!=null)vals.push(r.nsa); });
    var minV=0, maxV=Math.ceil(Math.max.apply(null,vals)/10000)*10000;
    var X=function(k){ return padL+(k-x0)/(x1-x0)*(W-padL-padR); };
    var Y=function(v){ return padT+(1-(v-minV)/(maxV-minV))*(H-padT-padB); };
    for(var g=0; g<=maxV; g+=20000){ svg.appendChild(el("line",{x1:padL,y1:Y(g),x2:W-padR,y2:Y(g),class:"dm-grid"})); svg.appendChild(el("text",{x:padL-8,y:Y(g)+4,"text-anchor":"end",class:"dm-tk"}, (g/1000)+"k")); }
    var seenY={}; M.forEach(function(r){ var y=r.date.slice(0,4); if(r.date.slice(5,7)==="01"&&!seenY[y]&&(+y)%2===1){ seenY[y]=1; svg.appendChild(el("text",{x:X(mkey(r.date)),y:H-10,"text-anchor":"middle",class:"dm-tk"}, y)); } });
    // NSA first (behind), then SA
    function linePath(key,settledOnly){ var dd=""; var started=false; M.forEach(function(r){ if(settledOnly&&r.provisional) return; var v=r[key]; if(v==null) return; dd+=(started?"L":"M")+X(mkey(r.date)).toFixed(1)+" "+Y(v).toFixed(1)+" "; started=true; }); return dd; }
    svg.appendChild(el("path",{d:linePath("nsa",true),class:"dm-line-nsa"}));
    svg.appendChild(el("path",{d:linePath("sa",true),class:"dm-line-sa"}));
    // provisional last point drawn hollow + dashed connector from the prior settled SA point
    var prov=M.filter(function(r){return r.provisional;});
    if(prov.length){ var last=prov[prov.length-1];
      var idx=M.indexOf(last); var prev=null; for(var i=idx-1;i>=0;i--){ if(M[i].sa!=null){ prev=M[i]; break; } }
      if(prev){ svg.appendChild(el("path",{d:"M"+X(mkey(prev.date))+" "+Y(prev.sa)+" L"+X(mkey(last.date))+" "+Y(last.sa),class:"dm-line-prov"})); }
      if(last.sa!=null){ var c=el("circle",{cx:X(mkey(last.date)),cy:Y(last.sa),r:4,class:"dm-dot-prov-svg"}); c.appendChild(el("title",null,"Provisional advance estimate — "+last.date)); svg.appendChild(c); }
    }
  }

  var tb=document.getElementById("themeBtn");
  function curTheme(){ return document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"); }
  tb.addEventListener("click",function(){
    var next=curTheme()==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme",next);
    tb.setAttribute("aria-label","Switch to "+(next==="dark"?"light":"dark")+" theme");
    try{ localStorage.setItem("muntin-theme",next); }catch(e){}
    var live=document.getElementById("themeLive"); if(live) live.textContent=(next==="dark"?"Dark":"Light")+" theme on.";
    draw();
  });
  try{ var st=localStorage.getItem("muntin-theme"); if(st==="dark"||st==="light"){ document.documentElement.setAttribute("data-theme",st); tb.setAttribute("aria-label","Switch to "+(st==="dark"?"light":"dark")+" theme"); } }catch(e){}
  draw();
})();
</script>
`;
}

function HEAD(title, desc, breadcrumb) {
  return `<title>${title}</title>
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="https://muntin.digital/open/demand/" />
<link rel="alternate" hreflang="en" href="https://muntin.digital/open/demand/" />
<link rel="alternate" hreflang="es" href="https://muntin.digital/es/open/demand/" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital/open/demand/" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="es_US" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="https://muntin.digital/open/demand/" />
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
.lic::before{content:'\\2713'}
.honest{display:block;font:400 11.5px/1.4 var(--font-sans);color:var(--muted);font-style:italic}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}}
@media (forced-colors:active){.lic{border:1px solid CanvasText}.dm-line-sa,.dm-line-nsa{forced-color-adjust:none}}

/* === page-specific (.dm-*) === */
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
.dm-lane{border-left:3px solid var(--gold)}
.legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--ink-soft);margin:0 0 10px}
.legend .sw{display:inline-flex;align-items:center;gap:6px}
.dm-box{width:22px;height:4px;border-radius:2px;display:inline-block}
.dm-box.dm-sa{background:var(--teal-ink)} .dm-box.dm-nsa{background:var(--gold)}
.dm-dot-prov{width:11px;height:11px;border-radius:50%;border:1.5px dashed var(--rust);display:inline-block}
.nojs-note{background:var(--surface-2);border:1px dashed var(--line);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--ink-soft);margin:10px 0}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--sh);max-height:520px}
table.data{border-collapse:collapse;width:100%;font-size:13.5px}
table.data caption{text-align:left;padding:12px 14px 4px;color:var(--ink-soft);font-size:13px}
table.data th,table.data td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--line-soft);white-space:nowrap}
table.data th[scope=col]{position:sticky;top:0;background:var(--surface-2);z-index:1}
table.data th.l,table.data td.l{text-align:left}
.dm-prov-row{background:var(--teal-wash)}
.dm-prov{color:var(--rust);font-weight:600}
.dm-scroll{overflow-x:auto}
.dm-grid{stroke:var(--line);stroke-width:1}
.dm-tk{fill:var(--muted);font:11px var(--font-mono)}
.dm-line-sa{stroke:var(--teal-ink);stroke-width:2.2;fill:none}
.dm-line-nsa{stroke:var(--gold);stroke-width:1;fill:none;opacity:.7}
.dm-line-prov{stroke:var(--rust);stroke-width:1.8;stroke-dasharray:4 3;fill:none}
.dm-dot-prov-svg{fill:var(--surface);stroke:var(--rust);stroke-width:1.8}
.provgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
footer.prov{margin-top:40px;border-top:1px solid var(--line);padding-top:20px;color:var(--ink-soft);font-size:13.5px}
footer.prov h2{font-size:17px;margin:0 0 8px}
footer.prov a{word-break:break-word}
.aha{border-left:3px solid var(--gold);padding:6px 0 6px 16px;margin:22px 0;font-family:var(--font-display);font-size:clamp(17px,2.6vw,22px);line-height:1.3;color:var(--ink)}
.aha b{font-weight:700}
@media (max-width:560px){ h2{margin-top:28px} }
</style>
`;

// ---- honesty self-guard: observed/forecast/fence literals; provisional adjacent to any latest value --
const REQUIRED_LITERALS = [OBSERVED, PROV, FENCE];
function guardHtml(html, m) {
  const errs = [];
  for (const lit of REQUIRED_LITERALS) if (!html.includes(lit)) errs.push(`missing required literal: "${lit}"`);
  // cross-lane causal claims only — "never a demand forecast" is an honest negation and must NOT trip this
  if (/\bdemand (drove|pushed|caused|lifted|forced|drives|pushes)\b/i.test(html)) errs.push('a cross-lane causal claim ("demand drove/pushed…") appears in affirmative voice');
  // the latest-month numeric value may appear only where "provisional advance estimate" is adjacent
  if (m && m.months.length) {
    const last = m.months[m.months.length - 1];
    const latestStr = last.sales_sa_musd != null ? last.sales_sa_musd.toLocaleString('en-US') : null;
    if (latestStr) {
      // strip the data island + the table (where the provisional flag rides in-row) before scanning prose
      const prose = html.split('id="demand-data"')[0].replace(/<table[\s\S]*?<\/table>/g, '');
      if (prose.includes(latestStr)) errs.push(`the provisional latest value ${latestStr} appears in prose without the provisional marker inline`);
    }
  }
  return errs;
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const fake = { src: { unit: 'US$ millions' }, span: { from: '2015-01-01', to: '2026-06-01', y0: '2015', yN: '2026' }, provDate: '2026-06-01',
    trough: { fromDate: '2020-02-01', from: 67358, toDate: '2020-04-01', to: 30732 },
    months: [
      { date: '2015-01-01', sales_sa_musd: 49690, sales_nsa_musd: 47106, provisional: false },
      { date: '2020-02-01', sales_sa_musd: 67358, sales_nsa_musd: 65000, provisional: false },
      { date: '2020-04-01', sales_sa_musd: 30732, sales_nsa_musd: 29000, provisional: false },
      { date: '2026-06-01', sales_sa_musd: 102497, sales_nsa_musd: 104547, provisional: true },
    ] };
  const html = page(fake);
  eq('observed/provisional/fence literals present', guardHtml(html, fake), []);
  eq('CC0 chip (single, not CC-BY)', html.includes('>CC0<') && !html.includes('CC-BY'), true);
  eq('COVID trough rendered from data (67,358 → 30,732)', html.includes('67,358') && html.includes('30,732'), true);
  eq('latest value 102,497 is NOT a COVID-recovery endpoint in the aha', !(html.split('id="aha"')[1] || '').split('</p>')[0].includes('102,497'), true);
  eq('latest value never in prose without provisional marker', !guardHtml(html, fake).some((e) => /appears in prose/.test(e)), true);
  eq('newest table row flagged provisional advance estimate', /dm-prov-row[\s\S]*?provisional advance estimate/.test(html), true);
  eq('server table one row per month', (html.match(/<td class="l mono">\d{4}-/g) || []).length, 4);
  if (fs.existsSync(path.join(repo, SRC))) {
    const lm = model();
    eq('LIVE page passes the honesty guard', guardHtml(page(lm), lm), []);
  }
  console.log(`build-open-demand-page self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
if (!fs.existsSync(path.join(repo, SRC))) { console.error(`build-open-demand-page: ${SRC} not found — run scripts/build-marts-open-data.mjs first.`); process.exit(args.has('--check') ? 0 : 1); }
const m = model();
const html = page(m);
const errs = guardHtml(html, m);
if (errs.length) { console.error('build-open-demand-page: honesty guard failed:\n  ' + errs.join('\n  ')); process.exit(1); }
if (args.has('--check')) {
  const p = path.join(repo, OUT);
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (cur !== html) { console.error(`✗ ${OUT} is stale — run: node scripts/build-open-demand-page.mjs`); process.exit(1); }
  console.log(`✓ ${OUT} in sync.`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(path.join(repo, OUT)), { recursive: true });
fs.writeFileSync(path.join(repo, OUT), html);
console.log(`Wrote ${OUT} — ${m.months.length} months, fenced demand backdrop (provisional: ${m.provDate}).`);
