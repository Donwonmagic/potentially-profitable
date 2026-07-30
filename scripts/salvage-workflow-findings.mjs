#!/usr/bin/env node
/**
 * salvage-workflow-findings.mjs — pull the STRUCTURED results out of the ephemeral workflow
 * transcripts and land them in the repo, which is the only thing that survives the container.
 *
 * WHY THIS EXISTS. The discovery run (task #84) cost ~20M subagent tokens across three
 * attempts. Every byte of it lived in two container-only places:
 *   /root/.claude/projects/<session>/subagents/workflows/<run>/   (agent transcripts)
 *   /tmp/claude-0/<session>/tasks/<task>.output                   (result payloads)
 * On 2026-07-30 the /tmp payloads for the first two attempts were ALREADY GONE — the 1.1MB
 * run-1 result and the run-2 result had been reclaimed while the work was still unfinished.
 * Only the per-agent .jsonl transcripts remained. CLAUDE.md says it plainly: the container is
 * ephemeral, only the repo survives. A finding that exists only in /tmp is a finding you have
 * already half-lost.
 *
 * WHAT IT SALVAGES, in priority order:
 *   1. COMPUTED HYPOTHESES — claim + the code that was run + the measured result + outcome +
 *      provenance + caveats. This is the actual product: numbers derived by executing code
 *      against the real files, not model assertions.
 *   2. KILL VERDICTS — the adversarial panel's rulings, with lens and reasoning.
 *   3. METHOD RESEARCH — the FunSearch/AlphaEvolve findings, reusable independent of this run.
 *
 * It is READ-ONLY over the transcripts and safe to run while a workflow is still in flight;
 * re-running simply re-salvages whatever is present, so it can be run again at completion.
 *
 *   node scripts/salvage-workflow-findings.mjs <run-dir> <out-json>
 */
import fs from 'node:fs';
import path from 'node:path';

const [, , runDir, outJson] = process.argv;
if (!runDir || !outJson) { console.error('usage: salvage-workflow-findings.mjs <run-dir> <out-json>'); process.exit(1); }

const seen = new Set();
const hypotheses = [], kills = [], method = [];

/** Structured results arrive as StructuredOutput tool-call inputs inside the agent stream. */
function harvest(obj) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) { for (const x of obj) harvest(x); return; }
  const k = Object.keys(obj);
  const key = JSON.stringify(obj).slice(0, 400);
  if (k.includes('claim') && k.includes('measuredResult')) {
    if (!seen.has(key)) { seen.add(key); hypotheses.push(obj); }
  } else if (k.includes('verdict') && k.includes('lensName')) {
    if (!seen.has(key)) { seen.add(key); kills.push(obj); }
  } else if (k.includes('keyFindings') && k.includes('bottomLine')) {
    if (!seen.has(key)) { seen.add(key); method.push(obj); }
  }
  for (const v of Object.values(obj)) if (v && typeof v === 'object') harvest(v);
}

let files = 0, lines = 0;
for (const f of fs.readdirSync(runDir)) {
  if (!f.endsWith('.jsonl')) continue;
  files++;
  for (const line of fs.readFileSync(path.join(runDir, f), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    lines++;
    try { harvest(JSON.parse(line)); } catch { /* partial write mid-flight — skip, never guess */ }
  }
}

const out = {
  _doc: 'Salvaged from ephemeral workflow transcripts by scripts/salvage-workflow-findings.mjs. These are STRUCTURED agent results — computed hypotheses (code executed against real repo files), adversarial kill verdicts, and method research. Committed because the container is ephemeral and these cost ~20M subagent tokens to produce.',
  _warning: 'A hypothesis here is NOT verified unless it carries kill verdicts from a FULL lens panel. The 2026-07-28 run reported 3 "clean survivors" that were merely UNCOVERED — their verifiers had died on a session limit and absence-of-refutation was being counted as survival. Check coverage before republishing anything from this file.',
  salvagedFrom: runDir,
  transcriptFiles: files,
  transcriptLines: lines,
  counts: { hypotheses: hypotheses.length, killVerdicts: kills.length, methodBriefs: method.length },
  outcomes: hypotheses.reduce((a, h) => { const o = String(h.outcome || 'unknown'); a[o] = (a[o] || 0) + 1; return a; }, {}),
  killVerdictTally: kills.reduce((a, k) => { const v = String(k.verdict || 'unknown'); a[v] = (a[v] || 0) + 1; return a; }, {}),
  hypotheses, kills, method,
};
fs.writeFileSync(outJson, JSON.stringify(out, null, 2) + '\n');
console.log(`salvaged ${hypotheses.length} hypotheses, ${kills.length} kill verdicts, ${method.length} method briefs from ${files} transcript file(s) / ${lines} lines -> ${outJson}`);
console.log(`  outcomes: ${JSON.stringify(out.outcomes)}`);
console.log(`  kill verdicts: ${JSON.stringify(out.killVerdictTally)}`);
