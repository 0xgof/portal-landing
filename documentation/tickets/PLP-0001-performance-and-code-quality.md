# PLP-0001 - Portal Landing performance & code-quality pass

- Status: `IN PROGRESS` (created 2026-06-23; code fixes landed 2026-06-23 — see Implementation log)
- Stage: portal-landing / static site hardening
- Depends on: none (self-contained; static site, no build step)
- Goal: cut the page's asset payload from ~10 MB to under ~1 MB and remove the rough edges (doc drift, split state, layout-thrashing animation) **without changing the visual result** of either background layout (A/B) or the card-reveal animation, and **without adding a build step or any dependency**.
- Includes **dead-asset removal (§1)**, **conditional loading of layout-B-only resources (§2-4)**, and **maintainability fixes (§7-10)** that keep `js/script.js` `PORTAL_CONFIG` the single source of truth.

## Context

This is a dependency-free static page (`index.html` + `css/` + `js/`),
deployed by `git pull` on the EC2 box. There is no npm, bundler, or test
runner, so every fix must stay copy-deploy-able as-is.

The single biggest cost is `images/`: ~10 MB total, of which one 3.7 MB
file is referenced nowhere. The "SVGs" are base64-embedded rasters, which
is why a 3.4 MB `.svg` exists.

`js/script.js` defines `PORTAL_CONFIG` (`backgroundLayout`, the
`*ComingSoon` flags, `cardRevealAnimation`) and is meant to be the control
panel. Today the default is layout `B`, which **hides the hero title and
the SVG banner** and renders the Three.js shader instead — so several
assets/fonts that only layout A needs are still downloaded on the default
path.

State is currently split: the `coming-soon` class is hardcoded in
`index.html` **and** toggled at runtime from config, so config is not
actually the source of truth.

## Findings — defects, bugs & performance leaks

Catalogued from a read of `index.html`, `css/*`, `js/*`. Severity:
**[BUG]** wrong/latent-wrong behavior · **[PERF]** wasted work/bytes ·
**[A11Y/SEO]** · **[SMELL]** dead/redundant code.

### Latent correctness bugs

- **[BUG] `card-reveal-active` is never removed after the animation.**
  `js/card-reveal.js:111` adds it; phase 4 (`:217-228`) adds `card-revealed`
  but never removes `card-reveal-active`. Because of that the rule at
  `css/card-reveal.css:62-65` (`...card-reveal-active .portal-card.coming-soon::before/::after { display:none }`)
  stays active forever. **Consequence:** if `cardRevealAnimation` and either
  `*ComingSoon` flag are both enabled, the "Coming Soon" overlay is
  permanently hidden. It only escapes notice today because both flags are
  `false`. The card's own border/overlay (`:43-59`) are likewise permanently
  suppressed, leaving all final visuals dependent on the injected
  `.card-flip-back` — fragile.

- **[SMELL] Dead class op `cr-merged`.** `js/card-reveal.js:220`
  `portals.classList.remove('cr-merged')` removes a class that is never
  added anywhere and has no CSS rule (grep-confirmed). Leftover from a
  refactor; misleads readers into thinking a "merged" state exists.

- **[BUG] Blank-cards risk if the reveal script throws.** `js/script.js:21`
  sets `data-card-reveal="true"`, and `css/card-reveal.css:12-16` hides every
  `.portal-card` (`visibility:hidden`) while that attribute is present. The
  attribute is only cleared from inside `js/card-reveal.js`. If `runAnimation`
  throws before reaching a `removeAttribute` (e.g. during DOM
  construction at `:83-103`), the cards stay invisible permanently — a blank
  page with no fallback. The `setTimeout(startAnimation, 1200)` fallback
  (`:233`) guards a *late start*, not an *exception mid-run*. Add a
  try/finally (or a hard timeout that force-clears the attribute) so a script
  error degrades to visible cards.

- **[BUG] JS/CSS breakpoint mismatch for the reveal.** JS gates on
  `window.innerWidth < 900` (`js/card-reveal.js:10`) while CSS gates on
  `@media (max-width: 900px)` (`css/card-reveal.css:152`). `innerWidth`
  includes the scrollbar width, so at viewports right around 900px the two
  can disagree, leaving the cards in an inconsistent (hidden vs. fade-in)
  state. Use one source of truth (e.g. `matchMedia('(max-width:900px)')`).

### Performance leaks

- **[PERF] Three.js render loop never pauses.** `js/glass-shader.js:120-126`
  runs an unconditional `requestAnimationFrame` loop for a purely decorative
  background — full GPU/CPU work even when the tab is hidden or the shader is
  scrolled out of view. Gate on `document.hidden` / an
  `IntersectionObserver`, and stop the loop when off-screen.

- **[PERF] Shader sized once, before layout settles.**
  `js/glass-shader.js:8` reads `container.clientHeight` at init, but
  `.shader-bg` is `height:65%` of a body whose height grows as images/cards
  load. The only correction is a `window` `resize` listener
  (`:115-118`) — which does not fire on content reflow — so the canvas can be
  sized against a stale height. Recompute on load and via `ResizeObserver`.

- **[PERF] ~3.7 MB shipped for nothing.** `images/pendant.svg` is referenced
  nowhere (grep-confirmed). Pure dead payload. (See §1 of Work.)

- **[PERF] Layout-A assets loaded on the layout-B default path.**
  `STIX Two Math` (hero font) and `banner_image.svg` are fetched even though
  layout B hides the hero (`css/styles.css:84-86`) and the banner
  (`:74-76`). (See §2-3 of Work.)

- **[PERF] CSS `@import` waterfall.** `css/styles.css:2-3` chains the two
  component stylesheets via `@import`, forcing sequential downloads on the
  critical path. (See §5 of Work.)

### Accessibility / SEO

- **[A11Y/SEO] No heading on the default page.** The only `<h1>` lives in
  `.hero`, which is `display:none` in layout B (the default) — so the
  rendered page has no heading for screen readers or crawlers. Provide a
  visually-hidden `<h1>` that survives layout B.

- **[NOTE] Disabled-button handler is redundant for mouse only — keep it.**
  `js/script.js:38-44` attaches a `click`→`preventDefault` listener to
  `.portal-btn-disabled`, and `css/.../portal-btn.css:56-62` sets
  `pointer-events:none`. `pointer-events` only blocks pointer hit-testing, so a
  keyboard user who tabs to a disabled `<a href="#">` and presses Enter still
  fires a click that would jump to top — the JS handler prevents that. Not dead
  code; leave both in place. (Corrected during implementation.)

- **[SMELL] Card looks clickable but isn't (by mouse).**
  `.portal-card` has `cursor:pointer` (`components/cards/portal-card.css:20`)
  and Enter-key activation (`js/script.js:50-56`), but a mouse click on the
  card body (outside the button) does nothing. Either make the whole card a
  click target or drop the pointer cursor.

### Documentation

- **[BUG] Deploy-path drift.** `AGENT_GUIDE.md` (~lines 138/145/180) says
  `/var/www/landing/`; the correct path is **`/var/www/portal-landing/`**
  (per `README.md` and `deploy-landing.ps1`). Fix `AGENT_GUIDE.md`.

## Files

- `images/pendant.svg` — **delete.** 3.7 MB, referenced nowhere (confirmed via grep across html/css/js).
- `images/banner_image.svg`, `images/animation_banner_image.png`, `images/Gemini_Generated_Image_*.png` — re-export compressed; update the references in `css/styles.css:47`, `css/card-reveal.css:30,97`, `js/glass-shader.js:13`, `js/card-reveal.js:8` only if filenames change.
- `index.html` — load `STIX Two Math` and the Three.js importmap/CDN only when needed (layout B has no hero; layout A has no shader). Add SRI/`crossorigin` to any retained CDN resource. Replace CSS `@import` with `<link>` (or accept inline) to break the download waterfall.
- `css/styles.css` — drop the `@import` of the two component stylesheets if they move to `<link>`.
- `js/script.js` — make `coming-soon` driven entirely from `PORTAL_CONFIG` (remove the hardcoded class from `index.html`, or vice-versa — one source of truth).
- `js/card-reveal.js` — batch DOM reads before writes; collapse the three start triggers into one entry point; comment the timing/geometry constants.
- `AGENT_GUIDE.md` — fix the deploy path (`/var/www/landing/` → `/var/www/portal-landing/`) to match `README.md` and `deploy-landing.ps1`.

## Work

1. **Delete dead asset**: remove `images/pendant.svg` (3.7 MB, unreferenced). Verify with a repo-wide grep for `pendant` returning no hits afterward.
2. **Compress live images**: re-export `banner_image.svg` (true vector or compressed raster), `animation_banner_image.png`, and the shader PNG to WebP/AVIF or optimized PNG. Targets: SVG-banner < 300 KB, each PNG < 200 KB.
3. **Conditional fonts**: `STIX Two Math` is only used by `.hero-title`, which is `display:none` in layout B (the default). Load it only when `backgroundLayout === 'A'`, or drop it from the default critical path.
4. **Conditional Three.js**: the importmap + `unpkg` module are only needed for layout B. Gate the load behind the config check that already exists in `index.html`, and pin a local copy or add `integrity`/`crossorigin` if it stays on the CDN.
5. **Break the CSS waterfall**: replace the two `@import` lines in `css/styles.css` with `<link>` tags in `index.html` (parallel download) or concatenate.
6. **De-thrash the animation**: in `js/card-reveal.js`, group all layout reads (`offsetHeight`, `getBoundingClientRect`) ahead of the style writes within each phase so the browser reflows once per phase, not many times.
7. **Single start trigger**: collapse `Promise.all(...)`, `window load`, and `setTimeout(1200)` into one guarded entry point; keep the timeout only as an explicit fallback with a comment saying so.
8. **One source of truth for coming-soon**: drive the overlay entirely from `PORTAL_CONFIG`; remove the hardcoded `coming-soon` class from `index.html` so there is no pre-JS flash and no ambiguity.
9. **Document the animation**: add one-line comments for `T_EXPAND/T_CUT/T_SPLIT/T_FLIP/T_SETTLE`, `overhangX = 36`, and `scale(0.72)` explaining each phase/value.
10. **Fix doc drift**: correct the deploy path in `AGENT_GUIDE.md`.

## Non-goals

- Introducing npm/a bundler/a framework/a test runner. The site stays copy-deploy static.
- Adding any runtime dependency. Three.js stays the only third-party lib and is layout-B-only.
- Redesigning the page, cards, palette, or the card-reveal choreography. This is payload + plumbing, not a redesign.
- New portal features or wiring the Designer/Partner buttons to real destinations.

## Acceptance

- Total image payload drops from ~10 MB to under ~1 MB; `pendant.svg` is gone and grep for it returns nothing.
- The default path (layout B) downloads no font or asset it never renders (no `STIX Two Math`, no layout-A banner).
- Three.js loads only for layout B and either is local or carries an SRI hash.
- `css/styles.css` no longer chains stylesheets via `@import` on the critical path.
- `coming-soon` has exactly one source of truth (`PORTAL_CONFIG`); there is no overlay flash before JS runs.
- `AGENT_GUIDE.md`, `README.md`, and `deploy-landing.ps1` agree on `/var/www/portal-landing/`.
- No visual or behavioral regression in layout A, layout B, or the card-reveal animation.

## Definition of Done — coding rules & style (self-contained)

**Shortest working path — Ponytail ladder, in order:** (1) skip anything that does not need to exist; (2) prefer native platform features (plain HTML/CSS/DOM APIs, CSS custom properties, `<link rel=preload>`) over JS machinery; (3) **no new dependencies** and **no build step** — this site ships exactly what is in the repo; (4) prefer the smallest working diff; (5) add only the minimum code needed. No abstractions, scaffolding, or speculative future-proofing unless this ticket requires it. _This ticket:_ **reuse** the existing `PORTAL_CONFIG` gate and the existing CSS custom-property layout variables; do not introduce a new config layer or a JS templating helper.

**Do not simplify away** the layout-A/B switch, the card-reveal fallback trigger, accessibility (`alt`, keyboard nav, a reachable page heading), or `aria-disabled` on the inactive portal buttons. Removing assets must not remove the behavior that consumes them when its layout is active.

**Structure:** ≤ 700 lines per file; ≤ 3 levels of indirection (inline a helper rather than add a fourth hop). `js/card-reveal.js` is the one file at risk here — keep its phases flat.

**Function signatures — readable continuation, not vertical-per-arg.** First parameter on the signature line; wrapped parameters aligned under it; no formatter that rewrites signatures (no Prettier/Black on these files). Keep the existing vanilla-JS style; do not convert to arrow-everything or add a transpile target.

**Returns — assign non-trivial expressions to a named local first** (no complex arithmetic / DOM construction / object building inside `return`; simple `return;` / `return value;` / `return false;` are fine).

```js
var bgWidth = (3 * cardW) + (2 * overhangX);
return bgWidth;
```

**Tests:** there is no test runner; the equivalent here is a **manual verification checklist** (see Test Gate) that fails visibly if a change breaks. Add no framework to satisfy this.

**Report on completion (short):** implemented · assumptions/deviations · skipped work · when to add it.

## Test Gate

No automated runner exists. Verify locally and record the result:

```powershell
cd c:\AWS\dreamdo\portal-landing
python -m http.server 8080
```

Checks to perform (each must pass for both relevant layouts):

- With `backgroundLayout: "B"` (default): page renders the shader background; **no** request for `STIX Two Math` or the layout-A banner in DevTools Network; Three.js loads (local or with SRI); total transferred ≪ previous baseline.
- With `backgroundLayout: "A"`: hero title renders in `STIX Two Math`; SVG banner shows; **no** Three.js or shader PNG requested.
- Card-reveal animation runs once and settles identically to before (no double-trigger, no end flicker) at ≥ 900 px width; is skipped < 900 px as today.
- `coming-soon` overlay state matches `PORTAL_CONFIG` with no flash on load; toggling the flag flips the overlay with no `index.html` edit.
- Repo-wide grep for `pendant` returns zero hits; `images/` total under ~1 MB.
- Deploy path identical across `README.md`, `AGENT_GUIDE.md`, `deploy-landing.ps1`.

## Implementation log (2026-06-23)

Code-only changes landed; all three JS files pass `node --check`.

**Done (no new deps, no build step):**

- §1 Deleted `images/pendant.svg` (−3.7 MB). `images/` now ~6.26 MB (was ~10 MB).
- §3 `STIX Two Math` removed from the static `<head>`; `js/script.js` injects it only when `backgroundLayout === 'A'`. Default (B) path no longer fetches it.
- §4 Three.js already gated to layout B via the existing dynamic `import()` in `index.html` — left as-is (see Deferred for SRI/local-pin).
- §5 Replaced the two `@import`s in `css/styles.css` with `<link>`s in `index.html` (order preserved: card → btn → styles → card-reveal).
- §7 `js/card-reveal.js`: added an 8 s failsafe in `startAnimation` that force-clears `data-card-reveal`, so an exception anywhere in the animation degrades to visible cards instead of a blank page. (Kept the three resilience triggers; intent now commented.)
- §8 Removed the hardcoded `coming-soon` class from both cards in `index.html`; `PORTAL_CONFIG` is now the sole source of truth (the existing runtime toggle still applies it). No pre-JS overlay flash.
- §9 Commented the phase constants (`T_*`), `overhangX`, and the `scale(0.72)` start scale.
- §10 `AGENT_GUIDE.md` deploy path corrected to `/var/www/portal-landing/` (6 occurrences) — now matches `README.md` + `deploy-landing.ps1`.
- Breakpoint bug: `js/card-reveal.js` now gates on `matchMedia('(max-width:900px)')`, matching the CSS exactly (was `innerWidth < 900`).
- Dead code: removed the no-op `classList.remove('cr-merged')` (class was never added).
- Perf (shader): `js/glass-shader.js` now pauses the RAF loop on `visibilitychange`/off-screen via `IntersectionObserver`, and re-syncs canvas size on `load` + `ResizeObserver` (not just `window resize`).
- A11Y/SEO: added an always-present visually-hidden `<h1>` (+ `.sr-only` util in `css/styles.css`); the visual hero is now a decorative `<p aria-hidden>` so layout B still has a heading.
- Corrected the earlier "[SMELL] dead disabled-button handler" finding — it guards keyboard activation and was kept.

**Deferred (with reason):**

- **Image compression** (§2 — banner SVG + two 1.5 MB PNGs). No image tooling installed (`magick`/`cwebp`/`pngquant` absent) and the ticket forbids new deps. The "under ~1 MB" acceptance criterion can't be met this pass; needs an offline re-export (WebP/AVIF) or a one-off tool. Biggest remaining win.
- **Three.js SRI / local pin** (§4). importmap-based ESM doesn't carry `integrity` portably; pinning would mean vendoring ~600 KB into the repo. Deferred pending a decision on vendoring vs. CDN.
- **`coming-soon` hidden during/after reveal.** `card-reveal-active` is intentionally never torn down (it prevents end-flicker), so `css/card-reveal.css:62-65` keeps the overlay hidden whenever the reveal runs. Reveal (layout B) and coming-soon are mutually exclusive in practice; a real fix means rendering the overlay on the `.card-flip-back` face. Deferred to avoid regressing the settle animation. Latent only — both flags are currently `false`.
- **Aggressive de-thrash of the reveal's internal reads/writes.** The phase code is pixel-tuned; reordering risks the animation. Left intact beyond the failsafe + comments.
- **Whole-card click target** (mouse). UX nicety, not a defect; unchanged.
