/**
 * Cost Index — seed artifact (PREVIEW / illustrative).
 *
 * Sets window.MUNTIN_COST_INDEX. Loaded as a same-origin <script src> so the
 * free tool stays no-fetch (check-tool-no-fetch). Each ingredient carries the
 * RAW engine input (levelObs + sourceSeries + asOf) so tools/_shared/
 * composite-price.js assess() runs live in the browser — the surface renders
 * the real engine, not a pre-baked answer.
 *
 * STATUS: 'preview'. The figures below are ILLUSTRATIVE, not live market data —
 * shown so operators can see what the index reads like. They are labeled
 * illustrative in the UI (fact-check rule c). When the live USDA-AMS / BLS /
 * FRED fetch worker is provisioned (Muntin Ledger, blocked on API keys), this
 * file is replaced by the published, sanitized public artifact and status flips
 * to 'live'. Public sources only — never first-party delivered prices.
 */
(function (root) {
  'use strict';
  var DATA = {
    status: 'preview', // 'preview' (illustrative) until live sources connect
    generatedAt: '2026-06-06',
    ingredients: [
      {
        key: 'romaine',
        label_en: 'Romaine lettuce', label_es: 'Lechuga romana',
        unit_en: 'case', unit_es: 'caja',
        input: {
          asOf: '2026-05-28',
          levelObs: [
            { source: 'usda-ams-terminal', basis: 'wholesale', valueCents: 1390, date: '2026-05-28', family: 'ams' },
            { source: 'shipping-point', basis: 'wholesale', valueCents: 1560, date: '2026-05-27', family: 'shipping' }
          ],
          sourceSeries: {
            'usda-ams-terminal': { basis: 'wholesale', values: [1240, 1310, 1390], family: 'ams' },
            'bls-ppi-veg': { basis: 'index', values: [100, 104, 109], family: 'us-index' },
            'fred-veg': { basis: 'index', values: [200, 209, 219], family: 'us-index' }
          }
        }
      },
      {
        key: 'tomatoes',
        label_en: 'Tomatoes (round)', label_es: 'Jitomate (bola)',
        unit_en: 'case', unit_es: 'caja',
        seasonal: true,
        input: {
          asOf: '2026-05-26',
          levelObs: [
            { source: 'usda-ams-terminal', basis: 'wholesale', valueCents: 1820, date: '2026-05-26', family: 'ams' },
            { source: 'shipping-point', basis: 'wholesale', valueCents: 2040, date: '2026-05-25', family: 'shipping' }
          ],
          sourceSeries: {
            'usda-ams-terminal': { basis: 'wholesale', values: [1450, 1640, 1820], family: 'ams' },
            'bls-ppi-veg': { basis: 'index', values: [100, 110, 122], family: 'us-index' }
          }
        }
      },
      {
        key: 'chicken-breast',
        label_en: 'Chicken breast (boneless)', label_es: 'Pechuga de pollo (sin hueso)',
        unit_en: 'lb', unit_es: 'libra',
        input: {
          asOf: '2026-05-20',
          levelObs: [
            { source: 'usda-ams-poultry', basis: 'wholesale', valueCents: 312, date: '2026-05-20', family: 'ams' }
          ],
          sourceSeries: {
            'usda-ams-poultry': { basis: 'wholesale', values: [305, 309, 312], family: 'ams' },
            'bls-ppi-poultry': { basis: 'index', values: [100, 100.5, 101], family: 'us-index' }
          }
        }
      },
      {
        key: 'butter',
        label_en: 'Butter (AA, bulk)', label_es: 'Mantequilla (AA, a granel)',
        unit_en: 'lb', unit_es: 'libra',
        input: {
          asOf: '2026-05-22',
          levelObs: [
            { source: 'usda-ams-dairy', basis: 'wholesale', valueCents: 268, date: '2026-05-22', family: 'ams' },
            { source: 'cme-spot', basis: 'wholesale', valueCents: 281, date: '2026-05-22', family: 'cme' }
          ],
          sourceSeries: {
            'usda-ams-dairy': { basis: 'wholesale', values: [290, 278, 268], family: 'ams' },
            'bls-ppi-dairy': { basis: 'index', values: [100, 98, 96], family: 'us-index' }
          }
        }
      }
    ]
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
