#!/usr/bin/env node
/**
 * build-open-labor-page.mjs — generate open/labor/index.html, "The County Wage Backdrop" explorer
 * (spec-corpus-explorers.md §1.3). Reads the CC0 QCEW passthrough and emits a standalone /open page.
 *
 * HONESTY (ADR-013): a DESCRIPTIVE labor backdrop — a county food-services industry AVERAGE weekly
 * wage and employment, never a per-plate labor cost, and NEVER blended into the food index, the
 * pressure math, or the Vendor Benchmark reference. Never a forecast. The fence is the page boundary:
 * no pressure-arrow token appears anywhere (asserted at build).
 *
 *   node scripts/build-open-labor-page.mjs [--check] [--self-test]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = 'open/labor/index.html';
const SRC = 'cost-index/qcew-wages.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

const FENCE = 'a county industry average, never a per-plate labor cost';
const FENCE2 = 'never blended into the food index, the pressure math, or the Vendor Benchmark';

function model() {
  const src = rd(SRC);
  const q = src.quarters || [];
  const at = (y, qt, code) => q.find((r) => r.year === y && r.qtr === qt && r.industry_code === code);
  // the 2020 Q2 composition callout — endpoints rendered FROM DATA (never hardcoded)
  const q1 = at(2020, 1, '722'), q2 = at(2020, 2, '722');
  const drop = q1 && q2 ? { from: q1.avg_employment, to: q2.avg_employment, pct: Math.round((q2.avg_employment - q1.avg_employment) / q1.avg_employment * 100), wageFrom: q1.avg_wkly_wage, wageTo: q2.avg_wkly_wage } : null;
  const years = q.map((r) => r.year);
  const span = q.length ? { from: `${years[0]} Q${q[0].qtr}`, to: `${years[years.length - 1]} Q${q[q.length - 1].qtr}`, y0: years[0], yN: years[years.length - 1] } : null;
  return { src, quarters: q, drop, span };
}

function page(m) {
  const q = m.quarters, d = m.drop, sp = m.span;
  const title = 'The County Wage Backdrop — Restaurant Wages & Employment (BLS QCEW)';
  const desc = 'Montgomery County, MD restaurant average weekly wage and employment (BLS QCEW, NAICS 722). A county industry average, never a per-plate labor cost.';
  const tbody = q.slice().sort((a, b) => a.year - b.year || a.qtr - b.qtr || String(a.industry_code).localeCompare(String(b.industry_code)))
    .map((r) => `          <tr><td class="l mono">${r.year} Q${r.qtr}</td><td class="l">${esc(r.industry)} <span class="mono lb-code">(${r.industry_code})</span></td><td class="mono">${r.avg_wkly_wage}</td><td class="mono">${r.oty_wage_pct_chg == null ? '—' : (r.oty_wage_pct_chg > 0 ? '+' : '') + r.oty_wage_pct_chg + '%'}</td><td class="mono">${r.establishments}</td><td class="mono">${r.avg_employment.toLocaleString('en-US')}</td></tr>`).join('\n');
  // data island — a descriptive labor series only; no price, no pressure field
  const data = {
    meta: { dataset: 'BLS QCEW — Montgomery County MD food-services wages & employment', area: m.src.area, license: 'CC0 1.0', raw_url: 'https://muntin.digital/data/qcew-wages.json', csv_url: 'https://muntin.digital/cost-index/qcew-wages.csv', json_url: 'https://muntin.digital/cost-index/qcew-wages.json', catalog_url: 'https://muntin.digital/open/', fence: `${FENCE}; ${FENCE2}`, span: sp },
    series: q.map((r) => ({ year: r.year, qtr: r.qtr, code: r.industry_code, wage: r.avg_wkly_wage, emp: r.avg_employment })),
  };
  const breadcrumb = JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://muntin.digital/' },
    { '@type': 'ListItem', position: 2, name: 'Open data', item: 'https://muntin.digital/open/' },
    { '@type': 'ListItem', position: 3, name: 'The County Wage Backdrop', item: 'https://muntin.digital/open/labor/' },
  ] });
  const dataset = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Dataset',
    name: 'County restaurant-industry wages & employment (BLS QCEW)',
    description: 'Quarterly average weekly wage, establishments, and employment for private food services (NAICS 722 & 7225) in Montgomery County, MD. A descriptive labor backdrop, never a per-plate labor cost, never in the food index.',
    url: 'https://muntin.digital/open/labor/',
    creator: { '@type': 'Organization', name: 'Muntin Cost Index', url: 'https://muntin.digital/' },
    isBasedOn: { '@type': 'Dataset', name: 'BLS Quarterly Census of Employment and Wages', creator: { '@type': 'GovernmentOrganization', name: 'US Bureau of Labor Statistics' } },
    license: CC0,
    temporalCoverage: sp ? `${sp.y0}/${sp.yN}` : undefined,
    spatialCoverage: { '@type': 'Place', name: 'Montgomery County, MD', identifier: 'FIPS 24031' },
    keywords: ['restaurant wages', 'QCEW', 'food services', 'NAICS 722', 'employment', 'labor backdrop'],
    variableMeasured: [
      { '@type': 'PropertyValue', name: 'avg_wkly_wage', description: 'Average WEEKLY wage for the county food-services industry — a county industry average, never a per-plate labor cost, never an hourly rate.' },
      { '@type': 'PropertyValue', name: 'avg_employment', description: 'Average industry employment in the county; a headcount, never blended into the food index, the pressure math, or the Vendor Benchmark.' },
    ],
    distribution: [
      { '@type': 'DataDownload', name: 'QCEW wages CSV (CC0)', encodingFormat: 'text/csv', contentUrl: 'https://muntin.digital/cost-index/qcew-wages.csv', license: CC0 },
      { '@type': 'DataDownload', name: 'QCEW wages JSON (CC0)', encodingFormat: 'application/json', contentUrl: 'https://muntin.digital/cost-index/qcew-wages.json', license: CC0 },
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
      <h1>The County Wage Backdrop</h1>
    </div>
    <button class="themebtn" id="themeBtn" aria-label="Switch color theme" title="Switch light / dark theme">◐</button>
    <span id="themeLive" class="sr-only" role="status" aria-live="polite"></span>
  </div>
  <p class="lede">Montgomery County, MD restaurant-industry <b>average</b> weekly wage and employment (BLS QCEW, NAICS 722 &amp; 7225). A descriptive backdrop — <b>${FENCE}</b>, and <b>${FENCE2}</b> reference. Not a forecast.<span class="honest" style="margin-top:8px">A weekly wage, never an hourly rate; a county industry average, never a per-plate labor cost. It sits beside the cost data, never inside it.</span></p>
</header>

<main id="main">

  <section class="panel lb-lane" aria-label="How to read this page">
    <p style="margin:0"><b>A separate descriptive lane (ADR-013).</b> This county labor average is never an input to any Muntin price index, pressure reading, or Vendor Benchmark reference — it is a backdrop set beside the cost data, never blended into it. Not a forecast.</p>
  </section>

  <h2>Average weekly wage · ${sp ? sp.from + ' → ' + sp.to : ''}</h2>
  <p class="beat-sub">The county food-services average weekly wage, two industry definitions: the broader <b>Food services &amp; drinking places (722)</b> and the narrower <b>Restaurants &amp; other eating places (7225)</b>. A descriptive backdrop, drawn straight from the quarterly series — no projection line.</p>
  <figure class="panel">
    <div class="legend" aria-hidden="true">
      <span class="sw"><span class="lb-box lb-722"></span> Food services &amp; drinking places (722)</span>
      <span class="sw"><span class="lb-box lb-7225"></span> Restaurants &amp; other eating places (7225)</span>
    </div>
    <div class="lb-scroll">
      <svg id="wage" role="img" width="960" height="360" aria-labelledby="wage-t wage-d">
        <title id="wage-t">County food-services average weekly wage by quarter, two industry definitions.</title>
        <desc id="wage-d">A line chart of the Montgomery County, MD average weekly wage from ${sp ? sp.from : ''} to ${sp ? sp.to : ''}, for NAICS 722 (food services and drinking places) and NAICS 7225 (restaurants and other eating places). Both rise gradually over the period. This is a county industry average, never a per-plate labor cost, and never blended into any price index. Not a forecast.</desc>
      </svg>
    </div>
    <figcaption class="honest" data-audio-alt="County food-services average weekly wage by quarter for NAICS 722 and 7225 — a county industry average, never a per-plate labor cost, never blended into any price index or the Vendor Benchmark.">Average weekly wage by quarter — <b>${FENCE}</b>.</figcaption>
  </figure>

${d ? `  <p class="aha" id="aha">In <span class="mono">2020 Q2</span>, county food-services employment (722) fell from <span class="mono">${d.from.toLocaleString('en-US')}</span> to <span class="mono">${d.to.toLocaleString('en-US')}</span> — about <b>${Math.abs(d.pct)}%</b> — while the average weekly wage barely moved (<span class="mono">${d.wageFrom}</span> → <span class="mono">${d.wageTo}</span>).
    <span class="honest" style="display:block;margin-top:6px">A staffing-mix effect, not a pay cut: when the lowest-paid shifts drop first, the surviving average holds. And this is a weekly wage, never an hourly rate. Descriptive, never a forecast.</span>
  </p>` : ''}

  <h2>Every quarter, as data</h2>
  <p class="nojs-note">This table is the source of record — it works with no JavaScript, and the chart above is an enhancement of it.</p>
  <div class="tablewrap">
    <table class="data" id="tbl">
      <caption>BLS QCEW quarterly average weekly wage, establishments, and employment for private food services in Montgomery County, MD (FIPS 24031), ${sp ? sp.from + '–' + sp.to : ''}. <b>OTY %</b> is the over-the-year wage change, a native QCEW field. A county industry average, never a per-plate labor cost.</caption>
      <thead>
        <tr>
          <th scope="col" class="l">Quarter</th>
          <th scope="col" class="l">Industry</th>
          <th scope="col">Avg weekly wage</th>
          <th scope="col">OTY %</th>
          <th scope="col">Establishments</th>
          <th scope="col">Avg employment</th>
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
      <li><b>One county.</b> Montgomery County covers the Bethesda location; the Arlington, VA location is <em>not</em> in this series. A local backdrop, not a national one.</li>
      <li><b>An average, not a per-plate cost.</b> It is the whole industry's average weekly wage — never a labor cost you can attach to a dish or a menu price.</li>
      <li><b>Weekly, not hourly.</b> A weekly wage conflates hours and staffing mix; a shift in either moves it without any change in pay rate.</li>
      <li><b>Lagged and quarterly.</b> QCEW publishes about two quarters behind; this is a settled record, <b>never a forecast</b>.</li>
      <li><b>A backdrop, fenced off.</b> It is <b>${FENCE2}</b> reference — it sits beside the cost data, never inside it.</li>
    </ul>
  </section>

  <footer class="prov">
    <h2>Provenance &amp; license</h2>
    <div class="provgrid">
      <div><b>Raw feed · CC0</b><br>BLS QCEW (US BLS), public domain. <a href="/data/qcew-wages.json">data/qcew-wages.json</a></div>
      <div><b>Published series · CC0</b><br>A straight reshape. <a href="/cost-index/qcew-wages.csv">qcew-wages.csv</a> · <a href="/cost-index/qcew-wages.json">qcew-wages.json</a></div>
      <div><b>What this is</b><br>A descriptive county labor backdrop — ${FENCE}, ${FENCE2} reference. Not a forecast.</div>
      <div><b>Catalog</b><br><a href="/open/">Full open-data catalog →</a></div>
    </div>
  </footer>

</main>

<script type="application/ld+json">${dataset}</script>
<script type="application/json" id="labor-data">${JSON.stringify(data)}</script>
<script>
(function(){
  "use strict";
  var DATA = JSON.parse(document.getElementById("labor-data").textContent);
  var S = DATA.series;
  function el(tag,attrs,txt){ var e=document.createElementNS("http://www.w3.org/2000/svg",tag); if(attrs) for(var k in attrs) e.setAttribute(k,attrs[k]); if(txt!=null) e.textContent=txt; return e; }
  function clearDraw(svg){ var k=[].slice.call(svg.childNodes); for(var i=0;i<k.length;i++){ var t=k[i].tagName; if(t!=="title"&&t!=="desc") svg.removeChild(k[i]); } }
  function qkey(r){ return r.year + r.qtr/10; }

  function drawWage(){
    var svg=document.getElementById("wage"); clearDraw(svg);
    var W=960,H=360,padL=54,padR=18,padT=16,padB=34;
    var codes=["722","7225"], cls={ "722":"lb-line-722", "7225":"lb-line-7225" };
    var pts={}; codes.forEach(function(c){ pts[c]=S.filter(function(r){return r.code===c;}).sort(function(a,b){return qkey(a)-qkey(b);}); });
    var all=S.map(function(r){return r.wage;}); var minV=Math.min.apply(null,all), maxV=Math.max.apply(null,all);
    minV=Math.floor(minV/50)*50; maxV=Math.ceil(maxV/50)*50;
    var xs=S.map(qkey), x0=Math.min.apply(null,xs), x1=Math.max.apply(null,xs);
    var X=function(k){ return padL+(k-x0)/(x1-x0)*(W-padL-padR); };
    var Y=function(v){ return padT+(1-(v-minV)/(maxV-minV))*(H-padT-padB); };
    // gridlines + y labels
    for(var g=minV; g<=maxV; g+=100){ svg.appendChild(el("line",{x1:padL,y1:Y(g),x2:W-padR,y2:Y(g),class:"lb-grid"})); svg.appendChild(el("text",{x:padL-8,y:Y(g)+4,"text-anchor":"end",class:"lb-tk"}, g)); }
    // year ticks
    var seenY={}; S.forEach(function(r){ if(r.qtr===1&&!seenY[r.year]){ seenY[r.year]=1; svg.appendChild(el("text",{x:X(qkey(r)),y:H-12,"text-anchor":"middle",class:"lb-tk"}, r.year)); } });
    codes.forEach(function(c){ var p=pts[c]; if(!p.length) return; var dd="";
      p.forEach(function(r,i){ dd+=(i?"L":"M")+X(qkey(r)).toFixed(1)+" "+Y(r.wage).toFixed(1)+" "; });
      svg.appendChild(el("path",{d:dd,fill:"none",class:cls[c],"stroke-width":c==="722"?2.4:1.8}));
      var last=p[p.length-1];
      svg.appendChild(el("text",{x:X(qkey(last))+4,y:Y(last.wage)+4,class:cls[c]==="lb-line-722"?"lb-lab-722":"lb-lab-7225"}, c));
    });
  }

  var tb=document.getElementById("themeBtn");
  function curTheme(){ return document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"); }
  tb.addEventListener("click",function(){
    var next=curTheme()==="dark"?"light":"dark";
    document.documentElement.setAttribute("data-theme",next);
    tb.setAttribute("aria-label","Switch to "+(next==="dark"?"light":"dark")+" theme");
    try{ localStorage.setItem("muntin-theme",next); }catch(e){}
    var live=document.getElementById("themeLive"); if(live) live.textContent=(next==="dark"?"Dark":"Light")+" theme on.";
    drawWage();
  });
  try{ var st=localStorage.getItem("muntin-theme"); if(st==="dark"||st==="light"){ document.documentElement.setAttribute("data-theme",st); tb.setAttribute("aria-label","Switch to "+(st==="dark"?"light":"dark")+" theme"); } }catch(e){}
  drawWage();
})();
</script>
`;
}

function HEAD(title, desc, breadcrumb) {
  return `<title>${title}</title>
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta name="description" content="${esc(desc)}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="https://muntin.digital/open/labor/" />
<link rel="alternate" hreflang="en" href="https://muntin.digital/open/labor/" />
<link rel="alternate" hreflang="es" href="https://muntin.digital/es/open/labor/" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital/open/labor/" />
<meta property="og:locale" content="en_US" />
<meta property="og:locale:alternate" content="es_US" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="https://muntin.digital/open/labor/" />
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
@media (forced-colors:active){.lic{border:1px solid CanvasText}.lb-line-722,.lb-line-7225{forced-color-adjust:none}}

/* === page-specific (.lb-*) === */
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
.lb-lane{border-left:3px solid var(--gold)}
.legend{display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-size:12.5px;color:var(--ink-soft);margin:0 0 10px}
.legend .sw{display:inline-flex;align-items:center;gap:6px}
.lb-box{width:22px;height:4px;border-radius:2px;display:inline-block}
.lb-box.lb-722{background:var(--teal-ink)} .lb-box.lb-7225{background:var(--gold)}
.nojs-note{background:var(--surface-2);border:1px dashed var(--line);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--ink-soft);margin:10px 0}
.tablewrap{overflow-x:auto;border:1px solid var(--line);border-radius:14px;background:var(--surface);box-shadow:var(--sh)}
table.data{border-collapse:collapse;width:100%;font-size:13.5px}
table.data caption{text-align:left;padding:12px 14px 4px;color:var(--ink-soft);font-size:13px}
table.data th,table.data td{padding:9px 12px;text-align:right;border-bottom:1px solid var(--line-soft);white-space:nowrap}
table.data th[scope=col]{position:sticky;top:0;background:var(--surface-2);z-index:1}
table.data th.l,table.data td.l{text-align:left}
.lb-code{color:var(--muted)}
.lb-scroll{overflow-x:auto}
.lb-grid{stroke:var(--line);stroke-width:1}
.lb-tk{fill:var(--muted);font:11px var(--font-mono)}
.lb-line-722{stroke:var(--teal-ink);fill:none} .lb-line-7225{stroke:var(--gold);fill:none}
.lb-lab-722{fill:var(--teal-ink);font:700 12px var(--font-mono)} .lb-lab-7225{fill:var(--gold);font:700 12px var(--font-mono)}
.provgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}
footer.prov{margin-top:40px;border-top:1px solid var(--line);padding-top:20px;color:var(--ink-soft);font-size:13.5px}
footer.prov h2{font-size:17px;margin:0 0 8px}
footer.prov a{word-break:break-word}
.aha{border-left:3px solid var(--gold);padding:6px 0 6px 16px;margin:22px 0;font-family:var(--font-display);font-size:clamp(17px,2.6vw,22px);line-height:1.3;color:var(--ink)}
.aha b{font-weight:700}
@media (max-width:560px){ h2{margin-top:28px} }
</style>
`;

// ---- honesty self-guard: fence literals present, no pressure token, no price-index leak --------------
const REQUIRED_LITERALS = [FENCE, FENCE2, 'never a forecast'];
const PRESSURE_BAN = /pressure_dir|pressure_conf|pressure_dir_es/;
function guardHtml(html) {
  const errs = [];
  for (const lit of REQUIRED_LITERALS) if (!html.includes(lit)) errs.push(`missing required fence literal: "${lit}"`);
  if (PRESSURE_BAN.test(html)) errs.push('a pressure_* token leaked onto the fenced labor backdrop page');
  if (/\bwages? (drove|pushed|caused|forced)\b/i.test(html)) errs.push('a cross-lane causal claim ("wages drove/pushed…") appears in affirmative voice');
  return errs;
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (n, g, w) => { if (JSON.stringify(g) === JSON.stringify(w)) pass++; else { fail++; console.error('  ✗', n, 'got', JSON.stringify(g), 'want', JSON.stringify(w)); } };
  const fake = { src: { area: 'Montgomery County, MD (FIPS 24031)' }, span: { from: '2019 Q1', to: '2025 Q4', y0: 2019, yN: 2025 },
    drop: { from: 31419, to: 18690, pct: -41, wageFrom: 522, wageTo: 495 },
    quarters: [
      { year: 2019, qtr: 1, industry_code: '722', industry: 'Food services & drinking places', avg_wkly_wage: 486, oty_wage_pct_chg: 1.2, establishments: 1873, avg_employment: 31470 },
      { year: 2020, qtr: 1, industry_code: '722', industry: 'Food services & drinking places', avg_wkly_wage: 522, oty_wage_pct_chg: 2.0, establishments: 1900, avg_employment: 31419 },
      { year: 2020, qtr: 2, industry_code: '722', industry: 'Food services & drinking places', avg_wkly_wage: 495, oty_wage_pct_chg: -1.1, establishments: 1850, avg_employment: 18690 },
      { year: 2025, qtr: 4, industry_code: '7225', industry: 'Restaurants & other eating places', avg_wkly_wage: 640, oty_wage_pct_chg: 3.0, establishments: 1700, avg_employment: 30000 },
    ] };
  const html = page(fake);
  eq('fence + forecast literals present', guardHtml(html), []);
  eq('no pressure token', PRESSURE_BAN.test(html), false);
  eq('CC0 chip present (single, not CC-BY)', html.includes('>CC0<') && !html.includes('CC-BY'), true);
  eq('2020 Q2 drop rendered from data (31,419 → 18,690)', html.includes('31,419') && html.includes('18,690') && html.includes('41%'), true);
  eq('drop is a staffing-mix, not a pay cut', html.includes('staffing-mix effect, not a pay cut'), true);
  eq('no invented 32,588', html.includes('32,588'), false);
  eq('server table renders one row per quarter record', (html.match(/<tr><td class="l mono">/g) || []).length, 4);
  if (fs.existsSync(path.join(repo, SRC))) {
    const live = guardHtml(page(model()));
    eq('LIVE page passes the honesty guard', live, []);
  }
  console.log(`build-open-labor-page self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();
if (!fs.existsSync(path.join(repo, SRC))) { console.error(`build-open-labor-page: ${SRC} not found — run scripts/build-qcew-open-data.mjs first.`); process.exit(args.has('--check') ? 0 : 1); }
const html = page(model());
const errs = guardHtml(html);
if (errs.length) { console.error('build-open-labor-page: honesty guard failed:\n  ' + errs.join('\n  ')); process.exit(1); }
if (args.has('--check')) {
  const p = path.join(repo, OUT);
  const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
  if (cur !== html) { console.error(`✗ ${OUT} is stale — run: node scripts/build-open-labor-page.mjs`); process.exit(1); }
  console.log(`✓ ${OUT} in sync.`);
  process.exit(0);
}
fs.mkdirSync(path.dirname(path.join(repo, OUT)), { recursive: true });
fs.writeFileSync(path.join(repo, OUT), html);
console.log(`Wrote ${OUT} — ${model().quarters.length} quarter rows, fenced labor backdrop.`);
