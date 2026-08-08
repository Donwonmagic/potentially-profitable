#!/usr/bin/env node
/**
 * check-cadence-copy.cjs — no shipped surface may describe the Cost Index as publishing weekly.
 *
 * The dispatch went MONTHLY by founder call 2026-07-09 (the header of
 * .github/workflows/cost-index-dispatch.yml is the source of truth). This is Q-008's verify
 * command, and it is deliberately a SITE WALK rather than a check of three named files.
 *
 * Why it is written this way: Q-008's original verify tested llms.txt, llms-full.txt and
 * build-llms-txt.mjs for the literal string "publishes weekly". That command exited 0 on
 * 2026-08-08 while cost-index/methodology.json still scoped the Index as "Weekly wholesale
 * reference prices", /cost-index/weekly/ described itself as "Every weekly ... edition", the
 * ES catalog JSON-LD was named "weekly editions", and a rendered audio track SPOKE "the weekly
 * Cost Index" aloud. The item's doneWhen said "no shipped surface"; its verify checked three
 * files. That gap is the defect Q-018 exists to close, and this is its worked example.
 *
 * Precision over breadth: a naive "weekly near Cost Index" scan returns 18 hits, of which 15
 * are TRUE statements — EIA's weekly diesel series, USDA's weekly dairy survey, a BLS average
 * WEEKLY WAGE, and dated citations of the real weekly editions that ran through 2026-07-06.
 * So the claim shapes below require the Index to be the SUBJECT and weekly to be its own
 * publication rhythm, and a cadence word sitting next to an ISO date is exempt as history.
 * Rewriting a dated citation to match today's cadence would be the dishonesty this removes.
 *
 * TEETH: verified 2026-08-08 against four reintroductions — "publishes weekly", "the weekly
 * Cost Index", "Cost Index — weekly editions", "ships a weekly edition". 4 of 4 caught.
 *
 *   node scripts/check-cadence-copy.cjs        # exit 1 and name every offending surface
 *
 * .cjs because it uses require(); the repo's .mjs scripts are ESM.
 */
const fs=require('fs'),path=require('path');
// doneWhen: "No shipped surface describes the index cadence as weekly." So this walks the
// SITE, not three named files. Skips are declared; each says why it is not a shipped surface.
const SKIP=new Set(['.git','node_modules','dist','.wrangler','docs','tests','_includes','scripts']);
const ALLOW=[
  /^blog\/cost-index-week-/, /^es\/blog\/cost-index-week-/, /^cost-index\/week-\d/,  // frozen dated editions: they WERE weekly
  /^cost-index\/corrections/, /^es\/cost-index\/corrections/, /^data\/cost-index-corrections\.json$/, // the ledger quotes the wrong copy as the correction
  /^data\/queue(-inbox)?\.json$/,                                                    // carries this item's own title
  /^data\/(link-graph|content-intent|surface-)/, /^feed-llm\.json$/, /^(es\/)?llms-full\.txt$/, // derived indices of the site's own text
];
// A cadence claim names the Index as SUBJECT and weekly as its publication rhythm. Anything
// else that puts "weekly" near the Index is a SOURCE's cadence (EIA's weekly diesel series,
// USDA's weekly dairy survey), a BLS "average weekly wage", or a dated historical citation
// ("the weekly edition of 2026-07-06"), and all three are true statements.
const CLAIMS=[
  /(?:Cost Index|Índice de costos)[^.]{0,40}\b(?:publishes|publish|published|publica|publicado)\b[^.]{0,25}\b(?:weekly|semanal(?:mente)?)\b/i,
  /\b(?:weekly|semanales?)\s+(?:Restaurant\s+|Muntin\s+)*(?:Cost Index|Índice de costos)/i,
  /(?:Cost Index|Índice de costos)[^.]{0,20}[—–-]\s*(?:weekly|semanal(?:es)?)\b/i,
  // "weekly edition" attached to a SPECIFIC DATE is history, not a standing claim —
  // 2026-07-06 really was the last weekly edition, and rewriting a dated citation to match
  // today's cadence would be the dishonesty this item exists to remove. Any ISO date within
  // 30 chars of the cadence word exempts it.
  /(?:Cost Index|Índice de costos)[^.]{0,60}\b(?:weekly|semanal(?:es)?)\s+(?:edition|dispatch|edici[oó]n|despacho)s?\b(?![^.]{0,30}\d{4}-\d{2}-\d{2})/i,
];
const bad=[];
(function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(SKIP.has(e.name))continue;
 const f=path.join(d,e.name), rel=path.relative('.',f).replaceAll('\\','/');
 if(e.isDirectory()){walk(f);continue;}
 if(!/\.(html|txt|json)$/.test(e.name)||ALLOW.some(r=>r.test(rel)))continue;
 const t=fs.readFileSync(f,'utf8').replace(/\/(es\/)?cost-index\/weekly\//g,'[archive-url]'); // a slug is not a claim
 for(const re of CLAIMS){const m=t.match(re); if(m){bad.push(rel+': '+m[0].replace(/\s+/g,' ').trim().slice(0,100));break;}}
}})('.');
if(bad.length) throw new Error(bad.length+' shipped surface(s) still describe the Cost Index cadence as weekly:\n  '+bad.join('\n  '));
console.log('cadence: no shipped surface describes the Cost Index as publishing weekly ('+CLAIMS.length+' claim shapes, '+ALLOW.length+' declared exemptions)');
