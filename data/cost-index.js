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
          "medianCents": 1159,
          "rangeCents": [
            1159,
            1159
          ],
          "nObs": 1,
          "nFamilies": 1,
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
          "nFamilies": 3
        },
        "confidence": "medium",
        "label": "About $11.59 (wholesale reference, single source — range not yet measurable), up +30.3% over the window. 1+ source(s) for level, 3 for trend.",
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
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 1063,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 1083,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 1183,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 1206,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 1131,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
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
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.02475685234305924,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        1063,
        1083,
        1183,
        1206,
        1131,
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
        1159
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
          "medianCents": 1527,
          "rangeCents": [
            1527,
            1527
          ],
          "nObs": 1,
          "nFamilies": 1,
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
          "pct": 0.05042513964943181,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "medium",
        "label": "About $15.27 (wholesale reference, single source — range not yet measurable), up +5% over the window. 1+ source(s) for level, 2 for trend.",
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
        ],
        "history": [
          {
            "date": "2026-04-29",
            "valueCents": 1480,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-30",
            "valueCents": 1472,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 1524,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 1581,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 1576,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
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
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.0013080444735120995,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        1480,
        1472,
        1524,
        1581,
        1576,
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
        1527
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-04-29",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-29",
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
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
        "2026-06-05"
      ]
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
      },
      "spark_dates": [
        "2026-02-09",
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
        "2026-06-01"
      ]
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
      },
      "spark_dates": [
        "2026-02-09",
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
        "2026-06-01"
      ]
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
          "medianCents": 99,
          "rangeCents": [
            99,
            99
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 99,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.005482818664727041,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "medium",
        "label": "About $0.99 (wholesale reference, single source — range not yet measurable), up +0.5% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 99,
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
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 88,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 92,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 90,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 90,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 88,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
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
          }
        ]
      },
      "flag": {
        "verdict": "emerging",
        "actionBias": "watch",
        "reason": "a real move that has not persisted yet — watch the next read",
        "move": 0.1,
        "retrace": 0,
        "elevatedWeeks": 1,
        "nHistory": 26
      },
      "spark": [
        88,
        92,
        90,
        90,
        88,
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
        99
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
          "medianCents": 147,
          "rangeCents": [
            147,
            147
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-lmr",
              "valueCents": 147,
              "date": "2026-06-05"
            }
          ]
        },
        "trend": {
          "pct": 0.005482818664727041,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2
        },
        "confidence": "medium",
        "label": "About $1.47 (wholesale reference, single source — range not yet measurable), up +0.5% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "valueCents": 147,
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
        ],
        "history": [
          {
            "date": "2026-04-30",
            "valueCents": 130,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 131,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 134,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 133,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 132,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
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
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.072992700729927,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        130,
        131,
        134,
        133,
        132,
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
        147
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
      },
      "spark_dates": [
        "2025-02-01",
        "2025-03-01",
        "2025-04-01",
        "2025-05-01",
        "2025-06-01",
        "2025-07-01",
        "2025-08-01",
        "2026-01-01",
        "2026-02-01",
        "2026-03-01"
      ]
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
      },
      "spark_dates": [
        "2024-03-01",
        "2024-04-01",
        "2024-05-01",
        "2024-06-01",
        "2024-07-01",
        "2024-08-01",
        "2024-09-01",
        "2024-10-01",
        "2024-11-01",
        "2024-12-01",
        "2025-01-01",
        "2025-02-01",
        "2025-03-01",
        "2025-04-01",
        "2025-05-01",
        "2025-06-01",
        "2025-07-01",
        "2025-08-01",
        "2025-09-01",
        "2025-10-01",
        "2025-11-01",
        "2025-12-01",
        "2026-01-01",
        "2026-02-01",
        "2026-03-01",
        "2026-04-01"
      ]
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
          "medianCents": 8113,
          "rangeCents": [
            7781,
            8200
          ],
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "provenance": [
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
          "nSources": 7,
          "nFamilies": 7
        },
        "confidence": "high",
        "label": "About $77.81–$82.00 (wholesale reference), up +168.9% over the window. 6+ source(s) for level, 7 for trend.",
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
            "valueCents": 4450,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 4250,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 4350,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 5050,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 5050,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 5350,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 5200,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 5200,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 5200,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 5800,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 5800,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 5800,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 5800,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 5650,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 5650,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 6150,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 6150,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 6150,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 6150,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 5550,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 5550,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 5550,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 5550,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 5550,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 6050,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 6050,
            "source": "usda-ams-los-angeles",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "flag": {
        "verdict": "emerging",
        "actionBias": "watch",
        "reason": "a real move that has not persisted yet — watch the next read",
        "move": 0.16346153846153846,
        "retrace": 0.016260162601626018,
        "elevatedWeeks": 3,
        "nHistory": 26
      },
      "spark": [
        4450,
        4250,
        4350,
        5050,
        5050,
        5350,
        5200,
        5200,
        5200,
        5800,
        5800,
        5800,
        5800,
        5650,
        5650,
        6150,
        6150,
        6150,
        6150,
        5550,
        5550,
        5550,
        5550,
        5550,
        6050,
        6050
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-los-angeles",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
          "medianCents": 2175,
          "rangeCents": [
            1888,
            2463
          ],
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "provenance": [
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
          "agreement": 0.714,
          "nSources": 7,
          "nFamilies": 7
        },
        "confidence": "medium",
        "label": "About $18.88–$24.63 (wholesale reference), down -8.9% over the window. 6+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "valueCents": 4800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 4800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 3325,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 3275,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 4800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 4800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 4800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3275,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3275,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3275,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4050,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4050,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2775,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2675,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2675,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2675,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2675,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2675,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 1500,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 1500,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1500,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1500,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.5555555555555556,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        4800,
        4800,
        3325,
        3275,
        4800,
        4800,
        4800,
        3275,
        3275,
        3275,
        4050,
        4050,
        2775,
        2675,
        2675,
        2675,
        2675,
        2675,
        1500,
        1500,
        1500,
        1500,
        1800,
        1800,
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-baltimore",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
          "medianCents": 2400,
          "rangeCents": [
            2263,
            2763
          ],
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "provenance": [
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
          "agreement": 0.833,
          "nSources": 6,
          "nFamilies": 6
        },
        "confidence": "high",
        "label": "About $22.63–$27.63 (wholesale reference), up +12.3% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
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
            "valueCents": 2800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-01",
            "valueCents": 2800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 2800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-05",
            "valueCents": 2800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-06",
            "valueCents": 3150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-07",
            "valueCents": 3150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 3150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2950,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2950,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2950,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2950,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2950,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3000,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2925,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2975,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2975,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2975,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2975,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.00847457627118644,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "spark": [
        2800,
        2800,
        2800,
        2800,
        3150,
        3150,
        3150,
        2950,
        2950,
        2950,
        2950,
        2950,
        3000,
        2900,
        2900,
        2900,
        2900,
        2925,
        2900,
        2900,
        2900,
        2900,
        2975,
        2975,
        2975,
        2975
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-04-30",
        "to": "2026-06-05",
        "n": 26
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
      },
      "spark_dates": [
        "2026-04-30",
        "2026-05-01",
        "2026-05-04",
        "2026-05-05",
        "2026-05-06",
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
        "2026-06-05"
      ]
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
        "2026-05-30"
      ]
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
          "medianCents": 166,
          "rangeCents": [
            166,
            166
          ],
          "nObs": 1,
          "nFamilies": 1,
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
          "nFamilies": 3
        },
        "confidence": "medium",
        "label": "About $1.66 (wholesale reference, single source — range not yet measurable), up +12.4% over the window. 1+ source(s) for level, 3 for trend.",
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
          }
        ]
      },
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.05396825396825397,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 12
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
        166
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-03-14",
        "to": "2026-05-30",
        "n": 12
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
        "2026-05-30"
      ]
    },
    {
      "key": "eggs",
      "label_en": "Eggs",
      "label_es": "Huevo",
      "unit_en": "dozen",
      "unit_es": "docena",
      "assessment": {
        "asOf": "2026-06-01",
        "level": {
          "basis": "wholesale",
          "medianCents": 56,
          "rangeCents": [
            56,
            56
          ],
          "nObs": 1,
          "nFamilies": 1,
          "nSources": 1,
          "provenance": [
            {
              "source": "usda-ams",
              "valueCents": 56,
              "date": "2026-06-01"
            }
          ]
        },
        "trend": {
          "pct": -0.06230270809104499,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3
        },
        "confidence": "medium",
        "label": "About $0.56 (wholesale reference, single source — range not yet measurable), down -6.2% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams",
            "valueCents": 56,
            "date": "2026-06-01"
          },
          {
            "kind": "trend",
            "source": "usda-ams",
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
            "date": "2026-04-13",
            "valueCents": 60,
            "source": "usda-ams",
            "basis": "wholesale"
          },
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
        60,
        50,
        49,
        66,
        66,
        60,
        56
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams",
        "from": "2026-04-13",
        "to": "2026-06-01",
        "n": 8
      },
      "spark_dates": [
        "2026-04-13",
        "2026-04-20",
        "2026-04-27",
        "2026-05-04",
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01"
      ]
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
      },
      "spark_dates": [
        "2024-03-01",
        "2024-04-01",
        "2024-05-01",
        "2024-06-01",
        "2024-07-01",
        "2024-08-01",
        "2024-09-01",
        "2024-10-01",
        "2024-11-01",
        "2024-12-01",
        "2025-01-01",
        "2025-02-01",
        "2025-03-01",
        "2025-04-01",
        "2025-05-01",
        "2025-06-01",
        "2025-07-01",
        "2025-08-01",
        "2025-09-01",
        "2025-10-01",
        "2025-11-01",
        "2025-12-01",
        "2026-01-01",
        "2026-02-01",
        "2026-03-01",
        "2026-04-01"
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
