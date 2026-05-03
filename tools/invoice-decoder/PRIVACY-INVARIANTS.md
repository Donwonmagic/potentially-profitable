# Invoice Decoder — Privacy Invariants

This file is the canary list for the Invoice Decoder's privacy posture.
Every PR that touches one of the files referenced below must justify the
change against the relevant invariant or be flagged for privacy review.

The tool's user-facing claims — **"on-device OCR; nothing uploads,"
"encrypted to your device,"** **"image bytes never travel"** — depend on
these invariants holding. They are not aspirational; they are a contract.

## The invariants

| # | Invariant | Enforced by |
|---|---|---|
| I-1 | Network egress is allowlist-only: same-origin + `plausible.io`. | `telemetry.js` runtime sentinel (lines 21–28, 66–124) + `_headers` CSP `connect-src` (line 195) + `sw.js` allowlist (line 99) |
| I-2 | Vendored libraries (Tesseract.js, PDF.js, SheetJS, hash-wasm Argon2) are self-hosted under `/assets/vendor/` with SRI-pinned integrity. | `sw.js` precache (lines 60–73) + `vendor-config.js` resolver |
| I-3 | All persistent operator data is AES-GCM-256 ciphertext. The server only ever sees `{v, iv, ct, aad, wraps}`. | `encrypt.js:encryptPayload` (lines 174–223) |
| I-4 | KEKs are derived via Argon2id (m=64MiB, t=3, p=1) with PBKDF2-SHA256 (600k iterations) as a fallback. KEKs are never stored. | `kdf.js` (lines 52–120) |
| I-5 | The 24-word BIP39 recovery phrase is never persisted. Only a `recoveryPhraseGeneratedAt` timestamp survives. | `recovery.js` (lines 62–127) |
| I-6 | The passphrase lives in module-scope JS only, with a 30-minute idle expiry, wiped on `beforeunload`. | `passphrase-modal.js` (lines 406–495) |
| I-7 | Image, PDF, and CSV bytes are never POSTed. Only same-origin `/api/workbench/save` and `/api/workbench/get` ever move ciphertext. | `telemetry.js` egress sentinel + the controller (`invoice-decoder.js`) |
| I-8 | Web Share Target writes incoming files to a same-origin Cache (`id-share-inbox`); entries are deleted on first consumption. | `sw.js` (lines 238–277) |
| I-9 | PDF rasterization (the ScanSnap path added in Wave A) runs in this tab via the existing self-hosted PDF.js worker. No new vendor, no new egress. | `pdf-extract.js:rasterizeImageOnlyPdf` |
| I-10 | Telemetry is opt-out (default ON), never carries PII, and is disabled by toggling `mtn:telemetry` in localStorage to `'off'`. | `telemetry.js` (lines 30–58) |
| I-11 | `removeWrap` refuses to remove the last unlock path on an envelope. | `encrypt.js` (lines 264–277) |
| I-12 | Any future on-device-only counters (accuracy stats, learning-loop telemetry) must never appear in any outbound payload. | reserved — to be enforced by the telemetry-sentinel key-scan in Wave E.2 |

## What changes require privacy review

A change to any of the following touches the invariants above and needs an
explicit justification in the PR description:

- `tools/invoice-decoder/encrypt.js`
- `tools/invoice-decoder/kdf.js`
- `tools/invoice-decoder/device-key.js`
- `tools/invoice-decoder/recovery.js`
- `tools/invoice-decoder/passphrase-modal.js`
- `tools/invoice-decoder/pairing.js`
- `tools/invoice-decoder/telemetry.js`
- `tools/invoice-decoder/sw.js`
- `tools/invoice-decoder/vendor-config.js`
- `tools/invoice-decoder/manifest.webmanifest`
- `_headers` (CSP block applied to `/tools/invoice-decoder/*`)
- Anything that introduces a new `fetch(...)`, `<script src=...>`, or
  `import(...)` against a non-same-origin URL.

## What's deliberately not promised

We do **not** claim:

- That on-disk localStorage is a hard cryptographic boundary against a
  co-resident attacker who controls the operator's machine. The
  `mtn:device-id` key obfuscates the local-storage handoff to the
  Workshop, but it is not a defense against root-level compromise.
  This trade-off is disclosed in `device-key.js` (lines 7–17).
- That the passphrase in JS memory is immune to Spectre / Meltdown /
  shared-machine attacks. The operator has to use a machine they trust.
- That a typed pairing token is immune to MITM if the operator's
  device is already compromised when they transcribe it. The future
  ECDH QR ceremony (spec'd in the audit plan, Wave E.8) closes this.

These are honest limitations, called out so the privacy story scales
with the threat model rather than overpromising.

## Verifying the invariants yourself

Open the tool, then DevTools → Network. Run a full happy path: drop a
photo or PDF, watch it OCR, click Save. The Network panel should be
empty until the explicit Save POST, and the Save POST body must contain
`{ v, iv, ct, aad, wraps: [...] }` with no plaintext anywhere.

Wave E of the audit plan adds a built-in **"Run privacy self-test"**
button that automates this check inside the tool. Until that ships,
the manual DevTools walk is the reference test.
