# Wedding Invitation Prototype — Project Log

## Standing Instructions

These apply to every Claude working on this project, every time, without needing
to be asked again:

- **Keep this file updated as part of every task**, not only when asked — each
  change (design pass, bug fix, feature addition, revert, etc.) gets its own entry,
  grouped by topic rather than strict chronological order (see the note below).
- **Monitor how long and complex the conversation is getting, and proactively
  suggest a fresh chat when it's time — don't wait to be asked.** Concrete signals
  to watch for, not just a gut feeling:
  - 3+ rounds of edits to the same large files (`index.html`, `styles.css`,
    `script.js`) in one conversation — each edit means the full file effectively
    gets carried forward on every turn after that.
  - Roughly 15–20+ back-and-forth exchanges since the last time fresh files were
    uploaded.
  - The conversation has drifted across several unrelated topics (e.g. a design
    change, then a backend change, then something unrelated) rather than staying
    focused on one task.
  When any of these is true, say so directly — e.g. "this conversation has gotten
  long enough that a fresh chat would be more efficient — want to start one and
  re-upload the current files plus this log?" If the person keeps going anyway,
  it's fine to raise it again once another threshold is crossed. Be upfront that
  this is a heuristic based on visible signals (edit rounds, exchange count), not
  a precise internal measurement of processing cost.
- **When picking up this project in a new chat**, all 5 files (`index.html`,
  `styles.css`, `script.js`, `Code.gs`, this log) together are the right and
  sufficient starting point — the log gives the reasoning behind decisions, the
  files give the exact current code. Neither substitutes for the other.

A record of what we've built and why, grouped by topic rather than strict chronological
order — so "why does the RSVP toggle default to declined" and "why is search a network
call now" live together, even if weeks apart in the actual conversation. Within each
section, entries still run oldest → newest, so you can follow how that one piece evolved.

---

## Envelope & Opening

The opening moment went through several redesigns before landing on its current form:

- **First attempt** tried a "the letter itself grows to fill the screen" morph — a
  single card element measured via JS and animated from "peeking out of the envelope"
  to full-viewport. Looked broken in practice, so it was **reverted** to a simpler
  two-scene approach: tap the seal → flap animation → swap to the RSVP card.
- **Redesigned as a flat SVG envelope** (rounded rect, diagonal flap-fold lines, circular
  monogram seal reading "A & P") over a full-bleed photo placeholder, with a script
  "You are invited..." heading and "Click envelope to unseal" caption — far more
  reliable to render correctly than the earlier CSS 3D-transform version.
- **Real monogram artwork added**: the seal's placeholder text became an actual image
  (`assets/photos/monogram.png`), clipped to a circle so it sits inside the seal's
  border ring. Went through one follow-up fix — the monogram was recolored to white,
  which made it invisible against the seal's light backdrop, so the backdrop was
  reverted to transparent (letting the navy gradient show through) and the image was
  sized up (clip radius 23→26, image box 54×54→70×70) since it read too small either way.
- Couple name updated to **Arvin & Precious** partway through this process (was a
  placeholder before that).

---

## The Board (scrapbook page) & Entourage

The page revealed after unsealing the envelope, and the "Entourage" sub-page within it:

- Replaced a plain single RSVP card with a **scrapbook-style board**: a title plaque,
  a grid of "sticker" cards (photo placeholders, a date/venue badge with a working
  Google Maps link, "The Entourage" / "The Details" / "FAQs" badges, an "Our love
  story" heart badge, a few original SVG decorative illustrations in blue tones), and
  an "RSVP here" plaque anchoring the bottom.
- Went through a **design accuracy pass** afterward: switched from column-masonry to a
  proper CSS grid, gave the title plaque an arch/signboard silhouette with flourish
  ornaments, restyled the neutral badges as cream/gold-bordered stickers, added an
  ornate ringed border to the oval photo and a dashed "stamp" border to the square
  photo, restyled "RSVP here" as a two-line stacked sign with a hanging key charm, and
  let decorative pieces overlap their neighbors slightly for a more organic feel.
  Honest caveat that's stayed true throughout: none of this has been visually rendered
  on my end before being sent over — it's all read-the-code-and-compare-to-screenshots,
  not pixel-verified.
- **"The Entourage" badge is now clickable**, opening a full-screen overlay
  (`#entourageOverlay`) with the traditional roles laid out in cream pill-shaped
  fields under script-font labels, closeable via an X button or a "Return to the
  main page" link: Parents of the Groom/Bride, Principal Sponsors (Male/Female),
  Officiant, Best Man, Maid of Honor, then a "Secondary Sponsors" heading over
  Veil/Cord/Candle, Bible Bearer/Coin Bearer/Ring Bearer, and finally Bridesmaids/
  Groomsmen.
- **Made data-driven via a new Google Sheet tab, "Entourage"** — same one-row-per-
  person philosophy as the Guests sheet, just with `Role | Name | Order` columns
  instead of `Guest ID | Guest Name | RSVP...`. `Order` controls display sequence
  within a role (useful for sponsor pairs); rows are grouped and sorted client-side.
  This replaced the earlier version's hardcoded fixed pill counts (5 Bridesmaids,
  2 Veil, etc.) entirely — the number of pills under each role now comes straight
  from however many rows exist for it in the Sheet, so adding or removing a person
  never touches code again, just the Sheet.
  - `Code.gs` gained `?action=entourage`, openly accessible (unlike `?action=list`
    — entourage info is meant to be public, it's the whole point of the page) but
    still passing through the same rate limiter as everything else.
  - The **Role column's text must exactly match** one of these (case-insensitive):
    `Parents of the Groom`, `Parents of the Bride`, `Principal Sponsor Male`,
    `Principal Sponsor Female`, `Officiant`, `Best Man`, `Maid of Honor`, `Veil`,
    `Cord`, `Candle`, `Bible Bearer`, `Coin Bearer`, `Ring Bearer`, `Bridesmaid`,
    `Groomsman` — a row with anything else in that column is silently skipped
    (mapping lives in `script.js`'s `ENTOURAGE_ROLE_MAP`).
  - Data loads once per page visit, the first time the overlay is opened (not
    preloaded at page load) — a role with zero matching rows still shows one
    empty pill so the layout doesn't collapse, and a failed fetch shows the same
    honest "couldn't connect, try again" pattern used elsewhere on the site,
    rather than silently leaving things blank with no explanation.
  - **Trimmed to only the roles actually wanted**, shortly after the Sheet-driven
    version above was built: Parents of the Groom/Bride, Officiant, and the three
    Bearer roles (Bible/Coin/Ring) were removed entirely — they'd been included
    based on the reference screenshots, but weren't part of the actual role list.
    What's left, in order: Best Man/Maid of Honor, a "Primary Principal" section
    (the old Male/Female-split Principal Sponsors columns were consolidated into
    one unified name list, no gender split), a "Secondary Principal" section
    (renamed from "Secondary Sponsors") covering Veil/Cord/Candle, and
    Bridesmaids/Groomsmen.
  - **Parents of the Groom/Bride and the three Bearer roles restored** shortly
    after — turned out only Officiant was meant to stay cut, not those four.
    Parents now sits at the very top of the overlay (matching the reference
    layout); Bible Bearer pairs with Candle and Coin Bearer pairs with Ring
    Bearer, both still under the "Secondary Principal" section rather than a
    new heading of their own. Current valid Role values in the Sheet:
    `Parents of the Groom`, `Parents of the Bride`, `Primary Principal`,
    `Best Man`, `Maid of Honor`, `Veil`, `Cord`, `Candle`, `Bible Bearer`,
    `Coin Bearer`, `Ring Bearer`, `Bridesmaid`, `Groomsman`.
  - **Fixed a genuine layout gap, not just a naming detail**: any role with more
    than one person (Bridesmaids, Groomsmen, or a multi-person Sponsor entry) was
    stacking in a single vertical column instead of the 2-across layout intended.
    Switched `.ent-pill-group` from a flex column to a CSS grid (`repeat(2, 1fr)`),
    which fills left-to-right then wraps to the next row by default — exactly the
    "left to right, top to bottom" order that was asked for. A role with only one
    person still spans the full width instead of sitting oddly in half the space
    (via `:only-child` targeting in CSS, no JS needed). **Refined immediately
    after**: this 2-column treatment turned out to only really apply to Primary
    Principal — Bridesmaids and Groomsmen already sit in their own separate
    left/right columns at the outer grid level, so splitting their names into a
    further 2 columns inside each of those was over-narrowing them. They're back
    to single-column stacking (`.ent-pill-group-single`), while Primary Principal
    keeps the 2-column grid and picked up one more refinement: when its count is
    odd, the last (unpaired) entry now centers itself at the bottom, matching the
    width of a normal paired pill, via a pure-CSS `:last-child:nth-child(odd)`
    selector — no JS needed to detect "is this the odd one out."
- **"The Details" badge is now clickable too**, same pattern as Entourage: a
  full-screen overlay (`#detailsOverlay`) reusing the exact same overlay chrome
  (background dim, white rounded panel, X close button, "Return to the main
  page" link) — which is why that chrome got pulled out into shared `.info-*`
  classes (`.info-overlay`/`.info-panel`/`.info-close`/`.info-inner`/
  `.info-title`/`.info-return`) instead of being copy-pasted a second time
  under entourage-specific names. The date/venue/map card that used to sit
  directly on the board (`.badge-blob`) is gone — that content now lives
  inside this overlay as a vertical schedule timeline (`.detail-timeline`):
  each event gets a marker dot connected by a line to the next one, plus its
  own label ("Wedding Ceremony"), date/time, venue name, and a "View on map"
  link. Only one event exists right now (using the same December 8 / Villa by
  the Bay data the old card had), but the markup's built so a second
  `.detail-event` block (reception, after-party, etc.) can just be copied in —
  the connecting line and spacing handle any number of them automatically.
  Unlike Entourage, this isn't Sheet-driven — it's static HTML, same as the
  rest of the board's badges, since schedule details change far less often
  than a guest/entourage list and didn't seem worth a second Sheet tab.
- **Added the calendar + live countdown** from the reference video, sitting
  above the schedule timeline inside the Details overlay: a small month-grid
  calendar with the wedding day circled, and a Days/Hours/Min/Sec countdown
  that ticks live. The calendar is generated in JS from a single
  `WEDDING_DATE` constant (not hand-typed cell-by-cell), so it'll lay out
  correctly for whatever month/year that date is ever changed to. The
  countdown only actually runs (via `setInterval`) while the Details overlay
  is open — starts when it's opened, gets cleared when closed — rather than
  ticking in the background for a hidden panel nobody's looking at.
  - Sized up shortly after — it read too small even on mobile. Calendar
    max-width 280→340px with bigger month label, day-cell, and weekday
    text; countdown numbers grew from a `clamp(24px, 6vw, 32px)` cap to
    `clamp(32px, 10vw, 46px)`, with more breathing room between the four
    units.
  - That fixed a flat size for every screen — still looked small on a
    laptop even though it now looked right on mobile, since a laptop's
    `.info-panel` renders at 640-760px versus a phone's ~340-380px, and
    nothing was scaling to that difference. Switched to the same
    container-query approach used for the masonry cards: `.info-panel`
    is now an `inline-size` container, and an `@container (min-width:
    560px)` rule grows the calendar (max-width 340→460px, bigger month
    label/day cells) and countdown (58px numbers, wider gaps) once the
    panel itself actually has that much room — genuinely tied to the
    rendered panel size on that specific device, not a single guessed
    value applied to everyone.
- **Real ceremony/reception info replaces the old placeholder venue**: the
  single "Villa by the Bay" entry is now two events — Ceremony at Our Lady of
  the Assumption Parish (2:30 PM) and Reception at Socorro's The Venue
  (4:30 PM), both December 8, 2026 — each with its own map link. This is also
  the countdown's actual target time (ceremony start).
  - Both map links were swapped again shortly after from generic
    "search by name" Google Maps URLs to the exact `maps.app.goo.gl` share
    links provided for each venue — more reliable than a name search, which
    can occasionally land on a same-named place elsewhere.
- **Title plaque had two small but visible bugs, fixed together**: `.plaque-title`
  never actually had `text-align: center` set (every other card on the board does,
  via the shared `.card` class, but the title plaque uses its own `.plaque`/
  `.plaque-title` classes which never picked that up) — so the flourishes, the
  "Join us for the wedding of" line, and the "Arvin & Precious" names were all
  quietly defaulting to left-aligned instead of centered inside the plaque. At the
  same time, "Join us" had been split into its own `.eyebrow-emphasis` span sized
  at 1.6em while the rest of the line ("for the wedding of") sat at a much smaller
  11px, which read as an odd, unintentional-looking size mismatch rather than a
  clean "slightly bigger" eyebrow line. Fixed both: added `text-align: center` to
  `.plaque-title`, dropped the split-emphasis span, and bumped the whole eyebrow
  line uniformly to 13px instead.
  - **Reinstated shortly after**: the uniform-size version wasn't actually wanted —
    "Join us" is back to standing out via `.eyebrow-emphasis` at 1.6em, now sitting
    correctly centered since the `.plaque-title` fix above already covers it.
- **Two compounding entourage-overlay layout bugs, found from real device
  screenshots (iPhone + Samsung) rather than guessed from code**:
  - A `@media (max-width: 400px)` rule was collapsing `.entourage-grid` down to a
    single column on narrow phones — meaning every paired role (Bridesmaids/
    Groomsmen, Best Man/Maid of Honor, Parents of the Groom/Bride, etc.) stacked
    vertically instead of sitting side-by-side, which defeats the point of pairing
    them at all. Removed the override; the two-column layout is now unconditional.
  - Separately, roles that can hold more than one person (Veil, Cord, Candle,
    Bible/Coin/Ring Bearer) had `.ent-pill-group` set to its own internal
    `repeat(2, 1fr)` grid — meaning a role already sitting in a half-width outer
    column was being quartered again inside that half, on top of removing the
    mobile-collapse above this made already-tight columns even tighter. That's
    what was fracturing names mid-word ("Crispo" / "nde" on separate lines) in the
    Samsung screenshot. `.ent-pill-group` now stacks its pills in a single column
    by default — matching what Bridesmaids/Groomsmen already did via the (now-
    redundant and removed) `.ent-pill-group-single` modifier — while Primary
    Principal keeps its own explicit 2-column grid via `.ent-pill-group-primary`,
    since that section spans the *full* overlay width rather than a quartered half
    and was always meant to show sponsor pairs 2-across.
  - Also noticed in the Samsung screenshot: the "Tap for music" hint bubble was
    rendering on top of the entourage overlay (it sits at `z-index: 200`, above the
    overlay's `z-index: 90`), obscuring the "Parents of the Bride" heading. The
    hint already dismissed itself on its own tap; it now also dismisses the moment
    either the Entourage or Details overlay opens, so it can't float over content
    the guest hasn't interacted with it to trigger.
  - **Follow-up**: hiding the hint text wasn't enough — the music disc *button*
    itself was still `z-index: 200`, above every overlay (`.info-overlay` at 90,
    `.thankYouOverlay` at 100), and it sits at the exact same fixed `top:16px;
    right:16px` corner where `.info-close` renders. On phones, where the panel is
    close to full width, that put the disc directly on top of the close button,
    blocking taps on it. Dropped both `.music-disc` and `.music-hint` to
    `z-index: 50` — below every overlay — so opening Details, Entourage, or the
    Thank You screen now correctly covers the disc instead of floating above it.
- **Entourage reordered to match a reference template the couple shared** (a
  "Sage Green Wedding Invitation" layout). New order: Parents of the Groom/Bride
  → **Principal Sponsor** (moved earlier, above Best Man/Maid of Honor — it used
  to come after) → Best Man/Maid of Honor → **Secondary Sponsors** (renamed from
  "Secondary Principal" to match the template's heading): Candle/Veil paired
  (was Veil/Cord before) → Cord on its own full-width row → Groomsmen/Bridesmaids
  (order flipped — Groomsmen now left, Bridesmaids right) → Ring Bearer/Coin
  Bearer (order flipped to Ring-then-Coin) → Bible Bearer on its own full-width
  row → **Flower Girls, a brand new role** (2-column grid like Primary Principal,
  since the template shows 4 names in a 2×2 layout). Added a small italic
  `.ent-tagline` caption above each secondary-sponsor role/pair ("To light our
  path", "To clothe us as one", "To bind us together", "To guide us in our way",
  "To carry our symbol of Love, Treasure and Faith") to match the template's
  captions, styled to fit the site's own look rather than copying the template's
  fonts/colors directly.
  - **Found and fixed while doing this**: `ENTOURAGE_ROLE_MAP` in `script.js` was
    missing entries for Parents of the Groom, Parents of the Bride, Coin Bearer,
    Ring Bearer, and Bible Bearer — those five containers have existed in the HTML
    for a while, but with no matching map entry, anyone entered under those exact
    role names in the Entourage sheet tab would silently fail to render. All five
    are now mapped, alongside the new `"flower girl"` entry.
  - To use the new Flower Girls section, add rows to the **Entourage** sheet tab
    with role exactly `Flower Girl` (case-insensitive), same as any other role.
  - **Follow-up**: Parents of the Groom/Bride were still side-by-side as two
    columns. Changed to stack vertically instead — Groom's parents on top,
    Bride's parents below — each now taking the full width and using the same
    2-column pill treatment as Primary Principal, so Father/Mother still sit
    next to each other within their own row once names are entered.

- **Fixed entourage ordering and styling**: Reordered Ring Bearer, Coin Bearer, Bible Bearer, and Flower Girls to appear before Groomsmen and Bridesmen as requested. Added missing `.ent-tagline` elements for Bible Bearer ("To carry the Word of God") and Flower Girls ("To scatter blessings along our path") to ensure proper visual consistency with the existing entourage section styling.
- **Fixed Principal Sponsor ent-label**: Added missing ent-label element for Principal Sponsor section to maintain consistent entourage section structure (ent-tagline + ent-label + container pattern).
- **Replaced map functionality with click-to-enlarge images**: Removed OpenStreetMap iframe implementation and replaced with static images that enlarge when clicked, providing a simpler, more reliable venue visualization approach.
- **Enhanced click-outside-to-close behavior**: Overlays (entourage, details, thank you) and image enlargements now close when clicking outside their boundaries, in addition to the existing close buttons and return links.
- **Fixed URL hash state preservation**: Corrected timing issues in the URL hash system to ensure proper overlay state preservation through page refreshes using URL hashtags (#entourage, #details). When refreshing from an overlay view, users now see the main board content immediately (skipping the envelope animation) rather than returning to the initial envelope/letter view.

---

## RSVP Flow — data model, search, and submission

This is the part that changed shape the most over the course of the project.

**Original design → real spec.** The prototype started out modeling guests as
*parties* (e.g. "Kimi Czar" bringing a household of 4, one shared seat count, a toggle
per member). A backend spec you'd had summarized (Google Sheets schema: `Guest ID |
Guest Name | RSVP | Response Time | Note`) made clear the real model is **one row = one
person = one toggle**, no groups, no seats, no +1s — a genuine data-model change, not
just a backend detail, so it was flagged and confirmed before rebuilding rather than
guessed at.

**What replaced the party model:**
- Search returns exactly one best match (exact name match preferred, otherwise "name
  contains query"), never a full list.
- Alongside that match, a separate **"Others named [Surname]" dropdown** reveals any
  other guests sharing that surname — covering both "a sibling checking whether their
  sibling is coming too" and "two unrelated guests who happen to share a surname,"
  without ever auto-bundling them into one invitation. Opening the dropdown doesn't
  opt anyone in; a relative's row only joins the submission once *their own* toggle is
  actually switched. Long same-surname lists reveal in batches of 5 ("Show all" / "Show
  5 more"), re-offering the choice until everyone's visible.
- Surname matching is **suffix-aware** — a shared `parseName()`/`surnameOf()` helper
  recognizes Jr., Sr., and roman numerals I–VIII (case-insensitively, with or without a
  trailing period) so "Brandon Marson Jr." groups on "Marson," not "Jr."
- Toggle defaults to **declined** unless a guest's stored status is already
  "Attending" (so re-searching shows their last answer, not a reset). Re-submitting
  after already responding is fully allowed — no read-only lock.
- The invite row itself is laid out horizontally (name left, toggle right), and every
  relative row revealed under it reuses that same row style.

**Confirmation.** Went through a couple of revisions: briefly listed every submitted
person's individual response, then settled on always showing one plain message —
"Your response has been received," followed by "We can't wait to celebrate with you!"
unless *everyone* in that submission declined, in which case a softer "We'll miss you,
but thank you for letting us know." No names, no per-person listing, regardless of how
many people (main guest + any touched relatives) were part of that Confirm. This now
lives in a full-screen popup modal (`#thankYouOverlay`) instead of revealing inline in
the RSVP card.

**Connection handling.** Originally, if the Sheet couldn't be reached, search and RSVP
submission quietly fell back to small local mock data — functional, but silent about
the fact that nothing real was happening. Removed that fallback entirely: both search
and Confirm now show an honest **"We couldn't connect to the server. Please try again
in a moment"** message if the request fails, rather than pretending to work offline.

**Two small things worth knowing about how search behaves, from your own testing:**
- The 350ms pause before a search fires is intentional (debouncing — search once you
  stop typing, not on every keystroke), not lag.
- A single-letter search is technically possible right now (nothing blocks it) — it'll
  usually just match whatever name happens to contain that letter first. Flagged as a
  small loose end (worth a minimum search length) but not yet changed.

**A layout fix, not a logic bug:** you asked about a 3-word name only showing 2 words.
The search/matching code was checked and confirmed to work on names of any length —
nothing in it assumes exactly 2 words. As a precaution, `.person-row` was still given
`flex-wrap` and `.person-name` got `overflow-wrap: anywhere` so a long name is
guaranteed to wrap onto a second line rather than risk looking cramped next to its
toggle. (If what was actually cut off was inside Google Sheets itself rather than the
site, that's a separate, simpler thing — Sheets visually truncates a cell's display
when the column's too narrow and the next cell has content, but the full text is still
safely stored underneath.)

---

## Backend — Google Sheets + Apps Script

- **`Code.gs` built**: `doGet(e)` handles actions via query string (plain GET, so
  browsers never hit a CORS preflight). Originally: `?action=list` (read every row,
  return `{ id, name, status }` for each — `Note` deliberately excluded, manual-only)
  and `?action=rsvp&id=...&status=...` (set that row's `RSVP` column and stamp
  `Response Time`). `SHEET_NAME` constant at the top must match the actual tab name.
- **Connected**: your deployed Web App URL is set directly as `APPS_SCRIPT_URL` in
  `script.js` — no manual paste-in needed.
- **Abuse hardening, round one**: a per-guest write cooldown (`RSVP_COOLDOWN_SECONDS`,
  3s) so one row can't be spammed, and stricter Guest ID format validation
  (`GUEST_ID_PATTERN`, must look like `G001`). Explicitly did **not** add a shared
  secret key embedded in `script.js` at this stage — flagged as false security, since
  anyone who can see the deployed site's source can see an embedded "secret" too.
  Also flagged but left unfixed at the time: `?action=list` returned every guest's
  name and RSVP status to anyone who called it directly, not just site visitors — a
  real privacy exposure, not just a spam risk.

- **Security pass, done properly.** You asked to "hash" the Apps Script URL — worth
  being direct about why that doesn't work: the browser has to know the real,
  plaintext URL to call it, so anyone can see the exact request in dev tools' Network
  tab no matter how the source stores it. Not a hashing problem, not fixable
  client-side. What *was* fixable was the real vulnerability above:
  - `?action=list`'s public full-roster dump is gone. `?action=search&q=...` replaces
    it — the exact same `parseName()`/`surnameOf()` matching logic now lives in
    `Code.gs` too, so the server does the search itself and only ever returns the one
    matched guest plus their same-surname `similar` list, never the whole sheet.
  - `?action=list` still exists, but now requires a private `ADMIN_KEY` query
    parameter set only in `Code.gs` (never shipped to `script.js` or the public site)
    — lets you personally pull the full list without leaving it open to everyone else.
    **The placeholder must be changed to your own random string** before this does
    anything; it deliberately refuses to work while the placeholder is still in place.
    Usage: change `ADMIN_KEY` in `Code.gs`, redeploy (Deploy → Manage deployments →
    edit → New version → Deploy — the URL itself doesn't change), then visit
    `.../exec?action=list&key=yourkeyhere` to see the raw guest data.
  - `updateRsvp()` now requires the Guest ID **and** the guest's exact name to match
    the same row, not just the ID — raises the bar against blindly guessing sequential
    IDs (G001, G002...) to mess with responses that aren't yours to touch.
  - Added a basic **global** rate limit (60 requests/60 seconds across all visitors
    combined, via `CacheService`) — Apps Script doesn't expose caller IPs to `doGet()`,
    so this can't be a precise per-visitor limit, just a blunt shared counter sized
    well above normal wedding-site traffic.
  - `script.js` no longer downloads the full guest list on page load at all
    (`GUEST_LIST` → `MOCK_GUEST_LIST`, now only an offline-preview fallback, since
    removed entirely — see the Connection handling note above); `findGuest()` calls
    `?action=search` directly, and `handleLookup()` picked up a small request-id guard
    so a slow, stale search response can't overwrite a newer one if someone types fast.
  - **Disclosed limitation, not oversold as airtight**: the search endpoint still
    returns one real match per query, so a very patient attacker trying many short
    substrings could still slowly reconstruct names over time — inherent to any
    public, login-free "search your own name" pattern. What changed is the *cost*:
    one click to dump everyone, versus a slow, rate-limited, one-name-at-a-time grind.

- **Latency fix — RSVP search and Entourage overlay both felt like a "few seconds"
  in a bad way.** Root cause was `Code.gs` re-reading the whole Sheet from scratch on
  every single request, with no feedback shown client-side while that happens. Fixed
  both ends:
  - `Code.gs`: `getAllGuestRows()` and `listEntourage()` now cache their results in
    `CacheService` (guest rows: 30s TTL; entourage: 300s TTL, since it changes far less
    often). `updateRsvp()` explicitly invalidates the guest cache on a successful write
    so a guest's own RSVP shows up immediately rather than waiting out the TTL.
  - `script.js`: `handleLookup()` now shows a "Searching…" status the instant a lookup
    starts, instead of leaving the status blank during the network round trip.
    `loadEntourage()` is now also fired once in the background right after the page
    loads (in addition to its existing on-click call, which it still guards against
    double-fetching) — the goal is that by the time someone actually taps into the
    entourage overlay, the data is usually already sitting there ready, and the
    Apps Script backend has had a chance to shake off any cold-start delay before
    they notice it.

---

## Accessibility & Design System

A pass using the `ui-ux-pro-max` design skill against the built site. It had no
blue-specific wedding palette (its match defaulted to pink/gold), so the existing
navy/baby-blue system was kept rather than force a mismatched palette — but it caught
several concrete, fixable issues:

- **Emoji as structural icons** (key, play button, heart) — replaced with inline SVG
  icons; emoji are font-dependent and render inconsistently across platforms.
- **Touch target size** — the RSVP toggle switches were 42×24px, under the 44×44
  minimum. Fixed by expanding the invisible hit area to 44×44 without changing how the
  switch actually looks.
- **Missing accessible names** — toggle checkboxes had no label of their own (relied
  on nearby visible text, which screen readers don't associate automatically). Added
  `aria-label="{name} attending"` to each one, plus `aria-live="polite"` on the
  name-lookup status so "Invitation found..." gets announced automatically.
- **Typography** — swapped the script font from Alex Brush to **Great Vibes**, the
  tool's actual matched font for wedding invitations (paired with the existing
  Cormorant family).

**Responsive scaling on tablet/desktop.** The whole board (title plaque, photo
collage, RSVP card) was hard-capped at `max-width: 760px`, with only one other
breakpoint in the entire stylesheet (masonry going 2→3 columns at 620px) — past
that, nothing scaled further no matter how wide the screen got, so on a laptop
or tablet the page just sat as a narrow phone-width column with dead space on
both sides. Added breakpoints at 700px and 1100px: the board's showcase content
(title plaque, photo collage) now grows to 900px then 1080px max-width, the
masonry grid gains a 4th column at 1100px+, and the hero envelope grows from
its 300px cap up to 440px on desktop instead of staying phone-sized. The RSVP
card, title plaque, and entourage panel each kept their own tighter width caps
(520px, 640px, 640→760px) so they scale up modestly without turning into
oversized, awkward-to-read forms — only the actual showcase/collage content
stretches to fill the extra space.

**"Join us" emphasized in the title plaque.** The eyebrow line above the couple's
names ("Join us for the wedding of") now wraps "Join us" in its own span
(`.eyebrow-emphasis`) sized larger (1.6em) than the rest of the eyebrow text,
so it reads as the lead-in phrase rather than being uniform with "for the
wedding of".

**"Others named ___" similar-guests feature removed from RSVP search**, along
with all its supporting code: the toggle button and expandable row list in
`index.html`, the `.similar-toggle`/`.similar-rows`/`.reveal-more` CSS, and
`script.js`'s `parseName`/`surnameOf` helpers, `populateSimilar`/`resetSimilar`/
`buildPersonRow`/`renderSimilarRows`, and the extra-submissions logic in the
confirm handler (`touchedIds`/`rowInputs`). `findGuest`/`handleLookup` now only
track the single matched guest; confirming submits just that one RSVP.
`Code.gs`'s `searchGuests` still computes and returns a `similar` list — left
alone since nothing asked for a backend change, and the frontend now simply
ignores that field.

**Minimum search-length guard added** (closing the item that had been flagged
but not yet implemented): a debounced/typed lookup now only fires once the
query is 4+ characters, unless the input already contains more than one word
(e.g. "Al Reyes"), where the first name is clearly finished even though it's
short. A bare short name typed alone (e.g. just "Al", with no last name) won't
auto-search until the guest presses Enter — pressing Enter always searches
immediately regardless of length, since that's an explicit, unambiguous
signal that the input is complete. There's no way to know client-side that a
short typed name is actually a guest's *complete* first name rather than a
first few letters of a longer one, so this is a heuristic based on visible
typing signals, not a guarantee.

**Followed up with CSS Container Queries instead of adopting a framework.**
You asked whether something better than Bootstrap exists for responsive design —
researched it rather than guessing: Bootstrap is a poor fit here since it's an
opinionated component library (its own grid/cards/buttons), and this site is
the opposite of that — bespoke arch plaques, blob badges, tilted cards, an SVG
seal — adopting it would mean overriding its defaults constantly. Tailwind CSS
is 2026's most-recommended alternative for custom designs, but for a one-page
static site with no build tooling, it wouldn't have done much beyond renaming
the breakpoints from the previous fix. The actual best fit: **CSS container
queries**, now safe to use without fallbacks across all major browsers (support
since 2023) and described as the biggest responsive-design change since CSS
Grid, since they let an element respond to the width it actually renders at,
not the viewport — no dependency, no build step needed. Each `.card` is now its
own container (`container-type: inline-size`); badge text (`.badge-label`,
`.badge-date`, `.badge-venue`, `.badge-script`) scales up via `@container`
rules keyed to the card's real rendered width, so the same badge automatically
reads correctly whether the masonry grid put it in a 2-column phone layout or
a 4-column desktop one — complementing, not replacing, the page-level media
queries above (those two tools solve different problems: media queries for
overall page structure, container queries for how a component uses whatever
space it ends up with).

---

## Project Structure & Files

- **Split into three files** (`index.html`, `styles.css`, `script.js`) instead of one
  monolithic HTML file, for a cleaner file structure — they need to stay in the same
  folder, since `index.html` links to the other two by filename.
- **All code comments removed** from `index.html`, `styles.css`, `script.js`, and
  `Code.gs` across the whole project, on the reasoning that this log already captures
  the "why" behind everything — no need to duplicate that inside the code itself. Some
  genuinely unused code was also removed in the process (e.g. a leftover `firstNameOf`
  helper that nothing called).
- **This log itself was reorganized** from a strictly chronological, one-entry-per-turn
  format into the topic-grouped structure you're reading now, since the old format was
  getting long and hard to search through when trying to find where a specific past
  decision was made.

---

## Miscellaneous

Things that came up but don't belong to any one section above:

- Asked about installing the `superpowers` Claude Code plugin — that's a command for
  the Claude Code CLI specifically, not something runnable from this chat interface,
  and it wasn't in this project's plugin catalog either.

---

## Where things stand

**Files (in `/wedding-prototype/`):** `index.html`, `styles.css`, `script.js`,
`Code.gs`, this log.

**Current couple:** Arvin & Precious, December 8, 2026. RSVP deadline: October 15, 2026.

**Live guest data source:** your deployed Google Sheet, via the connected Apps Script
URL. No more local mock/offline fallback — a failed connection now shows an honest
error message instead of silently using placeholder data.

**Still open / not yet done:**
- Real couple photos (the board's blank photo placeholders are still waiting for images)
- Real venue name and confirmed map link (currently "Villa by the Bay" placeholder)
- `ADMIN_KEY` in `Code.gs` still needs to be changed from its placeholder value
- The "Entourage" Google Sheet tab needs to actually be created and filled in
  (`Role | Name | Order` columns — valid Role values: `Parents of the Groom`,
  `Parents of the Bride`, `Primary Principal`, `Best Man`, `Maid of Honor`,
  `Veil`, `Cord`, `Candle`, `Bible Bearer`, `Coin Bearer`, `Ring Bearer`,
  `Bridesmaid`, `Groomsman`)
- Gallery, countdown, and other "final website" sections (original Phase 5 scope)
