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
  "generatedAt": "2026-06-15",
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
            1232,
            1316
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
        "label": "About $12.32–$13.16 (wholesale reference, single market — band from recent volatility), up +5.2% over the window. 1+ source(s) for level, 3 for trend.",
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
      "seasonalNormals": {
        "10": {
          "medianCents": 1070,
          "p25Cents": 1064,
          "p75Cents": 1077,
          "n": 2,
          "years": 2
        },
        "11": {
          "medianCents": 1067,
          "p25Cents": 1058,
          "p75Cents": 1148,
          "n": 3,
          "years": 3
        },
        "12": {
          "medianCents": 1065,
          "p25Cents": 1064,
          "p75Cents": 1158,
          "n": 3,
          "years": 3
        },
        "01": {
          "medianCents": 1091,
          "p25Cents": 1080,
          "p75Cents": 1161,
          "n": 3,
          "years": 3
        },
        "02": {
          "medianCents": 1087,
          "p25Cents": 1070,
          "p75Cents": 1181,
          "n": 3,
          "years": 3
        },
        "03": {
          "medianCents": 1098,
          "p25Cents": 1079,
          "p75Cents": 1186,
          "n": 3,
          "years": 3
        },
        "04": {
          "medianCents": 1112,
          "p25Cents": 1094,
          "p75Cents": 1207,
          "n": 3,
          "years": 3
        },
        "05": {
          "medianCents": 1088,
          "p25Cents": 1060,
          "p75Cents": 1147,
          "n": 4,
          "years": 4
        },
        "06": {
          "medianCents": 1064,
          "p25Cents": 1050,
          "p75Cents": 1107,
          "n": 3,
          "years": 3
        },
        "07": {
          "medianCents": 1086,
          "p25Cents": 1075,
          "p75Cents": 1137,
          "n": 3,
          "years": 3
        },
        "08": {
          "medianCents": 1088,
          "p25Cents": 1082,
          "p75Cents": 1155,
          "n": 3,
          "years": 3
        },
        "09": {
          "medianCents": 1088,
          "p25Cents": 1083,
          "p75Cents": 1157,
          "n": 3,
          "years": 3
        }
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
            1461,
            1473
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
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0184
        },
        "confidence": "medium",
        "label": "About $14.61–$14.73 (wholesale reference, single market — band from recent volatility), up +4.1% over the window. 1+ source(s) for level, 3 for trend.",
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
      "seasonalNormals": {
        "10": {
          "medianCents": 1070,
          "p25Cents": 1064,
          "p75Cents": 1077,
          "n": 2,
          "years": 2
        },
        "11": {
          "medianCents": 1067,
          "p25Cents": 1058,
          "p75Cents": 1148,
          "n": 3,
          "years": 3
        },
        "12": {
          "medianCents": 1065,
          "p25Cents": 1064,
          "p75Cents": 1158,
          "n": 3,
          "years": 3
        },
        "01": {
          "medianCents": 1091,
          "p25Cents": 1080,
          "p75Cents": 1161,
          "n": 3,
          "years": 3
        },
        "02": {
          "medianCents": 1087,
          "p25Cents": 1070,
          "p75Cents": 1181,
          "n": 3,
          "years": 3
        },
        "03": {
          "medianCents": 1098,
          "p25Cents": 1079,
          "p75Cents": 1186,
          "n": 3,
          "years": 3
        },
        "04": {
          "medianCents": 1112,
          "p25Cents": 1094,
          "p75Cents": 1207,
          "n": 3,
          "years": 3
        },
        "05": {
          "medianCents": 1088,
          "p25Cents": 1060,
          "p75Cents": 1147,
          "n": 4,
          "years": 4
        },
        "06": {
          "medianCents": 1064,
          "p25Cents": 1050,
          "p75Cents": 1107,
          "n": 3,
          "years": 3
        },
        "07": {
          "medianCents": 1086,
          "p25Cents": 1075,
          "p75Cents": 1137,
          "n": 3,
          "years": 3
        },
        "08": {
          "medianCents": 1088,
          "p25Cents": 1082,
          "p75Cents": 1155,
          "n": 3,
          "years": 3
        },
        "09": {
          "medianCents": 1088,
          "p25Cents": 1083,
          "p75Cents": 1157,
          "n": 3,
          "years": 3
        }
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
        "label": "About $1.11–$1.56 (wholesale reference — band from reported market low–high), flat +0.1% over the window. 1+ source(s) for level, 3 for trend.",
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
      "seasonalNormals": {
        "10": {
          "medianCents": 136,
          "p25Cents": 120,
          "p75Cents": 148,
          "n": 13,
          "years": 3
        },
        "11": {
          "medianCents": 115,
          "p25Cents": 107,
          "p75Cents": 146,
          "n": 12,
          "years": 3
        },
        "12": {
          "medianCents": 117,
          "p25Cents": 105,
          "p75Cents": 147,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 126,
          "p25Cents": 119,
          "p75Cents": 147,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 146,
          "p25Cents": 129,
          "p75Cents": 161,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 160,
          "p25Cents": 147,
          "p75Cents": 215,
          "n": 14,
          "years": 3
        },
        "04": {
          "medianCents": 175,
          "p25Cents": 169,
          "p75Cents": 265,
          "n": 13,
          "years": 3
        },
        "05": {
          "medianCents": 184,
          "p25Cents": 161,
          "p75Cents": 276,
          "n": 12,
          "years": 3
        },
        "06": {
          "medianCents": 168,
          "p25Cents": 137,
          "p75Cents": 204,
          "n": 15,
          "years": 4
        },
        "07": {
          "medianCents": 175,
          "p25Cents": 121,
          "p75Cents": 184,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 190,
          "p25Cents": 153,
          "p75Cents": 197,
          "n": 12,
          "years": 3
        },
        "09": {
          "medianCents": 168,
          "p25Cents": 150,
          "p75Cents": 179,
          "n": 14,
          "years": 3
        }
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
          "agreement": 0.333,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.003
        },
        "confidence": "medium",
        "label": "About $0.72–$1.12 (wholesale reference — band from reported market low–high), flat -0.2% over the window. 1+ source(s) for level, 3 for trend.",
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
      "seasonalNormals": {
        "10": {
          "medianCents": 168,
          "p25Cents": 111,
          "p75Cents": 191,
          "n": 13,
          "years": 3
        },
        "11": {
          "medianCents": 160,
          "p25Cents": 106,
          "p75Cents": 189,
          "n": 12,
          "years": 3
        },
        "12": {
          "medianCents": 158,
          "p25Cents": 98,
          "p75Cents": 189,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 171,
          "p25Cents": 118,
          "p75Cents": 190,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 188,
          "p25Cents": 121,
          "p75Cents": 190,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 145,
          "p25Cents": 101,
          "p75Cents": 199,
          "n": 14,
          "years": 3
        },
        "04": {
          "medianCents": 138,
          "p25Cents": 100,
          "p75Cents": 227,
          "n": 13,
          "years": 3
        },
        "05": {
          "medianCents": 115,
          "p25Cents": 90,
          "p75Cents": 226,
          "n": 12,
          "years": 3
        },
        "06": {
          "medianCents": 121,
          "p25Cents": 89,
          "p75Cents": 196,
          "n": 15,
          "years": 4
        },
        "07": {
          "medianCents": 167,
          "p25Cents": 111,
          "p75Cents": 259,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 173,
          "p25Cents": 140,
          "p75Cents": 233,
          "n": 12,
          "years": 3
        },
        "09": {
          "medianCents": 163,
          "p25Cents": 150,
          "p75Cents": 229,
          "n": 14,
          "years": 3
        }
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
            93,
            97
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
          "agreement": 0.667,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0274
        },
        "confidence": "medium",
        "label": "About $0.93–$0.97 (wholesale reference, single market — band from recent volatility), up +3.2% over the window. 1+ source(s) for level, 3 for trend.",
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
      "seasonalNormals": {
        "10": {
          "medianCents": 93,
          "p25Cents": 90,
          "p75Cents": 94,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 84,
          "p25Cents": 83,
          "p75Cents": 88,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 83,
          "p25Cents": 82,
          "p75Cents": 85,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 84,
          "p25Cents": 82,
          "p75Cents": 86,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 87,
          "p25Cents": 85,
          "p75Cents": 89,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 89,
          "p25Cents": 88,
          "p75Cents": 91,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 90,
          "p25Cents": 89,
          "p75Cents": 93,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 92,
          "p25Cents": 90,
          "p75Cents": 100,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 96,
          "p25Cents": 94,
          "p75Cents": 99,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 99,
          "p25Cents": 97,
          "p75Cents": 100,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 97,
          "p25Cents": 96,
          "p75Cents": 98,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 97,
          "p25Cents": 95,
          "p75Cents": 98,
          "n": 12,
          "years": 3
        }
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
            131,
            143
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
          "agreement": 0.333,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0429
        },
        "confidence": "medium",
        "label": "About $1.31–$1.43 (wholesale reference, single market — band from recent volatility), flat -0.3% over the window. 1+ source(s) for level, 3 for trend.",
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
      "seasonalNormals": {
        "10": {
          "medianCents": 112,
          "p25Cents": 105,
          "p75Cents": 116,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 107,
          "p25Cents": 106,
          "p75Cents": 108,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 110,
          "p25Cents": 109,
          "p75Cents": 111,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 106,
          "p25Cents": 103,
          "p75Cents": 110,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 109,
          "p25Cents": 105,
          "p75Cents": 112,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 113,
          "p25Cents": 110,
          "p75Cents": 116,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 116,
          "p25Cents": 110,
          "p75Cents": 121,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 130,
          "p25Cents": 129,
          "p75Cents": 132,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 135,
          "p25Cents": 129,
          "p75Cents": 145,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 121,
          "p25Cents": 115,
          "p75Cents": 129,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 108,
          "p25Cents": 107,
          "p75Cents": 113,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 121,
          "p25Cents": 107,
          "p75Cents": 125,
          "n": 12,
          "years": 3
        }
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
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 7988,
          "rangeCents": [
            7107,
            8869
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 8100,
              "date": "2026-06-10"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 8250,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "pct": 0.6417910447761194,
          "dir": "up",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 2,
          "noise": 0.2981
        },
        "confidence": "low",
        "label": "About $71.07–$88.69 (wholesale reference), up +159% over the window. 6+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "valueCents": 8250,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
            "date": "2026-05-08",
            "valueCents": 5025,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 6600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 6600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 6700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 6850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 6850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 7750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 7750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 7800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 8100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 8100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 8225,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 8225,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 8225,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 8225,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 8800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 8800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 8800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 8750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 8750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 8800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 8800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 8800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 8600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 8600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 8250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "seasonalNormals": {
        "10": {
          "medianCents": 2750,
          "p25Cents": 2599,
          "p75Cents": 3080,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 3800,
          "p25Cents": 2825,
          "p75Cents": 6850,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 3550,
          "p25Cents": 2580,
          "p75Cents": 4069,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 2470,
          "p25Cents": 2375,
          "p75Cents": 2955,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2526,
          "p25Cents": 2318,
          "p75Cents": 3028,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 3405,
          "p25Cents": 2514,
          "p75Cents": 3579,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3105,
          "p25Cents": 2795,
          "p75Cents": 3524,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 4745,
          "p25Cents": 2838,
          "p75Cents": 5100,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3298,
          "p25Cents": 2698,
          "p75Cents": 4628,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3180,
          "p25Cents": 2643,
          "p75Cents": 3350,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2600,
          "p25Cents": 2505,
          "p75Cents": 2950,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2694,
          "p25Cents": 2524,
          "p75Cents": 3050,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "romaine-lettuce",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.06451612903225806,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 10651,
      "spark": [
        5025,
        6600,
        6600,
        6700,
        6850,
        6850,
        7750,
        7750,
        7800,
        8100,
        8100,
        8225,
        8225,
        8225,
        8225,
        8800,
        8800,
        8800,
        8750,
        8750,
        8800,
        8800,
        8800,
        8600,
        8600,
        8250
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "tomato",
      "label_en": "Tomatoes (round)",
      "label_es": "Jitomate (bola)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2100,
          "rangeCents": [
            1669,
            2531
          ],
          "rangeBasis": "markets",
          "typeDispersion": 0,
          "nObs": 6,
          "nFamilies": 6,
          "nSources": 6,
          "nTypes": 1,
          "provenance": [
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-06-15"
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
              "valueCents": 2050,
              "date": "2026-06-15"
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
          "pct": -0.625,
          "dir": "down",
          "agreement": 0.667,
          "nSources": 6,
          "nFamilies": 6,
          "nTypes": 1,
          "noise": 0.35975
        },
        "confidence": "low",
        "label": "About $16.69–$25.31 (wholesale reference), down -8.4% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
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
            "valueCents": 2450,
            "date": "2026-06-15"
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
            "valueCents": 2050,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-08",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1800,
            "source": "usda-ams-baltimore",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "seasonalNormals": {
        "10": {
          "medianCents": 1899,
          "p25Cents": 1773,
          "p75Cents": 2170,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1938,
          "p25Cents": 1680,
          "p75Cents": 2900,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2190,
          "p25Cents": 1500,
          "p75Cents": 3050,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 2000,
          "p25Cents": 1700,
          "p75Cents": 3000,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2470,
          "p25Cents": 1436,
          "p75Cents": 2510,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2218,
          "p25Cents": 1860,
          "p75Cents": 2748,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2500,
          "p25Cents": 1960,
          "p75Cents": 4424,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2155,
          "p25Cents": 2000,
          "p75Cents": 2450,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1925,
          "p25Cents": 1850,
          "p75Cents": 2018,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2100,
          "p25Cents": 2017,
          "p75Cents": 2194,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2140,
          "p25Cents": 2040,
          "p75Cents": 2495,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2050,
          "p25Cents": 2000,
          "p75Cents": 2132,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "tomato",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.45038167938931295,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.91,
      "epCents": 2308,
      "spark": [
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
        1800,
        1800,
        1800,
        1800,
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-baltimore",
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
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2463,
          "rangeCents": [
            2275,
            2663
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
              "date": "2026-06-15"
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
              "valueCents": 2600,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2975,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.01020408163265306,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.030649999999999997
        },
        "confidence": "low",
        "label": "About $22.75–$26.63 (wholesale reference), up +17.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2475,
            "date": "2026-06-15"
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
            "valueCents": 2600,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2975,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 2605,
          "p25Cents": 2572,
          "p75Cents": 2636,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 2660,
          "p25Cents": 2620,
          "p75Cents": 2800,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2635,
          "p25Cents": 2581,
          "p75Cents": 2769,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2750,
          "p25Cents": 2600,
          "p75Cents": 2800,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2693,
          "p25Cents": 2649,
          "p75Cents": 2776,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2687,
          "p25Cents": 2516,
          "p75Cents": 2820,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2600,
          "p25Cents": 2525,
          "p75Cents": 2860,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2770,
          "p25Cents": 2600,
          "p75Cents": 2930,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2600,
          "p25Cents": 2514,
          "p75Cents": 2975,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2600,
          "p25Cents": 2525,
          "p75Cents": 3125,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2790,
          "p25Cents": 2700,
          "p75Cents": 3325,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2650,
          "p25Cents": 2580,
          "p75Cents": 3065,
          "n": 12,
          "years": 3
        }
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
      "epCents": 2799,
      "spark": [
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
        2475,
        2475
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "russet-potato",
      "label_en": "Russet potatoes",
      "label_es": "Papa russet",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 1813,
          "rangeCents": [
            1619,
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
              "valueCents": 1800,
              "date": "2026-06-15"
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
              "valueCents": 2750,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1825,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.02098695405558707,
          "dir": "up",
          "agreement": 0.556,
          "nSources": 9,
          "nFamilies": 9,
          "nTypes": 2,
          "noise": 0.0215
        },
        "confidence": "medium",
        "label": "About $16.19–$23.38 (wholesale reference), up +5.9% over the window. 8+ source(s) for level, 9 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-15"
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
            "valueCents": 2750,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1825,
            "date": "2026-06-15"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1938,
          "p25Cents": 1723,
          "p75Cents": 2030,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1907,
          "p25Cents": 1816,
          "p75Cents": 2091,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 1991,
          "p25Cents": 1541,
          "p75Cents": 2150,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 1988,
          "p25Cents": 1825,
          "p75Cents": 2157,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 1775,
          "p25Cents": 1465,
          "p75Cents": 1943,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 1690,
          "p25Cents": 1650,
          "p75Cents": 1819,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 1733,
          "p25Cents": 1460,
          "p75Cents": 1881,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 1700,
          "p25Cents": 1456,
          "p75Cents": 1750,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1870,
          "p25Cents": 1774,
          "p75Cents": 2005,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2098,
          "p25Cents": 1872,
          "p75Cents": 3191,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2375,
          "p25Cents": 2160,
          "p75Cents": 3595,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2120,
          "p25Cents": 1990,
          "p75Cents": 2784,
          "n": 12,
          "years": 3
        }
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
      "epCents": 2238,
      "spark": [
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
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
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
      "seasonalNormals": {
        "10": {
          "medianCents": 284,
          "p25Cents": 196,
          "p75Cents": 308,
          "n": 12,
          "years": 3
        },
        "11": {
          "medianCents": 271,
          "p25Cents": 171,
          "p75Cents": 304,
          "n": 14,
          "years": 3
        },
        "12": {
          "medianCents": 262,
          "p25Cents": 164,
          "p75Cents": 268,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 259,
          "p25Cents": 149,
          "p75Cents": 262,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 259,
          "p25Cents": 163,
          "p75Cents": 265,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 248,
          "p25Cents": 200,
          "p75Cents": 277,
          "n": 14,
          "years": 3
        },
        "04": {
          "medianCents": 234,
          "p25Cents": 189,
          "p75Cents": 286,
          "n": 12,
          "years": 3
        },
        "05": {
          "medianCents": 235,
          "p25Cents": 175,
          "p75Cents": 279,
          "n": 14,
          "years": 3
        },
        "06": {
          "medianCents": 248,
          "p25Cents": 245,
          "p75Cents": 305,
          "n": 13,
          "years": 4
        },
        "07": {
          "medianCents": 253,
          "p25Cents": 244,
          "p75Cents": 312,
          "n": 13,
          "years": 3
        },
        "08": {
          "medianCents": 260,
          "p25Cents": 253,
          "p75Cents": 311,
          "n": 14,
          "years": 3
        },
        "09": {
          "medianCents": 269,
          "p25Cents": 244,
          "p75Cents": 311,
          "n": 13,
          "years": 3
        }
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
      "seasonalNormals": {
        "10": {
          "medianCents": 191,
          "p25Cents": 178,
          "p75Cents": 223,
          "n": 12,
          "years": 3
        },
        "11": {
          "medianCents": 178,
          "p25Cents": 177,
          "p75Cents": 194,
          "n": 14,
          "years": 3
        },
        "12": {
          "medianCents": 170,
          "p25Cents": 166,
          "p75Cents": 178,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 153,
          "p25Cents": 144,
          "p75Cents": 178,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 154,
          "p25Cents": 142,
          "p75Cents": 191,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 161,
          "p25Cents": 157,
          "p75Cents": 191,
          "n": 14,
          "years": 3
        },
        "04": {
          "medianCents": 162,
          "p25Cents": 155,
          "p75Cents": 171,
          "n": 12,
          "years": 3
        },
        "05": {
          "medianCents": 166,
          "p25Cents": 165,
          "p75Cents": 174,
          "n": 14,
          "years": 3
        },
        "06": {
          "medianCents": 188,
          "p25Cents": 166,
          "p75Cents": 192,
          "n": 13,
          "years": 4
        },
        "07": {
          "medianCents": 183,
          "p25Cents": 150,
          "p75Cents": 193,
          "n": 13,
          "years": 3
        },
        "08": {
          "medianCents": 174,
          "p25Cents": 172,
          "p75Cents": 194,
          "n": 14,
          "years": 3
        },
        "09": {
          "medianCents": 200,
          "p25Cents": 184,
          "p75Cents": 201,
          "n": 13,
          "years": 3
        }
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
      "seasonalNormals": {
        "01": {
          "medianCents": 95,
          "p25Cents": 76,
          "p75Cents": 138,
          "n": 5,
          "years": 2
        },
        "02": {
          "medianCents": 470,
          "p25Cents": 120,
          "p75Cents": 820,
          "n": 8,
          "years": 2
        },
        "03": {
          "medianCents": 286,
          "p25Cents": 157,
          "p75Cents": 393,
          "n": 10,
          "years": 2
        },
        "04": {
          "medianCents": 215,
          "p25Cents": 60,
          "p75Cents": 370,
          "n": 8,
          "years": 2
        },
        "05": {
          "medianCents": 182,
          "p25Cents": 65,
          "p75Cents": 348,
          "n": 8,
          "years": 2
        },
        "06": {
          "medianCents": 301,
          "p25Cents": 177,
          "p75Cents": 303,
          "n": 7,
          "years": 2
        }
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
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2500,
          "rangeCents": [
            2262,
            2738
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
              "valueCents": 3100,
              "date": "2026-06-01"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-15"
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
              "valueCents": 2750,
              "date": "2026-06-15"
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
          "pct": -0.08333333333333333,
          "dir": "down",
          "agreement": 0.714,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.1676
        },
        "confidence": "low",
        "label": "About $22.62–$27.38 (wholesale reference), down -10.7% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-15"
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
            "valueCents": 2750,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 2400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2450,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2450,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2450,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2575,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2575,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1862,
          "p25Cents": 1550,
          "p75Cents": 2253,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1940,
          "p25Cents": 1800,
          "p75Cents": 2800,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2820,
          "p25Cents": 2395,
          "p75Cents": 3191,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2860,
          "p25Cents": 2210,
          "p75Cents": 3000,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2780,
          "p25Cents": 2085,
          "p75Cents": 3040,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 3075,
          "p25Cents": 2049,
          "p75Cents": 3625,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2308,
          "p25Cents": 1970,
          "p75Cents": 3615,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 1925,
          "p25Cents": 1915,
          "p75Cents": 2300,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2177,
          "p25Cents": 1903,
          "p75Cents": 2481,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2630,
          "p25Cents": 2225,
          "p75Cents": 2830,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2370,
          "p25Cents": 2295,
          "p75Cents": 2440,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2200,
          "p25Cents": 2080,
          "p75Cents": 2313,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "bell-pepper",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.14563106796116504,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.82,
      "epCents": 3049,
      "spark": [
        2400,
        2400,
        2450,
        2450,
        2450,
        2575,
        2575,
        3200,
        3200,
        3200,
        3400,
        3400,
        3400,
        3400,
        3600,
        3600,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        2200,
        2200,
        2200,
        2200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "broccoli",
      "label_en": "Broccoli",
      "label_es": "Brócoli",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2600,
          "rangeCents": [
            1994,
            3206
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
              "valueCents": 4900,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "pct": -0.5210526315789473,
          "dir": "down",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.2747
        },
        "confidence": "low",
        "label": "About $19.94–$32.06 (wholesale reference), down -34.5% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "valueCents": 2600,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 4750,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4750,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4625,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4625,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4625,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4825,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4825,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2250,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2250,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2275,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 3759,
          "p25Cents": 3582,
          "p75Cents": 4266,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 3525,
          "p25Cents": 3070,
          "p75Cents": 4140,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 3400,
          "p25Cents": 2888,
          "p75Cents": 3750,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 3188,
          "p25Cents": 2933,
          "p75Cents": 3385,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 3305,
          "p25Cents": 2590,
          "p75Cents": 4349,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2753,
          "p25Cents": 2517,
          "p75Cents": 3316,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3000,
          "p25Cents": 2566,
          "p75Cents": 3426,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3200,
          "p25Cents": 2510,
          "p75Cents": 4950,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2963,
          "p25Cents": 2644,
          "p75Cents": 3335,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3308,
          "p25Cents": 3240,
          "p75Cents": 3843,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 3025,
          "p25Cents": 2995,
          "p75Cents": 3455,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 3483,
          "p25Cents": 3136,
          "p75Cents": 3989,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "broccoli",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.5081081081081081,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 4000,
      "spark": [
        4750,
        4200,
        4200,
        4200,
        4200,
        4750,
        4625,
        4625,
        4625,
        4825,
        4825,
        3800,
        3800,
        3800,
        3800,
        3050,
        3050,
        3050,
        3050,
        3050,
        2250,
        2250,
        2250,
        2250,
        2250,
        2275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "cauliflower",
      "label_en": "Cauliflower",
      "label_es": "Coliflor",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3200,
          "rangeCents": [
            2650,
            3650
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
              "valueCents": 2200,
              "date": "2026-06-08"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "pct": -0.2871287128712871,
          "dir": "down",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0824
        },
        "confidence": "low",
        "label": "About $26.50–$36.50 (wholesale reference), down -28.9% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "valueCents": 3500,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 5050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 4600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 4600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 4600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 4600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 4425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4400,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 4700,
          "p25Cents": 4700,
          "p75Cents": 5230,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 4700,
          "p25Cents": 4700,
          "p75Cents": 5340,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 4700,
          "p25Cents": 4700,
          "p75Cents": 5738,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 4700,
          "p25Cents": 4410,
          "p75Cents": 4744,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 4700,
          "p25Cents": 4700,
          "p75Cents": 5156,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 5225,
          "p25Cents": 4700,
          "p75Cents": 5478,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 5100,
          "p25Cents": 4700,
          "p75Cents": 5800,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 5290,
          "p25Cents": 4700,
          "p75Cents": 5540,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 4700,
          "p25Cents": 4700,
          "p75Cents": 4700,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 4700,
          "p25Cents": 4700,
          "p75Cents": 4700,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 4700,
          "p25Cents": 4175,
          "p75Cents": 5900,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 4700,
          "p25Cents": 4688,
          "p75Cents": 4700,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "cauliflower",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.2,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.6,
      "epCents": 5333,
      "spark": [
        5050,
        4600,
        4600,
        4600,
        4600,
        4500,
        4500,
        4500,
        4500,
        4500,
        4500,
        4425,
        4425,
        4425,
        4425,
        4200,
        4200,
        4200,
        4400,
        4400,
        4400,
        4400,
        4400,
        4400,
        4400,
        3600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "spinach",
      "label_en": "Spinach",
      "label_es": "Espinaca",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2200,
          "rangeCents": [
            2100,
            2244
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
              "valueCents": 2100,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "pct": -0.07216494845360824,
          "dir": "down",
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0353
        },
        "confidence": "low",
        "label": "About $21.00–$22.44 (wholesale reference), down -5.3% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 2425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2425,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2313,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2313,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2313,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2313,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2313,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2713,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2713,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2713,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2713,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2713,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2388,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2250,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1975,
          "p25Cents": 1956,
          "p75Cents": 2200,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1925,
          "p25Cents": 1700,
          "p75Cents": 2100,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2200,
          "p25Cents": 2100,
          "p75Cents": 2243,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2200,
          "p25Cents": 2100,
          "p75Cents": 2250,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2200,
          "p25Cents": 2100,
          "p75Cents": 2250,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2200,
          "p25Cents": 2100,
          "p75Cents": 2250,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2200,
          "p25Cents": 2125,
          "p75Cents": 2250,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2200,
          "p25Cents": 2100,
          "p75Cents": 2200,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2150,
          "p25Cents": 2100,
          "p75Cents": 2200,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2200,
          "p25Cents": 2108,
          "p75Cents": 2200,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2200,
          "p25Cents": 2200,
          "p75Cents": 2250,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2200,
          "p25Cents": 1981,
          "p75Cents": 2250,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "spinach",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.07216494845360824,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 2933,
      "spark": [
        2425,
        2425,
        2313,
        2313,
        2313,
        2313,
        2313,
        2713,
        2713,
        2713,
        2713,
        2713,
        2150,
        2150,
        2150,
        2150,
        2388,
        2388,
        2388,
        2388,
        2388,
        2388,
        2388,
        2388,
        2388,
        2250
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "asparagus",
      "label_en": "Asparagus",
      "label_es": "Espárragos",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3300,
          "rangeCents": [
            2537,
            4063
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
              "date": "2026-06-15"
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
              "valueCents": 2350,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.18185
        },
        "confidence": "low",
        "label": "About $25.37–$40.63 (wholesale reference), down -28% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-06-15"
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
            "valueCents": 2350,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 4407,
          "p25Cents": 3479,
          "p75Cents": 4986,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 3450,
          "p25Cents": 3113,
          "p75Cents": 3550,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 4170,
          "p25Cents": 3680,
          "p75Cents": 4344,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 4175,
          "p25Cents": 4050,
          "p75Cents": 5190,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 3432,
          "p25Cents": 3148,
          "p75Cents": 3850,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2840,
          "p25Cents": 2211,
          "p75Cents": 3415,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 4013,
          "p25Cents": 3374,
          "p75Cents": 4285,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3490,
          "p25Cents": 3180,
          "p75Cents": 5719,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3138,
          "p25Cents": 2988,
          "p75Cents": 3665,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3943,
          "p25Cents": 3075,
          "p75Cents": 4273,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 4090,
          "p25Cents": 3835,
          "p75Cents": 4175,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 4240,
          "p25Cents": 4050,
          "p75Cents": 4646,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "asparagus",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.4112903225806452,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.55,
      "epCents": 6000,
      "spark": [
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
        3650,
        3650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "garlic",
      "label_en": "Garlic",
      "label_es": "Ajo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 6200,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.013250000000000001
        },
        "confidence": "low",
        "label": "About $47.00–$60.50 (wholesale reference), down -17.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5600,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 6200,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 5600,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 7500,
          "p25Cents": 7006,
          "p75Cents": 7500,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 7300,
          "p25Cents": 7300,
          "p75Cents": 7800,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 7288,
          "p25Cents": 7200,
          "p75Cents": 7700,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 7200,
          "p25Cents": 6900,
          "p75Cents": 7550,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 7000,
          "p25Cents": 6950,
          "p75Cents": 7560,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 6950,
          "p25Cents": 6780,
          "p75Cents": 7725,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 7173,
          "p25Cents": 6223,
          "p75Cents": 7279,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 7150,
          "p25Cents": 6240,
          "p75Cents": 7580,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 6170,
          "p25Cents": 5641,
          "p75Cents": 7175,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 6230,
          "p25Cents": 6200,
          "p75Cents": 7500,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 6200,
          "p25Cents": 6200,
          "p75Cents": 7640,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 6470,
          "p25Cents": 6367,
          "p75Cents": 7500,
          "n": 12,
          "years": 3
        }
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
        5600,
        5600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "carrot",
      "label_en": "Carrot",
      "label_es": "Zanahoria",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3975,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0254
        },
        "confidence": "low",
        "label": "About $31.63–$39.00 (wholesale reference), up +16.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3425,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3975,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 3200,
          "p25Cents": 2760,
          "p75Cents": 3250,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 3190,
          "p25Cents": 2840,
          "p75Cents": 3230,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 3015,
          "p25Cents": 2835,
          "p75Cents": 3169,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2950,
          "p25Cents": 2875,
          "p75Cents": 3200,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 3203,
          "p25Cents": 3075,
          "p75Cents": 3396,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 3098,
          "p25Cents": 3028,
          "p75Cents": 3374,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3088,
          "p25Cents": 3000,
          "p75Cents": 3278,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3350,
          "p25Cents": 3000,
          "p75Cents": 3350,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3113,
          "p25Cents": 2993,
          "p75Cents": 3263,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3035,
          "p25Cents": 2850,
          "p75Cents": 3250,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 3200,
          "p25Cents": 2850,
          "p75Cents": 3250,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 3070,
          "p25Cents": 2850,
          "p75Cents": 3250,
          "n": 12,
          "years": 3
        }
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
        3425,
        3425
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "corn-on-the-cob",
      "label_en": "Corn on the cob",
      "label_es": "Elote (mazorca)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2638,
          "rangeCents": [
            1619,
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
              "date": "2026-06-15"
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
              "valueCents": 2700,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2575,
              "date": "2026-06-15"
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
              "valueCents": 1600,
              "date": "2026-06-15"
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
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.21685000000000001
        },
        "confidence": "low",
        "label": "About $16.19–$33.63 (wholesale reference), down -30.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1625,
            "date": "2026-06-15"
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
            "valueCents": 2700,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2575,
            "date": "2026-06-15"
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
            "valueCents": 1600,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 1625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 2200,
          "p25Cents": 2081,
          "p75Cents": 2680,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 2400,
          "p25Cents": 1575,
          "p75Cents": 2790,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2100,
          "p25Cents": 1720,
          "p75Cents": 2780,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 2763,
          "p25Cents": 2290,
          "p75Cents": 3200,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2382,
          "p25Cents": 1844,
          "p75Cents": 3655,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2490,
          "p25Cents": 1823,
          "p75Cents": 4345,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 1710,
          "p25Cents": 1578,
          "p75Cents": 4263,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 1430,
          "p25Cents": 1400,
          "p75Cents": 1500,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1530,
          "p25Cents": 1439,
          "p75Cents": 1738,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2180,
          "p25Cents": 1864,
          "p75Cents": 2508,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2200,
          "p25Cents": 2175,
          "p75Cents": 2850,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2105,
          "p25Cents": 2095,
          "p75Cents": 2269,
          "n": 12,
          "years": 3
        }
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
      "epCents": 9421,
      "spark": [
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
        1625,
        1625
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "kale",
      "label_en": "Kale",
      "label_es": "Col rizada (kale)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.125,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.03205
        },
        "confidence": "low",
        "label": "About $18.00–$28.00 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 2800,
          "p25Cents": 2538,
          "p75Cents": 2850,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 2800,
          "p25Cents": 2450,
          "p75Cents": 2975,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2800,
          "p25Cents": 2800,
          "p75Cents": 2975,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 2800,
          "p25Cents": 2800,
          "p75Cents": 3225,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 3000,
          "p25Cents": 2800,
          "p75Cents": 3350,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 3200,
          "p25Cents": 2800,
          "p75Cents": 3350,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3015,
          "p25Cents": 2800,
          "p75Cents": 3200,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2800,
          "p25Cents": 2800,
          "p75Cents": 2950,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2900,
          "p25Cents": 2813,
          "p75Cents": 2950,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2850,
          "p25Cents": 2800,
          "p75Cents": 2850,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2850,
          "p25Cents": 2800,
          "p75Cents": 2850,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2800,
          "p25Cents": 2740,
          "p75Cents": 2850,
          "n": 12,
          "years": 3
        }
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
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "basil",
      "label_en": "Basil",
      "label_es": "Albahaca",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 650,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.375,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $6.79–$8.94 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 688,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 650,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 688,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 838,
          "p25Cents": 838,
          "p75Cents": 838,
          "n": 10,
          "years": 2
        },
        "11": {
          "medianCents": 838,
          "p25Cents": 838,
          "p75Cents": 838,
          "n": 8,
          "years": 2
        },
        "12": {
          "medianCents": 838,
          "p25Cents": 838,
          "p75Cents": 838,
          "n": 10,
          "years": 2
        },
        "01": {
          "medianCents": 894,
          "p25Cents": 725,
          "p75Cents": 975,
          "n": 11,
          "years": 3
        },
        "02": {
          "medianCents": 1000,
          "p25Cents": 725,
          "p75Cents": 1016,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 1000,
          "p25Cents": 725,
          "p75Cents": 1100,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 1000,
          "p25Cents": 725,
          "p75Cents": 1100,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 1000,
          "p25Cents": 725,
          "p75Cents": 1100,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1000,
          "p25Cents": 725,
          "p75Cents": 1050,
          "n": 11,
          "years": 3
        },
        "07": {
          "medianCents": 838,
          "p25Cents": 838,
          "p75Cents": 848,
          "n": 10,
          "years": 2
        },
        "08": {
          "medianCents": 838,
          "p25Cents": 838,
          "p75Cents": 838,
          "n": 8,
          "years": 2
        },
        "09": {
          "medianCents": 838,
          "p25Cents": 838,
          "p75Cents": 838,
          "n": 8,
          "years": 2
        }
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "cilantro",
      "label_en": "Cilantro",
      "label_es": "Cilantro",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2775,
          "rangeCents": [
            2400,
            2944
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-15"
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
              "valueCents": 3600,
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.09570000000000001
        },
        "confidence": "low",
        "label": "About $24.00–$29.44 (wholesale reference), up +8.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2325,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-15"
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
            "valueCents": 3600,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 2925,
          "p25Cents": 2723,
          "p75Cents": 3000,
          "n": 10,
          "years": 2
        },
        "11": {
          "medianCents": 2640,
          "p25Cents": 2619,
          "p75Cents": 2783,
          "n": 8,
          "years": 2
        },
        "12": {
          "medianCents": 2632,
          "p25Cents": 2625,
          "p75Cents": 2658,
          "n": 10,
          "years": 2
        },
        "01": {
          "medianCents": 2600,
          "p25Cents": 2590,
          "p75Cents": 3075,
          "n": 12,
          "years": 3
        },
        "02": {
          "medianCents": 2775,
          "p25Cents": 2475,
          "p75Cents": 3075,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2700,
          "p25Cents": 2350,
          "p75Cents": 2776,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2700,
          "p25Cents": 2438,
          "p75Cents": 2925,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2700,
          "p25Cents": 2625,
          "p75Cents": 2925,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2925,
          "p25Cents": 2550,
          "p75Cents": 2963,
          "n": 11,
          "years": 3
        },
        "07": {
          "medianCents": 3200,
          "p25Cents": 2610,
          "p75Cents": 3700,
          "n": 10,
          "years": 2
        },
        "08": {
          "medianCents": 2935,
          "p25Cents": 2700,
          "p75Cents": 3475,
          "n": 8,
          "years": 2
        },
        "09": {
          "medianCents": 2820,
          "p25Cents": 2700,
          "p75Cents": 3048,
          "n": 8,
          "years": 2
        }
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
      "epCents": 3964,
      "spark": [
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
        2325,
        2325
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "button-mushroom",
      "label_en": "Button mushroom",
      "label_es": "Champiñón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $16.63–$23.38 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 1475,
          "p25Cents": 1475,
          "p75Cents": 1475,
          "n": 12,
          "years": 3
        }
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "sweet-potato",
      "label_en": "Sweet potato",
      "label_es": "Camote",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4225,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $24.75–$43.63 (wholesale reference), up +3.7% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2125,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4225,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2125,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1930,
          "p25Cents": 1850,
          "p75Cents": 1950,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1850,
          "p25Cents": 1850,
          "p75Cents": 1950,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2150,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2150,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2150,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2150,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2150,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2150,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1950,
          "p25Cents": 1875,
          "p75Cents": 1950,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 1990,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2000,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 1950,
          "p25Cents": 1850,
          "p75Cents": 2000,
          "n": 12,
          "years": 3
        }
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "avocado",
      "label_en": "Avocado",
      "label_es": "Aguacate",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 5900,
          "rangeCents": [
            4831,
            6969
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
              "valueCents": 6200,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 6000,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5700,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5800,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.6888888888888889,
          "dir": "up",
          "agreement": 0.857,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0565
        },
        "confidence": "low",
        "label": "About $48.31–$69.69 (wholesale reference), up +91.9% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5800,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 3375,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3650,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3900,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4000,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 4000,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 4100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 6050,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 6100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 6100,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 5800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 5800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 5800,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 5300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 5300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5600,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5700,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5700,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5700,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 5700,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 5513,
          "p25Cents": 3593,
          "p75Cents": 6085,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 4800,
          "p25Cents": 3545,
          "p75Cents": 6500,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 4670,
          "p25Cents": 3436,
          "p75Cents": 6222,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 4681,
          "p25Cents": 3700,
          "p75Cents": 6120,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 4877,
          "p25Cents": 3681,
          "p75Cents": 7856,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 4970,
          "p25Cents": 3771,
          "p75Cents": 8323,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 5310,
          "p25Cents": 4044,
          "p75Cents": 7290,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 5660,
          "p25Cents": 5333,
          "p75Cents": 7406,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 7055,
          "p25Cents": 6193,
          "p75Cents": 7178,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 6768,
          "p25Cents": 6060,
          "p75Cents": 7217,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 7675,
          "p25Cents": 6880,
          "p75Cents": 8020,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 5853,
          "p25Cents": 4793,
          "p75Cents": 6478,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "avocado",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.5616438356164384,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 7867,
      "spark": [
        3375,
        3500,
        3500,
        3500,
        3600,
        3600,
        3650,
        3800,
        3900,
        4000,
        4000,
        4100,
        6050,
        6100,
        6100,
        5800,
        5800,
        5800,
        5300,
        5300,
        5600,
        5600,
        5700,
        5700,
        5700,
        5700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "lemon",
      "label_en": "Lemon",
      "label_es": "Limón amarillo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 4813,
          "rangeCents": [
            4456,
            5013
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4800,
              "date": "2026-06-15"
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
              "valueCents": 5050,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4600,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.10285714285714286,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0479
        },
        "confidence": "low",
        "label": "About $44.56–$50.13 (wholesale reference), up +48.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4825,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4800,
            "date": "2026-06-15"
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
            "valueCents": 5050,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4600,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "move": 0.08426966292134831,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.45,
      "epCents": 10696,
      "spark": [
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
        4825,
        4825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "lime",
      "label_en": "Lime",
      "label_es": "Limón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3075,
          "rangeCents": [
            2744,
            3406
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
              "date": "2026-06-15"
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
              "valueCents": 2700,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3475,
              "date": "2026-06-15"
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
              "valueCents": 2375,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": -0.3763440860215054,
          "dir": "down",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.18135
        },
        "confidence": "low",
        "label": "About $27.44–$34.06 (wholesale reference), down -28.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-15"
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
            "valueCents": 2700,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3475,
            "date": "2026-06-15"
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
            "valueCents": 2375,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
      "epCents": 8786,
      "spark": [
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
        2900,
        2900
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "pineapple",
      "label_en": "Pineapple",
      "label_es": "Piña",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": -0.20512820512820512,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.073
        },
        "confidence": "low",
        "label": "About $15.69–$17.19 (wholesale reference), down -3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        1550,
        1550
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
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
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2138,
          "rangeCents": [
            1906,
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
              "date": "2026-06-15"
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
              "valueCents": 2000,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.16025
        },
        "confidence": "low",
        "label": "About $19.06–$24.56 (wholesale reference), down -23.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-15"
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
            "valueCents": 2000,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
      "epCents": 2251,
      "spark": [
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
        1850,
        1850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "celery",
      "label_en": "Celery",
      "label_es": "Apio",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3894,
          "rangeCents": [
            3606,
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
              "date": "2026-06-15"
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
              "valueCents": 3950,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3325,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.26744999999999997
        },
        "confidence": "low",
        "label": "About $36.06–$40.82 (wholesale reference), down -41.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3888,
            "date": "2026-06-15"
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
            "valueCents": 3950,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3325,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        3888,
        3888
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "cabbage",
      "label_en": "Cabbage",
      "label_es": "Repollo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2125,
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
              "date": "2026-06-15"
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
              "valueCents": 2150,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0601
        },
        "confidence": "low",
        "label": "About $18.81–$24.75 (wholesale reference), up +4.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1825,
            "date": "2026-06-15"
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
            "valueCents": 2150,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "elevatedWeeks": 6,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 2656,
      "spark": [
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
        1825,
        1825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "eggplant",
      "label_en": "Eggplant",
      "label_es": "Berenjena",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2850,
          "rangeCents": [
            2225,
            3356
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
              "date": "2026-06-15"
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
              "valueCents": 2150,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3325,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.08295
        },
        "confidence": "low",
        "label": "About $22.25–$33.56 (wholesale reference), down -22.7% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-15"
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
            "valueCents": 2150,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3325,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
      "epCents": 3519,
      "spark": [
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
        1650,
        1650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "zucchini",
      "label_en": "Zucchini",
      "label_es": "Calabacín",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 1625,
          "rangeCents": [
            1263,
            2150
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.22754999999999997
        },
        "confidence": "low",
        "label": "About $12.63–$21.50 (wholesale reference), down -39.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1150,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
      "epCents": 1711,
      "spark": [
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
        1150,
        1150
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "beet",
      "label_en": "Beet",
      "label_es": "Remolacha",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.04245
        },
        "confidence": "low",
        "label": "About $21.75–$24.25 (wholesale reference), up +2% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        2500,
        2500
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "leek",
      "label_en": "Leek",
      "label_es": "Puerro",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.25,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.014349999999999998
        },
        "confidence": "low",
        "label": "About $26.75–$32.00 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2875,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        2875,
        2875
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "ginger",
      "label_en": "Ginger root",
      "label_es": "Jengibre",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4850,
              "date": "2026-06-15"
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
              "valueCents": 3275,
              "date": "2026-06-15"
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
          "agreement": 0.857,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0278
        },
        "confidence": "low",
        "label": "About $37.50–$47.50 (wholesale reference), down -14.9% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4125,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4850,
            "date": "2026-06-15"
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
            "valueCents": 3275,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        4125,
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "yellow-squash",
      "label_en": "Yellow squash",
      "label_es": "Calabaza amarilla",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 1875,
          "rangeCents": [
            1550,
            2188
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.29275
        },
        "confidence": "low",
        "label": "About $15.50–$21.88 (wholesale reference), down -25% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "move": -0.46987951807228917,
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
        1100,
        1100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "jalapeno",
      "label_en": "Jalapeño",
      "label_es": "Chile jalapeño",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "pct": -0.273972602739726,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.34255
        },
        "confidence": "low",
        "label": "About $25.13–$28.50 (wholesale reference), down -5.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "jalapeno",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.03636363636363636,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 3104,
      "spark": [
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
        2650,
        2650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "green-onion",
      "label_en": "Green onion",
      "label_es": "Cebollín",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2100,
          "rangeCents": [
            1944,
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.15215
        },
        "confidence": "low",
        "label": "About $19.44–$22.00 (wholesale reference), down -66.2% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        2100,
        2100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "green-beans",
      "label_en": "Green beans",
      "label_es": "Ejotes",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3125,
          "rangeCents": [
            2825,
            3425
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
              "date": "2026-06-15"
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
              "valueCents": 3200,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-15"
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
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.31
        },
        "confidence": "low",
        "label": "About $28.25–$34.25 (wholesale reference), down -46.7% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-15"
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
            "valueCents": 3200,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 3050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "green-beans",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.23232323232323232,
        "retrace": 0.03937007874015748,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.88,
      "epCents": 3551,
      "spark": [
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
        3050,
        3050
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "parsley",
      "label_en": "Parsley",
      "label_es": "Perejil",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.375,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.02385
        },
        "confidence": "low",
        "label": "About $26.97–$32.25 (wholesale reference), flat -0.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2688,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "elevatedWeeks": 5,
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
        2688,
        2688,
        2463,
        2463,
        2688,
        2688,
        2688
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "brussels-sprouts",
      "label_en": "Brussels sprouts",
      "label_es": "Coles de Bruselas",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3375,
          "rangeCents": [
            3088,
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.11695
        },
        "confidence": "low",
        "label": "About $30.88–$36.69 (wholesale reference), down -40% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        3450,
        3450
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "butternut-squash",
      "label_en": "Butternut squash",
      "label_es": "Calabaza moscada",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3313,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.03935
        },
        "confidence": "low",
        "label": "About $19.25–$27.69 (wholesale reference), up +3.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2313,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3313,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        2313,
        2313
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "iceberg-lettuce",
      "label_en": "Iceberg lettuce",
      "label_es": "Lechuga iceberg",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 6163,
          "rangeCents": [
            5538,
            6788
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 6450,
              "date": "2026-06-15"
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
              "valueCents": 6700,
              "date": "2026-06-15"
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
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.35219999999999996
        },
        "confidence": "low",
        "label": "About $55.38–$67.88 (wholesale reference), up +34% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 6450,
            "date": "2026-06-15"
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
            "valueCents": 6700,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "move": 0.288135593220339,
        "retrace": 0.017241379310344827,
        "elevatedWeeks": 7,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.74,
      "epCents": 8328,
      "spark": [
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
        5700,
        5700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "bok-choy",
      "label_en": "Bok choy",
      "label_es": "Bok choy",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3313,
          "rangeCents": [
            2838,
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
              "date": "2026-06-15"
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
              "valueCents": 2900,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0561
        },
        "confidence": "low",
        "label": "About $28.38–$35.50 (wholesale reference), up +5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-15"
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
            "valueCents": 2900,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        3350,
        3350
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "artichoke",
      "label_en": "Artichoke",
      "label_es": "Alcachofa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5225,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.059750000000000004
        },
        "confidence": "low",
        "label": "About $47.00–$55.13 (wholesale reference), up +9.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5225,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "move": 0.43830431491294475,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.4,
      "epCents": 12783,
      "spark": [
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
        5700,
        5700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "okra",
      "label_en": "Okra",
      "label_es": "Quimbombó",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2500,
          "rangeCents": [
            2388,
            2788
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2575,
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
              "valueCents": 1950,
              "date": "2026-06-15"
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
          "pct": -0.020833333333333332,
          "dir": "down",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0959
        },
        "confidence": "low",
        "label": "About $23.88–$27.88 (wholesale reference), down -26.5% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2575,
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
            "valueCents": 1950,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2175,
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "okra",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.020833333333333332,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 2941,
      "spark": [
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2400,
        2175,
        2175,
        2175,
        2175,
        2175,
        2175,
        2350,
        2350,
        2350
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "snow-peas",
      "label_en": "Snow peas",
      "label_es": "Arvejas de nieve",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.10845
        },
        "confidence": "low",
        "label": "About $21.00–$28.44 (wholesale reference), down -17.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2825,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        2825,
        2825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "butter-lettuce",
      "label_en": "Butter lettuce",
      "label_es": "Lechuga mantequilla (Boston)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2675,
          "rangeCents": [
            2469,
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
              "valueCents": 2675,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.095
        },
        "confidence": "low",
        "label": "About $24.69–$36.00 (wholesale reference), up +8.9% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2675,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
      "epCents": 4115,
      "spark": [
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
        3350,
        3350
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "green-leaf-lettuce",
      "label_en": "Green leaf lettuce",
      "label_es": "Lechuga hoja verde",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3763,
          "rangeCents": [
            3213,
            4594
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
              "valueCents": 4475,
              "date": "2026-06-15"
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
              "valueCents": 3100,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3650,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "pct": 0.28776978417266186,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.17585
        },
        "confidence": "low",
        "label": "About $32.13–$45.94 (wholesale reference), up +22% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4475,
            "date": "2026-06-15"
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
            "valueCents": 3100,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 4475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "green-leaf-lettuce",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.005555555555555556,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 5376,
      "spark": [
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
        5150,
        4475
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "red-leaf-lettuce",
      "label_en": "Red leaf lettuce",
      "label_es": "Lechuga hoja roja",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3750,
          "rangeCents": [
            3088,
            4350
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
              "date": "2026-06-15"
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
              "valueCents": 4000,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-15"
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
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.15125
        },
        "confidence": "low",
        "label": "About $30.88–$43.50 (wholesale reference), up +29.8% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 5400,
            "date": "2026-06-15"
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
            "valueCents": 4000,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "elevatedWeeks": 7,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 5357,
      "spark": [
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
        5400,
        5400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "collard-greens",
      "label_en": "Collard greens",
      "label_es": "Berza (collard)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-15"
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
          "agreement": 0.25,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $16.81–$19.88 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "elevatedWeeks": 7,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 2866,
      "spark": [
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
        2275,
        2275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "napa-cabbage",
      "label_en": "Napa cabbage",
      "label_es": "Col napa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2900,
          "rangeCents": [
            2675,
            3644
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-05-19"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3425,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 5200,
              "date": "2026-06-15"
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
          "pct": -0.22666666666666666,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.04205
        },
        "confidence": "low",
        "label": "About $26.75–$36.44 (wholesale reference), up +6.2% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-05-19"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3425,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 5200,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3750,
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
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3538,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3450,
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
            "valueCents": 2775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "napa-cabbage",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.22666666666666666,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"Chinese Cabbage\"), pending live verification.",
      "yield": 0.8,
      "epCents": 3625,
      "spark": [
        3750,
        3750,
        3750,
        3650,
        3650,
        3950,
        3950,
        3950,
        3950,
        3950,
        3538,
        3538,
        3538,
        3538,
        3538,
        3538,
        3538,
        3538,
        3538,
        3450,
        3450,
        3450,
        3450,
        2775,
        2900,
        2900
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "rutabaga",
      "label_en": "Rutabaga",
      "label_es": "Colinabo (rutabaga)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3225,
              "date": "2026-06-15"
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
          "agreement": 0.667,
          "nSources": 6,
          "nFamilies": 6,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $28.13–$31.69 (wholesale reference), flat +0% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3225,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "daikon",
      "label_en": "Daikon radish",
      "label_es": "Rábano daikon",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3300,
          "rangeCents": [
            2788,
            3550
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
              "valueCents": 3600,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.833,
          "nSources": 6,
          "nFamilies": 6,
          "nTypes": 1,
          "noise": 0.011300000000000001
        },
        "confidence": "low",
        "label": "About $27.88–$35.50 (wholesale reference), down -5.6% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2650,
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
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "basis": "wholesale"
          },
          {
            "kind": "trend",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "basis": "wholesale"
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3200,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "daikon",
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
      "coverage": "Staged: AMS commodity term resolved (\"Daikon\"), pending live verification.",
      "yield": 0.85,
      "epCents": 3882,
      "spark": [
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200,
        3200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "cherry-tomato",
      "label_en": "Cherry tomatoes",
      "label_es": "Jitomate cherry",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1400,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.16394999999999998
        },
        "confidence": "low",
        "label": "About $17.00–$28.63 (wholesale reference), up +1.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1400,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        1800,
        1800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "acorn-squash",
      "label_en": "Acorn squash",
      "label_es": "Calabaza bellota",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3913,
              "date": "2026-06-15"
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
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0516
        },
        "confidence": "low",
        "label": "About $35.75–$42.75 (wholesale reference), up +54.5% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3913,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        3200,
        3200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "serrano-pepper",
      "label_en": "Serrano pepper",
      "label_es": "Chile serrano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3625,
          "rangeCents": [
            3225,
            4647
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
              "valueCents": 3325,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 6500,
              "date": "2026-05-04"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6363,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2950,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4075,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.45041322314049587,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.1357
        },
        "confidence": "low",
        "label": "About $32.25–$46.47 (wholesale reference), up +8.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3325,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 6500,
            "date": "2026-05-04"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6363,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2950,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4075,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3550,
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 6050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 6050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 6050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 6050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 6050,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 4900,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 4475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 4200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 4200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 4200,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 3825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3825,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3825,
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
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3625,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3425,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3225,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "serrano-pepper",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.2569832402234637,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"Peppers, Serrano\"), pending live verification.",
      "yield": 0.85,
      "epCents": 4265,
      "spark": [
        6050,
        6050,
        6050,
        6050,
        6050,
        4900,
        4475,
        4200,
        4200,
        4200,
        3825,
        3825,
        3825,
        3650,
        3650,
        3650,
        3650,
        3650,
        3625,
        3425,
        3425,
        3225,
        3225,
        3225,
        3325,
        3325
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "poblano-pepper",
      "label_en": "Poblano pepper",
      "label_es": "Chile poblano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3400,
          "rangeCents": [
            2838,
            3888
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
              "valueCents": 3300,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-08"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-02-25"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3750,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": -0.4942528735632184,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.15625
        },
        "confidence": "low",
        "label": "About $28.38–$38.88 (wholesale reference), up +10.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-06-08"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-02-25"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3750,
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 6525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 6525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 6525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 5275,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 5175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 5450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3650,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3300,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "poblano-pepper",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3944954128440367,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"Peppers, Poblano\"), pending live verification.",
      "yield": 0.8,
      "epCents": 4250,
      "spark": [
        6525,
        6525,
        6525,
        5275,
        5175,
        5450,
        5450,
        5450,
        5450,
        5450,
        5450,
        5450,
        5450,
        5450,
        4175,
        4175,
        4175,
        4175,
        4175,
        3750,
        3650,
        3650,
        3650,
        3650,
        3300,
        3300
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "habanero-pepper",
      "label_en": "Habanero pepper",
      "label_es": "Chile habanero",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3800,
          "rangeCents": [
            3463,
            4150
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
              "valueCents": 4075,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3525,
              "date": "2026-06-10"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4100,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2475,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.05844155844155844,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.06035
        },
        "confidence": "low",
        "label": "About $34.63–$41.50 (wholesale reference), up +26.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4075,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3525,
            "date": "2026-06-10"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4100,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2475,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4300,
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
          }
        ],
        "history": [
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
            "valueCents": 3850,
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
            "valueCents": 3850,
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
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 3750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4063,
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
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3975,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 4075,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "habanero-pepper",
      "flag": {
        "verdict": "emerging",
        "actionBias": "watch",
        "reason": "a real move that has not persisted yet — watch the next read",
        "move": 0.08666666666666667,
        "retrace": 0,
        "elevatedWeeks": 3,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"Peppers, Habanero\"), pending live verification.",
      "yield": 0.85,
      "epCents": 4471,
      "spark": [
        3850,
        3850,
        3850,
        3850,
        3850,
        3700,
        3700,
        3700,
        3700,
        3700,
        3750,
        3750,
        3750,
        4075,
        4075,
        4075,
        4075,
        4075,
        4063,
        3950,
        3950,
        3975,
        3975,
        3975,
        4075,
        4075
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "mint",
      "label_en": "Mint",
      "label_es": "Menta",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.375,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $8.44–$14.50 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "rosemary",
      "label_en": "Rosemary",
      "label_es": "Romero",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $6.81–$8.50 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "thyme",
      "label_en": "Thyme",
      "label_es": "Tomillo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $7.88–$10.21 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1011,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "oregano",
      "label_en": "Oregano",
      "label_es": "Orégano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 719,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $7.24–$8.77 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 873,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 719,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "tarragon",
      "label_en": "Tarragon",
      "label_es": "Estragón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1075,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.5,
          "nSources": 6,
          "nFamilies": 6,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $7.94–$12.13 (wholesale reference), flat +0% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1075,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "dill",
      "label_en": "Dill",
      "label_es": "Eneldo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3925,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
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
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0363
        },
        "confidence": "low",
        "label": "About $12.75–$31.63 (wholesale reference), down -12.3% over the window. 7+ source(s) for level, 7 for trend.",
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3925,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
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
        3925,
        3925
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "red-onion",
      "label_en": "Red onion",
      "label_es": "Cebolla roja",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 1875,
          "rangeCents": [
            1625,
            2163
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
              "valueCents": 1950,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-15"
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
              "valueCents": 1500,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.08333333333333333,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.06709999999999999
        },
        "confidence": "low",
        "label": "About $16.25–$21.63 (wholesale reference), up +38.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-15"
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
            "valueCents": 1500,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 1800,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 1850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 1863,
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
            "valueCents": 1950,
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
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1950,
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
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "red-onion",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.04669887278582931,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS term resolved (\"Onions, Dry\" + variety RED filter), pending live verification.",
      "yield": 0.88,
      "epCents": 2131,
      "spark": [
        1800,
        1800,
        1800,
        1800,
        1850,
        1850,
        1863,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        2000,
        1950,
        1900,
        1950,
        1950,
        1950,
        1950
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "red-potato",
      "label_en": "Red potato",
      "label_es": "Papa roja",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3150,
          "rangeCents": [
            2975,
            3425
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
              "valueCents": 2750,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3250,
              "date": "2026-06-15"
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
              "valueCents": 3050,
              "date": "2026-06-12"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.1,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.02025
        },
        "confidence": "low",
        "label": "About $29.75–$34.25 (wholesale reference), up +12% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3250,
            "date": "2026-06-15"
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
            "valueCents": 3050,
            "date": "2026-06-12"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 2500,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2000,
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
            "valueCents": 2525,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 2000,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2450,
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
            "valueCents": 2450,
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
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2413,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2413,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2413,
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
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2475,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2225,
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2750,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 3128,
          "p25Cents": 2970,
          "p75Cents": 3285,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 3070,
          "p25Cents": 3000,
          "p75Cents": 3225,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2860,
          "p25Cents": 2781,
          "p75Cents": 3109,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2900,
          "p25Cents": 2825,
          "p75Cents": 2990,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 3110,
          "p25Cents": 2913,
          "p75Cents": 3173,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 3160,
          "p25Cents": 2889,
          "p75Cents": 3286,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3063,
          "p25Cents": 2723,
          "p75Cents": 3190,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3200,
          "p25Cents": 3043,
          "p75Cents": 3380,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3250,
          "p25Cents": 3200,
          "p75Cents": 3719,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3608,
          "p25Cents": 3253,
          "p75Cents": 3750,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 3365,
          "p25Cents": 3200,
          "p75Cents": 3795,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 3350,
          "p25Cents": 3160,
          "p75Cents": 3775,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "red-potato",
      "flag": {
        "verdict": "emerging",
        "actionBias": "watch",
        "reason": "a real move that has not persisted yet — watch the next read",
        "move": 0.12244897959183673,
        "retrace": 0,
        "elevatedWeeks": 3,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"ROUND RED\"), pending live verification.",
      "yield": 0.85,
      "epCents": 3706,
      "spark": [
        2500,
        2000,
        2525,
        2525,
        2000,
        2450,
        2450,
        2450,
        1950,
        2450,
        2450,
        2450,
        2450,
        1950,
        2413,
        2413,
        2413,
        2125,
        2450,
        2475,
        2475,
        2475,
        2225,
        2750,
        2750,
        2750
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "grapefruit",
      "label_en": "Grapefruit",
      "label_es": "Toronja",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3250,
          "rangeCents": [
            2800,
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.022556390977443608,
          "dir": "up",
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.020900000000000002
        },
        "confidence": "low",
        "label": "About $28.00–$34.00 (wholesale reference), down -4.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 3400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 3793,
          "p25Cents": 3225,
          "p75Cents": 3900,
          "n": 13,
          "years": 3
        },
        "11": {
          "medianCents": 3815,
          "p25Cents": 3600,
          "p75Cents": 3963,
          "n": 9,
          "years": 2
        },
        "12": {
          "medianCents": 4000,
          "p25Cents": 3565,
          "p75Cents": 4100,
          "n": 9,
          "years": 2
        },
        "01": {
          "medianCents": 4028,
          "p25Cents": 4000,
          "p75Cents": 4125,
          "n": 9,
          "years": 2
        },
        "02": {
          "medianCents": 3767,
          "p25Cents": 3400,
          "p75Cents": 4013,
          "n": 8,
          "years": 2
        },
        "03": {
          "medianCents": 3550,
          "p25Cents": 3490,
          "p75Cents": 4088,
          "n": 9,
          "years": 3
        },
        "04": {
          "medianCents": 3400,
          "p25Cents": 3290,
          "p75Cents": 3753,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3230,
          "p25Cents": 3200,
          "p75Cents": 3780,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3450,
          "p25Cents": 3200,
          "p75Cents": 3723,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3604,
          "p25Cents": 3118,
          "p75Cents": 3931,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 3725,
          "p25Cents": 3390,
          "p75Cents": 3815,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 3800,
          "p25Cents": 3356,
          "p75Cents": 3800,
          "n": 12,
          "years": 3
        }
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
        3400,
        3400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "apple",
      "label_en": "Apples",
      "label_es": "Manzana",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.04054054054054054,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0182
        },
        "confidence": "low",
        "label": "About $35.50–$39.00 (wholesale reference), up +9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 3850,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 3628,
          "p25Cents": 3554,
          "p75Cents": 3740,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 3600,
          "p25Cents": 3600,
          "p75Cents": 3635,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 3563,
          "p25Cents": 3500,
          "p75Cents": 3600,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 3500,
          "p25Cents": 3488,
          "p75Cents": 3538,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 3525,
          "p25Cents": 3483,
          "p75Cents": 3561,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 3500,
          "p25Cents": 3155,
          "p75Cents": 3500,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3590,
          "p25Cents": 3455,
          "p75Cents": 3835,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3580,
          "p25Cents": 3430,
          "p75Cents": 3900,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3500,
          "p25Cents": 3393,
          "p75Cents": 3900,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3613,
          "p25Cents": 3229,
          "p75Cents": 4369,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 3750,
          "p25Cents": 3500,
          "p75Cents": 4900,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 3828,
          "p25Cents": 3485,
          "p75Cents": 4368,
          "n": 12,
          "years": 3
        }
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
        3850,
        3850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "pear",
      "label_en": "Pears",
      "label_es": "Pera",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.06493506493506493,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.018349999999999998
        },
        "confidence": "low",
        "label": "About $38.19–$41.44 (wholesale reference), up +10.8% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 4100,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 4050,
          "p25Cents": 3838,
          "p75Cents": 4648,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 4170,
          "p25Cents": 4050,
          "p75Cents": 4900,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 4245,
          "p25Cents": 4200,
          "p75Cents": 4479,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 4200,
          "p25Cents": 4100,
          "p75Cents": 4500,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 4200,
          "p25Cents": 4165,
          "p75Cents": 4500,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 4250,
          "p25Cents": 4200,
          "p75Cents": 4455,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3950,
          "p25Cents": 3928,
          "p75Cents": 4098,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 3800,
          "p25Cents": 3600,
          "p75Cents": 3800,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 3800,
          "p25Cents": 3574,
          "p75Cents": 3850,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3980,
          "p25Cents": 3800,
          "p75Cents": 4538,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 4200,
          "p25Cents": 4100,
          "p75Cents": 4590,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 4100,
          "p25Cents": 3565,
          "p75Cents": 4573,
          "n": 12,
          "years": 3
        }
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
        4100,
        4100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "banana",
      "label_en": "Bananas",
      "label_es": "Plátano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $21.38–$22.75 (wholesale reference), up +2.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2150,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 2350,
          "p25Cents": 2174,
          "p75Cents": 2443,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 2350,
          "p25Cents": 2100,
          "p75Cents": 2375,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2350,
          "p25Cents": 2155,
          "p75Cents": 2369,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2080,
          "p25Cents": 2050,
          "p75Cents": 2100,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2100,
          "p25Cents": 2050,
          "p75Cents": 2103,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2118,
          "p25Cents": 2050,
          "p75Cents": 2125,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2200,
          "p25Cents": 2150,
          "p75Cents": 2264,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2280,
          "p25Cents": 2150,
          "p75Cents": 2400,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2295,
          "p25Cents": 2150,
          "p75Cents": 2375,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 2257,
          "p25Cents": 2044,
          "p75Cents": 2419,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2350,
          "p25Cents": 2120,
          "p75Cents": 2450,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2350,
          "p25Cents": 2100,
          "p75Cents": 2450,
          "n": 12,
          "years": 3
        }
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
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "watermelon",
      "label_en": "Watermelon",
      "label_es": "Sandía",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": -0.058823529411764705,
          "dir": "down",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 1,
          "noise": 0.2022
        },
        "confidence": "low",
        "label": "About $6.75–$19.75 (wholesale reference), down -21.4% over the window. 3+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 562,
          "p25Cents": 550,
          "p75Cents": 691,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 563,
          "p25Cents": 550,
          "p75Cents": 650,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 725,
          "p25Cents": 513,
          "p75Cents": 725,
          "n": 13,
          "years": 3
        },
        "01": {
          "medianCents": 850,
          "p25Cents": 725,
          "p75Cents": 1500,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 715,
          "p25Cents": 679,
          "p75Cents": 1650,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 1033,
          "p25Cents": 750,
          "p75Cents": 2164,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 1093,
          "p25Cents": 761,
          "p75Cents": 1765,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 700,
          "p25Cents": 650,
          "p75Cents": 713,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 592,
          "p25Cents": 564,
          "p75Cents": 685,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 575,
          "p25Cents": 550,
          "p75Cents": 601,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 560,
          "p25Cents": 525,
          "p75Cents": 650,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 560,
          "p25Cents": 498,
          "p75Cents": 650,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "watermelon",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.08571428571428572,
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
        800,
        800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "cantaloupe",
      "label_en": "Cantaloupe",
      "label_es": "Melón cantalupo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3238,
          "rangeCents": [
            2725,
            3738
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
              "valueCents": 3325,
              "date": "2026-06-15"
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
              "valueCents": 3150,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4600,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3450,
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
              "valueCents": 2650,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5500,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.325,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.13865
        },
        "confidence": "directional",
        "label": "About $27.25–$37.38 (wholesale reference), up +32.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3325,
            "date": "2026-06-15"
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
            "valueCents": 3150,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4600,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3450,
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
            "valueCents": 2650,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5500,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
          {
            "date": "2026-05-08",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 2400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 18400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 18400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 18400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 18400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 18400,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 2450,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 2450,
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
            "valueCents": 1950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 2550,
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
            "valueCents": 2350,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2088,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2088,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2250,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2250,
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
            "valueCents": 3000,
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
            "valueCents": 2775,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 2483,
          "p25Cents": 2325,
          "p75Cents": 2813,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 2738,
          "p25Cents": 2360,
          "p75Cents": 2970,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2730,
          "p25Cents": 2066,
          "p75Cents": 3190,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2781,
          "p25Cents": 2675,
          "p75Cents": 3850,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2421,
          "p25Cents": 2291,
          "p75Cents": 2978,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2100,
          "p25Cents": 2070,
          "p75Cents": 2548,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2430,
          "p25Cents": 2210,
          "p75Cents": 2544,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2710,
          "p25Cents": 2355,
          "p75Cents": 2750,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 2775,
          "p25Cents": 2663,
          "p75Cents": 3045,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 3495,
          "p25Cents": 2600,
          "p75Cents": 9255,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 2250,
          "p25Cents": 2060,
          "p75Cents": 5500,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 4646,
          "p25Cents": 2085,
          "p75Cents": 11755,
          "n": 12,
          "years": 3
        }
      },
      "yieldSlug": "cantaloupe",
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
      "coverage": "Staged: AMS commodity stem resolved (\"Cantaloup\"), pending live verification.",
      "yield": 0.5,
      "epCents": 6476
    },
    {
      "key": "blueberry",
      "label_en": "Blueberries",
      "label_es": "Arándano azul",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 3000,
          "rangeCents": [
            2538,
            3350
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
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.049586776859504134,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.26039999999999996
        },
        "confidence": "low",
        "label": "About $25.38–$33.50 (wholesale reference), down -17.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3175,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 3175,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 4655,
          "p25Cents": 3990,
          "p75Cents": 5529,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 2825,
          "p25Cents": 2570,
          "p75Cents": 3610,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 2745,
          "p25Cents": 1919,
          "p75Cents": 2993,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 3094,
          "p25Cents": 2290,
          "p75Cents": 3175,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2450,
          "p25Cents": 2160,
          "p75Cents": 3511,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2315,
          "p25Cents": 1886,
          "p75Cents": 3248,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 3835,
          "p25Cents": 3076,
          "p75Cents": 4320,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2505,
          "p25Cents": 1720,
          "p75Cents": 2820,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1873,
          "p25Cents": 1651,
          "p75Cents": 2340,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 1870,
          "p25Cents": 1743,
          "p75Cents": 2247,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 1820,
          "p25Cents": 1620,
          "p75Cents": 1970,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2635,
          "p25Cents": 2324,
          "p75Cents": 3439,
          "n": 12,
          "years": 3
        }
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
      "epCents": 3000,
      "spark": [
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
        3175,
        3175
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "raspberry",
      "label_en": "Raspberries",
      "label_es": "Frambuesa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-15",
        "level": {
          "basis": "wholesale",
          "medianCents": 2988,
          "rangeCents": [
            1838,
            3475
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
              "date": "2026-06-15"
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
              "valueCents": 1800,
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4050,
              "date": "2026-06-15"
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
              "date": "2026-06-15"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-06-15"
            }
          ]
        },
        "trend": {
          "pct": 0.04424778761061947,
          "dir": "up",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0936
        },
        "confidence": "low",
        "label": "About $18.38–$34.75 (wholesale reference), up +4.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2950,
            "date": "2026-06-15"
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
            "valueCents": 1800,
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4050,
            "date": "2026-06-15"
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
            "date": "2026-06-15"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-06-15"
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
          }
        ],
        "history": [
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 2950,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1483,
          "p25Cents": 1125,
          "p75Cents": 1671,
          "n": 14,
          "years": 3
        },
        "11": {
          "medianCents": 1600,
          "p25Cents": 988,
          "p75Cents": 2138,
          "n": 13,
          "years": 3
        },
        "12": {
          "medianCents": 1870,
          "p25Cents": 1624,
          "p75Cents": 2501,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 2345,
          "p25Cents": 1980,
          "p75Cents": 2663,
          "n": 13,
          "years": 3
        },
        "02": {
          "medianCents": 2470,
          "p25Cents": 2124,
          "p75Cents": 3471,
          "n": 12,
          "years": 3
        },
        "03": {
          "medianCents": 2535,
          "p25Cents": 2426,
          "p75Cents": 2648,
          "n": 12,
          "years": 3
        },
        "04": {
          "medianCents": 2528,
          "p25Cents": 2105,
          "p75Cents": 2978,
          "n": 14,
          "years": 3
        },
        "05": {
          "medianCents": 2465,
          "p25Cents": 1850,
          "p75Cents": 3550,
          "n": 13,
          "years": 3
        },
        "06": {
          "medianCents": 1269,
          "p25Cents": 1201,
          "p75Cents": 1354,
          "n": 14,
          "years": 4
        },
        "07": {
          "medianCents": 1267,
          "p25Cents": 915,
          "p75Cents": 2548,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 1970,
          "p25Cents": 1640,
          "p75Cents": 2450,
          "n": 13,
          "years": 3
        },
        "09": {
          "medianCents": 2214,
          "p25Cents": 1609,
          "p75Cents": 2754,
          "n": 12,
          "years": 3
        }
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
      "epCents": 2988,
      "spark": [
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
        2950,
        2950
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-atlanta",
        "from": "2026-05-08",
        "to": "2026-06-15",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-12",
        "2026-06-15"
      ]
    },
    {
      "key": "short-rib",
      "label_en": "Short rib",
      "label_es": "Costilla corta de res",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-12",
        "level": {
          "basis": "wholesale",
          "medianCents": 610,
          "rangeCents": [
            601,
            619
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
              "valueCents": 610,
              "date": "2026-06-12"
            }
          ]
        },
        "trend": {
          "pct": 0.030405405405405407,
          "dir": "up",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0162
        },
        "confidence": "medium",
        "label": "About $6.01–$6.19 (wholesale reference, single market — band from recent volatility), up +4.1% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 610,
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
            "valueCents": 592,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-08",
            "valueCents": 598,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 603,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-12",
            "valueCents": 613,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-13",
            "valueCents": 581,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-14",
            "valueCents": 590,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-15",
            "valueCents": 579,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 615,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-19",
            "valueCents": 597,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-20",
            "valueCents": 613,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-21",
            "valueCents": 594,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-22",
            "valueCents": 593,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-26",
            "valueCents": 627,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-27",
            "valueCents": 600,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-28",
            "valueCents": 596,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 585,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 608,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 620,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 601,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 590,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 601,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 607,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 629,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 614,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 601,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 610,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 1070,
          "p25Cents": 1064,
          "p75Cents": 1077,
          "n": 2,
          "years": 2
        },
        "11": {
          "medianCents": 1067,
          "p25Cents": 1058,
          "p75Cents": 1148,
          "n": 3,
          "years": 3
        },
        "12": {
          "medianCents": 1065,
          "p25Cents": 1064,
          "p75Cents": 1158,
          "n": 3,
          "years": 3
        },
        "01": {
          "medianCents": 1091,
          "p25Cents": 1080,
          "p75Cents": 1161,
          "n": 3,
          "years": 3
        },
        "02": {
          "medianCents": 1087,
          "p25Cents": 1070,
          "p75Cents": 1181,
          "n": 3,
          "years": 3
        },
        "03": {
          "medianCents": 1098,
          "p25Cents": 1079,
          "p75Cents": 1186,
          "n": 3,
          "years": 3
        },
        "04": {
          "medianCents": 1112,
          "p25Cents": 1094,
          "p75Cents": 1207,
          "n": 3,
          "years": 3
        },
        "05": {
          "medianCents": 1088,
          "p25Cents": 1060,
          "p75Cents": 1147,
          "n": 4,
          "years": 4
        },
        "06": {
          "medianCents": 1064,
          "p25Cents": 1050,
          "p75Cents": 1107,
          "n": 3,
          "years": 3
        },
        "07": {
          "medianCents": 1086,
          "p25Cents": 1075,
          "p75Cents": 1137,
          "n": 3,
          "years": 3
        },
        "08": {
          "medianCents": 1088,
          "p25Cents": 1082,
          "p75Cents": 1155,
          "n": 3,
          "years": 3
        },
        "09": {
          "medianCents": 1088,
          "p25Cents": 1083,
          "p75Cents": 1157,
          "n": 3,
          "years": 3
        }
      },
      "yieldSlug": "short-rib",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.021775544388609715,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 938,
      "spark": [
        592,
        598,
        603,
        613,
        581,
        590,
        579,
        615,
        597,
        613,
        594,
        593,
        627,
        600,
        596,
        585,
        608,
        620,
        601,
        590,
        601,
        607,
        629,
        614,
        601,
        610
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
      "seasonalNormals": {
        "10": {
          "medianCents": 541,
          "p25Cents": 532,
          "p75Cents": 550,
          "n": 2,
          "years": 2
        },
        "11": {
          "medianCents": 563,
          "p25Cents": 549,
          "p75Cents": 609,
          "n": 3,
          "years": 3
        },
        "12": {
          "medianCents": 561,
          "p25Cents": 541,
          "p75Cents": 615,
          "n": 3,
          "years": 3
        },
        "01": {
          "medianCents": 555,
          "p25Cents": 529,
          "p75Cents": 615,
          "n": 3,
          "years": 3
        },
        "02": {
          "medianCents": 563,
          "p25Cents": 538,
          "p75Cents": 619,
          "n": 3,
          "years": 3
        },
        "03": {
          "medianCents": 579,
          "p25Cents": 546,
          "p75Cents": 625,
          "n": 3,
          "years": 3
        },
        "04": {
          "medianCents": 580,
          "p25Cents": 552,
          "p75Cents": 635,
          "n": 3,
          "years": 3
        },
        "05": {
          "medianCents": 557,
          "p25Cents": 510,
          "p75Cents": 617,
          "n": 4,
          "years": 4
        },
        "06": {
          "medianCents": 547,
          "p25Cents": 525,
          "p75Cents": 580,
          "n": 3,
          "years": 3
        },
        "07": {
          "medianCents": 550,
          "p25Cents": 530,
          "p75Cents": 588,
          "n": 3,
          "years": 3
        },
        "08": {
          "medianCents": 558,
          "p25Cents": 533,
          "p75Cents": 595,
          "n": 3,
          "years": 3
        },
        "09": {
          "medianCents": 567,
          "p25Cents": 539,
          "p75Cents": 600,
          "n": 3,
          "years": 3
        }
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
    },
    {
      "key": "whole-turkey",
      "label_en": "Whole turkey",
      "label_es": "Pavo entero",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-08",
        "level": {
          "basis": "wholesale",
          "medianCents": 180,
          "rangeCents": [
            173,
            186
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
              "valueCents": 180,
              "date": "2026-06-08"
            }
          ]
        },
        "trend": {
          "pct": 0.07142857142857142,
          "dir": "up",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 3,
          "noise": 0.0066
        },
        "confidence": "medium",
        "label": "About $1.73–$1.86 (wholesale reference — band from reported market low–high), up +7% over the window. 1+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 180,
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
            "basis": "index"
          }
        ],
        "history": [
          {
            "date": "2026-02-16",
            "valueCents": 168,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-02-23",
            "valueCents": 168,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-02",
            "valueCents": 169,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-09",
            "valueCents": 169,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-16",
            "valueCents": 169,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-23",
            "valueCents": 168,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-03-30",
            "valueCents": 171,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-06",
            "valueCents": 173,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-13",
            "valueCents": 174,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-20",
            "valueCents": 175,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-04-27",
            "valueCents": 176,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-04",
            "valueCents": 176,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-11",
            "valueCents": 176,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-18",
            "valueCents": 176,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-25",
            "valueCents": 176,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 180,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 180,
            "source": "usda-ams-national",
            "basis": "wholesale"
          }
        ]
      },
      "seasonalNormals": {
        "10": {
          "medianCents": 119,
          "p25Cents": 107,
          "p75Cents": 164,
          "n": 13,
          "years": 3
        },
        "11": {
          "medianCents": 110,
          "p25Cents": 102,
          "p75Cents": 168,
          "n": 12,
          "years": 3
        },
        "12": {
          "medianCents": 113,
          "p25Cents": 100,
          "p75Cents": 168,
          "n": 14,
          "years": 3
        },
        "01": {
          "medianCents": 91,
          "p25Cents": 87,
          "p75Cents": 171,
          "n": 12,
          "years": 3
        },
        "02": {
          "medianCents": 104,
          "p25Cents": 99,
          "p75Cents": 139,
          "n": 11,
          "years": 3
        },
        "03": {
          "medianCents": 119,
          "p25Cents": 108,
          "p75Cents": 169,
          "n": 14,
          "years": 3
        },
        "04": {
          "medianCents": 118,
          "p25Cents": 104,
          "p75Cents": 173,
          "n": 13,
          "years": 3
        },
        "05": {
          "medianCents": 124,
          "p25Cents": 104,
          "p75Cents": 176,
          "n": 12,
          "years": 3
        },
        "06": {
          "medianCents": 136,
          "p25Cents": 113,
          "p75Cents": 154,
          "n": 15,
          "years": 4
        },
        "07": {
          "medianCents": 139,
          "p25Cents": 104,
          "p75Cents": 149,
          "n": 14,
          "years": 3
        },
        "08": {
          "medianCents": 131,
          "p25Cents": 98,
          "p75Cents": 155,
          "n": 12,
          "years": 3
        },
        "09": {
          "medianCents": 128,
          "p25Cents": 102,
          "p75Cents": 156,
          "n": 14,
          "years": 3
        }
      },
      "yieldSlug": "whole-turkey",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.0650887573964497,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "tier": "measured",
      "coverage": "Staged: AMS source resolved (National Turkey Report 3647, \"Whole Young\"), pending live verification.",
      "yield": 0.5,
      "epCents": 360,
      "spark": [
        168,
        168,
        169,
        169,
        169,
        168,
        171,
        173,
        174,
        175,
        176,
        176,
        176,
        176,
        176,
        180,
        180
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
    "measured": 100,
    "derived": 1,
    "absent": 6,
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
        "key": "oyster-mushroom",
        "label_en": "oyster-mushroom",
        "label_es": "oyster-mushroom",
        "reason": "No distinct public series: USDA AMS terminal reports carry only a generic \"Mushrooms\" commodity — no oyster-specific wholesale quote is published."
      },
      {
        "key": "lamb-shoulder",
        "label_en": "lamb-shoulder",
        "label_es": "lamb-shoulder",
        "reason": "Pending source wiring: lamb cuts publish in the LMR lamb family (e.g., LM_XL552); slug to be wired."
      },
      {
        "key": "ground-turkey",
        "label_en": "ground-turkey",
        "label_es": "ground-turkey",
        "reason": "No public ground-turkey series: USDA’s National Turkey Report quotes whole birds and parts, not ground; LMR does not cover poultry."
      }
    ]
  }
};
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX = DATA;
  if (root) root.MUNTIN_COST_INDEX = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
