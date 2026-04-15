# Cloudflare Pages setup runbook

This runbook walks through migrating hosting for muntin.digital
from GitHub Pages to Cloudflare Pages. It's split into two phases
so you can verify each step before committing to the next.

- **Phase A — Setup.** Connect Cloudflare Pages to the GitHub
  repo, deploy, and verify at a `*.pages.dev` URL. Zero production
  risk — GitHub Pages keeps serving the real domain throughout.
- **Phase B — DNS flip.** Once Phase A is verified, change the
  A records in Cloudflare DNS to point at Cloudflare Pages.
  Production traffic starts hitting the new host.

**Prerequisite:** DNS has been live on Cloudflare nameservers for
at least 48 hours before running Phase B. Phase A has no such
requirement and can run any time.

## Why we're doing this

Three concrete wins, in order of business impact:

1. **Kills the last Lighthouse Performance ceiling.** The
   "Use efficient cache lifetimes" finding on muntin.digital is
   caused by GitHub Pages' short default cache headers. Pages
   lets us set 30-day cache on static assets via the `_headers`
   file in the repo root — unblocks the Performance score
   from 88 toward 95+.

2. **Lets us add a server-side layer later.** Cloudflare Pages
   ships with Workers on the same origin, so we can eventually
   build:
   - A tiny email forwarding endpoint that replaces Formspree
     entirely (save $10/mo)
   - A PSI audit-response cache that makes shared audit links
     instant and saves our PSI quota
   - Server-side rate limiting, bot protection, redirects
   None of this is possible on GitHub Pages today.

3. **Unified control plane.** Currently we have DNS at Cloudflare,
   hosting at GitHub, email at Google Workspace, analytics at
   Plausible. Moving hosting into Cloudflare collapses four
   vendors into three and puts DNS + hosting in the same dashboard.

## Phase A — Setup (no DNS changes)

### Step A.1 — Create the Pages project

1. Go to **https://dash.cloudflare.com/**
2. In the left sidebar, click **Workers & Pages**
3. Click **Create application** (top right)
4. Click the **Pages** tab
5. Click **Connect to Git**
6. Click **Connect GitHub** — authorize Cloudflare to access
   your GitHub account if prompted. You can scope access to
   just the `potentially-profitable` repo.
7. Select **Donwonmagic/potentially-profitable**
8. Click **Begin setup**

### Step A.2 — Configure the build

Cloudflare shows a form asking about build settings. Fill in:

| Field | Value |
|---|---|
| **Project name** | `muntin-digital` |
| **Production branch** | `main` |
| **Framework preset** | `None` (this is a static site, no build needed) |
| **Build command** | *(leave empty)* |
| **Build output directory** | `/` (just a single forward slash — means "the repo root") |
| **Root directory** | *(leave empty — defaults to repo root)* |
| **Environment variables** | *(none needed)* |

Click **Save and Deploy**.

### Step A.3 — Wait for first build

Cloudflare Pages will:
1. Clone the repo
2. Read every file in the root (this is a static site, nothing to build)
3. Apply the `_headers` file at deploy time
4. Publish the result to the Cloudflare edge

The first build usually finishes in 30–90 seconds. You'll see a
live log window — watch for a green "Success" indicator.

If the build fails:
- Check the build log for the specific error
- Most common issue: wrong "Build output directory" value
  (should be `/`, not `dist` or `public` or anything else)
- Email don@muntin.digital with a screenshot of the failure if
  you can't figure it out

### Step A.4 — Verify at the pages.dev URL

Once the build succeeds, Cloudflare gives you a preview URL like:

```
https://muntin-digital.pages.dev/
```

Open that URL in a fresh incognito window and verify:

- [ ] Homepage loads with correct content, colors, fonts
- [ ] Navigation works (click around to Services, Restaurants, Work, Blog)
- [ ] `https://muntin-digital.pages.dev/tools/audits/restaurant/` loads and the audit form accepts a URL
- [ ] Running a real audit on the pages.dev version returns results
- [ ] `https://muntin-digital.pages.dev/blog/how-much-does-a-custom-restaurant-website-cost-in-2026/` loads the cost post
- [ ] `https://muntin-digital.pages.dev/resources/restaurant-website-checklist/` loads the checklist
- [ ] `https://muntin-digital.pages.dev/work/irish-inn-glen-echo/` loads the case study
- [ ] Fonts render (Fraunces + Inter should appear — no system-font fallback)
- [ ] Images load (hero, OG cards, work screenshots)

### Step A.5 — Verify cache headers are being applied

Open Chrome DevTools → Network tab → reload the page → click
on `site.css` in the request list → look at the "Headers" panel.

You should see:
```
cache-control: public, max-age=2592000
```

That confirms the `_headers` rule is being applied at the edge.
If you see `max-age=600` or something tiny instead, the `_headers`
file wasn't picked up — check that it's committed to the repo
root with the filename exactly `_headers` (no extension, leading
underscore).

### Step A.6 — Leave it running in parallel

At this point, Cloudflare Pages is serving a full copy of the
site at `muntin-digital.pages.dev`, and GitHub Pages is still
serving the real `muntin.digital`. Both are live simultaneously.

**Leave it in this state for at least 48 hours.** Use that
window to:
- Confirm DNS cutover from today is stable (no anomalies)
- Watch muntin.digital for any issues from the pending deploy
- Test every page you care about at the pages.dev URL
- Run a few Lighthouse audits on the pages.dev version to
  confirm the cache-header improvement is showing up

## Phase B — DNS flip (after 48h of stable DNS)

Once both of these are true:
1. DNS has been stable on Cloudflare nameservers for 48+ hours
2. The pages.dev deploy has been verified working

...you can proceed with Phase B.

### Step B.1 — Add a custom domain on the Pages project

1. In the Cloudflare dashboard, go to **Workers & Pages**
2. Click on the `muntin-digital` project
3. Click the **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `muntin.digital`
6. Click **Continue**
7. Cloudflare will detect that the DNS is already managed
   in the same account and offer to automatically update
   the DNS records. Click **Activate domain**.
8. Repeat for `www.muntin.digital`:
   - Click **Set up a custom domain**
   - Enter: `www.muntin.digital`
   - Click **Continue** → **Activate domain**

Cloudflare handles the DNS changes automatically:
- The 4 GitHub Pages A records get replaced with a CNAME to
  `muntin-digital.pages.dev`
- The www CNAME gets updated to point at the Pages project

### Step B.2 — Monitor during propagation

Even though you're already on Cloudflare DNS (so propagation is
instant within Cloudflare's infrastructure), visitors with cached
DNS from the previous A records may still hit GitHub Pages for a
few hours.

Immediately after Step B.1, verify:

- [ ] `https://muntin.digital/` still loads in a fresh incognito window
- [ ] Navigation, audit tool, blog posts all work
- [ ] `curl -I https://muntin.digital/assets/site.css` from a terminal
  shows `cache-control: public, max-age=2592000` — if it still shows
  GitHub Pages' short cache, you're hitting GitHub Pages via cached DNS
- [ ] Email still works (send yourself a test from don@muntin.digital)

### Step B.3 — Post-flip: re-audit muntin.digital

Run the Lighthouse audit on muntin.digital via your own audit tool
or Chrome DevTools. Compare to the pre-Phase-B baseline:

**Pre-Phase B (GitHub Pages):**
- Performance: 88
- Remaining findings: "Use efficient cache lifetimes" ~15 KiB

**Expected post-Phase B (Cloudflare Pages):**
- Performance: 92–95
- "Use efficient cache lifetimes" finding: gone
- Speed Index improved
- LCP likely improved (edge caching + Brotli)

### Step B.4 — Clean up

After a week of stable running on Cloudflare Pages:

- Delete the old DNS records at GoDaddy (they've been idle since
  the DNS cutover — optional cleanup, not required)
- Disable the GitHub Pages source in the repo settings
  (Settings → Pages → Source → None). GitHub Pages stops building,
  the old hosting stops consuming CI minutes.
- Keep the `CNAME` file in the repo (harmless, needed for potential
  future rollback)

## Rollback plan

If something breaks during Phase B and you need to revert:

1. In the Cloudflare Pages project → Custom domains → remove
   `muntin.digital` and `www.muntin.digital`
2. In Cloudflare DNS → manually re-add the 4 A records pointing at
   GitHub Pages IPs:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
3. Re-add the www CNAME pointing at `muntin.digital`
4. Wait 5 minutes for Cloudflare to propagate internally
5. Verify `muntin.digital` loads again

Total rollback time: ~10 minutes. The risk is bounded.

## Related

- `/_headers` — the Cloudflare Pages headers config that makes
  the cache-lifetime improvement possible
- `/CNAME` — GitHub Pages custom domain file, kept for rollback
- `/docs/search-console-setup.md` — Google Search Console runbook
  (no changes needed during this migration; Search Console verifies
  via DNS TXT which is unchanged)
