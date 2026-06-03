/**
 * adapter.ts — the POS-agnostic SalesMixAdapter seam.
 *
 * One interface, many sources. Everything downstream (plate-recost's $/week,
 * theoretical-vs-actual variance) consumes `SalesMixRow[]` and never knows
 * whether it came from a CSV upload or a POS webhook. Build order (plan, Pod C):
 *   1. CsvSalesMixAdapter — ships day one, zero external deps. ← here
 *   2. SquareSalesMixAdapter — cleanest OAuth, dominant in the ICP. ← skeleton
 *   3. Toast (start the partner app early — lead time), then Clover.
 *
 * POS tokens are KMS-wrapped (clone migrations/0002_integrations.sql +
 * routes/integrations/quickbooks.ts), read-only scopes, webhooks for
 * near-real-time with a 15-min poll fallback.
 */

import { parseSalesMixCsv, weeklyCovers, type SalesMixRow, type WeeklyCoversOpts } from './sales-mix.js';

export interface SalesMixWindow {
  rows: SalesMixRow[];
  periodDays: number;     // the export/window length, so weeklyCovers can normalize
  source: 'csv' | 'square' | 'toast' | 'clover';
}

export interface SalesMixAdapter {
  readonly source: SalesMixWindow['source'];
  /** Pull (or parse) the sales mix for a window. Implementations normalize to SalesMixRow[]. */
  fetchWindow(orgId: string, opts: { sinceDays?: number }): Promise<SalesMixWindow>;
}

/** Convenience: window → per-week covers keyed for recipe matching. */
export function coversFromWindow(win: SalesMixWindow, opts: Omit<WeeklyCoversOpts, 'periodDays'> = {}): Record<string, number> {
  return weeklyCovers(win.rows, { ...opts, periodDays: win.periodDays });
}

// ---- 1. CSV fallback — ships day one (no POS, no OAuth) -------------------
export class CsvSalesMixAdapter implements SalesMixAdapter {
  readonly source = 'csv' as const;
  constructor(private readText: (orgId: string) => Promise<{ text: string; periodDays: number }>) {}
  async fetchWindow(orgId: string, _opts: { sinceDays?: number } = {}): Promise<SalesMixWindow> {
    const { text, periodDays } = await this.readText(orgId);
    const { rows } = parseSalesMixCsv(text);
    return { rows, periodDays: periodDays > 0 ? periodDays : 7, source: 'csv' };
  }
}

// ---- 2. Square — skeleton (OAuth, read-only orders/catalog) ---------------
// Implement against the Square Orders API (SearchOrders → line items) once the
// OAuth app + KMS token store exist. Read-only scopes: ORDERS_READ,
// ITEMS_READ. Webhook order.updated for near-real-time; 15-min poll fallback.
export class SquareSalesMixAdapter implements SalesMixAdapter {
  readonly source = 'square' as const;
  constructor(private deps: {
    getAccessToken: (orgId: string) => Promise<string>;   // KMS-unwrapped, read-only
    fetchImpl?: typeof fetch;
  }) {}
  async fetchWindow(orgId: string, opts: { sinceDays?: number } = {}): Promise<SalesMixWindow> {
    const sinceDays = opts.sinceDays ?? 7;
    // const token = await this.deps.getAccessToken(orgId);
    // POST https://connect.squareup.com/v2/orders/search { query: { filter: { date_time_filter:
    //   { closed_at: { start_at: <now - sinceDays> } } } } } → aggregate line_items by name → units.
    // Map to SalesMixRow[] (item, unitsSold, grossSalesCents from base_price_money * quantity).
    void orgId;
    throw new Error('SquareSalesMixAdapter: implement against Square Orders API once the OAuth app + KMS token store exist.');
    // eslint-disable-next-line no-unreachable
    return { rows: [], periodDays: sinceDays, source: 'square' };
  }
}
