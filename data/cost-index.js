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
  "generatedAt": "2026-06-06",
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
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "lb",
          "medianCents": 137,
          "rangeCents": [
            137,
            137
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
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
          "nFamilies": 3,
          "nTypes": 3
        },
        "confidence": "medium",
        "label": "About $1.37/lb (wholesale reference, single source — range not yet measurable), up +9.1% over the window. 1+ source(s) for level, 3 for trend.",
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "lb",
          "medianCents": 83,
          "rangeCents": [
            83,
            83
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
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
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "low",
        "label": "About $0.83/lb (wholesale reference, single source — range not yet measurable), down -31.8% over the window. 1+ source(s) for level, 2 for trend.",
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "lb",
          "medianCents": 526,
          "rangeCents": [
            526,
            526
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "noaa",
              "valueCents": 526,
              "date": "2026-03-01"
            }
          ]
        },
        "trend": {
          "pct": -0.2897017060128828,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "low",
        "label": "About $5.26/lb (wholesale reference, single source — range not yet measurable), down -29% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "noaa",
            "valueCents": 526,
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
        "level": {
          "basis": "wholesale",
          "unit": "lb",
          "medianCents": 384,
          "rangeCents": [
            384,
            384
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "noaa",
              "valueCents": 384,
              "date": "2026-03-01"
            }
          ]
        },
        "trend": {
          "pct": -0.0014533402658149803,
          "dir": "flat",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "low",
        "label": "About $3.84/lb (wholesale reference, single source — range not yet measurable), flat -0.1% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "noaa",
            "valueCents": 384,
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "carton",
          "medianCents": 8150,
          "rangeCents": [
            7800,
            8200
          ],
          "nObs": 6,
          "nFamilies": 6,
          "nTypes": 1,
          "nSources": 6,
          "provenance": [
            {
              "source": "usda-ams-baltimore",
              "valueCents": 8200,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "valueCents": 8900,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-detroit",
              "valueCents": 8100,
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
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 2
        },
        "confidence": "medium",
        "label": "About $78.00–$82.00/carton (wholesale reference), up +168.9% over the window. 6+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "valueCents": 8200,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "valueCents": 8900,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "valueCents": 8100,
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
        ]
      },
      "seasonal": true,
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "carton",
          "medianCents": 2275,
          "rangeCents": [
            2063,
            2550
          ],
          "nObs": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "nSources": 8,
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
              "source": "usda-ams-chicago",
              "valueCents": 2350,
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
          "pct": -0.06521739130434782,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2
        },
        "confidence": "medium",
        "label": "About $20.63–$25.50/carton (wholesale reference), down -6.5% over the window. 8+ source(s) for level, 9 for trend.",
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
            "source": "usda-ams-chicago",
            "valueCents": 2350,
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
        ]
      },
      "seasonal": true,
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "sack",
          "medianCents": 2250,
          "rangeCents": [
            2100,
            2475
          ],
          "nObs": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "nSources": 7,
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
              "valueCents": 2250,
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
          "pct": 0.16666666666666666,
          "dir": "up",
          "agreement": 0.714,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1
        },
        "confidence": "low",
        "label": "About $21.00–$24.75/sack (wholesale reference), up +16.7% over the window. 7+ source(s) for level, 7 for trend.",
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
            "valueCents": 2250,
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "sack",
          "medianCents": 1700,
          "rangeCents": [
            1581,
            2038
          ],
          "nObs": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "nSources": 8,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "valueCents": 1750,
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
          "nFamilies": 9,
          "nTypes": 2
        },
        "confidence": "low",
        "label": "About $15.81–$20.38/sack (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "valueCents": 1750,
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "unit": "lb",
          "medianCents": 162,
          "rangeCents": [
            162,
            162
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
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
          "nFamilies": 3,
          "nTypes": 3
        },
        "confidence": "medium",
        "label": "About $1.62/lb (wholesale reference, single source — range not yet measurable), down -11% over the window. 1+ source(s) for level, 3 for trend.",
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 2
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
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 2
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
          "unit": "dozen",
          "medianCents": 225,
          "rangeCents": [
            225,
            225
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nTypes": 1,
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
          "nFamilies": 2,
          "nTypes": 2
        },
        "confidence": "low",
        "label": "About $2.25/dozen (retail reference, single source — range not yet measurable), down -65.7% over the window. 1+ source(s) for level, 2 for trend.",
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 1
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
          "nFamilies": 2,
          "nTypes": 2
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
        ]
      },
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 0
      }
    }
  ]
};
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
