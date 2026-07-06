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
  "generatedAt": "2026-07-06",
  "ingredients": [
    {
      "key": "whole-chicken",
      "label_en": "Whole chicken",
      "label_es": "Pollo entero",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-29",
        "level": {
          "basis": "wholesale",
          "medianCents": 95,
          "rangeCents": [
            79,
            116
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
              "valueCents": 95,
              "date": "2026-06-29"
            }
          ]
        },
        "trend": {
          "pct": -0.04040404040404041,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0148
        },
        "confidence": "medium",
        "label": "About $0.79–$1.16 (wholesale reference — band from reported market low–high), down -4.3% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 95,
            "date": "2026-06-29"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 85,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 88,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 95,
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
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.010416666666666666,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "tier": "measured",
      "yield": 0.6,
      "epCents": 158,
      "spark": [
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
        85,
        85,
        88,
        95
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-03-09",
        "to": "2026-06-29",
        "n": 17
      },
      "spark_dates": [
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
        "2026-06-08",
        "2026-06-15",
        "2026-06-22",
        "2026-06-29"
      ]
    },
    {
      "key": "chicken-breast",
      "label_en": "Chicken breast (boneless)",
      "label_es": "Pechuga de pollo (sin hueso)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-29",
        "level": {
          "basis": "wholesale",
          "medianCents": 125,
          "rangeCents": [
            103,
            155
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
              "valueCents": 125,
              "date": "2026-06-29"
            }
          ]
        },
        "trend": {
          "pct": -0.14383561643835616,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0265
        },
        "confidence": "medium",
        "label": "About $1.03–$1.55 (wholesale reference — band from reported market low–high), down -14% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 125,
            "date": "2026-06-29"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 135,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 131,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 125,
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
        "move": -0.23780487804878048,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 132,
      "spark": [
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
        136,
        135,
        131,
        125
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-03-09",
        "to": "2026-06-29",
        "n": 17
      },
      "spark_dates": [
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
        "2026-06-08",
        "2026-06-15",
        "2026-06-22",
        "2026-06-29"
      ]
    },
    {
      "key": "ribeye",
      "label_en": "Ribeye",
      "label_es": "Ribeye (bife ancho)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-07-02",
        "level": {
          "basis": "wholesale",
          "medianCents": 1152,
          "rangeCents": [
            1112,
            1192
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
              "valueCents": 1152,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.031118587047939444,
          "dir": "down",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.024550000000000002
        },
        "confidence": "medium",
        "label": "About $11.12–$11.92 (wholesale reference, single market — band from recent volatility), up +4.1% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 1152,
            "date": "2026-07-02"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 1214,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1280,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1277,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1314,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-19",
            "valueCents": 1316,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1153,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1325,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1278,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1246,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1049,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1269,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1293,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1187,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1152,
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
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.06035889070146819,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 1536,
      "spark": [
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
        1274,
        1214,
        1280,
        1277,
        1314,
        1316,
        1153,
        1325,
        1278,
        1246,
        1049,
        1269,
        1293,
        1187,
        1152
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-28",
        "to": "2026-07-02",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-19",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02"
      ]
    },
    {
      "key": "beef-tenderloin",
      "label_en": "Beef tenderloin",
      "label_es": "Lomo fino de res",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-07-02",
        "level": {
          "basis": "wholesale",
          "medianCents": 1443,
          "rangeCents": [
            1437,
            1449
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
              "valueCents": 1443,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.029589778076664425,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.01915
        },
        "confidence": "medium",
        "label": "About $14.37–$14.49 (wholesale reference, single market — band from recent volatility), down -3.1% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 1443,
            "date": "2026-07-02"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 1565,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1517,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1504,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1497,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-19",
            "valueCents": 1471,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1510,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1512,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1503,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1484,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1519,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1511,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1472,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1459,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1443,
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
        "move": -0.04310344827586207,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 1698,
      "spark": [
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
        1467,
        1565,
        1517,
        1504,
        1497,
        1471,
        1510,
        1512,
        1503,
        1484,
        1519,
        1511,
        1472,
        1459,
        1443
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-28",
        "to": "2026-07-02",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-19",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02"
      ]
    },
    {
      "key": "pork-shoulder",
      "label_en": "Pork shoulder",
      "label_es": "Espaldilla de cerdo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-07-02",
        "level": {
          "basis": "wholesale",
          "medianCents": 118,
          "rangeCents": [
            117,
            119
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
              "valueCents": 118,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.2236842105263158,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0305
        },
        "confidence": "medium",
        "label": "About $1.17–$1.19 (wholesale reference, single market — band from recent volatility), down -19.8% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 118,
            "date": "2026-07-02"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 127,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 123,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 118,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 119,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-19",
            "valueCents": 132,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 120,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 120,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 119,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 119,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 126,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 122,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 121,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 118,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 118,
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
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.15714285714285714,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 157,
      "spark": [
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
        137,
        127,
        123,
        118,
        119,
        132,
        120,
        120,
        119,
        119,
        126,
        122,
        121,
        118,
        118
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-28",
        "to": "2026-07-02",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-19",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02"
      ]
    },
    {
      "key": "pork-loin",
      "label_en": "Pork loin",
      "label_es": "Lomo de cerdo",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-07-02",
        "level": {
          "basis": "wholesale",
          "medianCents": 90,
          "rangeCents": [
            89,
            91
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
              "valueCents": 90,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.0425531914893617,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.007699999999999999
        },
        "confidence": "medium",
        "label": "About $0.89–$0.91 (wholesale reference, single market — band from recent volatility), down -5.6% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 90,
            "date": "2026-07-02"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-19",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 95,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 92,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 93,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 91,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 94,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 90,
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
        "move": -0.0425531914893617,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 106,
      "spark": [
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
        95,
        94,
        93,
        93,
        94,
        95,
        95,
        94,
        92,
        93,
        93,
        94,
        91,
        94,
        90
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-28",
        "to": "2026-07-02",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-19",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02"
      ]
    },
    {
      "key": "onion",
      "label_en": "Onions",
      "label_es": "Cebolla",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2500,
          "rangeCents": [
            2413,
            2775
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
              "valueCents": 2550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3575,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2850,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.14583333333333334,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0332
        },
        "confidence": "low",
        "label": "About $24.13–$27.75 (wholesale reference), up +25.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3575,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2850,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2750,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.1,
        "retrace": 0,
        "elevatedWeeks": 5,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.88,
      "epCents": 2841,
      "spark": [
        2400,
        2400,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2450,
        2450,
        2450,
        2425,
        2600,
        2600,
        2600,
        2600,
        2600,
        2700,
        2700,
        2700,
        2700,
        2700,
        2600,
        2600,
        2600,
        2750
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "russet-potato",
      "label_en": "Russet potatoes",
      "label_es": "Papa russet",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 1950,
          "rangeCents": [
            1838,
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
              "valueCents": 1900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1525,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2000,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.13043478260869565,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.01325
        },
        "confidence": "low",
        "label": "About $18.38–$23.38 (wholesale reference), up +6.7% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1525,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2000,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2600,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.08333333333333333,
        "retrace": 0.05454545454545454,
        "elevatedWeeks": 8,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.81,
      "epCents": 2407,
      "spark": [
        2300,
        2300,
        2400,
        2400,
        2425,
        2425,
        2425,
        2500,
        2250,
        2250,
        2250,
        2250,
        2750,
        2400,
        2400,
        2400,
        2350,
        2700,
        2700,
        2700,
        2700,
        2700,
        2750,
        2600,
        2600,
        2600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "cheddar-cheese",
      "label_en": "Cheddar cheese",
      "label_es": "Queso cheddar",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-27",
        "level": {
          "basis": "wholesale",
          "medianCents": 158,
          "rangeCents": [
            157,
            159
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
              "valueCents": 158,
              "date": "2026-06-27"
            }
          ]
        },
        "trend": {
          "pct": -0.018633540372670808,
          "dir": "down",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.005350000000000001
        },
        "confidence": "medium",
        "label": "About $1.57–$1.59 (wholesale reference, single market — band from recent volatility), down -5% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 158,
            "date": "2026-06-27"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-13",
            "valueCents": 165,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-20",
            "valueCents": 162,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-27",
            "valueCents": 158,
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
        "move": -0.04242424242424243,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 12
      },
      "tier": "measured",
      "spark": [
        161,
        162,
        165,
        165,
        165,
        166,
        166,
        166,
        166,
        165,
        162,
        158
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-04-11",
        "to": "2026-06-27",
        "n": 12
      },
      "spark_dates": [
        "2026-04-11",
        "2026-04-18",
        "2026-04-25",
        "2026-05-02",
        "2026-05-09",
        "2026-05-16",
        "2026-05-23",
        "2026-05-30",
        "2026-06-06",
        "2026-06-13",
        "2026-06-20",
        "2026-06-27"
      ]
    },
    {
      "key": "butter",
      "label_en": "Butter (AA, bulk)",
      "label_es": "Mantequilla (AA, a granel)",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-27",
        "level": {
          "basis": "wholesale",
          "medianCents": 161,
          "rangeCents": [
            160,
            162
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
              "date": "2026-06-27"
            }
          ]
        },
        "trend": {
          "pct": -0.14814814814814814,
          "dir": "down",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0066
        },
        "confidence": "medium",
        "label": "About $1.60–$1.62 (wholesale reference, single market — band from recent volatility), down -15.1% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 161,
            "date": "2026-06-27"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-13",
            "valueCents": 161,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-20",
            "valueCents": 161,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-27",
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
        "move": -0.08522727272727272,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 12,
        "gated": false
      },
      "tier": "measured",
      "spark": [
        189,
        181,
        177,
        175,
        175,
        171,
        168,
        162,
        161,
        161,
        161,
        161
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-04-11",
        "to": "2026-06-27",
        "n": 12
      },
      "spark_dates": [
        "2026-04-11",
        "2026-04-18",
        "2026-04-25",
        "2026-05-02",
        "2026-05-09",
        "2026-05-16",
        "2026-05-23",
        "2026-05-30",
        "2026-06-06",
        "2026-06-13",
        "2026-06-20",
        "2026-06-27"
      ]
    },
    {
      "key": "eggs",
      "label_en": "Eggs",
      "label_es": "Huevo",
      "unit_en": "dozen",
      "unit_es": "docena",
      "assessment": {
        "asOf": "2026-06-29",
        "level": {
          "basis": "wholesale",
          "medianCents": 58,
          "rangeCents": [
            57,
            59
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
              "valueCents": 58,
              "date": "2026-06-29"
            }
          ]
        },
        "trend": {
          "pct": -0.12121212121212122,
          "dir": "down",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.039599999999999996
        },
        "confidence": "medium",
        "label": "About $0.57–$0.59 (wholesale reference, single market — band from recent volatility), down -15% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams",
            "type": "usda-ams",
            "valueCents": 58,
            "date": "2026-06-29"
          },
          {
            "kind": "trend",
            "source": "usda-ams",
            "type": "usda-ams",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 56,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 56,
            "source": "usda-ams",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 58,
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
        "move": -0.07936507936507936,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 8
      },
      "tier": "measured",
      "spark": [
        66,
        66,
        60,
        56,
        56,
        56,
        56,
        58
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams",
        "from": "2026-05-11",
        "to": "2026-06-29",
        "n": 8
      },
      "spark_dates": [
        "2026-05-11",
        "2026-05-18",
        "2026-05-25",
        "2026-06-01",
        "2026-06-08",
        "2026-06-15",
        "2026-06-22",
        "2026-06-29"
      ]
    },
    {
      "key": "romaine-lettuce",
      "label_en": "Romaine lettuce",
      "label_es": "Lechuga romana",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3625,
          "rangeCents": [
            2712,
            4538
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
              "valueCents": 3900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3625,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3825,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.5592705167173252,
          "dir": "down",
          "agreement": 0.714,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.2794
        },
        "confidence": "low",
        "label": "About $27.12–$45.38 (wholesale reference), up +13.3% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3625,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3825,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-07-02"
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
          },
          {
            "date": "2026-06-16",
            "valueCents": 8250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 8250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 7750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 7750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 7750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 5600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 5600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 5600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3625,
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
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.5857142857142857,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 4833,
      "spark": [
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
        8250,
        8250,
        8250,
        7750,
        7750,
        7750,
        5600,
        5600,
        5600,
        4000,
        4000,
        4000,
        4000,
        3625
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "tomato",
      "label_en": "Tomatoes (round)",
      "label_es": "Jitomate (bola)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2100,
          "rangeCents": [
            1962,
            2375
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.03773584905660377,
          "dir": "down",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.239
        },
        "confidence": "low",
        "label": "About $19.62–$23.75 (wholesale reference), down -33.3% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2525,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2525,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2550,
            "source": "usda-ams-boston",
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
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.91,
      "epCents": 2308,
      "spark": [
        2650,
        2600,
        2600,
        2600,
        2600,
        2550,
        2550,
        2500,
        2500,
        2450,
        2450,
        2425,
        2450,
        2450,
        2450,
        2450,
        2600,
        2600,
        2600,
        2600,
        2600,
        2525,
        2525,
        2500,
        2500,
        2550
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "bell-pepper",
      "label_en": "Bell pepper",
      "label_es": "Pimiento morrón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2900,
          "rangeCents": [
            2550,
            3113
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
              "valueCents": 2500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.17142857142857143,
          "dir": "down",
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.1662
        },
        "confidence": "low",
        "label": "About $25.50–$31.13 (wholesale reference), down -11.4% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2900,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.11538461538461539,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.82,
      "epCents": 3537,
      "spark": [
        3500,
        3500,
        3500,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900,
        2900
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "broccoli",
      "label_en": "Broccoli",
      "label_es": "Brócoli",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2888,
          "rangeCents": [
            2588,
            3188
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2888,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2850,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.06666666666666667,
          "dir": "down",
          "agreement": 0.714,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.2438
        },
        "confidence": "low",
        "label": "About $25.88–$31.88 (wholesale reference), up +5.6% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2888,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2850,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2725,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2725,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2800,
            "source": "usda-ams-boston",
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
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.01818181818181818,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 4443,
      "spark": [
        3000,
        3000,
        2750,
        2750,
        2750,
        2775,
        2775,
        2725,
        2725,
        2550,
        2550,
        2300,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2700,
        2700,
        2700,
        2800,
        2800,
        2800,
        2800,
        2800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "cauliflower",
      "label_en": "Cauliflower",
      "label_es": "Coliflor",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4000,
          "rangeCents": [
            2850,
            4450
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
              "valueCents": 2700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4350,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 5500,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4500,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.1678832116788321,
          "dir": "up",
          "agreement": 0.286,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.1172
        },
        "confidence": "low",
        "label": "About $28.50–$44.50 (wholesale reference), flat +0% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4350,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 5500,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4500,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3425,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4000,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.2698412698412698,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.6,
      "epCents": 6667,
      "spark": [
        3425,
        3425,
        3150,
        3150,
        3150,
        3150,
        3150,
        3300,
        3300,
        3300,
        3000,
        3000,
        3500,
        3500,
        3500,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        4000,
        4000,
        4000,
        4000,
        4000
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "spinach",
      "label_en": "Spinach",
      "label_es": "Espinaca",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2238,
          "rangeCents": [
            2150,
            2263
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2238,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-02"
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
          "noise": 0.0412
        },
        "confidence": "low",
        "label": "About $21.50–$22.63 (wholesale reference), down -1.6% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2238,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2200,
            "source": "usda-ams-boston",
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
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 2984,
      "spark": [
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "asparagus",
      "label_en": "Asparagus",
      "label_es": "Espárragos",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4975,
          "rangeCents": [
            4437,
            5513
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
              "valueCents": 6100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4975,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 5300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5700,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.3968253968253968,
          "dir": "up",
          "agreement": 0.857,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.219
        },
        "confidence": "low",
        "label": "About $44.37–$55.13 (wholesale reference), up +22.2% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 6100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4975,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 5300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4400,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.4426229508196721,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.55,
      "epCents": 9045,
      "spark": [
        3150,
        3150,
        3350,
        3350,
        3350,
        3050,
        3050,
        3500,
        2350,
        2350,
        1825,
        1825,
        2350,
        2350,
        2125,
        2150,
        3150,
        2900,
        2900,
        3100,
        3100,
        3100,
        3950,
        3900,
        3900,
        4400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "garlic",
      "label_en": "Garlic",
      "label_es": "Ajo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 6000,
          "rangeCents": [
            5263,
            6200
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
              "valueCents": 5300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 6300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 6200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 6200,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5225,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.14545454545454545,
          "dir": "up",
          "agreement": 0.857,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0095
        },
        "confidence": "low",
        "label": "About $52.63–$62.00 (wholesale reference), down -15.5% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 5300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 6300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 6200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 6200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5225,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 5750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 5900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 5900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 5900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 5950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 5950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 5950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 5950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 5950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 6250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 6250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 6250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 6300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 6300,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.14545454545454545,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.87,
      "epCents": 6897,
      "spark": [
        5500,
        5500,
        5500,
        5500,
        5500,
        5500,
        5750,
        5600,
        5600,
        5500,
        5500,
        5500,
        5500,
        5900,
        5900,
        5900,
        5950,
        5950,
        5950,
        5950,
        5950,
        6250,
        6250,
        6250,
        6300,
        6300
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "carrot",
      "label_en": "Carrot",
      "label_es": "Zanahoria",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3350,
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
              "valueCents": 3500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3175,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3975,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3875,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3125,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.0078125,
          "dir": "down",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.02565
        },
        "confidence": "low",
        "label": "About $31.63–$39.00 (wholesale reference), up +10.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3175,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3975,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3875,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3125,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3175,
            "source": "usda-ams-boston",
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
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.82,
      "epCents": 4085,
      "spark": [
        3200,
        3200,
        3200,
        3200,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175,
        3175
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "corn-on-the-cob",
      "label_en": "Corn on the cob",
      "label_es": "Elote (mazorca)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2800,
          "rangeCents": [
            2506,
            3163
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.14285714285714285,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.34325
        },
        "confidence": "low",
        "label": "About $25.06–$31.63 (wholesale reference), down -54.7% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3200,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.16363636363636364,
        "retrace": 0.015384615384615385,
        "elevatedWeeks": 5,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.28,
      "epCents": 10000,
      "spark": [
        2800,
        2800,
        2750,
        2750,
        2750,
        2750,
        2750,
        2600,
        2600,
        2600,
        2600,
        2600,
        2700,
        2700,
        2700,
        2800,
        2950,
        2950,
        2950,
        2950,
        2950,
        3050,
        3250,
        3250,
        3200,
        3200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "kale",
      "label_en": "Kale",
      "label_es": "Col rizada (kale)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2175,
          "rangeCents": [
            1800,
            2538
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-02"
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
          "noise": 0.049100000000000005
        },
        "confidence": "low",
        "label": "About $18.00–$25.38 (wholesale reference), down -7.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2100,
            "source": "usda-ams-boston",
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
      "epCents": 3107,
      "spark": [
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "basil",
      "label_en": "Basil",
      "label_es": "Albahaca",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 650,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 788,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 588,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 825,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-07-02"
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
        "label": "About $6.79–$8.94 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 688,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 650,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 788,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 588,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 825,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 700,
            "source": "usda-ams-boston",
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
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700,
        700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "cilantro",
      "label_en": "Cilantro",
      "label_es": "Cilantro",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2788,
          "rangeCents": [
            2556,
            3019
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
              "valueCents": 2600,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2925,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3075,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-07-02"
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
          "noise": 0.0494
        },
        "confidence": "low",
        "label": "About $25.56–$30.19 (wholesale reference), up +1.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2925,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3075,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2925,
            "source": "usda-ams-boston",
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
      "epCents": 3983,
      "spark": [
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925,
        2925
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "button-mushroom",
      "label_en": "Button mushroom",
      "label_es": "Champiñón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2163,
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
              "valueCents": 2225,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1475,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-07-02"
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
          "noise": 0.0061
        },
        "confidence": "low",
        "label": "About $16.63–$23.38 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2225,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1475,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1475,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1475,
            "source": "usda-ams-boston",
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
      "epCents": 2403,
      "spark": [
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475,
        1475
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "sweet-potato",
      "label_en": "Sweet potato",
      "label_es": "Camote",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3400,
          "rangeCents": [
            2600,
            5025
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5500,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5400,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4650,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.714,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0
        },
        "confidence": "low",
        "label": "About $26.00–$50.25 (wholesale reference), up +5.9% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2125,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5500,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5400,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4650,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3400,
            "source": "usda-ams-boston",
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
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "avocado",
      "label_en": "Avocado",
      "label_es": "Aguacate",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4575,
          "rangeCents": [
            4063,
            5063
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
              "valueCents": 5150,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4575,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6138,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 4175,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3950,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.3689655172413793,
          "dir": "down",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.1015
        },
        "confidence": "low",
        "label": "About $40.63–$50.63 (wholesale reference), up +34.6% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 5150,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4575,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6138,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 4175,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3950,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 7250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 7250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 7250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 7000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 7000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 7000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 7000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 7000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 6000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 6000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 6000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 6000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 6000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 5500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 5250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 5250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 5250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 5250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4575,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4575,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4575,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4575,
            "source": "usda-ams-boston",
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
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3464285714285714,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 6100,
      "spark": [
        7250,
        7250,
        7250,
        7000,
        7000,
        7000,
        7000,
        7000,
        6000,
        6000,
        6000,
        6000,
        6000,
        5500,
        5500,
        5500,
        5500,
        5250,
        5250,
        5250,
        5250,
        5000,
        4575,
        4575,
        4575,
        4575
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "lime",
      "label_en": "Lime",
      "label_es": "Limón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2300,
          "rangeCents": [
            1412,
            3188
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
              "valueCents": 2900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.53125,
          "dir": "down",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.157
        },
        "confidence": "low",
        "label": "About $14.12–$31.88 (wholesale reference), down -60% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4575,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "lime",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.4230769230769231,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.35,
      "epCents": 6571,
      "spark": [
        4800,
        4825,
        4575,
        4100,
        4100,
        4000,
        3900,
        3400,
        3400,
        3400,
        3000,
        2800,
        2700,
        2500,
        2500,
        2500,
        2500,
        2400,
        2400,
        2300,
        2300,
        2250,
        2250,
        2250,
        2250,
        2250
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "pineapple",
      "label_en": "Pineapple",
      "label_es": "Piña",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 1825,
          "rangeCents": [
            1650,
            1938
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1825,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1825,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.140625,
          "dir": "up",
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0884
        },
        "confidence": "low",
        "label": "About $16.50–$19.38 (wholesale reference), up +1.4% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1825,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1825,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "pineapple",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.140625,
        "retrace": 0,
        "elevatedWeeks": 5,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 3650,
      "spark": [
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1825,
        1825,
        1825,
        1825,
        1825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "lemon",
      "label_en": "Lemon",
      "label_es": "Limón amarillo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4813,
          "rangeCents": [
            4585,
            5041
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
              "valueCents": 5300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4813,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 4500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4775,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4650,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.3026315789473684,
          "dir": "up",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0482
        },
        "confidence": "low",
        "label": "About $45.85–$50.41 (wholesale reference), up +57.1% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 5300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4813,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 4500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4775,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4650,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 5150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 5150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 5150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 5000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 4900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 4900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "lemon",
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
      "yield": 0.45,
      "epCents": 10696,
      "spark": [
        3800,
        3800,
        3800,
        3800,
        3800,
        5150,
        5150,
        5150,
        5000,
        5000,
        5000,
        5000,
        5000,
        5000,
        4900,
        4900,
        4950,
        4950,
        4950,
        4950,
        4950,
        4950,
        4950,
        4950,
        4950,
        4950
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "celery",
      "label_en": "Celery",
      "label_es": "Apio",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3338,
          "rangeCents": [
            3075,
            3588
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
              "valueCents": 3200,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3475,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.13414634146341464,
          "dir": "down",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.15465
        },
        "confidence": "low",
        "label": "About $30.75–$35.88 (wholesale reference), down -30.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3475,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 4100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "celery",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.15476190476190477,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 4451,
      "spark": [
        4100,
        4100,
        4200,
        4200,
        4200,
        4200,
        4200,
        4300,
        4300,
        4300,
        4300,
        4300,
        3950,
        3950,
        3950,
        3750,
        3750,
        3850,
        3600,
        3600,
        3600,
        3550,
        3550,
        3550,
        3550,
        3550
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "cabbage",
      "label_en": "Cabbage",
      "label_es": "Repollo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2113,
          "rangeCents": [
            2025,
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
              "valueCents": 1950,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2125,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.15,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0774
        },
        "confidence": "low",
        "label": "About $20.25–$22.75 (wholesale reference), down -7.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2125,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2125,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "cabbage",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.15,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 2641,
      "spark": [
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2200,
        2200,
        2200,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
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
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "cucumber",
      "label_en": "Cucumber",
      "label_es": "Pepino",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2088,
          "rangeCents": [
            1900,
            2276
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1975,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.3333333333333333,
          "dir": "down",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.13190000000000002
        },
        "confidence": "low",
        "label": "About $19.00–$22.76 (wholesale reference), down -45.8% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1975,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "cucumber",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3333333333333333,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 2198,
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
        1800,
        1800,
        1800,
        2000,
        2000,
        2000,
        2000,
        2000,
        2000,
        1800,
        1800,
        1800,
        1800,
        1800,
        2000,
        2000,
        2000
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "zucchini",
      "label_en": "Zucchini",
      "label_es": "Calabacín",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 1375,
          "rangeCents": [
            1112,
            1638
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
              "valueCents": 1450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1275,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1500,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.5188679245283019,
          "dir": "down",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.2341
        },
        "confidence": "low",
        "label": "About $11.12–$16.38 (wholesale reference), down -49.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1275,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1500,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "zucchini",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.5188679245283019,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 1447,
      "spark": [
        2650,
        2650,
        2650,
        2650,
        2650,
        2650,
        2650,
        2650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1650,
        1300,
        1300,
        1275,
        1275,
        1275,
        1275,
        1275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "eggplant",
      "label_en": "Eggplant",
      "label_es": "Berenjena",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3100,
          "rangeCents": [
            2044,
            3213
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
              "valueCents": 1350,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3250,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2075,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.390625,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0723
        },
        "confidence": "low",
        "label": "About $20.44–$32.13 (wholesale reference), down -15.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1350,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3250,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2075,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "eggplant",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.390625,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.81,
      "epCents": 3827,
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
        2800,
        2700,
        2700,
        2150,
        2150,
        2150,
        2150,
        2150,
        2150,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950,
        1950
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "leek",
      "label_en": "Leek",
      "label_es": "Puerro",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2988,
          "rangeCents": [
            2550,
            3206
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3125,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3550,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-02"
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
          "noise": 0.0119
        },
        "confidence": "low",
        "label": "About $25.50–$32.06 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2875,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3125,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "leek",
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
      "epCents": 5976,
      "spark": [
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "ginger",
      "label_en": "Ginger root",
      "label_es": "Jengibre",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4300,
          "rangeCents": [
            3538,
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
              "valueCents": 3875,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4650,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5200,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.857,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0166
        },
        "confidence": "low",
        "label": "About $35.38–$47.50 (wholesale reference), down -12.3% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3875,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4650,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "ginger",
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
      "yield": 0.85,
      "epCents": 5059,
      "spark": [
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650,
        4650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "yellow-squash",
      "label_en": "Yellow squash",
      "label_es": "Calabaza amarilla",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 1600,
          "rangeCents": [
            1362,
            1838
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
              "valueCents": 1325,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1400,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1625,
              "date": "2026-07-06"
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
              "valueCents": 1450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1600,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.30434782608695654,
          "dir": "down",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.2878
        },
        "confidence": "low",
        "label": "About $13.62–$18.38 (wholesale reference), down -62.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 1325,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1400,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1625,
            "date": "2026-07-06"
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
            "valueCents": 1450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1600,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "yellow-squash",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.30434782608695654,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.95,
      "epCents": 1684,
      "spark": [
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2300,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        2100,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600,
        1600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "jalapeno",
      "label_en": "Jalapeño",
      "label_es": "Chile jalapeño",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2900,
          "rangeCents": [
            2675,
            3338
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
              "valueCents": 2850,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2950,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3650,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.10416666666666667,
          "dir": "down",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.29000000000000004
        },
        "confidence": "low",
        "label": "About $26.75–$33.38 (wholesale reference), down -22.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2850,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2950,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2150,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "jalapeno",
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
      "yield": 0.85,
      "epCents": 3412,
      "spark": [
        2400,
        2400,
        2400,
        2400,
        2400,
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
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "green-onion",
      "label_en": "Green onion",
      "label_es": "Cebollín",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2075,
          "rangeCents": [
            1844,
            2206
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1875,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1500,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.04504504504504504,
          "dir": "down",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.13015
        },
        "confidence": "low",
        "label": "About $18.44–$22.06 (wholesale reference), down -60.7% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1875,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1500,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "green-onion",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.16483516483516483,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 3192,
      "spark": [
        2775,
        2775,
        2775,
        2775,
        2775,
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
        2650,
        2650,
        2650,
        2650
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "green-beans",
      "label_en": "Green beans",
      "label_es": "Ejotes",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4075,
          "rangeCents": [
            3650,
            4475
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
              "valueCents": 4150,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3750,
              "date": "2026-07-02"
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
              "valueCents": 4200,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 1.2535211267605635,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.3514
        },
        "confidence": "low",
        "label": "About $36.50–$44.75 (wholesale reference), down -42.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4150,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3750,
            "date": "2026-07-02"
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
            "valueCents": 4200,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1775,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1775,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2088,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2088,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2088,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3150,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2500,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2750,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3300,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 4550,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 4275,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4350,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4000,
            "source": "usda-ams-chicago",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "green-beans",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.2698412698412698,
        "retrace": 0.12087912087912088,
        "elevatedWeeks": 7,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.88,
      "epCents": 4631,
      "spark": [
        1775,
        1775,
        2088,
        2088,
        2088,
        3150,
        3150,
        3350,
        3350,
        3350,
        3300,
        3300,
        2500,
        2500,
        2500,
        2750,
        3300,
        3300,
        3300,
        4550,
        4275,
        4350,
        4350,
        4350,
        4350,
        4000
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-chicago",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "parsley",
      "label_en": "Parsley",
      "label_es": "Perejil",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2963,
          "rangeCents": [
            2719,
            3144
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
              "valueCents": 2725,
              "date": "2026-07-02"
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
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3275,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3025,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3275,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0,
          "dir": "flat",
          "agreement": 0.125,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0252
        },
        "confidence": "low",
        "label": "About $27.19–$31.44 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2725,
            "date": "2026-07-02"
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
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3275,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3025,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3275,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "parsley",
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
      "epCents": 4233,
      "spark": [
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
        3100,
        3100
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "brussels-sprouts",
      "label_en": "Brussels sprouts",
      "label_es": "Coles de Bruselas",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3388,
          "rangeCents": [
            3088,
            3719
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3425,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3150,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3625,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-06-17"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4500,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.03896103896103896,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.1392
        },
        "confidence": "low",
        "label": "About $30.88–$37.19 (wholesale reference), up +5.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3425,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3150,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3625,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-06-17"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4500,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3525,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3525,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3525,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "brussels-sprouts",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.05263157894736842,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 4235,
      "spark": [
        3850,
        3850,
        3525,
        3525,
        3525,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3800,
        3850,
        3850,
        3850,
        4000,
        4000,
        4000,
        4000,
        4000
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "butternut-squash",
      "label_en": "Butternut squash",
      "label_es": "Calabaza moscada",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2482,
          "rangeCents": [
            2138,
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
              "date": "2026-07-02"
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
              "valueCents": 2200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2975,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.08333333333333333,
          "dir": "down",
          "agreement": 0.25,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.06420000000000001
        },
        "confidence": "low",
        "label": "About $21.38–$27.69 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2313,
            "date": "2026-07-02"
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
            "valueCents": 2200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2975,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "butternut-squash",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.08333333333333333,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 3546,
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
        2400,
        2400,
        2400,
        2400,
        2400,
        2200,
        2200,
        2200,
        2200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "iceberg-lettuce",
      "label_en": "Iceberg lettuce",
      "label_es": "Lechuga iceberg",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3175,
          "rangeCents": [
            2218,
            4375
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
              "valueCents": 4750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2875,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4600,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2875,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.26282051282051283,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.26455
        },
        "confidence": "low",
        "label": "About $22.18–$43.75 (wholesale reference), up +4.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2875,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4600,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2875,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 5800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 6000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 6250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 6400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 6400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 7200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 6500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 6500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 6500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 6350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 6350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 6350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 4600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 4600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "iceberg-lettuce",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.55078125,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.74,
      "epCents": 4291,
      "spark": [
        3900,
        3900,
        5800,
        6000,
        6250,
        6400,
        6400,
        7200,
        7200,
        7200,
        7200,
        7200,
        7200,
        7200,
        7200,
        6500,
        6500,
        6500,
        6350,
        6350,
        6350,
        4600,
        4600,
        4600,
        3950,
        2875
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "bok-choy",
      "label_en": "Bok choy",
      "label_es": "Bok choy",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3000,
          "rangeCents": [
            2538,
            3563
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
              "valueCents": 3100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4050,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2500,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.275,
          "dir": "down",
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.044399999999999995
        },
        "confidence": "low",
        "label": "About $25.38–$35.63 (wholesale reference), down -10.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4050,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "bok-choy",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.06451612903225806,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.8,
      "epCents": 3750,
      "spark": [
        4000,
        4000,
        4000,
        4000,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
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
        2900,
        2900
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "artichoke",
      "label_en": "Artichoke",
      "label_es": "Alcachofa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 5575,
          "rangeCents": [
            5150,
            5963
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
              "valueCents": 6150,
              "date": "2026-07-02"
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
              "valueCents": 5200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 5700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 5450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 5900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 5000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 7000,
              "date": "2026-07-02"
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
          "noise": 0.0154
        },
        "confidence": "low",
        "label": "About $51.50–$59.63 (wholesale reference), up +25.7% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 6150,
            "date": "2026-07-02"
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
            "valueCents": 5200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 5700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 5450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 5900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 5000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 7000,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 4800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 5200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 5200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 5200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 5200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "artichoke",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.08333333333333333,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.4,
      "epCents": 13938,
      "spark": [
        3900,
        3900,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        4800,
        5200,
        5200,
        5200,
        5200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "okra",
      "label_en": "Okra",
      "label_es": "Quimbombó",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2775,
          "rangeCents": [
            2375,
            3275
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
              "valueCents": 2325,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2775,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.06666666666666667,
          "dir": "up",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.1456
        },
        "confidence": "low",
        "label": "About $23.75–$32.75 (wholesale reference), down -39.2% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2325,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2775,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "okra",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.06666666666666667,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.85,
      "epCents": 3265,
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
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "snow-peas",
      "label_en": "Snow peas",
      "label_es": "Arvejas de nieve",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3550,
          "rangeCents": [
            3100,
            3763
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
              "valueCents": 3763,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3600,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.3333333333333333,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.13374999999999998
        },
        "confidence": "low",
        "label": "About $31.00–$37.63 (wholesale reference), up +29.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3763,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3600,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "snow-peas",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.34513274336283184,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.9,
      "epCents": 3944,
      "spark": [
        2850,
        2850,
        2850,
        2825,
        2825,
        2825,
        2825,
        2825,
        2600,
        2600,
        2600,
        2600,
        2600,
        2550,
        2550,
        2550,
        3300,
        3300,
        3300,
        3300,
        3300,
        3300,
        3300,
        3300,
        3300,
        3800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "butter-lettuce",
      "label_en": "Butter lettuce",
      "label_es": "Lechuga mantequilla (Boston)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2525,
          "rangeCents": [
            2388,
            3225
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
              "valueCents": 2525,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2425,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2475,
              "date": "2026-07-02"
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
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.0997229916897507,
          "dir": "down",
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0553
        },
        "confidence": "low",
        "label": "About $23.88–$32.25 (wholesale reference), up +8.9% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2525,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2425,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2475,
            "date": "2026-07-02"
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
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2888,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2888,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2888,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2888,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2888,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "butter-lettuce",
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
      "epCents": 3885,
      "spark": [
        2888,
        2888,
        2888,
        2888,
        2888,
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
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600,
        2600
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "green-leaf-lettuce",
      "label_en": "Green leaf lettuce",
      "label_es": "Lechuga hoja verde",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2650,
          "rangeCents": [
            2087,
            3213
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
              "valueCents": 2800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2525,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3325,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.2361111111111111,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.158
        },
        "confidence": "low",
        "label": "About $20.87–$32.13 (wholesale reference), down -6.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2525,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3325,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2750,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "green-leaf-lettuce",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.21428571428571427,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 3786,
      "spark": [
        3600,
        3600,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3550,
        3550,
        3100,
        3100,
        3100,
        3100,
        3100,
        3100,
        3000,
        3000,
        3000,
        2600,
        2600,
        2600,
        2600,
        2750
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "red-leaf-lettuce",
      "label_en": "Red leaf lettuce",
      "label_es": "Lechuga hoja roja",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2994,
          "rangeCents": [
            2400,
            3619
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
              "valueCents": 3975,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 5100,
              "date": "2026-06-17"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2963,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3025,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-07-02"
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
              "valueCents": 2100,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.31210191082802546,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.13829999999999998
        },
        "confidence": "low",
        "label": "About $24.00–$36.19 (wholesale reference), down -8.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3975,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 5100,
            "date": "2026-06-17"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2963,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3025,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-07-02"
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
            "valueCents": 2100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2925,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "red-leaf-lettuce",
      "flag": {
        "verdict": "easing",
        "actionBias": "hold",
        "reason": "prices have come down vs the baseline",
        "move": -0.3032258064516129,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 4277,
      "spark": [
        3925,
        3925,
        3875,
        3875,
        3875,
        3875,
        3875,
        3875,
        3875,
        3875,
        3875,
        3875,
        4000,
        4000,
        4000,
        3825,
        3825,
        3825,
        3500,
        3500,
        3500,
        2925,
        2925,
        2925,
        2900,
        2700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "collard-greens",
      "label_en": "Collard greens",
      "label_es": "Berza (collard)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 1875,
          "rangeCents": [
            1675,
            2100
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1875,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1875,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1550,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2250,
              "date": "2026-07-02"
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
              "valueCents": 1600,
              "date": "2026-07-02"
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
        "label": "About $16.75–$21.00 (wholesale reference), down -1.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1875,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1875,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1550,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2250,
            "date": "2026-07-02"
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
            "valueCents": 1600,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1875,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "collard-greens",
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
      "epCents": 2885,
      "spark": [
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875,
        1875
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "napa-cabbage",
      "label_en": "Napa cabbage",
      "label_es": "Col napa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2925,
          "rangeCents": [
            2650,
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
              "valueCents": 2950,
              "date": "2026-07-02"
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
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3425,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 5200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.11811023622047244,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0503
        },
        "confidence": "low",
        "label": "About $26.50–$36.44 (wholesale reference), down -13.3% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2950,
            "date": "2026-07-02"
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
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3425,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 5200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3175,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "napa-cabbage",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.06666666666666667,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"Chinese Cabbage\"), pending live verification.",
      "yield": 0.8,
      "epCents": 3656,
      "spark": [
        3175,
        3175,
        3175,
        3175,
        3000,
        3000,
        3000,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800,
        2800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "rutabaga",
      "label_en": "Rutabaga",
      "label_es": "Colinabo (rutabaga)",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3025,
          "rangeCents": [
            3000,
            3181
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3225,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-07-02"
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
        "label": "About $30.00–$31.81 (wholesale reference), flat +0% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3225,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3000,
            "source": "usda-ams-boston",
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
      "epCents": 3878,
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
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "daikon",
      "label_en": "Daikon radish",
      "label_es": "Rábano daikon",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3300,
          "rangeCents": [
            2788,
            3513
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
              "valueCents": 3550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2650,
              "date": "2026-07-02"
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
          "noise": 0.0107
        },
        "confidence": "low",
        "label": "About $27.88–$35.13 (wholesale reference), down -7.2% over the window. 6+ source(s) for level, 6 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3400,
            "source": "usda-ams-boston",
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
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "beet",
      "label_en": "Beet",
      "label_es": "Remolacha",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2325,
          "rangeCents": [
            1888,
            2400
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2350,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1850,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1675,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1900,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.06666666666666667,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0385
        },
        "confidence": "low",
        "label": "About $18.88–$24.00 (wholesale reference), down -4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2350,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1850,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1675,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1900,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "beet",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.06666666666666667,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.75,
      "epCents": 3100,
      "spark": [
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
        2250,
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
        2400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "acorn-squash",
      "label_en": "Acorn squash",
      "label_es": "Calabaza bellota",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3800,
          "rangeCents": [
            3475,
            4150
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-22"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3750,
              "date": "2026-07-02"
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
          "pct": 0.11764705882352941,
          "dir": "up",
          "agreement": 1,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0812
        },
        "confidence": "low",
        "label": "About $34.75–$41.50 (wholesale reference), up +30.6% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-06-22"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3750,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "acorn-squash",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.11764705882352941,
        "retrace": 0,
        "elevatedWeeks": 4,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 0.7,
      "epCents": 5429,
      "spark": [
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3800,
        3800,
        3800,
        3800
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "serrano-pepper",
      "label_en": "Serrano pepper",
      "label_es": "Chile serrano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3675,
          "rangeCents": [
            3413,
            3775
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6363,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-07-02"
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
          "noise": 0.2513
        },
        "confidence": "low",
        "label": "About $34.13–$37.75 (wholesale reference), up +2.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6363,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "serrano-pepper",
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
      "coverage": "Staged: AMS commodity term resolved (\"Peppers, Serrano\"), pending live verification.",
      "yield": 0.85,
      "epCents": 4324,
      "spark": [
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700,
        3700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "poblano-pepper",
      "label_en": "Poblano pepper",
      "label_es": "Chile poblano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3250,
          "rangeCents": [
            2975,
            3425
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
              "valueCents": 2900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-06-29"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 6350,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3250,
              "date": "2026-07-02"
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
          "noise": 0.1315
        },
        "confidence": "low",
        "label": "About $29.75–$34.25 (wholesale reference), up +10.2% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-06-29"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 6350,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3250,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "poblano-pepper",
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
      "coverage": "Staged: AMS commodity term resolved (\"Peppers, Poblano\"), pending live verification.",
      "yield": 0.8,
      "epCents": 4063,
      "spark": [
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "habanero-pepper",
      "label_en": "Habanero pepper",
      "label_es": "Chile habanero",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3513,
          "rangeCents": [
            3438,
            4050
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
              "valueCents": 4200,
              "date": "2026-07-02"
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
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3350,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4400,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.04477611940298507,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.058800000000000005
        },
        "confidence": "low",
        "label": "About $34.38–$40.50 (wholesale reference), up +21.2% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4200,
            "date": "2026-07-02"
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
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3350,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4400,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "habanero-pepper",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.04477611940298507,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"Peppers, Habanero\"), pending live verification.",
      "yield": 0.85,
      "epCents": 4133,
      "spark": [
        3350,
        3350,
        3350,
        3350,
        3350,
        3350,
        3350,
        3350,
        3350,
        3350,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500,
        3500
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "mint",
      "label_en": "Mint",
      "label_es": "Menta",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1275,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 1725,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 425,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 875,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1250,
              "date": "2026-07-02"
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
        "label": "About $8.44–$14.50 (wholesale reference), flat +0% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1275,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 1725,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 425,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 875,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1250,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1275,
            "source": "usda-ams-boston",
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
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275,
        1275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "rosemary",
      "label_en": "Rosemary",
      "label_es": "Romero",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 850,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 438,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 475,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-07-02"
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
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 850,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 438,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 475,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 850,
            "source": "usda-ams-boston",
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
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "thyme",
      "label_en": "Thyme",
      "label_es": "Tomillo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 894,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1050,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 800,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 638,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-07-02"
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
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 894,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1050,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 800,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 638,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1050,
            "source": "usda-ams-boston",
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
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050,
        1050
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "oregano",
      "label_en": "Oregano",
      "label_es": "Orégano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 888,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 719,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 613,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 725,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1113,
              "date": "2026-07-02"
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
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 888,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 719,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 613,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 725,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1113,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 850,
            "source": "usda-ams-boston",
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
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850,
        850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "tarragon",
      "label_en": "Tarragon",
      "label_es": "Estragón",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1075,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 1100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 575,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1450,
              "date": "2026-07-02"
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
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1075,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 1100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 575,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1450,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 1075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1075,
            "source": "usda-ams-boston",
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
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075,
        1075
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "dill",
      "label_en": "Dill",
      "label_es": "Eneldo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2450,
          "rangeCents": [
            1175,
            2625
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
              "valueCents": 2650,
              "date": "2026-06-26"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3925,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2600,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 538,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 550,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 1800,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.02,
          "dir": "down",
          "agreement": 0.571,
          "nSources": 7,
          "nFamilies": 7,
          "nTypes": 1,
          "noise": 0.0297
        },
        "confidence": "low",
        "label": "About $11.75–$26.25 (wholesale reference), down -14% over the window. 7+ source(s) for level, 7 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2650,
            "date": "2026-06-26"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3925,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2600,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 538,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 550,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 1800,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "dill",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.02,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 3769,
      "spark": [
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2450,
        2450,
        2450,
        2450,
        2450,
        2450,
        2450,
        2450,
        2450
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "red-onion",
      "label_en": "Red onion",
      "label_es": "Cebolla roja",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2150,
          "rangeCents": [
            2100,
            2344
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
              "valueCents": 2125,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2275,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1650,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.2638888888888889,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.0542
        },
        "confidence": "low",
        "label": "About $21.00–$23.44 (wholesale reference), up +64.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2125,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2275,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1650,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 1825,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1775,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2275,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "red-onion",
      "flag": {
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.2465753424657534,
        "retrace": 0,
        "elevatedWeeks": 8,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "coverage": "Staged: AMS term resolved (\"Onions, Dry\" + variety RED filter), pending live verification.",
      "yield": 0.88,
      "epCents": 2443,
      "spark": [
        1800,
        1800,
        1825,
        1825,
        1825,
        1825,
        1825,
        1775,
        1775,
        1900,
        1900,
        1900,
        1800,
        1800,
        1800,
        1800,
        2000,
        2000,
        2000,
        2000,
        2000,
        2200,
        2100,
        2100,
        2100,
        2275
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "cherry-tomato",
      "label_en": "Cherry tomatoes",
      "label_es": "Jitomate cherry",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2350,
          "rangeCents": [
            2250,
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
              "valueCents": 2300,
              "date": "2026-07-02"
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
              "valueCents": 2400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2225,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-22"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 1975,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.04,
          "dir": "down",
          "agreement": 0.625,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.1071
        },
        "confidence": "low",
        "label": "About $22.50–$28.63 (wholesale reference), up +1.6% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
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
            "valueCents": 2400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2225,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-22"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 1975,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          }
        ]
      },
      "seasonal": true,
      "yieldSlug": "cherry-tomato",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.04,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 2350,
      "spark": [
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2500,
        2400,
        2400,
        2400,
        2400,
        2400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "red-potato",
      "label_en": "Red potato",
      "label_es": "Papa roja",
      "unit_en": "sack",
      "unit_es": "saco",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3150,
          "rangeCents": [
            2775,
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
              "valueCents": 2400,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3250,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3950,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.1206896551724138,
          "dir": "up",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.027299999999999998
        },
        "confidence": "low",
        "label": "About $27.75–$34.63 (wholesale reference), up +9.2% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2400,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3250,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3950,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 4000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3650,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3250,
            "source": "usda-ams-boston",
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
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": -0.04411764705882353,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity term resolved (\"ROUND RED\"), pending live verification.",
      "yield": 0.85,
      "epCents": 3706,
      "spark": [
        2900,
        2900,
        2550,
        3400,
        3400,
        3400,
        3400,
        3700,
        4000,
        4000,
        4000,
        3700,
        3400,
        3400,
        3400,
        3400,
        3650,
        3050,
        3050,
        3050,
        3050,
        2900,
        3450,
        3450,
        3450,
        3250
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "apple",
      "label_en": "Apples",
      "label_es": "Manzana",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3825,
          "rangeCents": [
            3488,
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
              "valueCents": 3900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1700,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3500,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": -0.041666666666666664,
          "dir": "down",
          "agreement": 0.75,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.01075
        },
        "confidence": "low",
        "label": "About $34.88–$39.00 (wholesale reference), up +1.5% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1700,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3500,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3450,
            "source": "usda-ams-boston",
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
        "move": -0.041666666666666664,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.78,
      "epCents": 4904,
      "spark": [
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3600,
        3450,
        3450,
        3450,
        3450
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "pear",
      "label_en": "Pears",
      "label_es": "Pera",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 4025,
          "rangeCents": [
            3925,
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 4725,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3850,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4000,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 4275,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3825,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 4050,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3950,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.06944444444444445,
          "dir": "up",
          "agreement": 0.875,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.034449999999999995
        },
        "confidence": "low",
        "label": "About $39.25–$41.44 (wholesale reference), up +15.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 4100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 4725,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3850,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4000,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 4275,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3825,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 4050,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3950,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3850,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3850,
            "source": "usda-ams-boston",
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
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.78,
      "epCents": 5160,
      "spark": [
        3600,
        3600,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850,
        3850
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "banana",
      "label_en": "Bananas",
      "label_es": "Plátano",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 2163,
          "rangeCents": [
            2138,
            2225
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
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2150,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 2200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 1950,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 2175,
              "date": "2026-07-02"
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
        "label": "About $21.38–$22.25 (wholesale reference), up +2.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2150,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 2200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 1950,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 2175,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 2200,
            "source": "usda-ams-boston",
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
      "epCents": 3328,
      "spark": [
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200,
        2200
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "grapefruit",
      "label_en": "Grapefruit",
      "label_es": "Toronja",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3250,
          "rangeCents": [
            2872,
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
              "valueCents": 3200,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3900,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 2788,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3400,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2900,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3300,
              "date": "2026-07-02"
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
          "noise": 0.0305
        },
        "confidence": "low",
        "label": "About $28.72–$34.00 (wholesale reference), down -2.9% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3900,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 2788,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3400,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2900,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3300,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3400,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3400,
            "source": "usda-ams-boston",
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
        "move": 0,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 6500,
      "spark": [
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400,
        3400
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "watermelon",
      "label_en": "Watermelon",
      "label_es": "Sandía",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 825,
          "rangeCents": [
            688,
            2488
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
              "valueCents": 825,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 4150,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 550,
              "date": "2026-07-06"
            }
          ]
        },
        "trend": {
          "pct": -0.05714285714285714,
          "dir": "down",
          "agreement": 1,
          "nSources": 3,
          "nFamilies": 3,
          "nTypes": 1,
          "noise": 0.1991
        },
        "confidence": "low",
        "label": "About $6.88–$24.88 (wholesale reference), down -17.5% over the window. 3+ source(s) for level, 3 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 825,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 4150,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 550,
            "date": "2026-07-06"
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
          },
          {
            "date": "2026-06-16",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 1550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1550,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 950,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 825,
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
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.03125,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.5,
      "epCents": 1650,
      "spark": [
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
        800,
        800,
        800,
        800,
        1550,
        1550,
        1550,
        1550,
        1550,
        950,
        950,
        950,
        950,
        825
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "blueberry",
      "label_en": "Blueberries",
      "label_es": "Arándano azul",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3594,
          "rangeCents": [
            3069,
            3994
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
              "valueCents": 3538,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3650,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 3700,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3200,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 2675,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3725,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 3800,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.4230769230769231,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.2127
        },
        "confidence": "low",
        "label": "About $30.69–$39.94 (wholesale reference), down -27.1% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3538,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 3700,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3200,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 2675,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3725,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 3800,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 2600,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 2525,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 2625,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 2000,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 2250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 2900,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 3200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 1500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 1500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 1250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 1250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 3250,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 3100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 3700,
            "source": "usda-ams-boston",
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
        "verdict": "structural",
        "actionBias": "re-price",
        "reason": "elevated and sustained — the increase looks real",
        "move": 0.4095238095238095,
        "retrace": 0,
        "elevatedWeeks": 5,
        "nHistory": 26,
        "gated": false
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 3594,
      "spark": [
        2600,
        2525,
        2625,
        2700,
        2000,
        2000,
        2000,
        2250,
        2800,
        2900,
        2900,
        2900,
        2900,
        3100,
        2900,
        2900,
        3200,
        1500,
        1500,
        1250,
        1250,
        3250,
        3100,
        3100,
        3100,
        3700
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-boston",
        "from": "2026-05-28",
        "to": "2026-07-06",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02",
        "2026-07-06"
      ]
    },
    {
      "key": "raspberry",
      "label_en": "Raspberries",
      "label_es": "Frambuesa",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-07-06",
        "level": {
          "basis": "wholesale",
          "medianCents": 3319,
          "rangeCents": [
            3075,
            3681
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
              "valueCents": 3775,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 3050,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 1938,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 3413,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3225,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 3100,
              "date": "2026-07-02"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 3650,
              "date": "2026-07-06"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 4550,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.03409090909090909,
          "dir": "up",
          "agreement": 0.5,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.07919999999999999
        },
        "confidence": "directional",
        "label": "About $30.75–$36.81 (wholesale reference), up +3.4% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3775,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 3050,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 1938,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 3413,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3225,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 3100,
            "date": "2026-07-02"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 3650,
            "date": "2026-07-06"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 4550,
            "date": "2026-07-02"
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
            "date": "2026-05-28",
            "valueCents": 1700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-05-29",
            "valueCents": 1700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-01",
            "valueCents": 350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-02",
            "valueCents": 1350,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-03",
            "valueCents": 1025,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-04",
            "valueCents": 1025,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-05",
            "valueCents": 700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-08",
            "valueCents": 1300,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-09",
            "valueCents": 1500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-10",
            "valueCents": 1500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-11",
            "valueCents": 1500,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-12",
            "valueCents": 1100,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-15",
            "valueCents": 1800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 1200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 1700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 1700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 2075,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 2050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 2050,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 2700,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 2450,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 2800,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 2200,
            "source": "usda-ams-boston",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-06",
            "valueCents": 1938,
            "source": "usda-ams-boston",
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
        "verdict": "insufficient",
        "actionBias": "watch",
        "reason": "not enough history to tell a spike from a real trend — treat as real",
        "move": null,
        "retrace": null,
        "elevatedWeeks": null,
        "nHistory": 6
      },
      "tier": "measured",
      "yield": 1,
      "epCents": 3319,
      "spark": [
        2700,
        2988,
        2988,
        2900,
        2850,
        3319
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
          "agreement": 0.5,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0016
        },
        "confidence": "directional",
        "label": "About $5.51 (wholesale reference, single source — range not yet measurable), down -2.2% over the window. 1+ source(s) for level, 2 for trend.",
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
      "key": "short-rib",
      "label_en": "Short rib",
      "label_es": "Costilla corta de res",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-07-02",
        "level": {
          "basis": "wholesale",
          "medianCents": 603,
          "rangeCents": [
            597,
            609
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
              "valueCents": 603,
              "date": "2026-07-02"
            }
          ]
        },
        "trend": {
          "pct": 0.01174496644295302,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.020999999999999998
        },
        "confidence": "medium",
        "label": "About $5.97–$6.09 (wholesale reference, single market — band from recent volatility), up +1.8% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "valueCents": 603,
            "date": "2026-07-02"
          },
          {
            "kind": "trend",
            "source": "usda-lmr",
            "type": "usda-lmr",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 588,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-16",
            "valueCents": 585,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 575,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 590,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-19",
            "valueCents": 573,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 617,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-23",
            "valueCents": 621,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-24",
            "valueCents": 608,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-25",
            "valueCents": 593,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-26",
            "valueCents": 595,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
            "valueCents": 611,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-30",
            "valueCents": 616,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-01",
            "valueCents": 595,
            "source": "usda-lmr",
            "basis": "wholesale"
          },
          {
            "date": "2026-07-02",
            "valueCents": 603,
            "source": "usda-lmr",
            "basis": "wholesale"
          }
        ]
      },
      "yieldSlug": "short-rib",
      "flag": {
        "verdict": "flat",
        "actionBias": "hold",
        "reason": "within the normal range",
        "move": 0.0033277870216306157,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 26
      },
      "tier": "measured",
      "yield": 0.65,
      "epCents": 928,
      "spark": [
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
        610,
        588,
        585,
        575,
        590,
        573,
        617,
        621,
        608,
        593,
        595,
        611,
        616,
        595,
        603
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-lmr",
        "from": "2026-05-28",
        "to": "2026-07-02",
        "n": 26
      },
      "spark_dates": [
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
        "2026-06-15",
        "2026-06-16",
        "2026-06-17",
        "2026-06-18",
        "2026-06-19",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24",
        "2026-06-25",
        "2026-06-26",
        "2026-06-29",
        "2026-06-30",
        "2026-07-01",
        "2026-07-02"
      ]
    },
    {
      "key": "whole-turkey",
      "label_en": "Whole turkey",
      "label_es": "Pavo entero",
      "unit_en": "lb",
      "unit_es": "libra",
      "assessment": {
        "asOf": "2026-06-29",
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
              "date": "2026-06-29"
            }
          ]
        },
        "trend": {
          "pct": 0.0650887573964497,
          "dir": "up",
          "agreement": 1,
          "nSources": 2,
          "nFamilies": 2,
          "nTypes": 2,
          "noise": 0.0086
        },
        "confidence": "medium",
        "label": "About $1.73–$1.86 (wholesale reference — band from reported market low–high), up +6.5% over the window. 1+ source(s) for level, 2 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "valueCents": 180,
            "date": "2026-06-29"
          },
          {
            "kind": "trend",
            "source": "usda-ams-national",
            "type": "usda-ams",
            "basis": "wholesale"
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
          },
          {
            "date": "2026-06-15",
            "valueCents": 180,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-22",
            "valueCents": 180,
            "source": "usda-ams-national",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-29",
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
        "move": 0.04046242774566474,
        "retrace": 0,
        "elevatedWeeks": 0,
        "nHistory": 17
      },
      "tier": "measured",
      "coverage": "Staged: AMS source resolved (National Turkey Report 3647, \"Whole Young\"), pending live verification.",
      "yield": 0.5,
      "epCents": 360,
      "spark": [
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
        180,
        180,
        180,
        180
      ],
      "spark_meta": {
        "basis": "wholesale",
        "source": "usda-ams-national",
        "from": "2026-03-09",
        "to": "2026-06-29",
        "n": 17
      },
      "spark_dates": [
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
        "2026-06-08",
        "2026-06-15",
        "2026-06-22",
        "2026-06-29"
      ]
    },
    {
      "key": "cantaloupe",
      "label_en": "Cantaloupe",
      "label_es": "Melón cantalupo",
      "unit_en": "carton",
      "unit_es": "caja",
      "assessment": {
        "asOf": "2026-06-18",
        "level": {
          "basis": "wholesale",
          "medianCents": 3532,
          "rangeCents": [
            2700,
            4325
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
              "valueCents": 3613,
              "date": "2026-06-18"
            },
            {
              "source": "usda-ams-baltimore",
              "type": "usda-ams",
              "valueCents": 2300,
              "date": "2026-06-16"
            },
            {
              "source": "usda-ams-boston",
              "type": "usda-ams",
              "valueCents": 4300,
              "date": "2026-06-18"
            },
            {
              "source": "usda-ams-chicago",
              "type": "usda-ams",
              "valueCents": 4400,
              "date": "2026-06-18"
            },
            {
              "source": "usda-ams-detroit",
              "type": "usda-ams",
              "valueCents": 3450,
              "date": "2026-06-18"
            },
            {
              "source": "usda-ams-los-angeles",
              "type": "usda-ams",
              "valueCents": 2750,
              "date": "2026-06-18"
            },
            {
              "source": "usda-ams-miami",
              "type": "usda-ams",
              "valueCents": 2550,
              "date": "2026-06-18"
            },
            {
              "source": "usda-ams-new-york",
              "type": "usda-ams",
              "valueCents": 5725,
              "date": "2026-06-18"
            }
          ]
        },
        "trend": {
          "pct": 0.34210526315789475,
          "dir": "up",
          "agreement": 1,
          "nSources": 8,
          "nFamilies": 8,
          "nTypes": 1,
          "noise": 0.14975
        },
        "confidence": "directional",
        "label": "About $27.00–$43.25 (wholesale reference), up +34.2% over the window. 8+ source(s) for level, 8 for trend.",
        "provenance": [
          {
            "kind": "level",
            "source": "usda-ams-atlanta",
            "type": "usda-ams",
            "valueCents": 3613,
            "date": "2026-06-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-baltimore",
            "type": "usda-ams",
            "valueCents": 2300,
            "date": "2026-06-16"
          },
          {
            "kind": "level",
            "source": "usda-ams-boston",
            "type": "usda-ams",
            "valueCents": 4300,
            "date": "2026-06-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-chicago",
            "type": "usda-ams",
            "valueCents": 4400,
            "date": "2026-06-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-detroit",
            "type": "usda-ams",
            "valueCents": 3450,
            "date": "2026-06-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-los-angeles",
            "type": "usda-ams",
            "valueCents": 2750,
            "date": "2026-06-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-miami",
            "type": "usda-ams",
            "valueCents": 2550,
            "date": "2026-06-18"
          },
          {
            "kind": "level",
            "source": "usda-ams-new-york",
            "type": "usda-ams",
            "valueCents": 5725,
            "date": "2026-06-18"
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
          },
          {
            "date": "2026-06-16",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-17",
            "valueCents": 3325,
            "source": "usda-ams-atlanta",
            "basis": "wholesale"
          },
          {
            "date": "2026-06-18",
            "valueCents": 3613,
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
        "nHistory": 5
      },
      "tier": "measured",
      "coverage": "Staged: AMS commodity stem resolved (\"Cantaloup\"), pending live verification.",
      "yield": 0.5,
      "epCents": 7064,
      "spark": [
        3025,
        3238,
        3238,
        3388,
        3532
      ]
    }
  ],
  "drivers": [
    {
      "key": "diesel",
      "label_en": "Diesel",
      "label_es": "Diésel",
      "kind": "energy",
      "trend": {
        "pct": 0.19743589743589743,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.071
      },
      "leads": [],
      "spark": [
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
        521,
        506,
        483,
        467
      ]
    },
    {
      "key": "electricity",
      "label_en": "Electricity",
      "label_es": "Electricidad",
      "kind": "energy",
      "trend": {
        "pct": -0.009530791788856362,
        "dir": "down",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.0219
      },
      "leads": [],
      "spark": [
        1364,
        1437,
        1392,
        1351
      ]
    },
    {
      "key": "seafood-import",
      "label_en": "Imported seafood",
      "label_es": "Mariscos importados",
      "kind": "trade",
      "trend": {
        "pct": 0.018822100789314043,
        "dir": "up",
        "agreement": 1,
        "nSources": 1,
        "nFamilies": 1,
        "nTypes": 1,
        "noise": 0.0049
      },
      "leads": [
        "salmon-fillet",
        "whole-salmon",
        "salmon-skin-on-fillet",
        "shrimp",
        "shrimp-head-on",
        "shrimp-pd",
        "tuna-loin",
        "whole-lobster",
        "whole-halibut",
        "whole-trout",
        "scallops",
        "whole-crab",
        "octopus",
        "clams",
        "squid",
        "whole-branzino"
      ],
      "spark": [
        16470,
        16440,
        16760,
        16650,
        16780
      ]
    }
  ],
  "coverage": {
    "measured": 101,
    "derived": 1,
    "absent": 5,
    "gaps": [
      {
        "key": "leg-of-lamb",
        "label_en": "leg-of-lamb",
        "label_es": "leg-of-lamb",
        "reason": "Honestly absent — no free per-cut lamb wholesale price (LMR feed is volume-only; cut prices are PDF-only)."
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
        "reason": "Honestly absent — no free per-cut lamb wholesale price (LMR feed is volume-only; cut prices are PDF-only)."
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
