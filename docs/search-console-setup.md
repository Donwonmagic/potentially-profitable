# Google Search Console setup runbook

Google Search Console is the control panel Google gives you for
monitoring — and fixing — how your site appears in search results.
Every site that wants to rank should have it set up. For Muntin
Digital specifically, it's the fastest way to diagnose:

- Whether Google has actually indexed your pages
- Which keywords are bringing people to the site
- What average position you rank at for each keyword
- Favicon and rich-result status (FAQ, HowTo, Article, etc.)
- Any crawl errors or blocked URLs
- Who's linking to you (external backlinks, growing over time)

Search Console is **separate from Google Business Profile**. GBP
is for local-pack + knowledge-panel ranking; Search Console is
for web-search ranking and technical SEO. You need both. They
live in different Google properties and don't share data.

## One-time setup

### 1. Add `muntin.digital` as a property

1. Go to **https://search.google.com/search-console**
2. Sign in with the Google account you want to own the
   verification. Use the same account that owns your Google
   Business Profile if possible — it simplifies future cross-
   account tasks.
3. Click **Add property** (upper-left)
4. Choose **Domain** (recommended — covers every subdomain and
   both HTTP and HTTPS variants in a single property) and enter
   `muntin.digital`
5. Google will give you a **TXT record** to add to your DNS

### 2. Verify ownership via DNS TXT record

1. Copy the TXT record value Google provides — it looks like
   `google-site-verification=AbCdEfGhIjKlMnOp...` (a long string
   of letters and numbers)
2. Go to your domain registrar's DNS control panel — wherever
   you bought `muntin.digital`. Common registrars: Namecheap,
   GoDaddy, Google Domains / Squarespace Domains, Porkbun,
   Cloudflare Registrar.
3. Add a new DNS record:
   - **Type**: `TXT`
   - **Name / Host**: `@` (some registrars use blank instead —
     it means "root of the domain")
   - **Value**: the full `google-site-verification=...` string
     from step 1, pasted as-is
   - **TTL**: default (usually 1 hour or "Auto")
4. Save the record.
5. Wait **5 to 15 minutes** for DNS propagation. Some registrars
   are faster; Cloudflare is nearly instant; GoDaddy can take 30
   minutes.
6. Back in Search Console, click **Verify**. If it fails, wait
   another 10 minutes and try again — propagation varies.

If DNS verification is blocked or confusing, you can alternately
verify with an **HTML file upload** at a specific URL path
Google gives you. You'd commit that file to the repo root and
push. Works, but the DNS method is the industry standard.

### 3. Submit the sitemap

1. In the Search Console left nav, click **Sitemaps**
2. In the "Add a new sitemap" input, enter `sitemap.xml`
   (the domain prefix is auto-filled, so you're effectively
   submitting `https://muntin.digital/sitemap.xml`)
3. Click **Submit**
4. Google will start crawling the URLs listed in the sitemap
   within hours — though it may take days before the Sitemaps
   tab shows "Success" and a full URL count.

### 4. Request indexing on key pages manually

For a new or small site, you can dramatically speed up indexing
by manually requesting specific URLs instead of waiting for
Google to discover them:

1. Paste a URL into the **URL inspection** bar at the top of
   Search Console (not the left-nav search — the top bar)
2. Wait for the check to run (a few seconds)
3. Click **Request indexing** — this moves the URL to the front
   of Google's crawl queue for your site

Priority URLs to request, in this order:

```
https://muntin.digital/
https://muntin.digital/for/restaurants/
https://muntin.digital/tools/restaurant-audit/
https://muntin.digital/resources/restaurant-website-checklist/
https://muntin.digital/blog/how-much-does-a-custom-restaurant-website-cost-in-2026/
https://muntin.digital/work/
https://muntin.digital/work/irish-inn-glen-echo/
https://muntin.digital/work/off-day-collective/
https://muntin.digital/blog/
https://muntin.digital/tools/
```

Google caps manual indexing requests to about **10 per day** per
property, so spread the list over two days if you hit the cap.

## Ongoing — check once a month

Once the site is indexed, the Performance tab becomes the most
useful view. Check it on the first of every month and look at:

- **Which queries are bringing traffic?** Sort by Clicks
  descending. Look for surprises — queries you didn't expect,
  queries you're ranking for that you could double down on.
- **What position am I ranking at for each query?** Sort by
  Position ascending. Anything in the top 3 is delivering
  real clicks; anything 4–10 is on the first page and can
  climb with small content improvements; anything 11–20 is on
  page two and needs a real content push.
- **Impressions vs. clicks ratio** (CTR). Low CTR on a
  high-impression keyword means your meta description or title
  isn't selling. That's a one-line fix to a specific page.
- **Coverage tab**: any indexing errors, blocked-by-robots, or
  "discovered but not indexed" states that need fixing.
- **Enhancements tab**: any issues with structured data, mobile
  usability, or Core Web Vitals.
- **Links tab**: new external backlinks since the last check —
  the slowest-but-most-durable authority signal.

## Common gotchas

- **"Not indexed — discovered but not crawled"** usually means
  Google found the URL in the sitemap but hasn't prioritized
  crawling it yet. New sites often see this for 1–4 weeks.
  Request indexing manually to move the URL to the front of
  the queue.
- **"URL is not on Google"** is the normal state for a brand-new
  site in its first week. If it persists beyond two weeks on a
  URL you've requested indexing for, something is blocking
  Google — usually a `robots.txt` rule, a `noindex` meta tag, a
  404, or a server error.
- **Favicon not showing in search** takes **1–4 weeks** to update
  even after you've uploaded new favicon files. Patience. Use
  the `/brand/favicons/README.md` recipe to generate the PNGs
  first; the HTML tags are already wired.
- **Mobile usability errors** on older reports often come from
  old third-party widgets that loaded when the site was on a
  different platform. If you see these on a Muntin-built custom
  site, it's a real issue worth looking at — our stack is mobile-
  first by default and shouldn't produce these warnings.
- **Manual Action** notice is extremely rare but if it ever
  appears, stop everything and read it immediately. It means
  Google's spam team has taken action against the site and you
  need to respond within the dashboard to recover rankings.

## When to re-verify

Search Console occasionally re-verifies domain ownership. If
your DNS TXT record is ever deleted (e.g., during a registrar
migration), verification lapses and you lose access until you
re-add the record. Always leave the `google-site-verification`
TXT record in place even if you think you don't need it anymore.

## Related

- `/brand/favicons/README.md` — Favicon generation recipe
  (needed so Google Search has a PNG to display next to the
  result URL)
- `/sitemap.xml` — The actual sitemap file Search Console will
  crawl
- `/robots.txt` — The file that tells Google's crawler where it
  can and can't go (currently wide-open with no restrictions)
