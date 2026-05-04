# Invoice Decoder — automation recipes

Ship-ready installer descriptors for **on-device** automation that
forwards invoice attachments from the operator's email into the
Invoice Decoder PWA via the existing Web Share Target. The recipes
run entirely on the operator's phone — there is no Muntin server
component, and no inbox bytes ever leave the device.

## Apple Shortcuts (iOS / iPadOS / macOS) — `apple-shortcut.json`

The Shortcut watches a Mail label called **"Invoices"** for new
messages with PDF attachments. When one arrives, the Shortcut:

1. Saves the attachment to **Files → On My Device → Invoices**.
2. Calls the Web Share Target deeplink:
   `https://muntin.digital/tools/invoice-decoder/?intake=share`
   passing the saved attachment as a shared file.
3. The PWA's existing `?shared=` token reader picks the file up and
   routes it through the unified intake.

### Install

1. iPhone Settings → **Shortcuts** → ensure the toggle for
   *Allow Untrusted Shortcuts* is enabled.
2. Tap the install link surfaced in the Invoice Decoder UI's
   "Settings → Email-the-tool" panel.
3. Add a Mail filter: From your distributors → label **Invoices**.
4. The Shortcut fires automatically once per matching email.

### Privacy

- Runs in the operator's local Shortcuts environment.
- Touches Mail, Files, and the Muntin PWA only.
- Muntin's network footprint stays exactly the same as a manual
  drag-and-drop: Web Share Target → service-worker cache → page
  controller. Verify in DevTools.

## Tasker (Android) — `tasker-profile.xml`

Equivalent profile for Tasker. Trigger: new Gmail message tagged
**Invoices** with a PDF attachment. Action chain mirrors the iOS
flow, ending in an intent open to the same deeplink.

### Install

1. Open Tasker → Profiles → Import → select the .xml.
2. Grant Tasker the Mail accessibility permission Android requires
   to read filtered messages.
3. Set up the Gmail filter that adds the **Invoices** label.

## What's in this directory

- `apple-shortcut.json` — descriptor (the binary `.shortcut` is built
  from this descriptor in CI; signing key in deploy secrets).
- `tasker-profile.xml` — Tasker profile XML (importable as-is).

Both files ship as static assets; the install affordance in the
PWA's Settings panel links to them directly.
