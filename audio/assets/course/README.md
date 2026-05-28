# Course celebration audio assets (Lesson Mode, Phase 3.3)

Optional pre-recorded audio cues that play alongside the celebration
card when the operator marks a lesson complete. All five files are
**optional** — when a file is absent, the celebration card carries
the moment on its own. When a file lands here, the next lesson
complete that triggers its tier plays the audio automatically.

The runtime hook lives in the inline script stamped by
`scripts/inject-course-mark-complete.mjs`. After editing or recording
a file in this directory, no rebuild is needed — the next lesson
complete picks it up. Plausible event `Course Celebration Audio` fires
with `tier` + `locale` props on every play.

## Files this directory holds

Each tier ships in two locales (EN + ES). Per-locale codes match the
`locale` value the inline script reads from `<html lang>` — `en` or
`es`. Adding additional locales (`fr`, `it`, `pt`, `zh`) is a
straight file-add at the same paths.

| File                            | Length        | Plays when                       |
| ------------------------------- | ------------- | -------------------------------- |
| `lesson-complete.en.mp3`        | ~3 s          | Any per-lesson complete that doesn't fire a module-boundary card |
| `lesson-complete.es.mp3`        | ~3 s          | same, ES                         |
| `m1-complete.en.mp3`            | ~10-15 s      | Module 1 (Orient) finished       |
| `m1-complete.es.mp3`            | ~10-15 s      | same, ES                         |
| `m2-complete.en.mp3`            | ~10-15 s      | Module 2 (Decide) finished       |
| `m2-complete.es.mp3`            | ~10-15 s      | same, ES                         |
| `m3-complete.en.mp3`            | ~10-15 s      | Module 3 (Assemble) finished     |
| `m3-complete.es.mp3`            | ~10-15 s      | same, ES                         |
| `bootcamp-complete.en.mp3`      | ~25-35 s      | All 16 lessons done — bootcamp finish |
| `bootcamp-complete.es.mp3`      | ~25-35 s      | same, ES                         |

## Why these and not lesson-by-lesson audio

Two operational reasons:

1. **Lesson-specific completion audio would mean 20 × 2 = 40 recordings
   to keep aligned with each lesson's content.** Module-boundary +
   bootcamp boundaries collapse that to 5 × 2 = 10 recordings that
   stay relevant across content edits to the underlying lessons.

2. **The MuntinContext-hydrated celebration card already handles the
   personalized "Locked in. Marche, fifteen seats, Italian" surface
   visually.** Audio doesn't need to repeat the data; it carries the
   *moment* — the feeling of crossing the line. A branded ~10 s
   bumper compounds in recognition value across the bootcamp; a
   personalized synth narration doesn't.

## Recording script suggestions

These are starting points — Don's voice is the real source of truth.
Keep each clip under the length guidance above; nobody wants their
celebration to drag.

### `lesson-complete.<lang>.mp3` (~3 s, per-lesson)

EN: > "Saved. Onto the next one."
ES: > "Guardado. A la siguiente."

This plays a *lot* (up to 16 times per operator across the bootcamp).
Keep it short, warm, and identical-take-every-time so it becomes
audio wallpaper rather than a discrete interruption.

### `m1-complete.<lang>.mp3` (~12 s, M1 Orient finished)

EN: > "Module one. Orient. Done. You named the place,
>   you said what it's for, you wrote the promise.
>   That promise is the spine of the next three
>   modules — every decision from here either honors
>   it or doesn't. Onto Decide."

ES: > "Módulo uno. Orientar. Listo. Le pusiste nombre al lugar,
>   dijiste para qué es, escribiste la promesa.
>   Esa promesa es la columna de los próximos tres
>   módulos — cada decisión de aquí en adelante
>   o la honra o no. Pasamos a Decidir."

### `m2-complete.<lang>.mp3` (~12 s, M2 Decide finished)

EN: > "Module two. Decide. Done. Eight decisions, made.
>   Customer, naming, positioning, palette, voice —
>   the shape of your restaurant on the page is set.
>   Module three is the operator paperwork — menu,
>   photos, hours, Google profile. It's the longest
>   stretch. Pace yourself."

ES: > "Módulo dos. Decidir. Listo. Ocho decisiones, tomadas.
>   Cliente, nombre, posicionamiento, paleta, voz —
>   ya está la forma de tu restaurante en la página.
>   El módulo tres es el papeleo del operador — menú,
>   fotos, horarios, perfil de Google. Es el tramo más
>   largo. Ve a tu ritmo."

### `m3-complete.<lang>.mp3` (~12 s, M3 Assemble finished)

EN: > "Module three. Assemble. Done. The operator
>   paperwork is in. Menu, photos, hours, GBP — all
>   captured. Module four is the shortest path between
>   what you've built and a site that's live on a
>   domain. Five lessons. You're close."

ES: > "Módulo tres. Ensamblar. Listo. El papeleo del
>   operador está completo. Menú, fotos, horarios,
>   GBP — todo capturado. El módulo cuatro es el
>   camino más corto entre lo que has construido y un
>   sitio en vivo en un dominio. Cinco lecciones.
>   Estás cerca."

### `bootcamp-complete.<lang>.mp3` (~28 s, all 16 done)

EN: > "Sixteen lessons. Your restaurant is on the
>   internet. Real domain, real schema, real photos,
>   real hours. Real Google profile pointing at it.
>   And — this is the part most courses don't ship —
>   a recurring calendar event on your phone that
>   keeps it from going stale. Open the calendar
>   invite when it lands. Accept the four events.
>   Come back here in thirty days. Reach out if
>   anything broke. Hello at muntin dot digital."

ES: > "Dieciséis lecciones. Tu restaurante está en
>   internet. Dominio real, schema real, fotos
>   reales, horarios reales. Perfil de Google
>   apuntando ahí. Y — esta es la parte que la
>   mayoría de cursos no entrega — un evento
>   recurrente en tu calendario que evita que se
>   ponga obsoleto. Abre la invitación cuando llegue.
>   Acepta los cuatro eventos. Vuelve aquí en treinta
>   días. Escríbenos si algo se rompió. Hello arroba
>   muntin punto digital."

## Technical spec (all files)

- 44.1 kHz, 24-bit, mono WAV at recording stage; export to MP3 96 kbps
  CBR for delivery (matches the rest of the audio library).
- Peak around −3 dBFS in source; final loudness target −16 LUFS to
  match the body narration loudness.
- Drop into `audio/assets/course/<tier>.<lang>.mp3` — no other
  pipeline step required. The inline script reads from there directly.

## Localization

Two locales today (EN + ES). To add a third:

1. Record `<tier>.<lang>.mp3` for each tier you want voiced.
2. Confirm the lesson HTML's `<html lang>` value matches the lang
   suffix (the inline script reads `<html lang>` to pick the locale
   code — `es-US` and `es-MX` both resolve to `es`).
3. No code change needed — the inline script handles any locale
   that has a matching file on disk.
