# Blog drafts — release day playbook

This directory holds blog posts that have been written but are not yet
published. Every post in here is a fully-formed HTML file with its own
head, JSON-LD, styles, and content — it is just not linked from the blog
index, not in the sitemap, and carries a `<meta name="robots"
content="noindex,nofollow">` tag so Google will not crawl it even if it
finds the URL.

The point is to batch-write content ahead of time and drip-release it on
a schedule, without a CMS and without a build tool. Static-site native.

## One post per subfolder

Each draft lives at:

```
blog/drafts/[final-slug]/index.html
```

The slug matches where the post will live at its final URL. When we
release it, all we do is move the folder from `blog/drafts/[slug]/` to
`blog/[slug]/` and flip a few lines.

Every draft file should already have its final canonical URL baked in —
`https://muntin.digital/blog/[slug]/` — so the JSON-LD, Open Graph tags,
and breadcrumbs are correct the moment it goes live. The `noindex`
robots tag is the only thing keeping it from being indexed while it
sits in drafts.

## Release-day checklist

On the scheduled release date, run through these four steps in order:

1. **Move the folder** from `blog/drafts/[slug]/` to `blog/[slug]/`.
   On the command line:
   ```sh
   git mv blog/drafts/[slug] blog/[slug]
   ```
   (git mv keeps the commit history on the file so we can see when it
   was originally drafted.)

2. **Remove the noindex meta tag** from the post's head. Find and
   delete this line:
   ```html
   <meta name="robots" content="noindex,nofollow" />
   ```

3. **Add the post card to `blog/index.html`**. Duplicate the existing
   `.post-card` block inside `.post-list`, update the href, date,
   reading time, title, and excerpt. Newest post goes first. Copy the
   title and excerpt from the post's hero section so they match.

4. **Add the post URL to `sitemap.xml`**. Duplicate an existing blog
   post `<url>` block and update `<loc>` to the new slug. Use
   `<changefreq>yearly</changefreq>` and `<priority>0.85</priority>`.

5. **Commit and push**:
   ```sh
   git commit -m "Publish: [post title]"
   git push
   ```

6. **(Optional) Post on social** once the merge is live. The audit
   page's share row pattern works here too — drop the post URL in
   Twitter/X, LinkedIn, or the restaurant-owner Facebook group you
   want it in.

That's the whole flow. No build tools, no CMS, no scheduler. The post
is live within a minute or two of the commit.

## Current schedule

Compressed to a weekly cadence — for a new domain, content volume beats
drip-spacing because Google needs crawlable surfaces to build freshness
signals.

| Post | Slug | Release date | Status |
|---|---|---|---|
| How Much Does a Custom Restaurant Website Cost in 2026? | `how-much-does-a-custom-restaurant-website-cost-in-2026` | Apr 13, 2026 | **Live** |
| Wix vs. Custom for Restaurants: What Breaks First | `wix-vs-custom-for-restaurants` | Apr 15, 2026 | **Live** |
| Why Your Restaurant Loses Reservations Every Night | `why-your-restaurant-loses-reservations-every-night` | Apr 22, 2026 | Queued |
| Toast, Square, Clover: Which POS Integrates Best? | `toast-vs-square-vs-clover-for-restaurants` | Apr 29, 2026 | Queued |

## Why a drafts directory and not a separate branch

Both work, but a drafts directory on `main` has one key advantage: you
can see every scheduled post in one `ls` command, and a release day
never requires a merge — just a file move and an index edit. A separate
branch means every release requires both a PR and a manual content
step, which is more room to forget something.

The tradeoff is that the draft HTML sits in the deployed repo, which
means a technically-curious visitor could guess the drafts URL and read
the post a few days early. The `noindex` tag prevents Google from
surfacing it. That's an acceptable tradeoff for a studio blog — if a
visitor is curious enough to guess `/blog/drafts/wix-vs-custom-for-
restaurants/`, they're already a fan and the early read isn't a
problem.
