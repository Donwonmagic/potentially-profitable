/**
 * Cost Index — browser seed (LIVE). GENERATED — do not edit by hand.
 *
 * Written by scripts/build-cost-index-seed.mjs from the fact-gated
 * data/cost-index.json (cleared by check-cost-index-sync.mjs: verified source,
 * in-bounds, fresh, citeable provenance) joined with data/cost-index-labels.json.
 * Sets window.MUNTIN_COST_INDEX; loaded same-origin so the tool stays no-fetch.
 * Each ingredient carries its baked assessment (level / trend / confidence /
 * provenance); tools/_shared/cost-index-ui.js renders it directly.
 */
(function (root) {
  'use strict';
  var DATA = {
  "status": "live",
  "generatedAt": "2026-06-07",
  "ingredients": [
    {
      "key": "ribeye",
      "label_en": "Ribeye",
      "label_es": "Ribeye (bife ancho)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "unit": "lb",
          "medianCents": 1159,
          "rangeCents": [
            1159,
            1159
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 1159,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.30280175394915204,
          "dir": "up",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3
        },
        "confidence": "medium",
        "label": "About $11.59/lb (wholesale reference, single source — range not yet measurable), up +30.3% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 1159,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "basis": "index"
          }
        ]
      },
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.21342031686859272,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "spark": [
        1053,
        1059,
        1075,
        1073,
        1064,
        1086,
        1088,
        1088,
        1057,
        1067,
        1063,
        1091,
        1087,
        1098,
        1112,
        1103,
        1149,
        1188,
        1222,
        1226,
        1229,
        1251,
        1230,
        1274,
        1273,
        1302
      ],
      "spark_meta": {
        "basis": "index",
        "source": "fred",
        "from": "2024-02-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "beef-tenderloin",
      "label_en": "Beef tenderloin",
      "label_es": "Lomo fino de res",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "unit": "lb",
          "medianCents": 1527,
          "rangeCents": [
            1527,
            1527
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 1527,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.028110881436045246,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "medium",
        "label": "About $15.27/lb (wholesale reference, single source — range not yet measurable), up +2.8% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 1527,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ]
      },
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.1915364665696755,
        "retrace": 0.032635768391321096,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "spark": [
        30495,
        30324,
        30185,
        31925,
        31808,
        29642,
        29491,
        30665,
        31950,
        31630,
        33192,
        32569,
        31618,
        33002,
        33240,
        34877,
        34995,
        35500,
        38945,
        35671,
        36060,
        35592,
        36644,
        36800,
        37997,
        37674
      ],
      "spark_meta": {
        "basis": "index",
        "source": "bls",
        "from": "2024-03-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "chicken-breast",
      "label_en": "Chicken breast (boneless)",
      "label_es": "Pechuga de pollo (sin hueso)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-01",
        "level": {
          "basis": "wholesale",
          "medianCents": 137,
          "rangeCents": [
            137,
            137
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-ams-national",
              "valueCents": 137,
              "date": "2026-06-01"
            }
          ]
        },
        "trend": {
          "pct": 0.09086693645517173,
          "dir": "up",
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3
        },
        "confidence": "medium",
        "label": "About $1.37 (wholesale reference, single source — range not yet measurable), up +9.1% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "valueCents": 137,
            "date": "2026-06-01"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "basis": "retail"
          }
        ],
        "history": [
          {
            "date": "2026-02-09",
            "valueCents": 146,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-16",
            "valueCents": 146,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-23",
            "valueCents": 143,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-02",
            "valueCents": 145,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-09",
            "valueCents": 146,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-16",
            "valueCents": 155,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-23",
            "valueCents": 164,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-30",
            "valueCents": 170,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-06",
            "valueCents": 175,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-13",
            "valueCents": 172,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-20",
            "valueCents": 168,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-27",
            "valueCents": 161,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 161,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 159,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 153,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-25",
            "valueCents": 146,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 137,
            "source": "usda-ams-national",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.06164383561643835,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "spark": [
        146,
        146,
        143,
        145,
        146,
        155,
        164,
        170,
        175,
        172,
        168,
        161,
        161,
        159,
        153,
        146,
        137
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-02-09",
        "to": "2026-06-01",
        "n": 17
      }
    },
    {
      "key": "whole-chicken",
      "label_en": "Whole chicken",
      "label_es": "Pollo entero",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-01",
        "level": {
          "basis": "wholesale",
          "medianCents": 83,
          "rangeCents": [
            83,
            83
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-ams-national",
              "valueCents": 83,
              "date": "2026-06-01"
            }
          ]
        },
        "trend": {
          "pct": -0.31766545933487,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "low",
        "label": "About $0.83 (wholesale reference, single source — range not yet measurable), down -31.8% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "valueCents": 83,
            "date": "2026-06-01"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-02-09",
            "valueCents": 121,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-16",
            "valueCents": 120,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-23",
            "valueCents": 116,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-02",
            "valueCents": 105,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-09",
            "valueCents": 99,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-16",
            "valueCents": 98,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-23",
            "valueCents": 96,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-30",
            "valueCents": 98,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-06",
            "valueCents": 100,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-13",
            "valueCents": 93,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-20",
            "valueCents": 90,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-27",
            "valueCents": 90,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 88,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 90,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 87,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-25",
            "valueCents": 83,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 83,
            "source": "usda-ams-national",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.17,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "spark": [
        121,
        120,
        116,
        105,
        99,
        98,
        96,
        98,
        100,
        93,
        90,
        90,
        88,
        90,
        87,
        83,
        83
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-02-09",
        "to": "2026-06-01",
        "n": 17
      }
    },
    {
      "key": "pork-loin",
      "label_en": "Pork loin",
      "label_es": "Lomo de cerdo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "unit": "lb",
          "medianCents": 131,
          "rangeCents": [
            131,
            131
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 131,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.005482818664727041,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "medium",
        "label": "About $1.31/lb (wholesale reference, single source — range not yet measurable), up +0.5% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 131,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.013159355913381455,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        17764,
        17820,
        18185,
        17851,
        18019,
        17790,
        17765,
        17715,
        18010,
        18647,
        18051,
        19760,
        19323,
        18965,
        18686,
        18720,
        18871,
        18859,
        19374,
        19237,
        19106,
        18981,
        19522,
        20037,
        18377,
        18247
      ],
      "spark_meta": {
        "basis": "index",
        "source": "bls",
        "from": "2024-03-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "pork-shoulder",
      "label_en": "Pork shoulder",
      "label_es": "Espaldilla de cerdo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "unit": "lb",
          "medianCents": 186,
          "rangeCents": [
            186,
            186
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 186,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.005482818664727041,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "medium",
        "label": "About $1.86/lb (wholesale reference, single source — range not yet measurable), up +0.5% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 186,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.013159355913381455,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        17764,
        17820,
        18185,
        17851,
        18019,
        17790,
        17765,
        17715,
        18010,
        18647,
        18051,
        19760,
        19323,
        18965,
        18686,
        18720,
        18871,
        18859,
        19374,
        19237,
        19106,
        18981,
        19522,
        20037,
        18377,
        18247
      ],
      "spark_meta": {
        "basis": "index",
        "source": "bls",
        "from": "2024-03-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "salmon-fillet",
      "label_en": "Salmon fillet",
      "label_es": "Filete de salmón",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-04-01",
        "level": {
          "basis": "wholesale",
          "medianCents": 556,
          "rangeCents": [
            556,
            556
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "noaa",
              "valueCents": 556,
              "date": "2026-03-01"
            }
          ]
        },
        "trend": {
          "pct": -0.07564443827006773,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "low",
        "label": "About $5.56 (wholesale reference, single source — range not yet measurable), down -7.6% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "noaa",
            "valueCents": 556,
            "date": "2026-03-01"
          },
          {
            "kind": "trend",
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2025-02-01",
            "valueCents": 601,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2025-03-01",
            "valueCents": 628,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2025-04-01",
            "valueCents": 565,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2025-05-01",
            "valueCents": 570,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2025-06-01",
            "valueCents": 525,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2025-07-01",
            "valueCents": 502,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2025-08-01",
            "valueCents": 470,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2026-01-01",
            "valueCents": 539,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-01",
            "valueCents": 523,
            "source": "noaa",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-01",
            "valueCents": 556,
            "source": "noaa",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.02456140350877193,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 10
      },
      "spark": [
        601,
        628,
        565,
        570,
        525,
        502,
        470,
        539,
        523,
        556
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "noaa",
        "from": "2025-02-01",
        "to": "2026-03-01",
        "n": 10
      }
    },
    {
      "key": "shrimp",
      "label_en": "Shrimp",
      "label_es": "Camarón",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-04-01",
        "level": null,
        "trend": {
          "pct": -0.017379654277408844,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "low",
        "label": "Directional only — no comparable price level. The market moved down -1.7% across 2 source(s).",
        "provenance": [
          {
            "kind": "trend",
            "source": "noaa",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2024-03-01",
            "valueCents": 8142,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-04-01",
            "valueCents": 8362,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-05-01",
            "valueCents": 8238,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-06-01",
            "valueCents": 8322,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-07-01",
            "valueCents": 8520,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-08-01",
            "valueCents": 9112,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-09-01",
            "valueCents": 9984,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-10-01",
            "valueCents": 10521,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-11-01",
            "valueCents": 10667,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2024-12-01",
            "valueCents": 9861,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-01-01",
            "valueCents": 10272,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-02-01",
            "valueCents": 10424,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-03-01",
            "valueCents": 10944,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-04-01",
            "valueCents": 12004,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-05-01",
            "valueCents": 12443,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-06-01",
            "valueCents": 11894,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-07-01",
            "valueCents": 12254,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-08-01",
            "valueCents": 12708,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-09-01",
            "valueCents": 13026,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-10-01",
            "valueCents": 13502,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-11-01",
            "valueCents": 12269,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2025-12-01",
            "valueCents": 11593,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2026-01-01",
            "valueCents": 11593,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2026-02-01",
            "valueCents": 11593,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2026-03-01",
            "valueCents": 11593,
            "source": "bls",
            "basis": "index"
          },
          {
            "date": "2026-04-01",
            "valueCents": 11593,
            "source": "bls",
            "basis": "index"
          }
        ]
      },
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.17564141567792313,
        "retrace": 0.14138646126499776,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "spark": [
        8142,
        8362,
        8238,
        8322,
        8520,
        9112,
        9984,
        10521,
        10667,
        9861,
        10272,
        10424,
        10944,
        12004,
        12443,
        11894,
        12254,
        12708,
        13026,
        13502,
        12269,
        11593,
        11593,
        11593,
        11593,
        11593
      ],
      "spark_meta": {
        "basis": "index",
        "source": "bls",
        "from": "2024-03-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "romaine-lettuce",
      "label_en": "Romaine lettuce",
      "label_es": "Lechuga romana",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "medianCents": 8025,
          "rangeCents": [
            7650,
            8200
          ],
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "valueCents": 7600,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-baltimore",
              "valueCents": 8200,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "valueCents": 8750,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-detroit",
              "valueCents": 8025,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-los-angeles",
              "valueCents": 6050,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-miami",
              "valueCents": 7700,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-new-york",
              "valueCents": 8200,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 1.6885245901639345,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8
        },
        "confidence": "high",
        "label": "About $76.50–$82.00 (wholesale reference), up +168.9% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "valueCents": 7600,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "valueCents": 8200,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "valueCents": 8750,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "valueCents": 8025,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "valueCents": 6050,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "valueCents": 7700,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "valueCents": 8200,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 5650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 6850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 6750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 6750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 6250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 7350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 7450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 7300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 7300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 7350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 7350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 7350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 7350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 7350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 7600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.6703296703296703,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "spark": [
        4275,
        4275,
        4275,
        4350,
        4550,
        4550,
        4550,
        4550,
        4550,
        4550,
        5600,
        5650,
        6850,
        6750,
        6750,
        6250,
        7350,
        7450,
        7300,
        7300,
        7350,
        7350,
        7350,
        7350,
        7350,
        7600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      }
    },
    {
      "key": "tomato",
      "label_en": "Tomatoes (round)",
      "label_es": "Jitomate (bola)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "medianCents": 2200,
          "rangeCents": [
            1975,
            2550
          ],
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "valueCents": 2550,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-baltimore",
              "valueCents": 1800,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "valueCents": 2550,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-detroit",
              "valueCents": 3100,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-los-angeles",
              "valueCents": 2150,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-miami",
              "valueCents": 2200,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-new-york",
              "valueCents": 1575,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": -0.08928571428571429,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8
        },
        "confidence": "medium",
        "label": "About $19.75–$25.50 (wholesale reference), down -8.9% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "valueCents": 2550,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "valueCents": 1800,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "valueCents": 2550,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "valueCents": 3100,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "valueCents": 2150,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "valueCents": 2200,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "valueCents": 1575,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 6850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 6600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 6700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 6700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 6700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 4225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.39644970414201186,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        6850,
        6600,
        6700,
        6700,
        6700,
        4225,
        4700,
        3900,
        3900,
        3350,
        3300,
        3300,
        3300,
        3100,
        3100,
        3100,
        3100,
        2900,
        2900,
        2700,
        2600,
        2450,
        2450,
        2450,
        2550,
        2550
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      }
    },
    {
      "key": "onion",
      "label_en": "Onions",
      "label_es": "Cebolla",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "medianCents": 2375,
          "rangeCents": [
            2175,
            2588
          ],
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "valueCents": 2450,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-baltimore",
              "valueCents": 1950,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "valueCents": 2500,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-chicago",
              "valueCents": 2975,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-detroit",
              "valueCents": 2850,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-los-angeles",
              "valueCents": 1550,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-miami",
              "valueCents": 2300,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-new-york",
              "valueCents": 2250,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.12264150943396226,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8
        },
        "confidence": "high",
        "label": "About $21.75–$25.88 (wholesale reference), up +12.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "valueCents": 2450,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "valueCents": 1950,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "valueCents": 2500,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "valueCents": 2975,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "valueCents": 2850,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "valueCents": 1550,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "valueCents": 2300,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "valueCents": 2250,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "basis": "wholesale"
          }
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 2513,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 2513,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 2513,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2513,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2413,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2413,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2413,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2413,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.025069637883008356,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        2525,
        2525,
        2525,
        2513,
        2513,
        2513,
        2450,
        2525,
        2500,
        2513,
        2500,
        2500,
        2500,
        2500,
        2550,
        2550,
        2450,
        2413,
        2413,
        2375,
        2375,
        2375,
        2375,
        2413,
        2413,
        2450
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      }
    },
    {
      "key": "russet-potato",
      "label_en": "Russet potatoes",
      "label_es": "Papa russet",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-05",
        "level": {
          "basis": "wholesale",
          "medianCents": 1725,
          "rangeCents": [
            1581,
            2038
          ],
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "valueCents": 1800,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-baltimore",
              "valueCents": 1950,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "valueCents": 2425,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-chicago",
              "valueCents": 1650,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-detroit",
              "valueCents": 1525,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-los-angeles",
              "valueCents": 1350,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-miami",
              "valueCents": 2300,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-new-york",
              "valueCents": 1600,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.222,
          "nSources": 9,
          "nFamilies": 9
        },
        "confidence": "low",
        "label": "About $15.81–$20.38 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "valueCents": 1800,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "valueCents": 1950,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "valueCents": 2425,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "valueCents": 1650,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "valueCents": 1525,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "valueCents": 1350,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "valueCents": 2300,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "valueCents": 1600,
            "date": "2026-06-05"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 1763,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 1763,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1763,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1763,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1763,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1763,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.02098695405558707,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        1775,
        1775,
        1775,
        2000,
        1763,
        1763,
        1763,
        1763,
        1763,
        1763,
        1700,
        1700,
        1700,
        1700,
        1700,
        1700,
        1950,
        1700,
        1700,
        1700,
        2050,
        1800,
        1800,
        1800,
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      }
    },
    {
      "key": "butter",
      "label_en": "Butter (AA, bulk)",
      "label_es": "Mantequilla (AA, a granel)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-05-30",
        "level": {
          "basis": "wholesale",
          "medianCents": 162,
          "rangeCents": [
            162,
            162
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 162,
              "date": "2026-05-30"
            }
          ]
        },
        "trend": {
          "pct": -0.10970116457921335,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3
        },
        "confidence": "medium",
        "label": "About $1.62 (wholesale reference, single source — range not yet measurable), down -11% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 162,
            "date": "2026-05-30"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "basis": "retail"
          }
        ],
        "history": [
          {
            "date": "2026-03-14",
            "valueCents": 182,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-21",
            "valueCents": 186,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-28",
            "valueCents": 189,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-04",
            "valueCents": 189,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-11",
            "valueCents": 189,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-18",
            "valueCents": 181,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-25",
            "valueCents": 177,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-02",
            "valueCents": 175,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-09",
            "valueCents": 175,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-16",
            "valueCents": 171,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-23",
            "valueCents": 168,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-30",
            "valueCents": 162,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.136,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 12
      },
      "spark": [
        182,
        186,
        189,
        189,
        189,
        181,
        177,
        175,
        175,
        171,
        168,
        162
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-03-14",
        "to": "2026-05-30",
        "n": 12
      }
    },
    {
      "key": "cheddar-cheese",
      "label_en": "Cheddar cheese",
      "label_es": "Queso cheddar",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-05-30",
        "level": {
          "basis": "wholesale",
          "unit": "lb",
          "medianCents": 166,
          "rangeCents": [
            166,
            166
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 166,
              "date": "2026-05-30"
            }
          ]
        },
        "trend": {
          "pct": 0.12351109907958845,
          "dir": "up",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3
        },
        "confidence": "medium",
        "label": "About $1.66/lb (wholesale reference, single source — range not yet measurable), up +12.4% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 166,
            "date": "2026-05-30"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "basis": "retail"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.061619718309859156,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        573,
        569,
        551,
        555,
        554,
        560,
        576,
        573,
        584,
        568,
        562,
        570,
        554,
        574,
        574,
        591,
        600,
        604,
        612,
        605,
        564,
        579,
        598,
        599,
        597,
        603
      ],
      "spark_meta": {
        "basis": "retail",
        "source": "fred",
        "from": "2024-02-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "eggs",
      "label_en": "Eggs",
      "label_es": "Huevo",
      "unit_en": "dozen",
      "unit_es": "docena",
      "assessment": {
        "asOf": "2026-04-01",
        "level": {
          "basis": "retail",
          "medianCents": 225,
          "rangeCents": [
            225,
            225
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "fred",
              "valueCents": 225,
              "date": "2026-04-01"
            }
          ]
        },
        "trend": {
          "pct": -0.6569520743305018,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "low",
        "label": "About $2.25 (retail reference, single source — range not yet measurable), down -65.7% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "fred",
            "valueCents": 225,
            "date": "2026-04-01"
          },
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "basis": "retail"
          }
        ],
        "history": [
          {
            "date": "2024-02-01",
            "valueCents": 300,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-03-01",
            "valueCents": 299,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-04-01",
            "valueCents": 286,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-05-01",
            "valueCents": 270,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-06-01",
            "valueCents": 272,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-07-01",
            "valueCents": 308,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-08-01",
            "valueCents": 320,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-09-01",
            "valueCents": 382,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-10-01",
            "valueCents": 337,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-11-01",
            "valueCents": 365,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2024-12-01",
            "valueCents": 415,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-01-01",
            "valueCents": 495,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-02-01",
            "valueCents": 590,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-03-01",
            "valueCents": 623,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-04-01",
            "valueCents": 512,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-05-01",
            "valueCents": 455,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-06-01",
            "valueCents": 378,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-07-01",
            "valueCents": 360,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-08-01",
            "valueCents": 359,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-09-01",
            "valueCents": 349,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-11-01",
            "valueCents": 286,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2025-12-01",
            "valueCents": 271,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2026-01-01",
            "valueCents": 258,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2026-02-01",
            "valueCents": 250,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2026-03-01",
            "valueCents": 235,
            "source": "fred",
            "basis": "retail"
          },
          {
            "date": "2026-04-01",
            "valueCents": 225,
            "source": "fred",
            "basis": "retail"
          }
        ]
      },
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.296875,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        300,
        299,
        286,
        270,
        272,
        308,
        320,
        382,
        337,
        365,
        415,
        495,
        590,
        623,
        512,
        455,
        378,
        360,
        359,
        349,
        286,
        271,
        258,
        250,
        235,
        225
      ],
      "spark_meta": {
        "basis": "retail",
        "source": "fred",
        "from": "2024-02-01",
        "to": "2026-04-01",
        "n": 26
      }
    },
    {
      "key": "vegetable-oil",
      "label_en": "Vegetable oil",
      "label_es": "Aceite vegetal",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-04-01",
        "level": null,
        "trend": {
          "pct": 0.1294851749963952,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "directional",
        "label": "Directional only — no comparable price level. The market moved up +12.9% across 2 source(s).",
        "provenance": [
          {
            "kind": "trend",
            "source": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2024-03-01",
            "valueCents": 24006,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-04-01",
            "valueCents": 23890,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-05-01",
            "valueCents": 23494,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-06-01",
            "valueCents": 23555,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-07-01",
            "valueCents": 23866,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-08-01",
            "valueCents": 23431,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-09-01",
            "valueCents": 23496,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-10-01",
            "valueCents": 23577,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-11-01",
            "valueCents": 23808,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2024-12-01",
            "valueCents": 23370,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-01-01",
            "valueCents": 23477,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-02-01",
            "valueCents": 23693,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-03-01",
            "valueCents": 24148,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-04-01",
            "valueCents": 23569,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-05-01",
            "valueCents": 24462,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-06-01",
            "valueCents": 24243,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-07-01",
            "valueCents": 25925,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-08-01",
            "valueCents": 27753,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-09-01",
            "valueCents": 28499,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-10-01",
            "valueCents": 28074,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-11-01",
            "valueCents": 27484,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2025-12-01",
            "valueCents": 27112,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2026-01-01",
            "valueCents": 27113,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2026-02-01",
            "valueCents": 27046,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2026-03-01",
            "valueCents": 29285,
            "source": "fred",
            "basis": "index"
          },
          {
            "date": "2026-04-01",
            "valueCents": 30994,
            "source": "fred",
            "basis": "index"
          }
        ]
      },
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.31458624931076895,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "spark": [
        24006,
        23890,
        23494,
        23555,
        23866,
        23431,
        23496,
        23577,
        23808,
        23370,
        23477,
        23693,
        24148,
        23569,
        24462,
        24243,
        25925,
        27753,
        28499,
        28074,
        27484,
        27112,
        27113,
        27046,
        29285,
        30994
      ],
      "spark_meta": {
        "basis": "index",
        "source": "fred",
        "from": "2024-03-01",
        "to": "2026-04-01",
        "n": 26
      }
    }
  ],
  "drivers": [
    {
      "key": "corn",
      "label_en": "Corn (feed)",
      "label_es": "Maíz (forraje)",
      "kind": "feed-grain",
      "trend": {
        "pct": -0.10505733970690542,
        "dir": "down",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1
      },
      "leads": [
        "chicken-breast",
        "whole-chicken",
        "pork-loin",
        "pork-shoulder",
        "ribeye",
        "beef-tenderloin",
        "eggs"
      ],
      "spark": [
        17061,
        16129,
        17628,
        17092,
        16782,
        16706,
        17057,
        16758,
        17544,
        17697,
        18230,
        17909,
        17878,
        17793,
        16610,
        16572,
        17038,
        16194,
        17241,
        17023,
        17105,
        17006,
        15904,
        15845,
        16961,
        15951
      ]
    },
    {
      "key": "soybeans",
      "label_en": "Soybeans (feed)",
      "label_es": "Soya (forraje)",
      "kind": "feed-grain",
      "trend": {
        "pct": -0.07207624468201937,
        "dir": "down",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1
      },
      "leads": [
        "chicken-breast",
        "whole-chicken",
        "pork-loin",
        "pork-shoulder"
      ],
      "spark": [
        20119,
        19900,
        20438,
        19971,
        19276,
        16871,
        16600,
        16582,
        16883,
        16642,
        17443,
        17389,
        16740,
        17399,
        18106,
        17931,
        16948,
        16785,
        16924,
        16518,
        18726,
        18538,
        17236,
        18743,
        20007,
        19434
      ]
    },
    {
      "key": "diesel",
      "label_en": "Diesel",
      "label_es": "Diésel",
      "kind": "energy",
      "trend": {
        "pct": 3.8372513562386974,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1
      },
      "leads": [],
      "spark": [
        367,
        361,
        354,
        350,
        348,
        346,
        353,
        362,
        368,
        369,
        371,
        381,
        390,
        486,
        507,
        538,
        540,
        564,
        561,
        540,
        535,
        564,
        564,
        560,
        552,
        535
      ]
    },
    {
      "key": "electricity",
      "label_en": "Electricity",
      "label_es": "Electricidad",
      "kind": "energy",
      "trend": {
        "pct": 0.92,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1
      },
      "leads": [],
      "spark": [
        1253,
        1247,
        1235,
        1232,
        1289,
        1337,
        1316,
        1323,
        1289,
        1235,
        1264,
        1282,
        1298,
        1316,
        1289,
        1293,
        1354,
        1405,
        1393,
        1399,
        1349,
        1319,
        1363,
        1364,
        1437,
        1392
      ]
    }
  ]
};
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
