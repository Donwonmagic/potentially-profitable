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
  "generatedAt": "2026-06-13",
  "ingredients": [
    {
      "key": "ribeye",
      "label_en": "Ribeye",
      "label_es": "Ribeye (bife ancho)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1274,
          "rangeCents": [
            1227,
            1321
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 1274,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.21333333333333335,
          "dir": "up",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0184
        },
        "confidence": "medium",
        "label": "About $12.27–$13.21 (wholesale reference, single market — band from recent volatility), up +5.2% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 1274,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "type": "fred",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1050,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1077,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1086,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1206,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1164,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1139,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1178,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 986,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1188,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1170,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1143,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1083,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1214,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1212,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1189,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1093,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1107,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1226,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1227,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1121,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1159,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1241,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1230,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1254,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1249,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1274,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "ribeye",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.11461067366579178,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 1699,
      "spark": [
        1050,
        1077,
        1086,
        1206,
        1164,
        1139,
        1178,
        986,
        1188,
        1170,
        1143,
        1083,
        1214,
        1212,
        1189,
        1093,
        1107,
        1226,
        1227,
        1121,
        1159,
        1241,
        1230,
        1254,
        1249,
        1274
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "beef-tenderloin",
      "label_en": "Beef tenderloin",
      "label_es": "Lomo fino de res",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1467,
          "rangeCents": [
            1454,
            1480
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 1467,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.023952095808383235,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0183
        },
        "confidence": "medium",
        "label": "About $14.54–$14.80 (wholesale reference, single market — band from recent volatility), down -0.9% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 1467,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-06",
            "valueCents": 1503,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 1495,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1529,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1552,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1551,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1532,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1487,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1570,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1551,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1498,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1510,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1489,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1486,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1497,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1487,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1512,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1533,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1545,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1519,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1476,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1527,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1476,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1498,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1508,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1500,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1467,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "beef-tenderloin",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.02847682119205298,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 1726,
      "spark": [
        1503,
        1495,
        1529,
        1552,
        1551,
        1532,
        1487,
        1570,
        1551,
        1498,
        1510,
        1489,
        1486,
        1497,
        1487,
        1512,
        1533,
        1545,
        1519,
        1476,
        1527,
        1476,
        1498,
        1508,
        1500,
        1467
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-06",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-06",
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "chicken-breast",
      "label_en": "Chicken breast (boneless)",
      "label_es": "Pechuga de pollo (sin hueso)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-08",
        "level": {
          "basis": "wholesale",
          "medianCents": 136,
          "rangeCents": [
            111,
            156
          ],
          "rangeBasis": "measured",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-national",
              "type": "usda-ams",
              "valueCents": 136,
              "date": "2026-06-08"
            }
          ]
        },
        "trend": {
          "pct": -0.0684931506849315,
          "dir": "down",
          "agreement": 0.333,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.003
        },
        "confidence": "medium",
        "label": "About $1.11–$1.56 (wholesale reference — band from reported market low–high), flat -0.2% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 136,
            "date": "2026-06-08"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "type": "fred",
            "basis": "retail"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 136,
            "source": "usda-ams-national",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "chicken-breast",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.12258064516129032,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 143,
      "spark": [
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
        137,
        136
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-02-16",
        "to": "2026-06-08",
        "n": 17
      },
      "spark_dates": [
        "2026-02-16",
        "2026-02-23",
        "2026-03-02",
        "2026-03-09",
        "2026-03-16",
        "2026-03-23",
        "2026-03-30",
        "2026-04-06",
        "2026-04-13",
        "2026-04-20",
        "2026-04-27",
        "2026-05-04",
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01",
        "2026-06-08"
      ]
    },
    {
      "key": "whole-chicken",
      "label_en": "Whole chicken",
      "label_es": "Pollo entero",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-08",
        "level": {
          "basis": "wholesale",
          "medianCents": 85,
          "rangeCents": [
            72,
            112
          ],
          "rangeBasis": "measured",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-national",
              "type": "usda-ams",
              "valueCents": 85,
              "date": "2026-06-08"
            }
          ]
        },
        "trend": {
          "pct": -0.2916666666666667,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.016300000000000002
        },
        "confidence": "medium",
        "label": "About $0.72–$1.12 (wholesale reference — band from reported market low–high), down -29.1% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 85,
            "date": "2026-06-08"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 85,
            "source": "usda-ams-national",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "whole-chicken",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.1414141414141414,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "tier": "measured",
      "yield": 0.6,
      "epCents": 142,
      "spark": [
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
        83,
        85
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-02-16",
        "to": "2026-06-08",
        "n": 17
      },
      "spark_dates": [
        "2026-02-16",
        "2026-02-23",
        "2026-03-02",
        "2026-03-09",
        "2026-03-16",
        "2026-03-23",
        "2026-03-30",
        "2026-04-06",
        "2026-04-13",
        "2026-04-20",
        "2026-04-27",
        "2026-05-04",
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01",
        "2026-06-08"
      ]
    },
    {
      "key": "pork-loin",
      "label_en": "Pork loin",
      "label_es": "Lomo de cerdo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 95,
          "rangeCents": [
            92,
            98
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 95,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.07954545454545454,
          "dir": "up",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0352
        },
        "confidence": "medium",
        "label": "About $0.92–$0.98 (wholesale reference, single market — band from recent volatility), down -16% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 95,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 88,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 88,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 90,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 92,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 91,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 90,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 92,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 96,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 96,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 92,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 99,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 92,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 91,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "pork-loin",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.03260869565217391,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 112,
      "spark": [
        88,
        94,
        93,
        88,
        90,
        92,
        93,
        95,
        91,
        90,
        92,
        95,
        95,
        93,
        94,
        96,
        96,
        94,
        94,
        92,
        99,
        95,
        92,
        94,
        91,
        95
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "pork-shoulder",
      "label_en": "Pork shoulder",
      "label_es": "Espaldilla de cerdo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 137,
          "rangeCents": [
            129,
            145
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 137,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.014814814814814815,
          "dir": "up",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0461
        },
        "confidence": "medium",
        "label": "About $1.29–$1.45 (wholesale reference, single market — band from recent volatility), down -16% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 137,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 135,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 137,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 139,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 140,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 143,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 142,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 144,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 148,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 148,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 148,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 150,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 147,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 152,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 151,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 152,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 149,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 149,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 149,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 143,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 140,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 147,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 133,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 125,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 124,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 124,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 137,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "pork-shoulder",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.04861111111111111,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 183,
      "spark": [
        135,
        137,
        139,
        140,
        143,
        142,
        144,
        148,
        148,
        148,
        150,
        147,
        152,
        151,
        152,
        149,
        149,
        149,
        143,
        140,
        147,
        133,
        125,
        124,
        124,
        137
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "romaine-lettuce",
      "label_en": "Romaine lettuce",
      "label_es": "Lechuga romana",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 8025,
          "rangeCents": [
            7100,
            8950
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 8300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 8100,
              "date": "2026-06-10"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 8600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 8025,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 5050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 7900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 7950,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.8241758241758241,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.32075
        },
        "confidence": "low",
        "label": "About $71.00–$89.50 (wholesale reference), up +155.3% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 8300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 8100,
            "date": "2026-06-10"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 8600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 8025,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 5050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 7900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 7950,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 8300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 8300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 8300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 8300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 8300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "romaine-lettuce",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.4690265486725664,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 10700,
      "spark": [
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
        7600,
        8300,
        8300,
        8300,
        8300,
        8300
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "tomato",
      "label_en": "Tomatoes (round)",
      "label_es": "Jitomate (bola)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2100,
          "rangeCents": [
            1662,
            2538
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2325,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.48520710059171596,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.4044
        },
        "confidence": "low",
        "label": "About $16.62–$25.38 (wholesale reference), down -11.2% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2325,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 2550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "tomato",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3409090909090909,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.91,
      "epCents": 2308,
      "spark": [
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
        2550,
        2550,
        2350,
        2350,
        2200,
        2175
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "onion",
      "label_en": "Onions",
      "label_es": "Cebolla",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2438,
          "rangeCents": [
            2250,
            2569
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2475,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2975,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.015121368881814564,
          "dir": "down",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.031149999999999997
        },
        "confidence": "medium",
        "label": "About $22.50–$25.69 (wholesale reference), up +16.5% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2475,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2975,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "onion",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.01,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.88,
      "epCents": 2770,
      "spark": [
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
        2450,
        2450,
        2450,
        2450,
        2475,
        2475
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "russet-potato",
      "label_en": "Russet potatoes",
      "label_es": "Papa russet",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1800,
          "rangeCents": [
            1619,
            2263
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1525,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.02098695405558707,
          "dir": "up",
          "agreement": 0.111,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0211
        },
        "confidence": "low",
        "label": "About $16.19–$22.63 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1525,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "russet-potato",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.058823529411764705,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.81,
      "epCents": 2222,
      "spark": [
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
        1800,
        1800,
        1800,
        1800,
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "butter",
      "label_en": "Butter (AA, bulk)",
      "label_es": "Mantequilla (AA, a granel)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 161,
          "rangeCents": [
            156,
            166
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 161,
              "date": "2026-06-06"
            }
          ]
        },
        "trend": {
          "pct": -0.13440860215053763,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0122
        },
        "confidence": "medium",
        "label": "About $1.56–$1.66 (wholesale reference, single market — band from recent volatility), down -10.4% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 161,
            "date": "2026-06-06"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "type": "fred",
            "basis": "retail"
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-06",
            "valueCents": 161,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.14133333333333334,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 12
      },
      "tier": "measured",
      "spark": [
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
        162,
        161
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-03-21",
        "to": "2026-06-06",
        "n": 12
      },
      "spark_dates": [
        "2026-03-21",
        "2026-03-28",
        "2026-04-04",
        "2026-04-11",
        "2026-04-18",
        "2026-04-25",
        "2026-05-02",
        "2026-05-09",
        "2026-05-16",
        "2026-05-23",
        "2026-05-30",
        "2026-06-06"
      ]
    },
    {
      "key": "cheddar-cheese",
      "label_en": "Cheddar cheese",
      "label_es": "Queso cheddar",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 166,
          "rangeCents": [
            165,
            167
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 166,
              "date": "2026-06-06"
            }
          ]
        },
        "trend": {
          "pct": 0.10666666666666667,
          "dir": "up",
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0027
        },
        "confidence": "medium",
        "label": "About $1.65–$1.67 (wholesale reference, single market — band from recent volatility), up +4.9% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 166,
            "date": "2026-06-06"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "type": "fred",
            "basis": "retail"
          }
        ],
        "history": [
          {
            "date": "2026-03-21",
            "valueCents": 150,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-28",
            "valueCents": 156,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-04",
            "valueCents": 159,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-11",
            "valueCents": 161,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-18",
            "valueCents": 162,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-25",
            "valueCents": 165,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-02",
            "valueCents": 165,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-09",
            "valueCents": 165,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-16",
            "valueCents": 166,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-23",
            "valueCents": 166,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-30",
            "valueCents": 166,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-06",
            "valueCents": 166,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.0375,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 12
      },
      "tier": "measured",
      "spark": [
        150,
        156,
        159,
        161,
        162,
        165,
        165,
        165,
        166,
        166,
        166,
        166
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-03-21",
        "to": "2026-06-06",
        "n": 12
      },
      "spark_dates": [
        "2026-03-21",
        "2026-03-28",
        "2026-04-04",
        "2026-04-11",
        "2026-04-18",
        "2026-04-25",
        "2026-05-02",
        "2026-05-09",
        "2026-05-16",
        "2026-05-23",
        "2026-05-30",
        "2026-06-06"
      ]
    },
    {
      "key": "eggs",
      "label_en": "Eggs",
      "label_es": "Huevo",
      "unit_en": "dozen",
      "unit_es": "docena",
      "assessment": {
        "asOf": "2026-06-08",
        "level": {
          "basis": "wholesale",
          "medianCents": 56,
          "rangeCents": [
            51,
            61
          ],
          "rangeBasis": "volatility",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams",
              "type": "usda-ams",
              "valueCents": 56,
              "date": "2026-06-08"
            }
          ]
        },
        "trend": {
          "pct": -0.06666666666666667,
          "dir": "down",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.1271
        },
        "confidence": "medium",
        "label": "About $0.51–$0.61 (wholesale reference, single market — band from recent volatility), down -10.7% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams",
            "type": "usda-ams",
            "valueCents": 56,
            "date": "2026-06-08"
          },
          {
            "kind": "trend",
            "source": "usda-ams",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "type": "fred",
            "basis": "retail"
          }
        ],
        "history": [
          {
            "date": "2026-04-20",
            "valueCents": 60,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-27",
            "valueCents": 50,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 49,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 66,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 66,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-25",
            "valueCents": 60,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 56,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 56,
            "source": "usda-ams",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.01818181818181818,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 8
      },
      "tier": "measured",
      "spark": [
        60,
        50,
        49,
        66,
        66,
        60,
        56,
        56
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams",
        "from": "2026-04-20",
        "to": "2026-06-08",
        "n": 8
      },
      "spark_dates": [
        "2026-04-20",
        "2026-04-27",
        "2026-05-04",
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01",
        "2026-06-08"
      ]
    },
    {
      "key": "bell-pepper",
      "label_en": "Bell pepper",
      "label_es": "Pimiento morrón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2500,
          "rangeCents": [
            2200,
            2800
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-01"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.1691
        },
        "confidence": "medium",
        "label": "About $22.00–$28.00 (wholesale reference), down -3.1% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-01"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "bell-pepper",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.21666666666666667,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.82,
      "epCents": 3049,
      "spark": [
        2350,
        2350,
        2350,
        2525,
        2950,
        2950,
        3000,
        3175,
        3550,
        3550,
        3550,
        3550,
        3550,
        3625,
        3625,
        3500,
        3500,
        3500,
        3100,
        2700,
        2350,
        2350,
        2350,
        2350,
        2350,
        2350
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "broccoli",
      "label_en": "Broccoli",
      "label_es": "Brócoli",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2750,
          "rangeCents": [
            2150,
            3350
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2888,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.2361111111111111,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.2472
        },
        "confidence": "low",
        "label": "About $21.50–$33.50 (wholesale reference), down -34.5% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2888,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3725,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "broccoli",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.25675675675675674,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 4231,
      "spark": [
        3600,
        3600,
        3600,
        3600,
        3725,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3600,
        3000,
        2950,
        3200,
        3200,
        3250,
        3250,
        3250,
        3025,
        3025,
        2750,
        2750,
        2750,
        2750
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "cauliflower",
      "label_en": "Cauliflower",
      "label_es": "Coliflor",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3150,
          "rangeCents": [
            2700,
            3910
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3838,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-08"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4125,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.27924882629107983,
          "dir": "down",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.08535000000000001
        },
        "confidence": "medium",
        "label": "About $27.00–$39.10 (wholesale reference), down -23.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3838,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-08"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4125,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 5325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4063,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4063,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4063,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4063,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4063,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "cauliflower",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.1656521739130435,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.6,
      "epCents": 5250,
      "spark": [
        5325,
        4850,
        4850,
        4600,
        4600,
        4600,
        4600,
        4600,
        4600,
        4600,
        4300,
        4300,
        4300,
        4063,
        4063,
        4063,
        4063,
        4063,
        3838,
        3838,
        3838,
        3838,
        3838,
        3838,
        3838,
        3838
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "spinach",
      "label_en": "Spinach",
      "label_es": "Espinaca",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2219,
          "rangeCents": [
            2100,
            2303
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2388,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2238,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.033949999999999994
        },
        "confidence": "medium",
        "label": "About $21.00–$23.03 (wholesale reference), down -2.2% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2388,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2238,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "spinach",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 2959,
      "spark": [
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "asparagus",
      "label_en": "Asparagus",
      "label_es": "Espárragos",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3750,
          "rangeCents": [
            2738,
            4513
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 4375,
              "date": "2026-06-01"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.46715328467153283,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.1738
        },
        "confidence": "medium",
        "label": "About $27.38–$45.13 (wholesale reference), down -16.3% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 4375,
            "date": "2026-06-01"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 6850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 6850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 6850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 6200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 6200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 6500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 6275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 6450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 6250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 5375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 5375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3738,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "asparagus",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.416,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.55,
      "epCents": 6818,
      "spark": [
        6850,
        6850,
        6850,
        6200,
        6200,
        6500,
        6275,
        6450,
        6250,
        5375,
        5375,
        4450,
        4150,
        4150,
        4150,
        4150,
        3750,
        3750,
        3850,
        3850,
        3950,
        3950,
        3950,
        3950,
        3738,
        3650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "garlic",
      "label_en": "Garlic",
      "label_es": "Ajo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 5550,
          "rangeCents": [
            4700,
            6050
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 5600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 5500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 6200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 6200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5250,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.11811023622047244,
          "dir": "down",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.018500000000000003
        },
        "confidence": "medium",
        "label": "About $47.00–$60.50 (wholesale reference), down -17.3% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 5500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 6200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 6200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5250,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 6350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 6185,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 6185,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 6185,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 6185,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 6185,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 6185,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 6100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 6100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 6100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 6100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "garlic",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.11811023622047244,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.87,
      "epCents": 6379,
      "spark": [
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6350,
        6185,
        6185,
        6185,
        6185,
        6185,
        6185,
        6100,
        6100,
        6100,
        6100,
        5600,
        5600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "carrot",
      "label_en": "Carrot",
      "label_es": "Zanahoria",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3575,
          "rangeCents": [
            3163,
            3900
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3425,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3175,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3975,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3875,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3125,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3725,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.007352941176470588,
          "dir": "up",
          "agreement": 1,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.02835
        },
        "confidence": "medium",
        "label": "About $31.63–$39.00 (wholesale reference), up +19.2% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3425,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3175,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3975,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3875,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3125,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3725,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "carrot",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.007352941176470588,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.82,
      "epCents": 4360,
      "spark": [
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3450,
        3450,
        3450,
        3450,
        3450,
        3450,
        3350,
        3350,
        3350,
        3350,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3425,
        3425
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "corn-on-the-cob",
      "label_en": "Corn on the cob",
      "label_es": "Elote (mazorca)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2550,
          "rangeCents": [
            1756,
            3363
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1625,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.14473684210526316,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.2058
        },
        "confidence": "low",
        "label": "About $17.56–$33.63 (wholesale reference), down -7.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1625,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1463,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1463,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1463,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "corn-on-the-cob",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.08450704225352113,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.28,
      "epCents": 9107,
      "spark": [
        1900,
        1900,
        1700,
        1700,
        1700,
        1775,
        1775,
        1775,
        1775,
        1775,
        1875,
        1575,
        1575,
        1600,
        1550,
        1400,
        1400,
        1400,
        1400,
        1400,
        1450,
        1463,
        1463,
        1463,
        1625,
        1625
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "kale",
      "label_en": "Kale",
      "label_es": "Col rizada (kale)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2200,
          "rangeCents": [
            1800,
            2800
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3625,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.16129032258064516,
          "dir": "up",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.01855
        },
        "confidence": "medium",
        "label": "About $18.00–$28.00 (wholesale reference), up +12.5% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3625,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1800,
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "kale",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 3143,
      "spark": [
        1550,
        1550,
        1550,
        1550,
        1750,
        1750,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "basil",
      "label_en": "Basil",
      "label_es": "Albahaca",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 744,
          "rangeCents": [
            679,
            894
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 688,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 788,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 588,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.333,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $6.79–$8.94 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 688,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 788,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 588,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "basil",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 1488,
      "spark": [
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688,
        688
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "cilantro",
      "label_en": "Cilantro",
      "label_es": "Cilantro",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2675,
          "rangeCents": [
            2400,
            2906
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2325,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2925,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2000,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.32857142857142857,
          "dir": "up",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.1011
        },
        "confidence": "medium",
        "label": "About $24.00–$29.06 (wholesale reference), up +8.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2325,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2925,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2000,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1944,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1944,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1944,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1944,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1944,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2088,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2088,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2088,
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
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "cilantro",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.19598765432098766,
        "retrace": 0.03125,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 3821,
      "spark": [
        1750,
        1750,
        1750,
        1944,
        1944,
        1944,
        1944,
        1944,
        2088,
        2088,
        2088,
        2450,
        2450,
        2450,
        2350,
        2525,
        2525,
        2538,
        2400,
        2400,
        2250,
        2250,
        2250,
        2250,
        2325,
        2325
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "button-mushroom",
      "label_en": "Button mushroom",
      "label_es": "Champiñón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2125,
          "rangeCents": [
            1663,
            2338
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1475,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.444,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $16.63–$23.38 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1475,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "button-mushroom",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.9,
      "epCents": 2361,
      "spark": [
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "sweet-potato",
      "label_en": "Sweet potato",
      "label_es": "Camote",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3400,
          "rangeCents": [
            2475,
            4363
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2125,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4225,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4500,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $24.75–$43.63 (wholesale reference), up +3.7% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2125,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4225,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4500,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "sweet-potato",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 4533,
      "spark": [
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125,
        2125
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "avocado",
      "label_en": "Avocado",
      "label_es": "Aguacate",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 5875,
          "rangeCents": [
            4737,
            7013
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 5850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 6200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 6000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 5900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5400,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.708029197080292,
          "dir": "up",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.06235
        },
        "confidence": "medium",
        "label": "About $47.37–$70.13 (wholesale reference), up +90% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 6200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 6000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 5900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5400,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 5350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 5350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 5350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 6200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 6900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 6900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 6900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 6900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 6450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 6250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 6250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 6250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 6000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "avocado",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.708029197080292,
        "retrace": 0.15217391304347827,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 7833,
      "spark": [
        3425,
        3425,
        3425,
        3425,
        3425,
        3425,
        3425,
        3425,
        3425,
        4350,
        4350,
        4350,
        5350,
        5350,
        5350,
        6200,
        6900,
        6900,
        6900,
        6900,
        6450,
        6250,
        6250,
        6250,
        6000,
        5850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "lemon",
      "label_en": "Lemon",
      "label_es": "Limón amarillo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 4813,
          "rangeCents": [
            3919,
            4948
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 4825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 5300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 5000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 4025,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4900,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.12209302325581395,
          "dir": "up",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0508
        },
        "confidence": "medium",
        "label": "About $39.19–$49.48 (wholesale reference), up +58.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 5300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 5000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 4025,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4900,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "lemon",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.09659090909090909,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.45,
      "epCents": 10696,
      "spark": [
        4300,
        4375,
        4375,
        4400,
        4400,
        4400,
        4400,
        4450,
        4450,
        4450,
        4450,
        4450,
        4550,
        4650,
        4650,
        4650,
        4650,
        4825,
        4825,
        4825,
        4825,
        4825,
        4825,
        4825,
        4825,
        4825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "lime",
      "label_en": "Lime",
      "label_es": "Limón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2950,
          "rangeCents": [
            2619,
            3281
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4850,
              "date": "2026-06-08"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3475,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.3763440860215054,
          "dir": "down",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.20074999999999998
        },
        "confidence": "low",
        "label": "About $26.19–$32.81 (wholesale reference), down -21.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4850,
            "date": "2026-06-08"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3475,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 5125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 5125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 5125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 5125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "lime",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3894736842105263,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.35,
      "epCents": 8429,
      "spark": [
        4650,
        4650,
        4650,
        4750,
        4750,
        4750,
        4750,
        5125,
        5125,
        5125,
        5125,
        4700,
        4775,
        4775,
        4775,
        4400,
        4400,
        4100,
        4100,
        4100,
        3350,
        3050,
        3050,
        3050,
        3050,
        2900
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "pineapple",
      "label_en": "Pineapple",
      "label_es": "Piña",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1625,
          "rangeCents": [
            1569,
            1719
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1775,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.20512820512820512,
          "dir": "down",
          "agreement": 0.222,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.07355
        },
        "confidence": "low",
        "label": "About $15.69–$17.19 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1775,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "pineapple",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.18421052631578946,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 3250,
      "spark": [
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1900,
        1900,
        1900,
        1900,
        1825,
        1825,
        1825,
        1825,
        1825,
        1825,
        1825,
        1825,
        1825,
        1825,
        1550,
        1550,
        1550,
        1550,
        1550,
        1550
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "chicken-thigh",
      "label_en": "Chicken thigh",
      "label_es": "Muslo de pollo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-08",
        "level": {
          "basis": "wholesale",
          "medianCents": 142,
          "rangeCents": [
            75,
            229
          ],
          "rangeBasis": "measured",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-national",
              "type": "usda-ams",
              "valueCents": 142,
              "date": "2026-06-08"
            }
          ]
        },
        "trend": {
          "pct": 0.3523809523809524,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.01455
        },
        "confidence": "medium",
        "label": "About $0.75–$2.29 (wholesale reference — band from reported market low–high), up +1.8% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 142,
            "date": "2026-06-08"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-02-16",
            "valueCents": 105,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-23",
            "valueCents": 108,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-02",
            "valueCents": 111,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-09",
            "valueCents": 117,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-16",
            "valueCents": 123,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-23",
            "valueCents": 127,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-30",
            "valueCents": 129,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-06",
            "valueCents": 129,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-13",
            "valueCents": 129,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-20",
            "valueCents": 131,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-27",
            "valueCents": 133,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 137,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 138,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 137,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-25",
            "valueCents": 140,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 143,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 142,
            "source": "usda-ams-national",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "chicken-thigh",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.15447154471544716,
        "retrace": 0.006993006993006993,
        "elevatedWeeks": 7,
        "nHistory": 17
      },
      "tier": "measured",
      "yield": 0.9,
      "epCents": 158,
      "spark": [
        105,
        108,
        111,
        117,
        123,
        127,
        129,
        129,
        129,
        131,
        133,
        137,
        138,
        137,
        140,
        143,
        142
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-02-16",
        "to": "2026-06-08",
        "n": 17
      },
      "spark_dates": [
        "2026-02-16",
        "2026-02-23",
        "2026-03-02",
        "2026-03-09",
        "2026-03-16",
        "2026-03-23",
        "2026-03-30",
        "2026-04-06",
        "2026-04-13",
        "2026-04-20",
        "2026-04-27",
        "2026-05-04",
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01",
        "2026-06-08"
      ]
    },
    {
      "key": "cucumber",
      "label_en": "Cucumber",
      "label_es": "Pepino",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2100,
          "rangeCents": [
            1838,
            2456
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1925,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2375,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.34513274336283184,
          "dir": "down",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.18615
        },
        "confidence": "medium",
        "label": "About $18.38–$24.56 (wholesale reference), down -22.2% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1925,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2375,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "cucumber",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3728813559322034,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 2211,
      "spark": [
        2825,
        2825,
        3000,
        3000,
        2950,
        2950,
        2950,
        2950,
        2950,
        2950,
        2950,
        2950,
        3050,
        3050,
        3050,
        3050,
        2000,
        1850,
        1850,
        1850,
        1850,
        1850,
        1850,
        1850,
        1850,
        1850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "celery",
      "label_en": "Celery",
      "label_es": "Apio",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3894,
          "rangeCents": [
            3600,
            4082
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3888,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4025,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.15478260869565216,
          "dir": "down",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.26385000000000003
        },
        "confidence": "low",
        "label": "About $36.00–$40.82 (wholesale reference), down -29.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3888,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4025,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4713,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3888,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3888,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "celery",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.19,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 5192,
      "spark": [
        4600,
        4600,
        4600,
        4713,
        4800,
        4800,
        4850,
        4850,
        4850,
        4850,
        4850,
        4850,
        4575,
        3900,
        3900,
        3900,
        3900,
        3900,
        3900,
        3900,
        3850,
        3850,
        3850,
        3850,
        3888,
        3888
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "cabbage",
      "label_en": "Cabbage",
      "label_es": "Repollo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2150,
          "rangeCents": [
            1881,
            2475
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.18199481865284975,
          "dir": "up",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0577
        },
        "confidence": "medium",
        "label": "About $18.81–$24.75 (wholesale reference), up +6.5% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1544,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1544,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1838,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1600,
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
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "cabbage",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.15873015873015872,
        "retrace": 0,
        "elevatedWeeks": 5,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 2688,
      "spark": [
        1544,
        1544,
        1538,
        1838,
        1575,
        1575,
        1575,
        1575,
        1450,
        1450,
        1600,
        1600,
        1600,
        1700,
        1700,
        1700,
        1700,
        1550,
        1550,
        1550,
        1650,
        1825,
        1825,
        1825,
        1825,
        1825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "eggplant",
      "label_en": "Eggplant",
      "label_es": "Berenjena",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2925,
          "rangeCents": [
            2475,
            3463
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3525,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.43103448275862066,
          "dir": "down",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0828
        },
        "confidence": "medium",
        "label": "About $24.75–$34.63 (wholesale reference), down -12.4% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3525,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2100,
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
            "valueCents": 2500,
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
            "valueCents": 2550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3550,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "eggplant",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.35294117647058826,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.81,
      "epCents": 3611,
      "spark": [
        2900,
        2900,
        2900,
        2900,
        2900,
        2100,
        2100,
        2500,
        2500,
        2500,
        2550,
        2550,
        3550,
        3550,
        3550,
        3550,
        3550,
        3550,
        3550,
        3550,
        3150,
        3150,
        3150,
        2900,
        1650,
        1650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "zucchini",
      "label_en": "Zucchini",
      "label_es": "Calabacín",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1825,
          "rangeCents": [
            1263,
            2300
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2925,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.43902439024390244,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.2278
        },
        "confidence": "low",
        "label": "About $12.63–$23.00 (wholesale reference), down -38.9% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2925,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1188,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "zucchini",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.43902439024390244,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 1921,
      "spark": [
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2075,
        1950,
        1950,
        2000,
        2000,
        2000,
        1525,
        1525,
        1525,
        1525,
        1525,
        1525,
        1525,
        950,
        950,
        1150,
        1150,
        1188,
        1150
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "beet",
      "label_en": "Beet",
      "label_es": "Remolacha",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2325,
          "rangeCents": [
            2175,
            2425
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.07407407407407407,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.037450000000000004
        },
        "confidence": "medium",
        "label": "About $21.75–$24.25 (wholesale reference), up +18.9% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2600,
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
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "beet",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.07407407407407407,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 3100,
      "spark": [
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2700,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2500,
        2500
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "leek",
      "label_en": "Leek",
      "label_es": "Puerro",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2975,
          "rangeCents": [
            2675,
            3200
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2875,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3075,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.049586776859504134,
          "dir": "down",
          "agreement": 0.222,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.01675
        },
        "confidence": "low",
        "label": "About $26.75–$32.00 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2875,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3075,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "leek",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.049586776859504134,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 5950,
      "spark": [
        3025,
        3025,
        3025,
        3025,
        3025,
        3025,
        3025,
        3025,
        2800,
        2800,
        2800,
        2800,
        2800,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875,
        2875
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "ginger",
      "label_en": "Ginger root",
      "label_es": "Jengibre",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 4125,
          "rangeCents": [
            3750,
            4750
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 4125,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.03125,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.0278
        },
        "confidence": "medium",
        "label": "About $37.50–$47.50 (wholesale reference), down -18.4% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4125,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "ginger",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.03125,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 4853,
      "spark": [
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4000,
        4125,
        4125,
        4125,
        4125,
        4125,
        4125
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "yellow-squash",
      "label_en": "Yellow squash",
      "label_es": "Calabaza amarilla",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1875,
          "rangeCents": [
            1550,
            2200
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2850,
              "date": "2026-05-11"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.5,
          "dir": "down",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.27975
        },
        "confidence": "low",
        "label": "About $15.50–$22.00 (wholesale reference), down -16.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2850,
            "date": "2026-05-11"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1863,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1863,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1863,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1663,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1138,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1138,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "yellow-squash",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.5,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 1974,
      "spark": [
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2075,
        1950,
        1950,
        1863,
        1863,
        1863,
        1663,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1138,
        1138,
        1250,
        1250,
        1100,
        1100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "jalapeno",
      "label_en": "Jalapeño",
      "label_es": "Chile jalapeño",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2638,
          "rangeCents": [
            2513,
            2850
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3688,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2625,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.5181818181818182,
          "dir": "down",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.34635
        },
        "confidence": "low",
        "label": "About $25.13–$28.50 (wholesale reference), down -5.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3688,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2625,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 5500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3650,
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
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "jalapeno",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.19696969696969696,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 3104,
      "spark": [
        5500,
        3650,
        3650,
        3650,
        3650,
        3650,
        3300,
        2750,
        2750,
        2750,
        2750,
        2675,
        2675,
        2675,
        2675,
        2675,
        2675,
        2675,
        2675,
        2675,
        2250,
        2250,
        2250,
        2250,
        2250,
        2650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "green-onion",
      "label_en": "Green onion",
      "label_es": "Cebollín",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2100,
          "rangeCents": [
            1881,
            2200
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1925,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.08695652173913043,
          "dir": "down",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.1642
        },
        "confidence": "medium",
        "label": "About $18.81–$22.00 (wholesale reference), down -58.3% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1925,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "green-onion",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.023255813953488372,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 3231,
      "spark": [
        2300,
        2300,
        2300,
        2300,
        2300,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        1900,
        1900,
        1900,
        1900,
        1900,
        2100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "green-beans",
      "label_en": "Green beans",
      "label_es": "Ejotes",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3325,
          "rangeCents": [
            3013,
            3625
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-05-27"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.06086956521739131,
          "dir": "up",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.30415000000000003
        },
        "confidence": "low",
        "label": "About $30.13–$36.25 (wholesale reference), down -31.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-05-27"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2088,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3038,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3038,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "green-beans",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.06086956521739131,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.88,
      "epCents": 3778,
      "spark": [
        2875,
        2875,
        3250,
        3250,
        3250,
        2900,
        2900,
        2475,
        2225,
        2088,
        2000,
        2000,
        1950,
        1950,
        1500,
        1650,
        1900,
        1900,
        2900,
        2900,
        3000,
        3000,
        3038,
        3038,
        3175,
        3050
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "parsley",
      "label_en": "Parsley",
      "label_es": "Perejil",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3063,
          "rangeCents": [
            2697,
            3225
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2688,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-05-11"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3025,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.16869565217391305,
          "dir": "up",
          "agreement": 0.333,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.027
        },
        "confidence": "medium",
        "label": "About $26.97–$32.25 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2688,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-05-11"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3025,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2463,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2463,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "parsley",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.16869565217391305,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 4376,
      "spark": [
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2688,
        2688,
        2463,
        2463,
        2688,
        2688
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "brussels-sprouts",
      "label_en": "Brussels sprouts",
      "label_es": "Coles de Bruselas",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3375,
          "rangeCents": [
            2875,
            3669
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3625,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.1320754716981132,
          "dir": "down",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.12285
        },
        "confidence": "medium",
        "label": "About $28.75–$36.69 (wholesale reference), down -41.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3625,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "brussels-sprouts",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.1320754716981132,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 4219,
      "spark": [
        3975,
        3975,
        3975,
        3975,
        3975,
        3975,
        3975,
        3975,
        3975,
        3975,
        4225,
        4075,
        4075,
        4000,
        4000,
        4000,
        4000,
        4000,
        3875,
        3875,
        3875,
        3450,
        3450,
        3450,
        3450,
        3450
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "butternut-squash",
      "label_en": "Butternut squash",
      "label_es": "Calabaza moscada",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2357,
          "rangeCents": [
            1925,
            2769
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2313,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-05-21"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3313,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2975,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.20155844155844155,
          "dir": "up",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0414
        },
        "confidence": "medium",
        "label": "About $19.25–$27.69 (wholesale reference), up +3.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2313,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-05-21"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3313,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2975,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2313,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "butternut-squash",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.20155844155844155,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 3367,
      "spark": [
        1925,
        1925,
        1925,
        1925,
        1925,
        1925,
        1925,
        1925,
        1925,
        1925,
        2250,
        2250,
        2250,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2313
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "iceberg-lettuce",
      "label_en": "Iceberg lettuce",
      "label_es": "Lechuga iceberg",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 5869,
          "rangeCents": [
            5288,
            6450
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 5700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 6300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 7200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5713,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 5350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 6775,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 6025,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.017857142857142856,
          "dir": "up",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.35414999999999996
        },
        "confidence": "low",
        "label": "About $52.88–$64.50 (wholesale reference), up +21.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 6300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 7200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5713,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 5350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 6775,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 6025,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 5000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 5800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "iceberg-lettuce",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.2737430167597765,
        "retrace": 0.017241379310344827,
        "elevatedWeeks": 6,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.74,
      "epCents": 7931,
      "spark": [
        5600,
        5600,
        4425,
        4425,
        4425,
        5000,
        4950,
        4875,
        4875,
        4400,
        4400,
        4475,
        3650,
        3325,
        3325,
        3450,
        3950,
        3950,
        3950,
        3950,
        5800,
        5700,
        5700,
        5700,
        5700,
        5700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "bok-choy",
      "label_en": "Bok choy",
      "label_es": "Bok choy",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3313,
          "rangeCents": [
            2988,
            3550
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3275,
              "date": "2026-04-20"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.015151515151515152,
          "dir": "up",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0566
        },
        "confidence": "medium",
        "label": "About $29.88–$35.50 (wholesale reference), up +15.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3275,
            "date": "2026-04-20"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3300,
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
            "valueCents": 3675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3675,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "bok-choy",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.07586206896551724,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 4141,
      "spark": [
        3300,
        3300,
        3300,
        3300,
        3300,
        3300,
        3675,
        3675,
        3675,
        3625,
        3625,
        3850,
        3850,
        3650,
        3650,
        3600,
        3600,
        3450,
        3450,
        3450,
        3350,
        3350,
        3350,
        3175,
        3100,
        3350
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "artichoke",
      "label_en": "Artichoke",
      "label_es": "Alcachofa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 5113,
          "rangeCents": [
            4700,
            5513
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 5700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4400,
              "date": "2026-05-21"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5225,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-05-15"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 5000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 6000,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.3333333333333333,
          "dir": "up",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.05075
        },
        "confidence": "medium",
        "label": "About $47.00–$55.13 (wholesale reference), up +11.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4400,
            "date": "2026-05-21"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5225,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-05-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 5000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 6000,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 5575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 5575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 5575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3963,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3963,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3963,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "artichoke",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.34911242603550297,
        "retrace": 0,
        "elevatedWeeks": 6,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.4,
      "epCents": 12783,
      "spark": [
        4275,
        4275,
        4275,
        5575,
        5575,
        5575,
        3400,
        3400,
        3400,
        3400,
        3400,
        4225,
        3963,
        3963,
        3963,
        4200,
        4200,
        4200,
        4350,
        4350,
        5700,
        5700,
        5700,
        5700,
        5700,
        5700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "snow-peas",
      "label_en": "Snow peas",
      "label_es": "Arvejas de nieve",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2700,
          "rangeCents": [
            2100,
            2844
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.1081
        },
        "confidence": "medium",
        "label": "About $21.00–$28.44 (wholesale reference), down -15.7% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2900,
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
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "snow-peas",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.02586206896551724,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.9,
      "epCents": 3000,
      "spark": [
        2825,
        2825,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825,
        2825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "butter-lettuce",
      "label_en": "Butter lettuce",
      "label_es": "Lechuga mantequilla (Boston)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2600,
          "rangeCents": [
            2397,
            3600
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2575,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2338,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-05-22"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 5800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.015151515151515152,
          "dir": "up",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.0925
        },
        "confidence": "medium",
        "label": "About $23.97–$36.00 (wholesale reference), up +8.9% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2575,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2338,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-05-22"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 5800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3013,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3013,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3013,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3113,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3175,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3625,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3625,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3225,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "butter-lettuce",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.11184865582475938,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 4000,
      "spark": [
        3300,
        3300,
        2600,
        2600,
        2600,
        2600,
        2600,
        3013,
        3013,
        3013,
        3113,
        3175,
        3625,
        3625,
        3425,
        3425,
        3350,
        3350,
        3350,
        3225,
        3350,
        2925,
        2925,
        2925,
        3350,
        3350
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "green-leaf-lettuce",
      "label_en": "Green leaf lettuce",
      "label_es": "Lechuga hoja verde",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3938,
          "rangeCents": [
            3475,
            5000
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 5150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-10"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5525,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3875,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.48201438848920863,
          "dir": "up",
          "agreement": 1,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.174
        },
        "confidence": "medium",
        "label": "About $34.75–$50.00 (wholesale reference), up +52% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-10"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5525,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3875,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4575,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "green-leaf-lettuce",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.17045454545454544,
        "retrace": 0,
        "elevatedWeeks": 5,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 5626,
      "spark": [
        3475,
        3475,
        3275,
        3300,
        3300,
        4300,
        4400,
        4500,
        4775,
        4575,
        4575,
        4575,
        4575,
        4525,
        4250,
        4450,
        4450,
        4450,
        4450,
        4450,
        4700,
        5150,
        5150,
        5150,
        5150,
        5150
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "red-leaf-lettuce",
      "label_en": "Red leaf lettuce",
      "label_es": "Lechuga hoja roja",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3688,
          "rangeCents": [
            3088,
            4688
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 5400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-01"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3875,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-05-18"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.30120481927710846,
          "dir": "up",
          "agreement": 1,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.1548
        },
        "confidence": "medium",
        "label": "About $30.88–$46.88 (wholesale reference), up +39.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-01"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3875,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-05-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "red-leaf-lettuce",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.30120481927710846,
        "retrace": 0.03571428571428571,
        "elevatedWeeks": 6,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 5269,
      "spark": [
        4150,
        4150,
        4150,
        3700,
        3700,
        4100,
        4250,
        4250,
        4250,
        4100,
        4100,
        4300,
        4300,
        4300,
        4400,
        4450,
        4450,
        4450,
        4450,
        4450,
        4775,
        5100,
        5600,
        5600,
        5400,
        5400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "collard-greens",
      "label_en": "Collard greens",
      "label_es": "Berza (collard)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1863,
          "rangeCents": [
            1681,
            1988
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1875,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-05-19"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1625,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.421875,
          "dir": "up",
          "agreement": 0.222,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $16.81–$19.88 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1875,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-05-19"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1625,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "collard-greens",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.3,
        "retrace": 0,
        "elevatedWeeks": 6,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 2866,
      "spark": [
        1600,
        1600,
        1600,
        1600,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        1750,
        2275,
        2275,
        2275,
        2275,
        2275,
        2275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "rutabaga",
      "label_en": "Rutabaga",
      "label_es": "Colinabo (rutabaga)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3000,
          "rangeCents": [
            2813,
            3169
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3225,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-05-29"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $28.13–$31.69 (wholesale reference), flat +0% over the window. 6+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3225,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-05-29"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "rutabaga",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.78,
      "epCents": 3846,
      "spark": [
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000,
        3000
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "cherry-tomato",
      "label_en": "Cherry tomatoes",
      "label_es": "Jitomate cherry",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2225,
          "rangeCents": [
            1700,
            2863
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4800,
              "date": "2026-05-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1350,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.4626865671641791,
          "dir": "down",
          "agreement": 0.444,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.17225000000000001
        },
        "confidence": "medium",
        "label": "About $17.00–$28.63 (wholesale reference), up +13.6% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4800,
            "date": "2026-05-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1350,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1800,
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "cherry-tomato",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.1111111111111111,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 2225,
      "spark": [
        3350,
        3350,
        2800,
        2025,
        2025,
        2025,
        2025,
        2025,
        2025,
        2025,
        2025,
        2025,
        2025,
        2025,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "acorn-squash",
      "label_en": "Acorn squash",
      "label_es": "Calabaza bellota",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3913,
          "rangeCents": [
            3575,
            4275
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3913,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4400,
              "date": "2026-06-08"
            }
          ]
        },
        "trend": {
          "pct": 0.5609756097560976,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.0517
        },
        "confidence": "medium",
        "label": "About $35.75–$42.75 (wholesale reference), up +60% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3913,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4400,
            "date": "2026-06-08"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "acorn-squash",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.5609756097560976,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 5590,
      "spark": [
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2050,
        2850,
        2850,
        2850,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "mint",
      "label_en": "Mint",
      "label_es": "Menta",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1263,
          "rangeCents": [
            844,
            1450
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1275,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 425,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 875,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.333,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $8.44–$14.50 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1275,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 425,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 875,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "mint",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 1804,
      "spark": [
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "rosemary",
      "label_en": "Rosemary",
      "label_es": "Romero",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 800,
          "rangeCents": [
            681,
            850
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 438,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 475,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $6.81–$8.50 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 438,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 475,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "rosemary",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 1600,
      "spark": [
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750,
        750
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "thyme",
      "label_en": "Thyme",
      "label_es": "Tomillo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 847,
          "rangeCents": [
            788,
            1021
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1011,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 894,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 638,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $7.88–$10.21 (wholesale reference), up +6.7% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1011,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 894,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 638,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1011,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "thyme",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 1694,
      "spark": [
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011,
        1011
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "oregano",
      "label_en": "Oregano",
      "label_es": "Orégano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 800,
          "rangeCents": [
            724,
            877
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 873,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 888,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 719,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 613,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 725,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1113,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $7.24–$8.77 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 873,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 888,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 719,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 613,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 725,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1113,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 873,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "oregano",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.55,
      "epCents": 1455,
      "spark": [
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873,
        873
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "tarragon",
      "label_en": "Tarragon",
      "label_es": "Estragón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 1088,
          "rangeCents": [
            794,
            1213
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1075,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 700,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 575,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.429,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $7.94–$12.13 (wholesale reference), flat +0% over the window. 6+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1075,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 700,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 575,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "tarragon",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.55,
      "epCents": 1978,
      "spark": [
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250,
        1250
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "dill",
      "label_en": "Dill",
      "label_es": "Eneldo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2450,
          "rangeCents": [
            1275,
            3163
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 7,
          "nFamilies": 7,
          "nSources": 7,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3925,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3825,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 538,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2000,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.3418803418803419,
          "dir": "up",
          "agreement": 0.125,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 2,
          "noise": 0.0363
        },
        "confidence": "low",
        "label": "About $12.75–$31.63 (wholesale reference), flat +0% over the window. 7+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3925,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3825,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 538,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2000,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3850,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3850,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3850,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "dill",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.01948051948051948,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 3769,
      "spark": [
        2925,
        2925,
        2925,
        3300,
        3300,
        3300,
        3850,
        3850,
        3850,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925,
        3925
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "grapefruit",
      "label_en": "Grapefruit",
      "label_es": "Toronja",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3250,
          "rangeCents": [
            2975,
            3400
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2375,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.022556390977443608,
          "dir": "up",
          "agreement": 0.333,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.02375
        },
        "confidence": "medium",
        "label": "About $29.75–$34.00 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2375,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3375,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "grapefruit",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.022556390977443608,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 6500,
      "spark": [
        3325,
        3325,
        3325,
        3325,
        3325,
        3325,
        3325,
        3450,
        3450,
        3450,
        3450,
        3150,
        3150,
        3050,
        3050,
        3050,
        3050,
        3375,
        3375,
        3375,
        3375,
        3375,
        3375,
        3375,
        3400,
        3400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "apple",
      "label_en": "Apples",
      "label_es": "Manzana",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 3725,
          "rangeCents": [
            3550,
            3900
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1375,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.04054054054054054,
          "dir": "up",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.01855
        },
        "confidence": "medium",
        "label": "About $35.50–$39.00 (wholesale reference), up +9% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1375,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3700,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "apple",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.02666666666666667,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.78,
      "epCents": 4776,
      "spark": [
        3700,
        3700,
        3700,
        3750,
        3750,
        3750,
        3775,
        3775,
        3800,
        3750,
        3750,
        3750,
        3775,
        3875,
        3850,
        3875,
        3850,
        3900,
        3900,
        3900,
        3875,
        3875,
        3900,
        3850,
        3850,
        3850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "pear",
      "label_en": "Pears",
      "label_es": "Pera",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 4025,
          "rangeCents": [
            3819,
            4144
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 4100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4725,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4275,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3725,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.044585987261146494,
          "dir": "up",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0179
        },
        "confidence": "medium",
        "label": "About $38.19–$41.44 (wholesale reference), up +15.2% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4725,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4275,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3725,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3925,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "pear",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.0379746835443038,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.78,
      "epCents": 5160,
      "spark": [
        3925,
        3850,
        3850,
        3750,
        3850,
        3900,
        3950,
        3950,
        3950,
        3950,
        3950,
        4150,
        4150,
        4450,
        4450,
        4450,
        4450,
        4350,
        4350,
        4350,
        4400,
        4400,
        4400,
        4275,
        4100,
        4100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "banana",
      "label_en": "Bananas",
      "label_es": "Plátano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2175,
          "rangeCents": [
            2138,
            2275
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0
        },
        "confidence": "medium",
        "label": "About $21.38–$22.75 (wholesale reference), up +4.9% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "banana",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 3346,
      "spark": [
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "watermelon",
      "label_en": "Watermelon",
      "label_es": "Sandía",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 800,
          "rangeCents": [
            675,
            1975
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 3,
          "nFamilies": 3,
          "nSources": 3,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 550,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.058823529411764705,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 4,
          "nFamilies": 4,
          "nTypes": 2,
          "noise": 0.1977
        },
        "confidence": "medium",
        "label": "About $6.75–$19.75 (wholesale reference), down -21.4% over the window. 3+ source(s) for level, 4 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 550,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "watermelon",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.058823529411764705,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 1600,
      "spark": [
        850,
        850,
        850,
        800,
        800,
        825,
        825,
        875,
        875,
        875,
        875,
        875,
        875,
        875,
        875,
        875,
        750,
        750,
        750,
        750,
        750,
        800,
        800,
        800,
        800,
        800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "blueberry",
      "label_en": "Blueberries",
      "label_es": "Arándano azul",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2750,
          "rangeCents": [
            2388,
            3231
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 3175,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1750,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.049586776859504134,
          "dir": "up",
          "agreement": 0.889,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.2517
        },
        "confidence": "low",
        "label": "About $23.88–$32.31 (wholesale reference), down -17.1% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3175,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1750,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3313,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3313,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3313,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2500,
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
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "blueberry",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.07627118644067797,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 2750,
      "spark": [
        3025,
        3025,
        3313,
        3313,
        3313,
        3025,
        2950,
        2950,
        2750,
        2750,
        2500,
        2450,
        2350,
        2450,
        2450,
        2450,
        2300,
        2300,
        2300,
        2300,
        2250,
        2250,
        2250,
        2325,
        2450,
        3175
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "raspberry",
      "label_en": "Raspberries",
      "label_es": "Frambuesa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 2700,
          "rangeCents": [
            1775,
            3131
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 8,
          "nFamilies": 8,
          "nSources": 8,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-atlanta",
              "type": "usda-ams",
              "valueCents": 2950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-06-05"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3025,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1075,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2000,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.024793388429752067,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0936
        },
        "confidence": "medium",
        "label": "About $17.75–$31.31 (wholesale reference), up +4.5% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-06-05"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3025,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1075,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2000,
            "date": "2026-06-12"
          },
          {
            "kind": "trend",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-05-07",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 2825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2875,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3025,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "raspberry",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.024793388429752067,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 2700,
      "spark": [
        3025,
        2825,
        3025,
        3025,
        3025,
        3025,
        2875,
        3050,
        3050,
        3050,
        3050,
        2900,
        3025,
        3025,
        3025,
        3025,
        2775,
        2800,
        2800,
        3050,
        3050,
        3050,
        3050,
        2250,
        2250,
        2950
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-07",
        "to": "2026-06-12",
        "n": 26
      },
      "spark_dates": [
        "2026-05-07",
        "2026-05-08",
        "2026-05-11",
        "2026-05-12",
        "2026-05-13",
        "2026-05-14",
        "2026-05-15",
        "2026-05-18",
        "2026-05-19",
        "2026-05-20",
        "2026-05-21",
        "2026-05-22",
        "2026-05-26",
        "2026-05-27",
        "2026-05-28",
        "2026-05-29",
        "2026-06-01",
        "2026-06-02",
        "2026-06-03",
        "2026-06-04",
        "2026-06-05",
        "2026-06-08",
        "2026-06-09",
        "2026-06-10",
        "2026-06-11",
        "2026-06-12"
      ]
    },
    {
      "key": "ground-beef",
      "label_en": "Ground beef",
      "label_es": "Carne molida de res",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-10",
        "level": {
          "basis": "wholesale",
          "medianCents": 551,
          "rangeCents": [
            551,
            551
          ],
          "rangeBasis": "point",
          "typeDispersion": 0,
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "type": "usda-lmr",
              "valueCents": 551,
              "date": "2026-06-10"
            }
          ]
        },
        "trend": {
          "pct": -0.02304964539007092,
          "dir": "down",
          "agreement": 0.333,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0067
        },
        "confidence": "directional",
        "label": "About $5.51 (wholesale reference, single source — range not yet measurable), flat -0.1% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 551,
            "date": "2026-06-10"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "bls",
            "type": "bls",
            "basis": "index"
          },
          {
            "kind": "trend",
            "source": "fred",
            "type": "fred",
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-06-08",
            "valueCents": 564,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 551,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "ground-beef",
      "flag": {
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 2
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 551
    }
  ],
  "drivers": [
    {
      "key": "corn",
      "label_en": "Corn (feed)",
      "label_es": "Maíz (forraje)",
      "kind": "feed-grain",
      "trend": {
        "pct": 0.10362173038229376,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.0325
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
        15904,
        15845,
        16961,
        15951,
        17552
      ]
    },
    {
      "key": "soybeans",
      "label_en": "Soybeans (feed)",
      "label_es": "Soya (forraje)",
      "kind": "feed-grain",
      "trend": {
        "pct": 0.19784172661870503,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.032
      },
      "leads": [
        "chicken-breast",
        "whole-chicken",
        "pork-loin",
        "pork-shoulder"
      ],
      "spark": [
        17236,
        18743,
        20007,
        19434,
        20646
      ]
    },
    {
      "key": "diesel",
      "label_en": "Diesel",
      "label_es": "Diésel",
      "kind": "energy",
      "trend": {
        "pct": 0.41192411924119243,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.0985
      },
      "leads": [],
      "spark": [
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
        535,
        521
      ]
    },
    {
      "key": "electricity",
      "label_en": "Electricity",
      "label_es": "Electricidad",
      "kind": "energy",
      "trend": {
        "pct": 0.05534495830174378,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.0139
      },
      "leads": [],
      "spark": [
        1319,
        1363,
        1364,
        1437,
        1392
      ]
    }
  ],
  "coverage": {
    "measured": 82,
    "derived": 1,
    "absent": 24,
    "gaps": [
      {
        "key": "striploin",
        "label_en": "striploin",
        "label_es": "striploin",
        "reason": "Staged: source resolved (LMR 2453, IMPS 180 boneless strip), pending live verification."
      },
      {
        "key": "leg-of-lamb",
        "label_en": "leg-of-lamb",
        "label_es": "leg-of-lamb",
        "reason": "Pending source wiring: lamb cuts publish weekly on LM_XL552 (report 2650, imported product); cut column to confirm via --discover, then --flip."
      },
      {
        "key": "whole-branzino",
        "label_en": "whole-branzino",
        "label_es": "whole-branzino",
        "reason": "No free public wholesale source: European seabass is thin/absent in NOAA FOSS; a daily quote needs a paid reporter network (Urner Barry tier)."
      },
      {
        "key": "napa-cabbage",
        "label_en": "napa-cabbage",
        "label_es": "napa-cabbage",
        "reason": "Staged: AMS commodity term resolved (\"Chinese Cabbage\"), pending live verification."
      },
      {
        "key": "daikon",
        "label_en": "daikon",
        "label_es": "daikon",
        "reason": "Staged: AMS commodity term resolved (\"Daikon\"), pending live verification."
      },
      {
        "key": "serrano-pepper",
        "label_en": "serrano-pepper",
        "label_es": "serrano-pepper",
        "reason": "Staged: AMS commodity term resolved (\"Peppers, Serrano\"), pending live verification."
      },
      {
        "key": "poblano-pepper",
        "label_en": "poblano-pepper",
        "label_es": "poblano-pepper",
        "reason": "Staged: AMS commodity term resolved (\"Peppers, Poblano\"), pending live verification."
      },
      {
        "key": "habanero-pepper",
        "label_en": "habanero-pepper",
        "label_es": "habanero-pepper",
        "reason": "Staged: AMS commodity term resolved (\"Peppers, Habanero\"), pending live verification."
      },
      {
        "key": "oyster-mushroom",
        "label_en": "oyster-mushroom",
        "label_es": "oyster-mushroom",
        "reason": "No distinct public series: USDA AMS terminal reports carry only a generic \"Mushrooms\" commodity — no oyster-specific wholesale quote is published."
      },
      {
        "key": "red-onion",
        "label_en": "red-onion",
        "label_es": "red-onion",
        "reason": "Staged: AMS term resolved (\"Onions, Dry\" + variety RED filter), pending live verification."
      },
      {
        "key": "red-potato",
        "label_en": "red-potato",
        "label_es": "red-potato",
        "reason": "Staged: AMS commodity term resolved (\"ROUND RED\"), pending live verification."
      },
      {
        "key": "cantaloupe",
        "label_en": "cantaloupe",
        "label_es": "cantaloupe",
        "reason": "Staged: AMS commodity stem resolved (\"Cantaloup\"), pending live verification."
      },
      {
        "key": "lamb-shoulder",
        "label_en": "lamb-shoulder",
        "label_es": "lamb-shoulder",
        "reason": "Pending source wiring: lamb cuts publish in the LMR lamb family (e.g., LM_XL552); slug to be wired."
      },
      {
        "key": "ground-pork",
        "label_en": "ground-pork",
        "label_es": "ground-pork",
        "reason": "Pending source wiring: pork trim (72%) on LM_PK602 (report 2498, Trimmings block); column/section to confirm via --discover, then --flip."
      },
      {
        "key": "whole-turkey",
        "label_en": "whole-turkey",
        "label_es": "whole-turkey",
        "reason": "Staged: AMS source resolved (National Turkey Report 3647, \"Whole Young\"), pending live verification."
      },
      {
        "key": "ground-turkey",
        "label_en": "ground-turkey",
        "label_es": "ground-turkey",
        "reason": "No public ground-turkey series: USDA’s National Turkey Report quotes whole birds and parts, not ground; LMR does not cover poultry."
      },
      {
        "key": "whole-halibut",
        "label_en": "whole-halibut",
        "label_es": "whole-halibut",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "whole-trout",
        "label_en": "whole-trout",
        "label_es": "whole-trout",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "scallops",
        "label_en": "scallops",
        "label_es": "scallops",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "whole-crab",
        "label_en": "whole-crab",
        "label_es": "whole-crab",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "octopus",
        "label_en": "octopus",
        "label_es": "octopus",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "salmon-skin-on-fillet",
        "label_en": "salmon-skin-on-fillet",
        "label_es": "salmon-skin-on-fillet",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "clams",
        "label_en": "clams",
        "label_es": "clams",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      },
      {
        "key": "squid",
        "label_en": "squid",
        "label_es": "squid",
        "reason": "Verified NOAA FOSS source, deferred by a transient NOAA outage — pending re-flip."
      }
    ]
  }
};
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
