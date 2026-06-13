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
          "noise": 0.0172
        },
        "confidence": "medium",
        "label": "About $14.54–$14.80 (wholesale reference, single market — band from recent volatility), down -3.3% over the window. 1+ source(s) for level, 2 for trend.",
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
          "noise": 0.03415
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
          "noise": 0.045899999999999996
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
            425,
            9600
          ],
          "rangeBasis": "measured",
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
          "noise": 0.033800000000000004
        },
        "confidence": "medium",
        "label": "About $4.25–$96.00 (wholesale reference — band from reported market low–high), up +16.5% over the window. 8+ source(s) for level, 9 for trend.",
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
            700,
            4800
          ],
          "rangeBasis": "measured",
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
          "noise": 0.0215
        },
        "confidence": "low",
        "label": "About $7.00–$48.00 (wholesale reference — band from reported market low–high), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
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
          "pct": -0.11538461538461539,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0127
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
        "move": -0.13440860215053763,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 13
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
        162,
        161
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-03-14",
        "to": "2026-06-06",
        "n": 13
      },
      "spark_dates": [
        "2026-03-14",
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
          "pct": 0.12162162162162163,
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
            "date": "2026-03-14",
            "valueCents": 148,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
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
        "move": 0.0440251572327044,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 13
      },
      "spark": [
        148,
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
        "from": "2026-03-14",
        "to": "2026-06-06",
        "n": 13
      },
      "spark_dates": [
        "2026-03-14",
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
            300,
            5350
          ],
          "rangeBasis": "measured",
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
          "agreement": 0.778,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.19014999999999999
        },
        "confidence": "medium",
        "label": "About $3.00–$53.50 (wholesale reference — band from reported market low–high), down -22.2% over the window. 8+ source(s) for level, 9 for trend.",
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
            1200,
            4600
          ],
          "rangeBasis": "measured",
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
          "noise": 0.05355
        },
        "confidence": "medium",
        "label": "About $12.00–$46.00 (wholesale reference — band from reported market low–high), up +6.5% over the window. 8+ source(s) for level, 9 for trend.",
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
            1050,
            6200
          ],
          "rangeBasis": "measured",
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
          "noise": 0.07885
        },
        "confidence": "medium",
        "label": "About $10.50–$62.00 (wholesale reference — band from reported market low–high), down -12.4% over the window. 8+ source(s) for level, 9 for trend.",
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
            1400,
            4400
          ],
          "rangeBasis": "measured",
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
          "noise": 0.0358
        },
        "confidence": "medium",
        "label": "About $14.00–$44.00 (wholesale reference — band from reported market low–high), up +18.9% over the window. 8+ source(s) for level, 9 for trend.",
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
            1600,
            3800
          ],
          "rangeBasis": "measured",
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
        "label": "About $16.00–$38.00 (wholesale reference — band from reported market low–high), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
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
            900,
            6000
          ],
          "rangeBasis": "measured",
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
        "label": "About $9.00–$60.00 (wholesale reference — band from reported market low–high), down -18.4% over the window. 7+ source(s) for level, 8 for trend.",
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
            1000,
            3850
          ],
          "rangeBasis": "measured",
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
          "noise": 0.17099999999999999
        },
        "confidence": "medium",
        "label": "About $10.00–$38.50 (wholesale reference — band from reported market low–high), down -58.3% over the window. 8+ source(s) for level, 9 for trend.",
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
            1650,
            5200
          ],
          "rangeBasis": "measured",
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
          "noise": 0.030399999999999996
        },
        "confidence": "medium",
        "label": "About $16.50–$52.00 (wholesale reference — band from reported market low–high), flat +0% over the window. 8+ source(s) for level, 9 for trend.",
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
            2200,
            4500
          ],
          "rangeBasis": "measured",
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
          "noise": 0.1288
        },
        "confidence": "medium",
        "label": "About $22.00–$45.00 (wholesale reference — band from reported market low–high), down -43.8% over the window. 8+ source(s) for level, 9 for trend.",
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
            1400,
            4000
          ],
          "rangeBasis": "measured",
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
          "agreement": 0.667,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.039850000000000003
        },
        "confidence": "medium",
        "label": "About $14.00–$40.00 (wholesale reference — band from reported market low–high), up +6.7% over the window. 8+ source(s) for level, 9 for trend.",
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
            1400,
            4900
          ],
          "rangeBasis": "measured",
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
          "noise": 0.0558
        },
        "confidence": "medium",
        "label": "About $14.00–$49.00 (wholesale reference — band from reported market low–high), up +17.2% over the window. 8+ source(s) for level, 9 for trend.",
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
            2800,
            7250
          ],
          "rangeBasis": "measured",
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
          "noise": 0.05315
        },
        "confidence": "medium",
        "label": "About $28.00–$72.50 (wholesale reference — band from reported market low–high), up +11.6% over the window. 8+ source(s) for level, 9 for trend.",
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
            1700,
            3250
          ],
          "rangeBasis": "measured",
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
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.091
        },
        "confidence": "medium",
        "label": "About $17.00–$32.50 (wholesale reference — band from reported market low–high), down -15.7% over the window. 8+ source(s) for level, 9 for trend.",
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
  ]
};
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
