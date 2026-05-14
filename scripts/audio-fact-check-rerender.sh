#!/usr/bin/env bash
# audio-fact-check-rerender.sh — May 2026 fact-check audio re-render
#
# Drives scripts/render-post-audio.mjs to refresh every audio narration
# manifest that the fact-check round invalidated. Runs locally; needs the
# Kokoro model files on disk. Resumable — kill it any time, re-run the
# script, the orchestrator picks up where it stopped.
#
# Defaults match the original wave-1 render workflow:
#   --engine f5   F5-TTS for English narration, Kokoro for non-English.
#   --commit-per-article   each article's audio.*.{mp3,json} get staged,
#                          committed ("audio: <slug>"), and pushed to the
#                          current branch's upstream the moment its full
#                          language set finishes. A mid-batch crash never
#                          costs more than the in-flight article.
#   --force-retranslate    invalidates the translation cache so cleaned
#                          prose actually reaches FR/IT/PT/ZH chunks.
#   Translation backend is Cloudflare Workers AI (Llama 3.3 70B) when the
#   CF env vars are set; falls back to Google Translate otherwise.
#
# Usage:
#   export CF_ACCOUNT_ID="..."     # editorial-tone translations via
#   export CF_AI_TOKEN="..."       # Cloudflare Workers AI (Llama 3.3 70B)
#
#   ./scripts/audio-fact-check-rerender.sh                  # default
#   ./scripts/audio-fact-check-rerender.sh --languages en   # narrow set
#   ./scripts/audio-fact-check-rerender.sh --engine kokoro  # all-Kokoro
#   ./scripts/audio-fact-check-rerender.sh --no-commit      # bulk render,
#                                                             commit later
#   ./scripts/audio-fact-check-rerender.sh --dry-run        # show plan
#
# Environment overrides:
#   CF_ACCOUNT_ID      Cloudflare account ID for Workers AI translations
#   CF_AI_TOKEN        Cloudflare API token (Workers AI Read scope)
#   CF_AI_MODEL        model override; default
#                        @cf/meta/llama-3.3-70b-instruct-fp8-fast
#   KOKORO_MODEL       path to kokoro-v1.0.onnx
#                      (default: ~/kokoro-models/kokoro-v1.0.onnx)
#   KOKORO_VOICES      path to voices-v1.0.bin
#                      (default: ~/kokoro-models/voices-v1.0.bin)
#   PYTHON             which python interpreter to shell out to
#                      (default: python3)
#
# What it re-renders:
#   The 18 articles whose HTML the May 2026 fact-check round rewrote.
#   English source + ES/FR/IT/PT/ZH translations. The renderer's hash
#   check would catch most of these on its own with --all, but this
#   script names them explicitly so the operator can read the list
#   before launching a 60+ hour run.
#
# What it costs:
#   ~30-45 minutes per article per language. 18 articles × 6 languages
#   × ~35 minutes ≈ 60+ hours of compute total. Run overnight + into
#   the next day. The orchestrator is resumable.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# ─────────────────────────────────────────────────────────────────────────
# Defaults + arg parsing
# ─────────────────────────────────────────────────────────────────────────
KOKORO_MODEL="${KOKORO_MODEL:-$HOME/kokoro-models/kokoro-v1.0.onnx}"
KOKORO_VOICES="${KOKORO_VOICES:-$HOME/kokoro-models/voices-v1.0.bin}"
LANGUAGES="en,es,fr,it,pt,zh"
ENGINE="f5"             # matches the original wave-1 render
COMMIT_PER_ARTICLE=1    # incremental commit + push per article (default on)
DRY_RUN=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --languages)         LANGUAGES="$2"; shift 2 ;;
    --languages=*)       LANGUAGES="${1#*=}"; shift ;;
    --engine)            ENGINE="$2"; shift 2 ;;
    --no-commit)         COMMIT_PER_ARTICLE=0; shift ;;
    --dry-run)           DRY_RUN=1; shift ;;
    --kokoro-model)      KOKORO_MODEL="$2"; shift 2 ;;
    --kokoro-voices)     KOKORO_VOICES="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,40p' "$0"; exit 0 ;;
    *)
      echo "unknown arg: $1" >&2
      echo "use --help for usage." >&2
      exit 2 ;;
  esac
done

# ─────────────────────────────────────────────────────────────────────────
# Article list — every directory the fact-check commits touched
# ─────────────────────────────────────────────────────────────────────────
ARTICLES=(
  blog/30-days-after-leaving-doordash-restaurant-case-study
  blog/an-honest-doordash-math-for-independent-restaurants-2026
  blog/how-to-get-cited-in-google-ai-overviews-restaurant
  blog/how-to-get-more-google-reviews-for-your-restaurant
  blog/how-to-recover-reservations-from-googles-find-a-table
  blog/how-to-respond-to-google-reviews-restaurant-playbook-2026
  blog/how-to-set-up-google-business-profile-for-your-restaurant
  blog/instagram-as-restaurant-seo-strategy-2026
  blog/loyalty-programs-for-independent-restaurants-what-works-2026
  blog/may-2026-wave-publishing-for-citation
  blog/my-restaurant-isnt-on-google-maps-10-minute-diagnostic
  blog/restaurant-schema-markup-complete-paste-ready-example
  blog/service-charges-vs-tipping-restaurant-operator-math-2026
  blog/toast-vs-square-vs-clover-for-restaurants
  blog/uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026
  blog/why-your-restaurant-loses-reservations-every-night
  blog/wix-vs-custom-for-restaurants
  learn/research/local-business-websites
  learn/research/fittss-law
  learn/research/cart-abandonment-rate
  learn/research/mobile-page-speed-3-second-rule
)

# ─────────────────────────────────────────────────────────────────────────
# Pre-flight checks
# ─────────────────────────────────────────────────────────────────────────
fail() { echo "✗ $*" >&2; exit 1; }
ok()   { echo "✓ $*"; }

[[ -x "$(command -v node)" ]] || fail "node not found on PATH."
[[ -f "$REPO_ROOT/scripts/render-post-audio.mjs" ]] || \
  fail "scripts/render-post-audio.mjs not found at repo root."

if [[ "$DRY_RUN" -eq 0 ]]; then
  if [[ ! -f "$KOKORO_MODEL" ]]; then
    fail "Kokoro model not found at: $KOKORO_MODEL
       Set KOKORO_MODEL=/path/to/kokoro-v1.0.onnx or pass --kokoro-model."
  fi
  if [[ ! -f "$KOKORO_VOICES" ]]; then
    fail "Kokoro voices not found at: $KOKORO_VOICES
       Set KOKORO_VOICES=/path/to/voices-v1.0.bin or pass --kokoro-voices."
  fi
fi

missing=()
for d in "${ARTICLES[@]}"; do
  [[ -f "$d/index.html" ]] || missing+=("$d")
done
if (( ${#missing[@]} )); then
  printf "✗ missing article directories:\n"
  printf "  %s\n" "${missing[@]}"
  fail "fix the article list in this script or pull latest before re-rendering."
fi

ok "preflight: node + renderer + kokoro models + 18 article dirs all present."

# Cloudflare Workers AI gates the editorial-tone (Llama 3.3 70B) translation
# path. If the env vars aren't set, scripts/lib/translate.py falls back to
# Google Translate's unauthenticated public endpoint with the glossary still
# applied — solid mechanical translation, but it loses the editorial
# register that makes FR/IT/PT/ZH narrations feel native. Warn loudly so
# the operator can decide to abort and `export CF_ACCOUNT_ID=… CF_AI_TOKEN=…`
# before the long run.
if [[ -z "${CF_ACCOUNT_ID:-}" || -z "${CF_AI_TOKEN:-}" ]]; then
  echo
  echo "  ⚠ CF_ACCOUNT_ID + CF_AI_TOKEN not set."
  echo "    Translations will fall back to Google Translate (mechanical, no"
  echo "    editorial register). Set both before re-running for native-feel"
  echo "    FR/IT/PT/ZH narrations:"
  echo "       export CF_ACCOUNT_ID=\"...\""
  echo "       export CF_AI_TOKEN=\"...\""
  echo
fi

# ─────────────────────────────────────────────────────────────────────────
# Plan summary
# ─────────────────────────────────────────────────────────────────────────
n_articles=${#ARTICLES[@]}
IFS=',' read -ra lang_arr <<< "$LANGUAGES"
n_langs=${#lang_arr[@]}
total_renders=$(( n_articles * n_langs ))
est_minutes=$(( total_renders * 35 ))
est_hours=$(( est_minutes / 60 ))

if [[ -n "${CF_ACCOUNT_ID:-}" && -n "${CF_AI_TOKEN:-}" ]]; then
  TRANSLATE_DESC="Cloudflare Workers AI (Llama 3.3 70B), --force-retranslate"
else
  TRANSLATE_DESC="Google Translate fallback (CF env vars unset), --force-retranslate"
fi

if (( COMMIT_PER_ARTICLE )); then
  COMMIT_DESC="--commit-per-article (auto stage + commit + push per article)"
else
  COMMIT_DESC="(no auto-commit; bulk render only — risky for long runs)"
fi

cat <<EOF

  May 2026 fact-check audio re-render
  ───────────────────────────────────
  Articles:    $n_articles
  Languages:   $LANGUAGES  (${n_langs})
  Renders:     $total_renders  (article × language)
  Est. time:   ~${est_hours} hours  (35 min × $total_renders, single-threaded)
  Engine:      $ENGINE   (F5 for English, Kokoro for non-English)
  Kokoro:      $KOKORO_MODEL
               $KOKORO_VOICES
  Translate:   $TRANSLATE_DESC
  Commit:      $COMMIT_DESC

EOF

if (( DRY_RUN )); then
  echo "  --dry-run set; not invoking renderer. Articles that would render:"
  printf "    %s\n" "${ARTICLES[@]}"
  echo
  exit 0
fi

read -rp "Proceed? [y/N] " ans
case "$ans" in
  y|Y|yes|YES) ;;
  *) echo "aborted."; exit 0 ;;
esac

# ─────────────────────────────────────────────────────────────────────────
# Render
# ─────────────────────────────────────────────────────────────────────────
RENDER_FLAGS=(
  --engine "$ENGINE"
  --languages "$LANGUAGES"
  --force-retranslate
  --kokoro-model "$KOKORO_MODEL"
  --kokoro-voices "$KOKORO_VOICES"
)
if (( COMMIT_PER_ARTICLE )); then
  RENDER_FLAGS+=(--commit-per-article)
fi

# Single batch invocation. The renderer walks the article list
# sequentially, shares translation pipeline state, and (with
# --commit-per-article) auto-commits + pushes each article's audio
# the moment its language set is on disk. A crash mid-batch never
# costs more than the in-flight article's worth of work — the
# renderer's hash check skips already-done articles on the next run.
echo
echo "─── render: all $n_articles articles ───"
if ! node scripts/render-post-audio.mjs "${ARTICLES[@]}" "${RENDER_FLAGS[@]}"; then
  echo "✗ render failed. Re-run this script — already-committed work won't redo."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────
# Verification — confirm no audio.json still carries cut patterns
# ─────────────────────────────────────────────────────────────────────────
echo
echo "─── verification: scanning audio manifests for cut patterns ───"

verify_paths=()
for d in "${ARTICLES[@]}"; do
  for f in "$d"/audio.json "$d"/audio.es.json "$d"/audio.fr.json \
           "$d"/audio.it.json "$d"/audio.pt.json "$d"/audio.zh.json; do
    [[ -f "$f" ]] && verify_paths+=("$f")
  done
done

# The patterns the fact-check round cut. Any of these surfacing in an
# audio.json after the re-render means that article's manifest didn't
# pick up the cleaned HTML — re-render it explicitly with:
#   ./scripts/audio-fact-check-rerender.sh --explicit
PATTERNS='two restaurants I manage|los dos restaurantes que manejo|paired-restaurant|fittss-law|two DMV restaurants|100-restaurant DMV cohort|maneja dos|Llevo dos restaurantes|administra dos|paired-query|90 days of paired|Usability of Local Business Websites|Jakob Nielsen.*Kara Pernice|Tacombi locations I worked with|moved up roughly five positions|roughly doubled over the quarter|15-25% lift in pack-card|8-15% of search-driven|\$165[–-]\$249'

stale=()
for f in "${verify_paths[@]}"; do
  if grep -E -l "$PATTERNS" "$f" >/dev/null 2>&1; then
    stale+=("$f")
  fi
done

if (( ${#stale[@]} )); then
  echo "✗ ${#stale[@]} audio manifest(s) still carry cut patterns:"
  printf "  %s\n" "${stale[@]}"
  echo
  echo "Re-render the affected articles in --explicit mode:"
  echo "  ./scripts/audio-fact-check-rerender.sh --explicit"
  exit 1
fi

ok "all ${#verify_paths[@]} audio manifest(s) clean of cut patterns."

# ─────────────────────────────────────────────────────────────────────────
# Final
# ─────────────────────────────────────────────────────────────────────────
echo
echo "─── audio coverage audit ───"
node scripts/check-audio-coverage.mjs || true

echo
if (( COMMIT_PER_ARTICLE )); then
  ok "re-render complete. Each article's audio has already been committed + pushed."
  echo
  echo "    git log --oneline | grep '^.\\{7\\} audio: ' | head"
else
  ok "re-render complete. Commit the new audio.*.mp3 and audio.*.json files:"
  echo
  echo "    git add -A 'blog/**/audio.*' 'learn/research/**/audio.*'"
  echo "    git status --short"
  echo "    git commit -m \"audio: re-render after May 2026 fact-check\""
  echo "    git push"
fi
echo
