#!/usr/bin/env python3
"""
Muntin financial model — built, not asserted.
Month 1 = 2026-08. Horizon 24 months (2026-08 .. 2028-07).

Every assumption carries a `basis` string: VERIFIED (read off a repo file or a
brief-supplied fact), EXTERNAL (web-sourced, dated), or ASSUMED (mine, stated).
No number in here is invented and presented as measured.
"""
import json, math
from collections import OrderedDict

MONTHS = 24
START_Y, START_M = 2026, 8

def label(i):
    m = START_M + i - 1
    y = START_Y + (m - 1) // 12
    mm = (m - 1) % 12 + 1
    return f"{y}-{mm:02d}"

# Census MARTS median NSA/SA seasonality (VERIFIED: bones/operator-the-money.md,
# computed from data/marts-sales.json, 138 months, 2020-21 excluded)
SEASON = {1:0.913, 2:0.917, 3:1.043, 4:1.012, 5:1.062, 6:1.024,
          7:1.028, 8:1.035, 9:0.980, 10:1.005, 11:0.952, 12:1.012}

# ---------------------------------------------------------------------------
# COST BASE  — monthly USD unless noted
# ---------------------------------------------------------------------------
COSTS = OrderedDict([
 ("fly_docling_extract", dict(lo=34, hi=60, basis="VERIFIED founder bill 2026-06-11 via apps/web/lib/copy.ts fixedDocling: $200/yr prepaid covers first $20/mo, last month usage $37 -> ~$34/mo effective. services/docling/fly.toml min_machines_running=2 performance/2cpu/8GB ALWAYS WARM + services/extract/fly.toml min=1 shared/1cpu/512MB. Warm pool is fixed, not per-invoice.")),
 ("neon_postgres", dict(lo=5, hi=40, basis="VERIFIED $0.84 for partial month May 20-31 2026 at near-zero traffic (copy.ts fixedNeon). EXTERNAL Neon Launch $0.106/CU-hr, storage $0.35/GB-mo. infra/cost-alarms.yaml sets the alarm at 10 compute-hr/day and names Pro '$19+'. Scales with customers.")),
 ("cloudflare", dict(lo=5, hi=25, basis="VERIFIED apps/api/wrangler.toml binds D1 + 2 KV + R2 + Queues producer/consumer + DLQ + Analytics Engine + 10 cron triggers; Queues requires Workers Paid ($5/mo floor). R2 24h TTL reaper keeps storage near zero. apps/web + apps/email-worker are two more Workers on the same account.")),
 ("aws_kms", dict(lo=2, hi=8, basis="VERIFIED docs/sub-processors.md #1 AWS KMS envelope keys + Object Lock WORM audit mirror. Per-tenant DEKs wrapped by CMK; CMK count unknown from repo. ASSUMED 1-3 CMKs.")),
 ("resend", dict(lo=0, hi=20, basis="VERIFIED copy.ts fixedResend 'free tier covers early access'; brief: worker.js:8789 caps any send at 90 (Resend free tier). EXTERNAL Resend Pro $20/mo at 50k. At 40 customers transactional volume stays inside free; the DISPATCH list is what breaks it.")),
 ("betterstack", dict(lo=0, hi=34, basis="VERIFIED infra/cost-alarms.yaml names BetterStack as the canonical monitoring surface and docs/sub-processors.md binds it. EXTERNAL $29/responder/mo annual, $34 monthly; free tier exists. UNKNOWN which plan is actually paid today.")),
 ("agent_workforce", dict(lo=200, hi=700, basis="ASSUMED, and this is the single largest omitted line. 491 of 584 product commits are authored by 'Claude'; the strategy's exception desk is explicitly AGENT-RUN. Neither repo records a subscription or API spend. A Max-class seat is ~$100-200/mo; sustained multi-session parallel work (the observed pattern) is plausibly 2-4x that. FOUNDER KNOWS THIS NUMBER AND NOBODY ASKED HIM.")),
 ("domains_certs", dict(lo=2, hi=5, basis="VERIFIED copy.ts fixedDomain '~$20/year. Cloudflare absorbs the rest.' Three hostnames in play (muntin.digital, app., api.) plus ledger.muntin.digital which 547 CTAs across 405 files point at and NEITHER REPO ROUTES.")),
])
ANNUAL = OrderedDict([
 ("apple_developer", dict(lo=99, hi=99, basis="EXTERNAL Apple Developer Program $99/yr. Required only if apps/ios survives — apps/ios/RELEASE.md is a full App Store Connect release runbook, so the shell is real. The strategy KILLS nothing about the 6 shells; it neither funds nor retires them.")),
 ("google_play", dict(lo=25, hi=25, basis="EXTERNAL Google Play one-time $25. apps/mobile ships an android/ target + strings/catalog.json references Google Play. Same silence in the strategy.")),
 ("eo_insurance", dict(lo=1200, hi=4800, basis="EXTERNAL 2026: tech E&O averages ~$1,044-1,320/yr for software developers/IT; small professional-services E&O typically $700-1,500/yr, range <$400 to >$7,000. UPPER BOUND IS MINE AND UNVERIFIED: a SIGNED monthly statement of food cost is not a standard tech-E&O risk class — it is accountant-adjacent, and a carrier may rate it up or decline it on a tech form.")),
 ("counsel_setup", dict(lo=2500, hi=9000, basis="ASSUMED, one-time in year 1. VERIFIED need: docs/legal-counsel-kickoff.md says Terms of Service 'not yet drafted; this engagement should produce the first draft' and the engagement was never paid. Scope now also includes the engagement letter for a signed deliverable, the employer authorization, and reconciling ToS s6 with the new product.")),
 ("counsel_ongoing", dict(lo=800, hi=2500, basis="ASSUMED. Contract review as customers sign; sub-processor notices.")),
 ("accounting_tax", dict(lo=1200, hi=3500, basis="ASSUMED. Entity return + sales/use analysis. Maryland taxability of SaaS vs a professional service is a real question the strategy's re-characterisation reopens.")),
 ("entity_registration", dict(lo=200, hi=600, basis="ASSUMED. MD SDAT annual report / personal property return, registered agent.")),
])

# ---------------------------------------------------------------------------
# FOUNDER-HOUR ENGINE — the actual constraint
# ---------------------------------------------------------------------------
CASES = OrderedDict([
 ("SLOW", dict(
    avail_h=13.0,            # VERIFIED brief: 13-26 founder-hours/month. Low end.
    close_min_per_loc=45,    # ASSUMED. Verdict asserts 20; desk_minutes_per_close is UNMEASURED (grep: 0 hits in either repo).
    rule_review_min_per_loc=15,
    support_min_per_cust=30,
    platform_overhead_h=8.0, # cost-index freshness, 21 manual builders, agent-PR review, deploy health
    sales_h_per_win=15.0,
    onboard_h_per_cust=8.0,  # 8-12 specialty vendors/customer; per-template needs real invoice A + held-out B
    loc_per_cust=1.3,
    churn=0.015,
    price_mo=600, annual_price=6000,
 )),
 ("BASE", dict(
    avail_h=20.0,
    close_min_per_loc=20,    # the verdict's own figure, taken at face value
    rule_review_min_per_loc=10,
    support_min_per_cust=20,
    platform_overhead_h=6.0,
    sales_h_per_win=8.0,
    onboard_h_per_cust=5.0,
    loc_per_cust=1.6,
    churn=0.010,
    price_mo=600, annual_price=6000,
 )),
 ("FAST", dict(
    avail_h=26.0,
    close_min_per_loc=12,    # desk minutes FALL as covered layouts rise (the venture question)
    rule_review_min_per_loc=5,
    support_min_per_cust=15,
    platform_overhead_h=5.0,
    sales_h_per_win=3.0,     # the verdict's "three founder-hours to close a customer"
    onboard_h_per_cust=3.0,
    loc_per_cust=2.0,
    churn=0.005,
    price_mo=600, annual_price=6000,
 )),
])

FIRST_SIGN_MONTH = 4   # Phase 0-3 = weeks 1-13 -> months 1-3 build, month 4 = 2026-11
PILOT_CAP_LOC, EVER_CAP_LOC = 10, 40
DSO_DAYS = 45          # ASSUMED. Hand-invoiced, unknown one-person vendor, restaurant AP.

def run(case_name, cfg, cash_policy="on_signature", cost_side="mid"):
    def c(d): return (d["lo"]+d["hi"])/2 if cost_side=="mid" else (d["lo"] if cost_side=="lo" else d["hi"])
    monthly_fixed = sum(c(v) for v in COSTS.values())
    annual_recurring = sum(c(v) for k,v in ANNUAL.items() if k!="counsel_setup")
    setup_once = c(ANNUAL["counsel_setup"])

    rows=[]
    pilot_done=False
    cust=0.0; loc=0.0; cash=0.0; ar=[]   # ar = list of (month_due, amount)
    cum_rev=0.0; cum_cost=0.0
    for i in range(1, MONTHS+1):
        mm = int(label(i).split("-")[1])
        # --- service + overhead load
        svc_h = (loc*(cfg["close_min_per_loc"]+cfg["rule_review_min_per_loc"]) +
                 cust*cfg["support_min_per_cust"])/60.0
        load_h = svc_h + cfg["platform_overhead_h"]
        spare = max(0.0, cfg["avail_h"] - load_h)
        # --- acquisition
        new_cust=0.0
        if i >= FIRST_SIGN_MONTH:
            if loc >= PILOT_CAP_LOC - 0.5: pilot_done = True
            # pilot cap holds for 3 months after it fills (the close must be
            # PROVEN before the cohort opens); then the ~40 ceiling applies.
            cap = EVER_CAP_LOC if pilot_done else PILOT_CAP_LOC
            per_win = cfg["sales_h_per_win"] + cfg["onboard_h_per_cust"]
            new_cust = spare / per_win
            new_cust = min(new_cust, max(0.0,(cap - loc))/cfg["loc_per_cust"])
        cust = cust*(1-cfg["churn"]) + new_cust
        loc  = min(EVER_CAP_LOC, loc*(1-cfg["churn"]) + new_cust*cfg["loc_per_cust"])
        # --- revenue (recognised monthly)
        rev = loc*cfg["price_mo"]
        # --- cash
        eff_mo = cfg["annual_price"]/12.0
        if cash_policy=="on_signature":
            billed = new_cust*cfg["loc_per_cust"]*cfg["annual_price"]
            if billed>0: ar.append((i + math.ceil(DSO_DAYS/30.0), billed))
        else:  # "peak_window" — the verdict's STATED policy: annual invoice, May-Aug
            # Each location is billed once a year, in May. A customer who signs
            # in November therefore receives six months of service before the
            # first invoice is even sent, and ~7.5 months before cash lands.
            if mm == 5 and loc > 0:
                ar.append((i + math.ceil(DSO_DAYS/30.0), loc*cfg["annual_price"]))
        cash_in = sum(a for (m,a) in ar if m==i)
        # --- costs
        cost = monthly_fixed + annual_recurring/12.0
        if i==1: cost += setup_once
        cash -= cost; cash += cash_in
        cum_rev += loc*eff_mo   # recognise at the ANNUAL price actually charged
        cum_cost += cost
        rows.append(dict(month=label(i), customers=round(cust,2), locations=round(loc,2),
                         mrr_at_list=round(rev), mrr_at_annual_rate=round(loc*eff_mo),
                         service_h=round(svc_h,1), total_load_h=round(load_h,1),
                         spare_h=round(spare,1), cash_in=round(cash_in),
                         cash_out=round(cost), cash_balance=round(cash),
                         season_index=SEASON[mm]))
    return dict(case=case_name, cash_policy=cash_policy, cost_side=cost_side,
                monthly_fixed=round(monthly_fixed), annual_recurring=round(annual_recurring),
                setup_once=round(setup_once), rows=rows,
                terminal=dict(customers=round(cust,1), locations=round(loc,1),
                              arr_at_list=round(loc*cfg["price_mo"]*12),
                              arr_at_annual_price=round(loc*cfg["annual_price"]),
                              load_h=round(load_h,1), avail_h=cfg["avail_h"]))

def ceiling(cfg):
    """Locations the founder can actually SERVE, ignoring all sales time."""
    per_loc = (cfg["close_min_per_loc"]+cfg["rule_review_min_per_loc"] +
               cfg["support_min_per_cust"]/cfg["loc_per_cust"])/60.0
    return (cfg["avail_h"] - cfg["platform_overhead_h"]) / per_loc

out={"asOf":"2026-08-07","horizonMonths":MONTHS,"startMonth":label(1),
     "costs":{k:dict(v) for k,v in COSTS.items()},
     "annualCosts":{k:dict(v) for k,v in ANNUAL.items()},
     "cases":{}, "serviceCeilings":{}, "priceSensitivity":{}}
for n,cfg in CASES.items():
    out["cases"][n]={"assumptions":cfg,
        "on_signature":run(n,cfg,"on_signature","mid"),
        "peak_window":run(n,cfg,"peak_window","mid")}
    out["serviceCeilings"][n]=dict(
        max_locations_servable=round(ceiling(cfg),1),
        arr_at_list=round(ceiling(cfg)*cfg["price_mo"]*12),
        arr_at_annual_price=round(ceiling(cfg)*cfg["annual_price"]),
        note="Locations servable with ZERO hours left for sales, onboarding, or product work.")

# price sensitivity at each case's service ceiling
for p in (400,600,1000):
    out["priceSensitivity"][f"${p}/loc/mo"]={
      n: dict(locations=round(ceiling(cfg),1),
              arr_monthly_billing=round(ceiling(cfg)*p*12),
              arr_annual_prepay_at_minus17pct=round(ceiling(cfg)*p*12*0.833),
              locations_to_cover_all_cash_costs=round(
                  (sum((v["lo"]+v["hi"])/2 for v in COSTS.values())*12 +
                   sum((v["lo"]+v["hi"])/2 for k,v in ANNUAL.items() if k!="counsel_setup"))
                  /(p*12),2))
      for n,cfg in CASES.items()}

print(json.dumps(out, indent=1))
