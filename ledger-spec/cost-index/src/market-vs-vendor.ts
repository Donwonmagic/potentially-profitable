/**
 * market-vs-vendor.ts — THE HEADLINE INSIGHT (plan's "ship FIRST").
 *
 *   "Beef is up 18% on your Sysco invoice — but the market only moved 6% this
 *    quarter. Your vendor moved you ~12 points more than the market. Worth a call."
 *   vs.
 *   "Beef is up 7% — and so is the whole market (about 6%). This one's the
 *    market, not your vendor; a re-price is fair."
 *
 * Fuses the three staged engines with ZERO counsel gating (operator's own
 * invoice move + the public composite trend):
 *   - the verdict's per-ingredient % move (vendorPctMove)
 *   - the composite market trend for the same ingredient (composite-price.assess)
 *   - the quality-gated confidence on that trend
 *
 * Output also carries the `seasonal` pass-through that plate-advice uses to
 * recommend HOLD over a re-price on a reverting spike. Pure, deterministic.
 */

import type { CompositeTrend } from './composite-price.js';

export type Attribution = 'market' | 'vendor' | 'mixed' | 'unknown';

export interface MarketVsVendorInput {
  ingredient: string;
  vendorPctMove: number;                 // verdict.delta_pct for this ingredient, e.g. 0.18
  marketTrend: CompositeTrend | null;    // composite trend for the same ingredient
  marketConfidence?: 'high' | 'medium' | 'low' | 'directional';
  seasonal?: boolean;                    // composite says this is a reverting spike
  /** points of move beyond the market that count as "your vendor", default 0.03 (3 pts). */
  vendorExcessThreshold?: number;
}

export interface MarketVsVendorResult {
  attribution: Attribution;
  vendorPctMove: number;
  marketPctMove: number | null;
  excessPct: number | null;     // vendorPctMove − marketPctMove (the "more than the market" gap)
  seasonal: boolean;
  line: string;                 // one operator-facing sentence
}

function pct(p: number): string {
  return (p >= 0 ? '' : '−') + Math.round(Math.abs(p) * 100) + '%';
}
function pts(p: number): string {
  return Math.round(Math.abs(p) * 100) + (Math.round(Math.abs(p) * 100) === 1 ? ' point' : ' points');
}

export function attributeMove(input: MarketVsVendorInput): MarketVsVendorResult {
  const ing = input.ingredient || 'This ingredient';
  const vendorMove = input.vendorPctMove;
  const thr = (typeof input.vendorExcessThreshold === 'number' && input.vendorExcessThreshold >= 0) ? input.vendorExcessThreshold : 0.03;
  const trend = input.marketTrend;
  const conf = input.marketConfidence || 'low';
  const seasonal = !!input.seasonal;

  // No usable market read → don't fabricate one. Say so plainly.
  if (!trend || trend.pct == null || conf === 'low') {
    return {
      attribution: 'unknown',
      vendorPctMove: vendorMove,
      marketPctMove: trend ? trend.pct : null,
      excessPct: null,
      seasonal,
      line: `${ing} is up ${pct(vendorMove)} on your invoice. We don't have a confident market read yet to say whether that's the market or just your vendor.`,
    };
  }

  const marketMove = trend.pct;
  const excess = vendorMove - marketMove;

  // The market fell or held while your vendor raised you → squarely your vendor.
  if (marketMove <= thr && vendorMove > thr) {
    return {
      attribution: 'vendor', vendorPctMove: vendorMove, marketPctMove: marketMove, excessPct: excess, seasonal,
      line: `${ing} is up ${pct(vendorMove)} on your invoice while the market is roughly flat (${pct(marketMove)}). That's your vendor, not the market — worth a call or a quote from someone else.`,
    };
  }

  // Vendor moved materially more than the market → mostly your vendor.
  if (excess > thr) {
    return {
      attribution: 'vendor', vendorPctMove: vendorMove, marketPctMove: marketMove, excessPct: excess, seasonal,
      line: `${ing} is up ${pct(vendorMove)} on your invoice, but the market only moved ${pct(marketMove)}. Your vendor moved you ~${pts(excess)} more than the market${seasonal ? ' — and the market read looks seasonal, so it may ease' : ''}. Worth a call.`,
    };
  }

  // Vendor moved roughly with the market → it's the market.
  if (Math.abs(excess) <= thr) {
    return {
      attribution: 'market', vendorPctMove: vendorMove, marketPctMove: marketMove, excessPct: excess, seasonal,
      line: `${ing} is up ${pct(vendorMove)} — and so is the whole market (about ${pct(marketMove)}). This one's the market, not your vendor${seasonal ? ', and it looks seasonal — holding may be smarter than a re-price' : '; a re-price is fair'}.`,
    };
  }

  // Vendor moved LESS than a rising market → your vendor is actually holding the line.
  return {
    attribution: 'mixed', vendorPctMove: vendorMove, marketPctMove: marketMove, excessPct: excess, seasonal,
    line: `${ing} is up ${pct(vendorMove)} on your invoice, less than the market's ${pct(marketMove)}. Your vendor is holding the line better than the market — no call needed.`,
  };
}
