#!/usr/bin/env node
/**
 * build-market-ground-truth.mjs — every market claim this company has ever
 * written down, harvested from both repos, dated, and joined to whatever
 * verifies it (usually nothing).
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * The 2026-08-07 company audit's completeness critic found that the product repo
 * already holds a dated 12-competitor market analysis naming two live dislocations
 * (Hubdoc shut 2026-05-08; Toast bundling invoice scanning to ~120K restaurants)
 * and that it appeared in ZERO of 235 findings. Nobody has been reading the
 * company's own market work. Prior audits close at 26%; zero closures ever came
 * from anyone working a written list. Prose plans go stale because nothing can
 * consume them — this repo's working architecture is manifest -> injector -> gate,
 * and artifacts written as DATA get built on.
 *
 * So this is not a market document. It is a HARVESTER:
 *
 *   scripts/build-market-ground-truth.mjs        this scanner
 *   docs/handoff/bones/market-ground-truth.json  the emitted corpus
 *
 * The ONLY hand-authored input is the LEXICON below — a list of company NAMES,
 * not a list of claims. Every claim, every date, every file:line in the output is
 * read off the working tree at run time. Add a competitor to the lexicon and its
 * claims appear; write a new market doc and its claims appear on the next run with
 * no human edit. That is the property a hand-written competitive brief cannot have.
 *
 * WHAT IT MEASURES
 *   1. Every lexicon company named anywhere in either repo, with each claim line,
 *      its file:line, its resolved claim date, and its claim kind.
 *   2. Verification join — a claim is `tracked` only if the competitor appears in
 *      the product repo's competitor-claims baseline, which is the ONLY verification
 *      mechanism either repo owns. Everything else is `asserted-never-verified`.
 *   3. ICP / persona statements, bucketed by the VERTICAL they assert
 *      (restaurant-specific vs vertical-agnostic vs smb-generic), so a company that
 *      coined "restaurant cost intelligence" on one surface and "a coffee shop and a
 *      hardware store" on another renders the contradiction without anyone arguing.
 *   4. Market-sizing / TAM / ARR / burn numbers wherever they are asserted.
 *   5. Competitor price points, separated from Muntin's own price points.
 *
 * ROOT-LIST DISCIPLINE. Both repos are walked from their root. Nothing is
 * hand-picked. Directories are skipped only via SKIP_DIRS below, where every entry
 * states why it is not authored prose, and file types only via TEXT_EXT, which is an
 * allowlist of authored formats. Both lists ship in the output so the scan's blind
 * spots are readable by whoever consumes the JSON. (The "declare roots, justify
 * omissions" rule was learned three times on 2026-07-28, each time by shipping the
 * bug first.)
 *
 * AMBIGUOUS NAMES. "Toast", "Square", "Wave", "Slice", "Ramp", "Sage", "Clover" and
 * "Plate" are ordinary English words and, in a restaurant corpus, ordinary food
 * words. Those lexicon entries carry `ambiguous: true` and only match a line that
 * also carries a market-context token (MARKET_CONTEXT). Precision over recall: an
 * undercount is visible in the output, a corpus full of literal toast is not.
 *
 * DETERMINISM. No clock, no network, no npm, no git. Directory reads are sorted and
 * keys are emitted in a fixed order, so two runs on the same tree are byte-identical
 * — which is what makes `--check` mean anything. Ages are computed against `--as-of`
 * (default AS_OF below), never against `Date.now()`; bumping that constant is a
 * one-line edit and is the honest way to re-age the corpus.
 *
 * DO NOT WIRE THIS INTO check-all.mjs. `--check` asserts that the emitted corpus
 * matches what the scanner currently sees; the corpus is SUPPOSED to move when
 * someone writes a new market doc. Wiring it into the deploy would turn "the founder
 * finally researched a competitor" into a red deploy. Run it by hand at the top of a
 * planning session and commit the diff — the diff is the report.
 *
 * Usage:
 *   node scripts/build-market-ground-truth.mjs             # write the corpus
 *   node scripts/build-market-ground-truth.mjs --check     # exit 1 if output would change
 *   node scripts/build-market-ground-truth.mjs --report    # print the digest to stdout
 *   node scripts/build-market-ground-truth.mjs --self-test # exercise the classifiers
 *   node scripts/build-market-ground-truth.mjs --as-of=YYYY-MM-DD
 *
 * Exit codes:
 *   0 — written / up to date / self-test passed
 *   1 — --check found drift, or the self-test failed, or the product repo is absent
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

/** The two trees this scanner addresses. `product` absent => its claims are simply missing, and the output says so. */
const REPOS = {
  storefront: REPO,
  product: path.resolve(REPO, '..', 'Muntin-Invoice-Decoder'),
};

const OUT = 'docs/handoff/bones/market-ground-truth.json';

/** Default measurement date. Ages are computed against this, never the clock. Bump deliberately. */
const AS_OF = '2026-08-07';

/**
 * The ONLY verification mechanism either repo owns: a baseline of competitor claims
 * with a canonical URL and a substring, checked monthly by a network cron.
 */
const BASELINE_REL = 'scripts/competitor-claims-baseline.json';
const BASELINE_CHECKER = 'scripts/check-competitor-claims.mjs';
const BASELINE_WORKFLOW = '.github/workflows/competitor-claims.yml';

// ---------------------------------------------------------------------------
// Root discipline
// ---------------------------------------------------------------------------

/** Directory names skipped anywhere in either tree. Every entry says why it is not authored prose. */
const SKIP_DIRS = {
  '.git': 'VCS internals — object store, not authored text',
  'node_modules': 'third-party dependency source — not this company’s writing',
  '.next': 'Next.js build output — generated from apps/web sources already scanned',
  '.open-next': 'OpenNext build output — generated',
  'dist': 'build output — generated from sources already scanned',
  'build': 'build output — generated',
  '.wrangler': 'wrangler local state — generated',
  '.venv': 'Python virtualenv — third-party source',
  '__pycache__': 'Python bytecode cache — generated',
  '.pytest_cache': 'pytest cache — generated',
  'coverage': 'coverage report output — generated',
  'playwright-report': 'test-run output — generated',
  'test-results': 'test-run output — generated',
  '.turbo': 'turbo cache — generated',
  'audio': 'storefront MP3 renders — binary; the audio SCRIPTS (audio*.json) live beside the articles and ARE scanned',
};

/** File extensions read. An allowlist of authored formats; everything else (mp3, png, woff, pdf, sqlite) is binary or generated. */
const TEXT_EXT = new Set([
  '.md', '.mdx', '.json', '.html', '.htm', '.txt',
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.yml', '.yaml', '.py', '.sql', '.sh', '.css', '.csv',
]);

/** Files above this are machine-generated data dumps, not authored claims; recorded in the output as skipped. */
const MAX_BYTES = 2_000_000;

/**
 * Two files in the storefront are skipped by exact path.
 *   - this generator: its LEXICON and its self-test literally contain competitor names
 *     and ICP phrases, so scanning it reports the instrument as evidence.
 *   - its own output: reading last run's corpus into this run's corpus is not a style
 *     problem, it is a correctness one — the file would grow on every run and `--check`
 *     would never converge.
 */
const SKIP_FILES = new Set([
  'scripts/build-market-ground-truth.mjs',
  OUT,
]);

/**
 * Where a claim is written, which decides who it can hurt.
 *   public-page  — a reader-facing page or an indexed marketing route. A stale claim here is live.
 *   internal-doc — docs/, runbooks/, ledger-spec/. Wrong here costs a decision, not a customer.
 *   data         — a manifest or fixture.
 *   code         — source, tests, config. Usually a comment.
 */
function surfaceOf(repo, rel) {
  if (/^(docs|runbooks|ledger-spec|tests|infra)\//.test(rel)) return 'internal-doc';
  if (/^(data|assets\/data)\//.test(rel) || /fixtures?\//.test(rel)) return 'data';
  if (repo === 'storefront' && /\.html?$/.test(rel)) return 'public-page';
  if (repo === 'product' && /^apps\/web\/(app|lib)\//.test(rel)) return 'public-page';
  if (/^(scripts|src|apps|packages|services|\.github)\//.test(rel)) return 'code';
  return 'code';
}

// ---------------------------------------------------------------------------
// The lexicon — NAMES ONLY. Never claims. Claims are read from the tree.
// ---------------------------------------------------------------------------

/**
 * kind:
 *   vertical-ops        restaurant back-office platforms (the direct over-scoped rivals)
 *   horizontal-ap       generic AP / receipt-capture tools (restaurant-illiterate)
 *   accounting          the ledger the operator already pays for (integration target AND rival)
 *   pos                 point of sale (bundling threat / integration target)
 *   data-provider       commodity price data (the Cost Index's actual category)
 *   distributor         the sell side — the invoices themselves
 *   web-presence        the retired services line's rivals, kept so retired-line claims are visible
 *   research            market-research houses
 * ambiguous: name is an ordinary English/food word — require MARKET_CONTEXT on the line.
 */
const LEXICON = [
  // --- vertical restaurant ops ---
  { id: 'marginedge',     name: 'MarginEdge',        kind: 'vertical-ops',  patterns: ['marginedge', 'margin edge'] },
  { id: 'restaurant365',  name: 'Restaurant365',     kind: 'vertical-ops',  patterns: ['restaurant365', 'restaurant 365', 'r365'] },
  { id: 'ottimate',       name: 'Ottimate',          kind: 'vertical-ops',  patterns: ['ottimate'] },
  { id: 'plateiq',        name: 'Plate IQ',          kind: 'vertical-ops',  patterns: ['plateiq', 'plate iq', 'plate-iq'] },
  { id: 'xtrachef',       name: 'xtraCHEF',          kind: 'vertical-ops',  patterns: ['xtrachef', 'xtra chef'] },
  { id: 'craftable',      name: 'Craftable',         kind: 'vertical-ops',  patterns: ['craftable'] },
  { id: 'marketman',      name: 'MarketMan',         kind: 'vertical-ops',  patterns: ['marketman', 'market man'] },
  { id: 'supy',           name: 'Supy',              kind: 'vertical-ops',  patterns: ['supy'] },
  { id: 'cheftec',        name: 'ChefTec',           kind: 'vertical-ops',  patterns: ['cheftec'] },
  { id: 'meez',           name: 'meez',              kind: 'vertical-ops',  patterns: ['meez'] },
  { id: 'galley',         name: 'Galley',            kind: 'vertical-ops',  patterns: ['galley solutions'] },
  { id: 'orderly',        name: 'Orderly',           kind: 'vertical-ops',  patterns: ['orderly'], ambiguous: true },
  { id: 'bluecart',       name: 'BlueCart',          kind: 'vertical-ops',  patterns: ['bluecart', 'blue cart'] },
  { id: 'stocktake',      name: 'StockTake Online',  kind: 'vertical-ops',  patterns: ['stocktake online', 'stocktake'] },

  // --- horizontal AP / receipt capture ---
  { id: 'dext',           name: 'Dext',              kind: 'horizontal-ap', patterns: ['dext'] },
  { id: 'hubdoc',         name: 'Hubdoc',            kind: 'horizontal-ap', patterns: ['hubdoc'] },
  { id: 'receiptbank',    name: 'Receipt Bank',      kind: 'horizontal-ap', patterns: ['receipt bank', 'receiptbank'] },
  { id: 'autoentry',      name: 'AutoEntry',         kind: 'horizontal-ap', patterns: ['autoentry', 'auto entry'] },
  { id: 'datamolino',     name: 'Datamolino',        kind: 'horizontal-ap', patterns: ['datamolino'] },
  { id: 'billcom',        name: 'Bill.com',          kind: 'horizontal-ap', patterns: ['bill.com', 'bill com'] },
  { id: 'stampli',        name: 'Stampli',           kind: 'horizontal-ap', patterns: ['stampli'] },
  { id: 'bookeai',        name: 'Booke AI',          kind: 'horizontal-ap', patterns: ['booke ai', 'booke.ai'] },
  { id: 'melio',          name: 'Melio',             kind: 'horizontal-ap', patterns: ['melio'] },
  { id: 'ramp',           name: 'Ramp',              kind: 'horizontal-ap', patterns: ['ramp'], ambiguous: true },
  { id: 'brex',           name: 'Brex',              kind: 'horizontal-ap', patterns: ['brex'] },

  // --- accounting ledgers ---
  { id: 'quickbooks',     name: 'QuickBooks Online', kind: 'accounting',    patterns: ['quickbooks', 'quick books', 'qbo'] },
  { id: 'xero',           name: 'Xero',              kind: 'accounting',    patterns: ['xero'] },
  { id: 'freshbooks',     name: 'FreshBooks',        kind: 'accounting',    patterns: ['freshbooks', 'fresh books'] },
  { id: 'wave',           name: 'Wave',              kind: 'accounting',    patterns: ['wave', 'waveapps'], ambiguous: true },
  { id: 'sage',           name: 'Sage / Sage Intacct', kind: 'accounting',  patterns: ['sage intacct', 'sage'], ambiguous: true },
  { id: 'netsuite',       name: 'NetSuite',          kind: 'accounting',    patterns: ['netsuite', 'net suite'] },

  // --- point of sale ---
  { id: 'toast',          name: 'Toast',             kind: 'pos',           patterns: ['toast'], ambiguous: true },
  { id: 'square',         name: 'Square',            kind: 'pos',           patterns: ['square'], ambiguous: true },
  { id: 'clover',         name: 'Clover',            kind: 'pos',           patterns: ['clover'], ambiguous: true },
  { id: 'lightspeed',     name: 'Lightspeed',        kind: 'pos',           patterns: ['lightspeed', 'light speed'] },
  { id: 'touchbistro',    name: 'TouchBistro',       kind: 'pos',           patterns: ['touchbistro', 'touch bistro'] },
  { id: 'revel',          name: 'Revel Systems',     kind: 'pos',           patterns: ['revel systems'] },
  { id: 'simphony',       name: 'Oracle Simphony',   kind: 'pos',           patterns: ['simphony', 'micros'] },

  // --- commodity price data (the Cost Index's real category) ---
  { id: 'expana',         name: 'Expana',            kind: 'data-provider', patterns: ['expana'] },
  { id: 'urnerbarry',     name: 'Urner Barry',       kind: 'data-provider', patterns: ['urner barry', 'urner-barry'] },
  { id: 'buyersedge',     name: 'Buyers Edge',       kind: 'data-provider', patterns: ['buyers edge', 'buyersedge', 'dining alliance'] },
  { id: 'mintec',         name: 'Mintec',            kind: 'data-provider', patterns: ['mintec'] },

  // --- market research ---
  { id: 'technomic',      name: 'Technomic',         kind: 'research',      patterns: ['technomic'] },
  { id: 'datassential',   name: 'Datassential',      kind: 'research',      patterns: ['datassential'] },
  { id: 'blackbox',       name: 'Black Box Intelligence', kind: 'research', patterns: ['black box intelligence', 'blackbox intelligence'] },
  { id: 'circana',        name: 'Circana',           kind: 'research',      patterns: ['circana'] },
  { id: 'nra',            name: 'National Restaurant Association', kind: 'research', patterns: ['national restaurant association', 'nra'] },

  // --- the sell side (invoice sources, not rivals — but they define the data) ---
  { id: 'sysco',          name: 'Sysco',             kind: 'distributor',   patterns: ['sysco'] },
  { id: 'usfoods',        name: 'US Foods',          kind: 'distributor',   patterns: ['us foods', 'usfoods'] },
  { id: 'pfg',            name: 'Performance Food Group', kind: 'distributor', patterns: ['performance food group', 'performance food', 'pfg'] },
  { id: 'gfs',            name: 'Gordon Food Service', kind: 'distributor',  patterns: ['gordon food', 'gfs'] },
  { id: 'restaurantdepot',name: 'Restaurant Depot',  kind: 'distributor',   patterns: ['restaurant depot'] },
  { id: 'baldor',         name: 'Baldor',            kind: 'distributor',   patterns: ['baldor'] },
  { id: 'chefswarehouse', name: "Chefs' Warehouse",  kind: 'distributor',   patterns: ['chefs warehouse', "chef's warehouse", 'chefswarehouse'] },
  { id: 'imperialdade',   name: 'Imperial Dade',     kind: 'distributor',   patterns: ['imperialdade', 'imperial dade'] },
  { id: 'shamrock',       name: 'Shamrock Foods',    kind: 'distributor',   patterns: ['shamrock'] },

  // --- retired services line (kept so its stale positioning stays visible) ---
  { id: 'squarespace',    name: 'Squarespace',       kind: 'web-presence',  patterns: ['squarespace'] },
  { id: 'wix',            name: 'Wix',               kind: 'web-presence',  patterns: ['wix'] },
  { id: 'shopify',        name: 'Shopify',           kind: 'web-presence',  patterns: ['shopify'] },
  { id: 'bentobox',       name: 'BentoBox',          kind: 'web-presence',  patterns: ['bentobox', 'bento box'] },
  { id: 'popmenu',        name: 'Popmenu',           kind: 'web-presence',  patterns: ['popmenu', 'pop menu'] },
  { id: 'ownercom',       name: 'Owner.com',         kind: 'web-presence',  patterns: ['owner.com'] },
  { id: 'olo',            name: 'Olo',               kind: 'web-presence',  patterns: ['olo'], ambiguous: true },
  { id: 'slice',          name: 'Slice',             kind: 'web-presence',  patterns: ['slice'], ambiguous: true },
];

/** A line must carry one of these for an `ambiguous` lexicon name to count as a market mention. */
const MARKET_CONTEXT = /\b(compet|rival|incumbent|vs\.?|versus|pricing|price[sd]?\b|\$\d|per month|\/mo\b|per location|subscription|saas|platform|pos\b|point of sale|market|vendor|invoice|software|tool|app\b|integrat|bundl|acquir|launch|shut down|sunset|seats?\b|tier|plan\b|onboard|churn|customers?\b|operators?\b|restaurants?\b|merchant)/i;

// ---------------------------------------------------------------------------
// Claim classification — ordered; first match wins.
// ---------------------------------------------------------------------------

const CLAIM_KINDS = [
  { kind: 'dislocation', re: /\b(shut down|shutdown|shut its|sunset|sunsetting|discontinued|end[- ]of[- ]life|acquired|acquisition|rebrand(ed)?|merged|launched|just launched|is dead|now dead|no longer|deprecat)\b/i,
    why: 'a dated market EVENT — the thing that decays fastest and matters most' },
  { kind: 'white-space',  re: /\b(nobody|no one|white ?space|undefended|unserved|underserved|no incumbent|nobody ships|nobody intercepts|gap\b|none of them|cannot follow)\b/i,
    why: 'an assertion that no competitor covers something — the moat claim' },
  { kind: 'pricing',      re: /(\$\s?\d|per month|\/mo\b|per location|per seat|per user|per document|sales-quoted|quoted|free tier|free plan|pricing)/i,
    why: 'a price attributed to someone — verifiable in one browser tab, and the first thing to rot' },
  { kind: 'capability',   re: /\b(does not|doesn.t|cannot|can.t|lacks|only|table[- ]stakes|solved problem|supports?|ships?|offers?|covers?|flags?|catches|reads?|posts?|integrat)\b/i,
    why: 'what a competitor does or does not do — decays on their release cadence' },
  { kind: 'positioning',  re: /\b(vs\.?|versus|against|wedge|moat|differentiat|position|compete|competitor|instead of|rather than|alternative)\b/i,
    why: 'how Muntin frames itself relative to them' },
  { kind: 'mention',      re: /.*/,
    why: 'named without a claim attached — presence, not knowledge' },
];

// ---------------------------------------------------------------------------
// ICP / persona detection
// ---------------------------------------------------------------------------

/** A line is an ICP statement if it matches one of these. `signal` is what it asserts about WHO. */
const ICP_PATTERNS = [
  { id: 'vertical-agnostic',  re: /\bvertical[- ]agnostic|any vertical|not just restaurants|coffee shop and a hardware store|no dependemos del giro|independiente del giro|regardless of (industry|vertical)/i, vertical: 'vertical-agnostic' },
  { id: 'smb-generic',        re: /\b(small business owners|small businesses|smb\b|any small business|dueños de negocios)\b/i, vertical: 'smb-generic' },
  { id: 'restaurant-vertical',re: /\b(restaurant cost intelligence|restaurant[- ]fluent|restaurant operators?|for restaurants|restaurant[- ]shaped|independent restaurants?|chef[- ]owner|taqueri|single[- ]location restaurant)\b/i, vertical: 'restaurant-specific' },
  { id: 'explicit-icp',       re: /\b(icp\b|ideal customer|target (user|customer|buyer|segment)|our buyer|the buyer is|who it.s for|persona|design partner|undefended segment|beachhead)\b/i, vertical: 'unspecified' },
  { id: 'buyer-bookkeeper',   re: /\b(bookkeeper|book-keeper|cpa\b|accountant|contadora|proadvisor)\b.{0,80}\b(wins|recommend|buyer|decide|account|channel|underserved|second user)\b/i, vertical: 'unspecified' },
  { id: 'segment-size',       re: /\b(single[- ]location|one[- ]location|1[-–]3 locations|multi[- ]unit|independent operator|small multi[- ]unit|\d+[- ]table)\b/i, vertical: 'unspecified' },
];

/** Who the line names as the person who buys/decides. Ordered; all matches recorded. */
const BUYER_SIGNALS = [
  { id: 'operator-owner', re: /\b(chef[- ]owner|owner[- ]operator|operator|restaurateur|dueñ[oa])\b/i },
  { id: 'bookkeeper-cpa', re: /\b(bookkeeper|book-keeper|cpa\b|accountant|contadora|proadvisor)\b/i },
  { id: 'gm-manager',     re: /\b(general manager|\bgm\b|kitchen manager|foh manager|front[- ]of[- ]house manager)\b/i },
  { id: 'chef',           re: /\b(executive chef|head chef|chef de cuisine)\b/i },
];

// ---------------------------------------------------------------------------
// Market sizing / money-at-stake detection
// ---------------------------------------------------------------------------

const SIZING_PATTERNS = [
  { id: 'tam',            re: /\b(TAM|SAM|SOM|total addressable|addressable market|market size)\b/ },
  { id: 'install-base',   re: /~?\s?[\d.,]+\s?[KkMm]?\s+(U\.?S\.?\s+)?(restaurants|locations|operators|merchants|customers|establishments)\b/ },
  { id: 'arr-projection', re: /\b(ARR|MRR|revenue projection|annual recurring)\b/ },
  { id: 'burn-capital',   re: /\b(burn|founder equity|personal capital|runway|raise|seed round)\b.{0,60}\$|\$[\d.,]+\s?[kKmM]\b.{0,40}\b(burn|equity|capital|runway)\b/ },
  { id: 'market-share',   re: /\b\d{1,3}(\.\d+)?\s?%\s+(of\s+)?(the\s+)?(market|restaurants|operators|independents|share)\b/i },
];

// ---------------------------------------------------------------------------
// Date resolution
// ---------------------------------------------------------------------------

const ISO_RE = /\b(20\d{2})-(\d{2})-(\d{2})\b/;
const ISO_RE_G = /\b20\d{2}-\d{2}-\d{2}\b/g;

/** File-level date, in ladder order. The `basis` is emitted so a reader can discount it. */
function fileDate(rel, text) {
  const base = path.basename(rel);
  let m = base.match(/(20\d{2}-\d{2}-\d{2})/);
  if (m) return { date: m[1], basis: 'filename' };
  m = rel.match(/(20\d{2}-\d{2}-\d{2})/);
  if (m) return { date: m[1], basis: 'path' };
  const head = text.slice(0, 4000);
  m = head.match(/\*\*Date:?\*\*[^\n]*?(20\d{2}-\d{2}-\d{2})/) || head.match(/^date:\s*['"]?(20\d{2}-\d{2}-\d{2})/im);
  if (m) return { date: m[1], basis: 'frontmatter' };
  m = text.match(/lastFactCheckedISO"?\s*[:=]\s*"(20\d{2}-\d{2}-\d{2})"/);
  if (m) return { date: m[1], basis: 'lastFactCheckedISO' };
  m = text.match(/lastVerifiedISO"?\s*[:=]\s*"(20\d{2}-\d{2}-\d{2})"/);
  if (m) return { date: m[1], basis: 'lastVerifiedISO' };
  m = text.match(/date(Modified|Published)"?\s*[:=]\s*"(20\d{2}-\d{2}-\d{2})/);
  if (m) return { date: m[2], basis: `date${m[1]}` };
  return { date: null, basis: 'none' };
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  const d = (Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000;
  return Number.isFinite(d) ? Math.round(d) : null;
}

// ---------------------------------------------------------------------------
// Text handling
// ---------------------------------------------------------------------------

/** Collapse a raw source line to a readable claim. HTML/JSX tags out, whitespace normal, bounded. */
function normalizeLine(line) {
  let s = line
    .replace(/<[^>]{0,400}>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  s = s.replace(/^[|>\-*#\s]+/, '').trim();
  if (s.length > 420) s = s.slice(0, 417).trimEnd() + '…';
  return s;
}

/** Lines that are code/config scaffolding rather than an authored claim about a company. */
const NOISE_RE = /^(import |export (const|default|type|interface)|const [A-Za-z_$]+ = require|\/\/ eslint|["']use (client|server)["']|\}\s*from|--\s*$)/;

function isNoise(s) {
  if (!s) return true;
  if (s.length < 12) return true;
  if (NOISE_RE.test(s)) return true;
  // A line that is only a URL, path, or identifier carries no claim.
  if (/^[\w./@-]+$/.test(s)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Walker
// ---------------------------------------------------------------------------

function walk(root, onFile, stats, isSelfRepo) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (Object.prototype.hasOwnProperty.call(SKIP_DIRS, e.name)) { stats.dirsSkipped++; continue; }
        stack.push(full);
        continue;
      }
      if (!e.isFile()) continue;
      const ext = path.extname(e.name).toLowerCase();
      if (!TEXT_EXT.has(ext)) { stats.filesSkippedExt++; continue; }
      if (isSelfRepo && SKIP_FILES.has(path.relative(root, full))) { stats.filesSkippedSelf++; continue; }
      let st;
      try { st = fs.statSync(full); } catch { continue; }
      if (st.size > MAX_BYTES) { stats.filesSkippedSize++; stats.oversizeFiles.push(path.relative(root, full)); continue; }
      stats.filesWalked++;
      onFile(full, path.relative(root, full));
    }
  }
}

// ---------------------------------------------------------------------------
// Matchers
// ---------------------------------------------------------------------------

const COMPILED = LEXICON.map((c) => ({
  ...c,
  res: c.patterns.map((p) => new RegExp(`(?<![\\w-])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '[ \\-]?')}(?![\\w-])`, 'i')),
}));

function matchCompetitors(line) {
  const hits = [];
  const ctx = MARKET_CONTEXT.test(line);
  for (const c of COMPILED) {
    if (c.ambiguous && !ctx) continue;
    if (c.res.some((r) => r.test(line))) hits.push(c);
  }
  return hits;
}

function classifyClaim(line) {
  for (const c of CLAIM_KINDS) if (c.re.test(line)) return c.kind;
  return 'mention';
}

function matchIcp(line) {
  const out = [];
  for (const p of ICP_PATTERNS) if (p.re.test(line)) out.push(p);
  return out;
}

function matchBuyers(line) {
  return BUYER_SIGNALS.filter((b) => b.re.test(line)).map((b) => b.id);
}

function matchSizing(line) {
  return SIZING_PATTERNS.filter((p) => p.re.test(line)).map((p) => p.id);
}

/** Price literals on a line, deduped and ordered as written. */
function priceLiterals(line) {
  const out = [];
  const re = /\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?(?:\s?[kKmM]\b)?/g;
  let m;
  while ((m = re.exec(line))) { const v = m[0].replace(/\s+/g, ''); if (!out.includes(v)) out.push(v); }
  return out;
}

// ---------------------------------------------------------------------------
// Verification join
// ---------------------------------------------------------------------------

function loadBaseline() {
  const p = path.join(REPOS.product, BASELINE_REL);
  if (!fs.existsSync(p)) return { present: false, entries: [] };
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return { present: true, entries: Array.isArray(j.entries) ? j.entries : [] };
  } catch (err) {
    return { present: true, parseError: String(err && err.message), entries: [] };
  }
}

/** Map a baseline entry's `competitor` string back onto a lexicon id. */
function lexiconIdFor(nameStr) {
  if (!nameStr) return null;
  for (const c of COMPILED) if (c.res.some((r) => r.test(nameStr))) return c.id;
  return null;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function build(asOf) {
  const stats = {
    filesWalked: 0, dirsSkipped: 0, filesSkippedExt: 0, filesSkippedSize: 0,
    filesSkippedSelf: 0, oversizeFiles: [], linesScanned: 0,
  };

  const byCompetitor = new Map();  // id -> { claims: [] }
  const icpStatements = [];
  const sizingStatements = [];
  const perFileHits = new Map();   // "repo:rel" -> count

  const productPresent = fs.existsSync(REPOS.product);

  for (const [repoName, root] of Object.entries(REPOS)) {
    if (!fs.existsSync(root)) continue;
    walk(root, (full, rel) => {
      let text;
      try { text = fs.readFileSync(full, 'utf8'); } catch { return; }
      if (text.includes('\u0000')) return; // binary that slipped the extension allowlist
      const fd = fileDate(rel, text);
      const lines = text.split('\n');
      stats.linesScanned += lines.length;
      const key = `${repoName}:${rel}`;
      const surface = surfaceOf(repoName, rel);

      for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        if (raw.length > 6000) continue; // minified/generated line
        const norm = normalizeLine(raw);
        if (isNoise(norm)) continue;

        // Date ladder: an ISO date ON the line wins, but only if it is in the past.
        // A FUTURE date on a line is something the line REFERS to (the 2026-11-13
        // launch, a renewal, a deadline) — it is never when the claim was written, and
        // treating it as such silently made half the corpus look freshly researched.
        const lineISO = norm.match(ISO_RE);
        const inlineUsable = lineISO && daysBetween(lineISO[0], asOf) >= 0;
        const claimDate = inlineUsable ? lineISO[0] : fd.date;
        const dateBasis = inlineUsable ? 'inline' : lineISO ? `${fd.basis}(inline-date-is-future)` : fd.basis;
        const source = `${repoName}:${rel}:${i + 1}`;

        // --- competitors ---
        const hits = matchCompetitors(norm);
        if (hits.length) {
          perFileHits.set(key, (perFileHits.get(key) || 0) + hits.length);
          const kind = classifyClaim(norm);
          const prices = priceLiterals(norm);
          const dates = norm.match(ISO_RE_G) || [];
          for (const c of hits) {
            if (!byCompetitor.has(c.id)) byCompetitor.set(c.id, []);
            byCompetitor.get(c.id).push({
              claimKind: kind,
              text: norm,
              source,
              repo: repoName,
              file: rel,
              line: i + 1,
              surface,
              claimDate,
              dateBasis,
              ageDays: daysBetween(claimDate, asOf),
              datesNamedInLine: dates,
              priceLiterals: prices,
              coNamed: hits.filter((h) => h.id !== c.id).map((h) => h.id).sort(),
            });
          }
        }

        // --- ICP / persona ---
        const icp = matchIcp(norm);
        if (icp.length) {
          const verticals = [...new Set(icp.map((p) => p.vertical).filter((v) => v !== 'unspecified'))];
          icpStatements.push({
            patterns: icp.map((p) => p.id).sort(),
            verticalClaim: verticals.length === 0 ? 'unspecified' : verticals.length === 1 ? verticals[0] : 'mixed',
            buyerSignals: matchBuyers(norm),
            text: norm,
            source,
            repo: repoName,
            file: rel,
            line: i + 1,
            surface,
            claimDate,
            dateBasis,
            ageDays: daysBetween(claimDate, asOf),
          });
        }

        // --- market sizing ---
        const sz = matchSizing(norm);
        if (sz.length) {
          sizingStatements.push({
            patterns: sz,
            text: norm,
            source, repo: repoName, file: rel, line: i + 1, surface,
            claimDate, dateBasis, ageDays: daysBetween(claimDate, asOf),
            priceLiterals: priceLiterals(norm),
          });
        }
      }
    }, stats, repoName === 'storefront');
  }

  // ---- verification join ----
  const baseline = loadBaseline();
  const baselineByLex = new Map();
  for (const e of baseline.entries) {
    const id = lexiconIdFor(e.competitor);
    if (!id) continue;
    if (!baselineByLex.has(id)) baselineByLex.set(id, []);
    baselineByLex.get(id).push({
      id: e.id, claim: e.claim, url: e.url, substring: e.substring,
      lastVerifiedISO: e.lastVerifiedISO,
      ageDays: daysBetween(e.lastVerifiedISO, asOf),
      page: e.page,
    });
  }

  // ---- assemble competitor records ----
  const competitors = [];
  for (const c of COMPILED) {
    const claims = byCompetitor.get(c.id) || [];
    if (!claims.length) continue;
    claims.sort((a, b) => (a.source < b.source ? -1 : a.source > b.source ? 1 : 0));
    const dated = claims.map((x) => x.claimDate).filter(Boolean).sort();
    const files = [...new Set(claims.map((x) => `${x.repo}:${x.file}`))].sort();
    const kinds = {};
    for (const x of claims) kinds[x.claimKind] = (kinds[x.claimKind] || 0) + 1;
    const tracked = baselineByLex.get(c.id) || [];

    // Only substantive claim kinds are worth reading; `mention` is presence, not knowledge.
    const substantive = claims.filter((x) => x.claimKind !== 'mention');

    competitors.push({
      id: c.id,
      name: c.name,
      kind: c.kind,
      ambiguousName: !!c.ambiguous,
      mentionCount: claims.length,
      substantiveClaimCount: substantive.length,
      fileCount: files.length,
      repos: [...new Set(claims.map((x) => x.repo))].sort(),
      claimKinds: Object.fromEntries(Object.entries(kinds).sort()),
      claimDateEarliest: dated[0] || null,
      claimDateLatest: dated[dated.length - 1] || null,
      staleDaysAtLatestClaim: dated.length ? daysBetween(dated[dated.length - 1], asOf) : null,
      undatedClaimCount: claims.filter((x) => !x.claimDate).length,
      verification: {
        status: tracked.length ? 'baseline-tracked' : 'asserted-never-verified',
        mechanism: tracked.length
          ? `${BASELINE_REL} -> ${BASELINE_CHECKER} (monthly cron, network fetch + substring match)`
          : null,
        entries: tracked,
        lastVerifiedISO: tracked.length ? tracked.map((t) => t.lastVerifiedISO).sort()[0] : null,
        verifiedAgeDays: tracked.length ? Math.max(...tracked.map((t) => t.ageDays ?? 0)) : null,
      },
      files,
      claims,
    });
  }
  competitors.sort((a, b) => b.substantiveClaimCount - a.substantiveClaimCount || (a.id < b.id ? -1 : 1));

  // ---- derived cuts ----
  const allClaims = competitors.flatMap((c) => c.claims.map((x) => ({ competitor: c.id, competitorName: c.name, ...x })));
  const uniqBySource = (arr) => {
    const seen = new Set(); const out = [];
    for (const x of arr) { const k = `${x.source}|${x.competitor}`; if (seen.has(k)) continue; seen.add(k); out.push(x); }
    return out;
  };

  const dislocations = uniqBySource(allClaims.filter((x) => x.claimKind === 'dislocation'))
    .sort((a, b) => (a.source < b.source ? -1 : 1));
  const whiteSpace = uniqBySource(allClaims.filter((x) => x.claimKind === 'white-space'))
    .sort((a, b) => (a.source < b.source ? -1 : 1));
  const competitorPricing = uniqBySource(allClaims.filter((x) => x.claimKind === 'pricing' && x.priceLiterals.length))
    .sort((a, b) => (a.source < b.source ? -1 : 1));

  // ---- ICP contradiction matrix ----
  const icpByVertical = {};
  for (const s of icpStatements) {
    icpByVertical[s.verticalClaim] = (icpByVertical[s.verticalClaim] || 0) + 1;
  }
  const icpFilesByVertical = {};
  for (const s of icpStatements) {
    const v = s.verticalClaim;
    if (v === 'unspecified') continue;
    (icpFilesByVertical[v] ||= new Set()).add(`${s.repo}:${s.file}`);
  }
  // A file that asserts BOTH a restaurant-specific and a vertical-agnostic ICP is a
  // contradiction inside one document; a repo that holds both is a contradiction across
  // the company. Both are computed, never asserted.
  const fileVerticals = new Map();
  for (const s of icpStatements) {
    if (s.verticalClaim === 'unspecified') continue;
    const k = `${s.repo}:${s.file}`;
    (fileVerticals.get(k) || fileVerticals.set(k, new Set()).get(k)).add(s.verticalClaim);
  }
  const contradictoryFiles = [...fileVerticals.entries()]
    .filter(([, v]) => v.size > 1)
    .map(([f, v]) => ({ file: f, verticalClaims: [...v].sort() }))
    .sort((a, b) => (a.file < b.file ? -1 : 1));

  const indexedIcpSurfaces = icpStatements.filter((s) => s.surface === 'public-page');

  const tally = (arr, key) => {
    const o = {};
    for (const x of arr) o[x[key]] = (o[x[key]] || 0) + 1;
    return Object.fromEntries(Object.entries(o).sort());
  };

  /**
   * The cut that decides what to fix first: a substantive competitor claim that is
   * (a) on a public page, (b) never verified by the baseline, and (c) older than the
   * baseline's own monthly cadence. Live, unchecked, and stale all at once.
   */
  const trackedIds = new Set([...baselineByLex.keys()]);
  const livePublicStaleClaims = uniqBySource(
    allClaims.filter(
      (x) => x.claimKind !== 'mention' && x.surface === 'public-page' && !trackedIds.has(x.competitor) && (x.ageDays === null || x.ageDays > 30),
    ),
  ).sort((a, b) => (b.ageDays ?? 1e9) - (a.ageDays ?? 1e9) || (a.source < b.source ? -1 : 1));

  // ---- staleness roll-up ----
  const withDates = competitors.filter((c) => c.claimDateLatest);
  const marketDocs = [...new Set(allClaims.filter((x) => x.claimKind !== 'mention').map((x) => `${x.repo}:${x.file}`))].sort();

  const out = {
    _generator: 'scripts/build-market-ground-truth.mjs',
    _why: 'Harvested, not written. The lexicon is names; every claim below is read off the working tree at run time. See the header comment.',
    asOf,
    repos: {
      storefront: { path: 'potentially-profitable', present: true },
      product: { path: 'Muntin-Invoice-Decoder', present: productPresent },
    },
    scan: {
      rootsWalked: Object.keys(REPOS).filter((k) => fs.existsSync(REPOS[k])),
      skipDirs: SKIP_DIRS,
      textExtensions: [...TEXT_EXT].sort(),
      maxFileBytes: MAX_BYTES,
      filesWalked: stats.filesWalked,
      linesScanned: stats.linesScanned,
      dirsSkipped: stats.dirsSkipped,
      filesSkippedByExtension: stats.filesSkippedExt,
      filesSkippedBySize: stats.filesSkippedSize,
      oversizeFilesSkipped: stats.oversizeFiles.sort().slice(0, 40),
    },
    verificationMechanism: {
      baselineFile: `product:${BASELINE_REL}`,
      checker: `product:${BASELINE_CHECKER}`,
      workflow: `product:${BASELINE_WORKFLOW}`,
      baselinePresent: baseline.present,
      baselineEntryCount: baseline.entries.length,
      competitorsTracked: [...baselineByLex.keys()].sort(),
      note: 'This is the ONLY verification either repo owns. It fetches a URL and greps a substring; it never checks whether the claim is TRUE, only whether a string is still on the page. It is informational (never blocks CI) and requires network, which this container does not have.',
    },
    summary: {
      competitorsNamed: competitors.length,
      competitorsWithSubstantiveClaims: competitors.filter((c) => c.substantiveClaimCount > 0).length,
      competitorsVerified: competitors.filter((c) => c.verification.status === 'baseline-tracked').length,
      competitorsUnverified: competitors.filter((c) => c.verification.status !== 'baseline-tracked').length,
      totalClaims: allClaims.length,
      substantiveClaims: allClaims.filter((x) => x.claimKind !== 'mention').length,
      undatedClaims: allClaims.filter((x) => !x.claimDate).length,
      dislocationClaims: dislocations.length,
      whiteSpaceClaims: whiteSpace.length,
      competitorPricingClaims: competitorPricing.length,
      claimsBySurface: tally(allClaims, 'surface'),
      substantiveClaimsBySurface: tally(allClaims.filter((x) => x.claimKind !== 'mention'), 'surface'),
      claimsByKind: tally(allClaims, 'claimKind'),
      claimsByCompetitorKind: tally(allClaims.map((x) => ({ k: (COMPILED.find((c) => c.id === x.competitor) || {}).kind })), 'k'),
      livePublicStaleClaims: livePublicStaleClaims.length,
      icpStatements: icpStatements.length,
      icpByVerticalClaim: Object.fromEntries(Object.entries(icpByVertical).sort()),
      icpBySurface: tally(icpStatements, 'surface'),
      icpContradictoryFiles: contradictoryFiles.length,
      icpStatementsOnIndexedMarketingSurfaces: indexedIcpSurfaces.length,
      marketSizingStatements: sizingStatements.length,
      distinctFilesCarryingSubstantiveClaims: marketDocs.length,
      medianClaimAgeDays: median(allClaims.map((x) => x.ageDays).filter((x) => x !== null)),
      oldestSubstantiveClaimAgeDays: Math.max(0, ...allClaims.filter((x) => x.claimKind !== 'mention' && x.ageDays !== null).map((x) => x.ageDays)),
      newestSubstantiveClaimAgeDays: Math.min(...allClaims.filter((x) => x.claimKind !== 'mention' && x.ageDays !== null).map((x) => x.ageDays).concat([Infinity])),
    },
    staleness: {
      byCompetitor: withDates
        .map((c) => ({ id: c.id, name: c.name, latestClaim: c.claimDateLatest, ageDays: c.staleDaysAtLatestClaim, verification: c.verification.status }))
        .sort((a, b) => b.ageDays - a.ageDays),
      marketDocuments: marketDocs,
    },
    dislocations,
    whiteSpace,
    competitorPricing,
    livePublicStaleClaims,
    icp: {
      byVerticalClaim: Object.fromEntries(Object.entries(icpByVertical).sort()),
      contradictoryFiles,
      onIndexedMarketingSurfaces: indexedIcpSurfaces.sort((a, b) => (a.source < b.source ? -1 : 1)),
      statements: icpStatements.sort((a, b) => (a.source < b.source ? -1 : 1)),
    },
    marketSizing: sizingStatements.sort((a, b) => (a.source < b.source ? -1 : 1)),
    competitors,
  };

  return out;
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// ---------------------------------------------------------------------------
// Self-test — exercises the classifiers on fixed strings, no filesystem.
// ---------------------------------------------------------------------------

function selfTest() {
  const fails = [];
  const eq = (label, got, want) => { if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${label}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };

  // Ambiguous names need market context.
  eq('toast-food', matchCompetitors('I put butter on the toast and ate it').map((c) => c.id), []);
  eq('toast-pos', matchCompetitors('Toast launched AI Invoice Scanning bundled to ~120K restaurants').map((c) => c.id), ['toast']);
  eq('wave-ocean', matchCompetitors('a wave of new produce arrived').map((c) => c.id), []);
  eq('wave-saas', matchCompetitors('Wave runs a free accounting product with paid add-ons pricing').map((c) => c.id), ['wave']);

  // Unambiguous names do not need context.
  eq('marginedge', matchCompetitors('MarginEdge is a restaurant operations platform').map((c) => c.id), ['marginedge']);
  eq('hyphen-guard', matchCompetitors('the dextrose content of the syrup').map((c) => c.id), []);

  // Claim kinds, in priority order.
  eq('kind-disloc', classifyClaim('Hubdoc shut down 8 May 2026'), 'dislocation');
  eq('kind-white', classifyClaim('Pre-post anomaly intercept — Nobody. White space.'), 'white-space');
  eq('kind-price', classifyClaim('Sales-quoted. Reviews report several hundred per location per month.'), 'pricing');
  eq('kind-cap', classifyClaim('MarginEdge supports recipe costing and POS integration'), 'capability');
  eq('kind-mention', classifyClaim('MarginEdge, Restaurant365, Toast'), 'mention');

  // ICP bucketing renders the contradiction rather than arguing it.
  eq('icp-agnostic', matchIcp('We are also vertical-agnostic, so a coffee shop and a hardware store can both use us').map((p) => p.vertical), ['vertical-agnostic']);
  eq('icp-restaurant', matchIcp('restaurant cost intelligence for independent restaurants').map((p) => p.vertical), ['restaurant-specific']);
  eq('icp-smb', matchIcp('Small business owners. Restaurants are the design partner cohort.').map((p) => p.vertical).sort(), ['smb-generic', 'unspecified']);

  // Prices.
  eq('prices', priceLiterals('Solo $25, Team $60, Accountant $150 + $30 per seat'), ['$25', '$60', '$150', '$30']);
  eq('price-range', priceLiterals('roughly $35 to $275 per month'), ['$35', '$275']);

  // Dates.
  eq('days', daysBetween('2026-05-21', '2026-08-07'), 78);
  eq('filedate', fileDate('docs/strategy/2026-07-28-legitimately-useful.md', ''), { date: '2026-07-28', basis: 'filename' });
  eq('frontdate', fileDate('runbooks/x.md', '# T\n\n**Date:** 2026-05-25\n'), { date: '2026-05-25', basis: 'frontmatter' });

  // Noise.
  eq('noise-import', isNoise(normalizeLine('import { ComparisonPage } from "../_components/ComparisonPage";')), true);
  eq('noise-short', isNoise('Toast'), true);

  // Sizing.
  eq('sizing-base', matchSizing('bundled to ~120K U.S. restaurants'), ['install-base']);
  eq('sizing-arr', matchSizing('revenue projection ~$109k ARR'), ['arr-projection']);

  if (fails.length) { console.error('SELF-TEST FAILED:\n  ' + fails.join('\n  ')); return 1; }
  console.log(`self-test OK — ${17} assertions across matchers, classifiers, dates, prices, noise`);
  return 0;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) process.exit(selfTest());

  const asOfArg = argv.find((a) => a.startsWith('--as-of='));
  const asOf = asOfArg ? asOfArg.slice('--as-of='.length) : AS_OF;
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(asOf)) { console.error(`--as-of must be YYYY-MM-DD (got ${asOf})`); process.exit(1); }

  if (!fs.existsSync(REPOS.product)) {
    console.error(`product repo not found at ${REPOS.product} — its market work is the majority of the corpus; refusing to emit a half-scan.`);
    process.exit(1);
  }

  const data = build(asOf);
  const json = JSON.stringify(data, null, 2) + '\n';
  const outPath = path.join(REPO, OUT);

  if (argv.includes('--check')) {
    const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;
    if (prev === json) { console.log(`${OUT} up to date`); process.exit(0); }
    console.error(`${OUT} would change — re-run without --check and commit the diff.`);
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, json);

  const s = data.summary;
  console.log(`wrote ${OUT}`);
  console.log(`  scanned      ${s === undefined ? '?' : data.scan.filesWalked} files / ${data.scan.linesScanned} lines across ${data.scan.rootsWalked.join(' + ')}`);
  console.log(`  competitors  ${s.competitorsNamed} named · ${s.competitorsVerified} verified · ${s.competitorsUnverified} never verified`);
  console.log(`  claims       ${s.totalClaims} total · ${s.substantiveClaims} substantive · ${s.undatedClaims} undated · median age ${s.medianClaimAgeDays}d`);
  console.log(`  dislocations ${s.dislocationClaims} · white-space ${s.whiteSpaceClaims} · competitor prices ${s.competitorPricingClaims}`);
  console.log(`  ICP          ${s.icpStatements} statements · ${JSON.stringify(s.icpByVerticalClaim)} · ${s.icpContradictoryFiles} self-contradicting files`);
  console.log(`  sizing       ${s.marketSizingStatements} market-sizing statements`);

  if (argv.includes('--report')) report(data);
}

function report(d) {
  const pad = (s, n) => String(s).padEnd(n);
  console.log('\n— competitors by substantive claims —');
  console.log(`  ${pad('id', 16)}${pad('kind', 16)}${pad('claims', 8)}${pad('latest', 12)}${pad('age', 7)}verification`);
  for (const c of d.competitors.slice(0, 30)) {
    console.log(`  ${pad(c.id, 16)}${pad(c.kind, 16)}${pad(c.substantiveClaimCount, 8)}${pad(c.claimDateLatest || '—', 12)}${pad((c.staleDaysAtLatestClaim ?? '—') + 'd', 7)}${c.verification.status}`);
  }
  console.log('\n— dislocations (dated market events) —');
  for (const x of d.dislocations.slice(0, 20)) console.log(`  [${x.claimDate || 'undated'}] ${x.competitorName} · ${x.source}\n      ${x.text.slice(0, 170)}`);
  console.log('\n— ICP vertical claims —');
  for (const [k, v] of Object.entries(d.icp.byVerticalClaim)) console.log(`  ${pad(k, 22)}${v}`);
  console.log('\n— files that contradict themselves on the vertical —');
  for (const f of d.icp.contradictoryFiles.slice(0, 25)) console.log(`  ${f.file}  ${f.verticalClaims.join(' vs ')}`);
}

main();
