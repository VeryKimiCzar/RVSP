# Wedding Invitation Prototype — Project Log

A running record of what we built and why, in the order it happened. Think of it as
browsing history for this project rather than a polished changelog — it's here so you
(or anyone picking this up later) can see the reasoning behind each decision.

---

## 1. Initial brief

You shared a detailed project brief: a personalized digital wedding invitation site,
blue motif, one shared template for many guests. Core flow requested:

> Open invitation → search name → system checks guest list → show invitation details
> → select attendance → submit RSVP

Tech direction: Canva for visual assets, HTML/CSS/JS for the interactive site,
Google Sheets + Apps Script for the eventual backend. Explicit instruction: build a
**small prototype first**, not the full site, but structure the code so it can be
expanded later rather than thrown away.

**Output:** a single-file HTML prototype (`wedding-invitation-prototype.html`) with:
- An envelope "opening" screen
- A name search field
- A personalized guest result (seat count + list of names)
- Per-person RSVP toggles
- A confirmation screen
- Mock guest data standing in for the future Google Sheet, with `findGuest()` and
  `submitRSVP()` written as isolated functions so they can later be swapped for real
  Google Apps Script calls without touching the UI code.

---

## 2. Matching your reference screenshots for the search/RSVP interaction

You shared screenshots of a reference design (green motif, Instagram Story format)
showing a **single continuous card** — not separate screens — where the guest name
field, "invitation found" status, seat count, and toggle switches all reveal in place
as you interact, plus iOS-style toggle switches instead of buttons.

**Changes made:**
- Rebuilt the search/RSVP UI as one scrolling card with progressive reveal
  (CSS grid-rows animation trick) instead of swapping between separate screens.
- Replaced the accept/decline buttons with animated toggle switches.
- Test guest data changed to **Kimi Czar** (party of 4) and **Merry Chris** (party of 2),
  per your request, plus a solo guest for edge-case testing.
- Made the layout responsive for phone/tablet/desktop (fluid widths, `clamp()` sizing).

---

## 3. Envelope opening animation — first attempt at "fill the screen"

You asked for the envelope-opening moment to feel like the letter itself grows to
fill the screen, so it feels like you're being pulled into the letter, rather than
cutting to a new screen.

**What I tried:** a single persistent card element whose position was measured via
JavaScript (`getBoundingClientRect`) and animated from "peeking out of the envelope"
coordinates to full-viewport coordinates — a FLIP-style morph.

**Outcome:** you reported this still looked broken. Given the added complexity and no
way for me to visually test the animation before sending it, you asked me to **revert**
to the simpler two-scene approach (envelope opens → transitions to a separate
RSVP card) and just fix the envelope's visuals instead.

---

## 4. Reverted to two-scene flow, fixed envelope visuals

- Went back to: tap the seal → flap animation → swap to the RSVP card scene.
- Fixed sizing issues (dropped a rigid aspect-ratio that was distorting on some
  screens, fixed the letter card being clipped/hidden incorrectly behind the flap).
- Names updated to **Arvin & Precious**, per your request from this point on.

---

## 5. Flat envelope-over-photo design

You shared a new reference: a flat, elegant envelope (not a 3D fold) sitting over a
full-bleed couple photo, with a script "You are invited..." heading above it and
"CLICK ENVELOPE TO UNSEAL" below.

**Changes made:**
- Rebuilt the envelope as an inline SVG: rounded rectangle, classic diagonal
  flap-fold lines, and a circular monogram seal ("A & P") at the center — much more
  reliable to render correctly than the earlier CSS 3D-transform approach.
- Added a full-bleed background layer standing in for your eventual couple photo
  (currently a blue gradient placeholder, with instructions in the CSS for swapping
  in a real image later).
- Added the "You are invited..." script heading (Alex Brush font) and the unseal
  caption.
- Simplified the open animation: seal shrinks and rotates away, fold lines fade,
  then the whole hero dissolves into the RSVP card underneath.

---

## 6. Scrapbook-style board after unsealing

You shared reference screenshots of a much richer "vision board" style page that
appears after opening the envelope — a collage of photo frames, floral illustrations,
a date/venue badge, "The Entourage," "Our love story," "The Details," "FAQs," and an
"RSVP here" plaque at the very bottom (which is where the name-search/RSVP flow
should live).

**Changes made:**
- Replaced the plain RSVP card scene with a **scrapbook-style board**: a title
  plaque, then a two/three-column card layout containing:
  - Three **blank photo placeholders** (main photo, oval-framed photo, square
    "stamp" photo) — intentionally empty, dashed borders, ready for you to drop
    real photos in later.
  - A date/venue badge with a working "click here to see map" link (currently
    pointing to a placeholder Google Maps search for "Villa by the Bay").
  - "The Entourage" / "The Details" / "FAQs" label badges.
  - An "Our love story" heart badge with a play-button accent.
  - Simple original SVG decorative illustrations (doves, a flower, a lily,
    champagne glasses) in blue tones — not copies of your reference's stock
    illustrations, since those looked like licensed Canva assets.
- Moved the "RSVP here" plaque to the bottom of the board. Tapping it expands the
  same name-search → seat count → attendance toggles → confirm → thank-you flow
  built in step 2, now living inside an expanding panel instead of its own screen.

**Also at this step:** split the single HTML file into **three separate files**
(`index.html`, `styles.css`, `script.js`) for a cleaner file structure, since you
asked whether that was possible. They need to stay in the same folder — `index.html`
links to the other two by filename.

---

## 7. Design accuracy pass

You said the board still didn't look close enough to your reference. Adjustments
made to close the gap:

- Switched the card layout from a column-based masonry to a proper CSS grid, so
  spacing reads as more intentional/collage-like rather than a plain tiled grid.
- Gave the title plaque an arch/signboard silhouette (rounded top, squarer bottom)
  with an inner ring and small flourish ornaments, instead of a plain rounded box.
- Restyled "The Entourage" / "The Details" as cream, gold-bordered stickers with
  small flourish marks, closer to the reference's label style.
- Added an ornate ringed border to the oval photo frame and a dashed "stamp" double
  border to the square photo frame.
- Restyled the RSVP plaque as a two-line stacked sign (bold "RSVP" + script "here")
  with a small gold key charm hanging off the corner, instead of a plain pill button.
- Added an extra lily-style decorative illustration for more floral presence, and
  let decorative pieces overlap their neighbors slightly (negative margins) for a
  more organic, pasted-together feel.

**Known limitation:** I don't have a way to render this HTML/CSS visually before
sending it to you, so every visual pass so far has been my best interpretation from
reading the code plus your screenshots — not a pixel-verified match. If something
still looks off, the fastest path forward is telling me specifically which element
(shape, color, spacing, font) isn't matching, rather than "the whole thing," since
that's much easier for me to target precisely without being able to see it myself.

---

## 8. Accessibility & icon audit (ui-ux-pro-max)

You asked me to try the `ui-ux-pro-max` design skill against the current build. It
didn't have a blue-specific wedding palette in its database (its wedding match
defaulted to pink/gold), so the existing navy/baby-blue system was kept rather than
force-fitting an unrelated palette. It did catch several concrete, fixable issues:

- **Emoji used as structural icons** — the key icon, play button, and heart were all
  emoji characters. Flagged directly by the tool's checklist ("No Emoji as Structural
  Icons... font-dependent, inconsistent across platforms"). Replaced all three with
  inline SVG icons.
- **Touch target size** — the RSVP attendance toggle switches were 42×24px, below the
  44×44 minimum the tool flags as critical. Fixed by expanding the invisible hit area
  to 44×44 without changing the switch's visual size.
- **Missing accessible names** — the toggle checkboxes had no label of their own
  (they relied on nearby visible text, which screen readers don't associate
  automatically). Added `aria-label="{name} attending"` to each one.
- **No live-region announcement** — added `aria-live="polite"` to the name-lookup
  status message so "Invitation found..." / "not found" gets announced automatically
  to screen readers instead of only appearing visually.
- **Typography** — swapped the script font from Alex Brush to **Great Vibes**, the
  tool's actual matched font for wedding invitations (paired with the Cormorant
  family already in use).

This was a polish pass on top of the existing layout/shapes from step 7, not a
redesign — nothing about the collage structure or card shapes changed here.

---

## 9. Backend spec received (Google Sheets + Apps Script)

You shared a summary (from ChatGPT) of how the Google Sheets + Apps Script backend
should work. Key points from the spec:

- **Sheet schema:** `Guest ID | Guest Name | RSVP | Response Time | Note` —
  **one row per person**, no Seats column, no groups/+1s.
- **Flow:** guest searches their name → sees their own invitation → **one toggle**
  for themselves (attending/declining) → Confirm Response → site sends Guest ID +
  choice to Apps Script → Apps Script flips `Pending → Attending/Declined` on that
  row and stamps Response Time. Note column is manual-only, never touched by the site.
- **Hard constraint:** a guest cannot add anyone, pick anyone else, or bring a +1.

**This is a real change from the current prototype**, not just a backend detail: the
prototype currently models guests as **parties** (e.g. "Kimi Czar" party of 4, each
with their own toggle and a shared seat count). The new spec is **one row = one
person = one toggle**, with no grouping/seats concept at all. Flagged this to you
directly rather than guessing and rebuilding the frontend twice — see the question
list in that turn's reply.



**This log gets updated as part of every change from now on**, not only when asked —
each new step (design pass, bug fix, feature addition, revert, etc.) gets its own
dated section here, in the order it happened, so this stays a reliable running record
rather than something reconstructed after the fact.


**Files (in `/wedding-prototype/`):**
- `index.html` — page structure
- `styles.css` — all styling
- `script.js` — envelope animation, RSVP panel toggle, name lookup, and RSVP logic

**Current couple:** Arvin & Precious, December 8, 2026

**Test guest data (mocked, standing in for the future Google Sheet):**
| Name searched | Party | Seats |
|---|---|---|
| Kimi Czar | Kimi, Nico, Bea, Ella Czar | 4 |
| Merry Chris | Merry, Joy Chris | 2 |
| Andrea Dela Cruz | Andrea Dela Cruz (solo) | 1 |

## 10. Confirmed: one-person-one-toggle model, plus surname-matching rules

Following up on step 9's questions, you confirmed the new data model and answered
each open point:

- **Party/seats model is being torn out.** The prototype moves to the spec's
  one row = one person = one toggle. No more "search a surname → see a household
  → toggle each member" screen.
- **Sibling/shared-surname handling:** if two guests share a surname *and* are
  actually part of the same household, the intended workflow is that one sibling
  can prompt/ask the other whether they're joining — i.e. the site should make it
  easy to check both without automatically bundling them as one invitation. If the
  shared surname is coincidental (unrelated guests), the site should still show the
  most accurate match to what was typed first, with a separate dropdown/option to
  reveal other guests who share that surname, rather than merging them.
- **Suffix-aware surname matching:** requested that surname matching recognize and
  ignore common name suffixes (Jr., Sr., I, II, III, IV, etc.) so that, e.g.,
  "Brandon Marson Jr." is matched/grouped on the surname "Marson," not on "Jr."
  You confirmed guest names themselves won't have duplicate collisions to worry
  about beyond this.
- **Re-visiting after responding:** guests are allowed to search again and
  resubmit/change their RSVP after already responding — no read-only lock.
- **Test data:** switching mock data to match the ChatGPT-provided Sheet sample —
  G001 Kimi Czar, G002 Merry Chris, G003 Marilyn Santos — replacing the old
  family-grouped mock data (Czar family of 4, Chris pair, Andrea Dela Cruz solo).
- **Sequencing:** reshape the frontend to the new one-person model first; the
  actual Google Apps Script (`Code.gs`) + Google Sheet setup walkthrough comes
  after, as a separate step-by-step pass (you'll be entering the Sheet manually,
  so that explanation needs to be step-by-step rather than just code).
- **Toggle wording & default:** keep "Joyfully accepts / Regretfully declines" as
  the single-person toggle labels, but the default state is now **declined**
  (matches the Sheet's `Pending` default being closer in spirit to "not yet
  confirmed attending" than to a household defaulting everyone to yes).
- **Confirmation screen changed:** on submitting, thank the guest specifically
  when they've accepted; the full members/summary list that used to show under
  the thank-you screen is being removed, since there's no household list to
  summarize anymore.

This is a frontend reshape pass (data model, search/matching logic, single-toggle
UI, confirm screen) — the Google Sheets + Apps Script step-by-step setup is queued
as the next step after this one, not done yet.

---

## 11. Frontend reshaped to one-person-one-toggle

Implemented the decisions from step 10.

**`script.js`:**
- `GUEST_LIST` replaced with the one-row-per-person shape: `G001 Kimi Czar`,
  `G002 Merry Chris`, `G003 Marilyn Santos`, each with `status` ("Pending" by
  default, matching the Sheet) and `responseTime`. The old party/`seats`/`members`
  shape is gone.
- Added `parseName()`, which splits a full name into first/last/suffix and
  recognizes Jr., Sr., and roman numerals I–VIII as non-surname suffixes (checked
  case-insensitively, with or without a trailing period) — so "Brandon Marson Jr."
  is matched on "Marson," not "Jr."
- `findGuest()` now returns the single best match for what was typed (exact name
  match preferred, otherwise a "name contains query" match) **plus**, separately,
  any other guests who share that match's surname (via `parseName`). The shared-
  surname guests are never merged into the result — they're only surfaced through
  the dropdown described below.
- Toggle now defaults to **declined** unless that guest's stored status is already
  "Attending" (so resubmitting/re-searching shows their last answer rather than
  always resetting).
- `submitRSVP()` now writes a single guest's status + timestamp (mocked locally),
  matching the eventual `Pending → Attending/Declined` Apps Script behavior.

**`index.html` / `styles.css`:**
- Removed the seat-count block and the multi-member toggle list.
- Added a single "Reserved in your honour" block showing just the matched guest's
  name and one toggle switch.
- Added a collapsible **"Others named [Surname]"** dropdown that appears above the
  invite block whenever other guests share the matched person's surname. It's
  collapsed by default; opening it lists the other guest(s) as tappable buttons
  that re-run the search as that person — this covers both a sibling checking on
  a sibling and two unrelated guests who happen to share a surname, without ever
  auto-bundling them into one invitation.
- Thank-you screen no longer shows a members summary list (nothing to summarize
  with one person per invitation). The thank-you message itself now differs by
  response: an "overjoyed you'll be celebrating with us" message when accepted,
  versus a quieter "sorry you can't make it, thank you for letting us know" when
  declined.
- Re-searching a name that already responded is still fully allowed (no read-only
  lock), and now reflects their last saved answer in the toggle position.

**Not done in this pass (queued next, per your sequencing preference):** the actual
Google Sheets column setup + Apps Script (`Code.gs`) walkthrough. `findGuest()` and
`submitRSVP()` remain isolated mock functions ready to be swapped for real
`fetch()` calls to an Apps Script Web App endpoint.

---

## 12. Google Sheets + Apps Script backend built

Implemented the actual backend from the spec in step 9, on top of the reshaped
frontend from step 11.

**New file — `Code.gs`** (Google Apps Script, bound to the guest-list Sheet):
- `doGet(e)` handles two actions via query string, both plain GET so the browser
  never hits a CORS preflight (Apps Script Web Apps don't handle `OPTIONS`
  requests, which breaks `POST`+JSON fetches from another origin):
  - `?action=list` — reads every row after the header and returns
    `{ ok, guests: [{ id, name, status }] }`. The `Note` column is deliberately
    left out of the response since it's manual-only and never shown on the site.
  - `?action=rsvp&id=...&status=...` — finds the row with that Guest ID, sets the
    `RSVP` column to `Attending` or `Declined`, and stamps `Response Time` with
    the current date/time. `Note` is never touched.
- `SHEET_NAME` constant at the top (`"Guests"`) — must match the actual tab name
  in the Sheet, changeable in one place if the tab is named differently.

**`script.js` changes:**
- `GUEST_LIST` is now `let`, not `const`, and starts as the same local mock data
  as before (Kimi Czar / Merry Chris / Marilyn Santos, all "Pending").
- Added `APPS_SCRIPT_URL` — left blank on purpose. While it's blank, the site
  behaves exactly as it did in step 11 (mock data, console-logged RSVPs). Once
  the deployed Web App URL is pasted in, `loadGuestList()` fetches the real
  guest list from the Sheet on page load, and `submitRSVP()` writes real
  responses back to it — the search/matching/suffix/similar-surname logic from
  step 11 didn't need to change at all, since it just operates on whatever's in
  `GUEST_LIST`.
- Both the fetch calls fail gracefully (falls back to mock behavior / logs a
  warning) if the Sheet can't be reached, so a typo'd or not-yet-deployed URL
  won't break the page.

**Manual setup still needed on your end** (walked through step by step in the
chat reply for this step, not repeated here since it involves clicking through
the Google Sheets and Apps Script UI): create the Sheet with the `Guest ID |
Guest Name | RSVP | Response Time | Note` header row and the three guest rows,
paste `Code.gs` into the Sheet's Apps Script editor, deploy it as a Web App
(`Execute as: Me`, `Who has access: Anyone`), then paste the resulting URL into
`APPS_SCRIPT_URL` in `script.js`.

---

## 13. Invite row redesigned: name/toggle side-by-side, inline family expansion

You shared a screenshot of the single-person invite block and asked for two
changes: lay the matched guest's name and toggle out horizontally (name left,
toggle right) instead of stacked/centered, and replace the old "Others named
X" dropdown — which used to swap the search to a different person entirely —
with one that expands *underneath* the matched guest's row and reveals each
same-surname guest as their own name+toggle row, so a family or group of
relatives arriving together can all be marked in one search instead of
re-searching each name one at a time.

Before implementing, I asked three clarifying questions since this changes the
submission model from "one guest per Confirm" to "however many rows are in
play per Confirm":

1. **Confirm scope** — does Confirm submit RSVPs for everyone currently shown
   (main + any expanded relatives), or only rows the guest actually touched?
   → **Only rows they interacted with.** Simply expanding the dropdown to look
   doesn't opt anyone in; a relative's row only joins the submission once its
   toggle is actually switched.
2. **Thank-you screen with multiple people** — list each person's response, or
   one generic group message? → **List each person briefly, comma-separated**
   (e.g. "Kimi Czar accepts, Jermon Czar II declines.").
3. **How the expanded rows reveal** — all at once as toggles, or a checklist
   first? → **Show as toggles right away**, with a "Show all" / "Show first 10"
   choice if the same-surname list is long; picking "first 10" re-offers the
   same choice for whatever's left, repeating until everything's shown. If
   what's left after any batch is 10 or fewer, only "Show all" is offered
   (a "first 10" choice would be identical to it at that point).

**`index.html` / `styles.css`:**
- Replaced the centered, stacked name/toggle invite block with a horizontal
  `.person-row` (name left, switch + accept/decline label right) — this same
  row style is reused for every relative row that gets revealed underneath.
- The "Others named [Surname]" chevron now lives inside the invite block,
  directly under the main guest's row, and expands an inline
  `#similarRows` container in place rather than a separate section that used
  to replace the search.

**`script.js`:**
- `findGuest()`'s return shape is unchanged (still `{ match, similar }`), but
  the similar list is no longer a set of clickable "switch to this person"
  buttons — it's rendered as real toggle rows via a new `buildPersonRow()`
  helper, shared between the main row and every relative row.
- Added `touchedIds` (a `Set`) that only gets a guest's id added to it when
  their row's toggle actually fires a `change` event — this is what Confirm
  reads to decide who besides the main guest gets submitted.
- Added pagination state (`revealedCount`) so opening the dropdown for a long
  same-surname list shows the "Show all" / "Show 10 more" choice described
  above, re-offering it after each batch until everyone's visible; a single
  "Show all" button appears once ≤10 remain.
- `submitRSVP()` now runs once per submitted person (main + touched
  relatives), and the thank-you screen (`renderThankYou()`) branches: a single
  submission keeps the old personalized accept/decline message, multiple
  submissions get the new comma-separated "Name accepts/declines" summary.

---

## 14. Thank-you screen became a popup modal; reveal batch size 10 → 5

You shared a reference screenshot of a dark, card-style "Thank You" popup (couple
name, divider, thank-you message, Close button) and asked for that instead of the
inline thank-you panel that used to reveal at the bottom of the RSVP card. (The
screenshot also had an unrelated "Get yours today, PM to purchase" sticker across
it — that's a marketplace watermark on the template it came from, not part of the
design, so it wasn't carried over.)

**Changes made:**
- Thank-you content moved out of the RSVP card entirely into `#thankYouOverlay`, a
  fixed full-screen modal that's hidden until Confirm is pressed. Styled to match
  the site's existing navy/brass palette rather than the reference's green, since
  it's replacing the popup *mechanism*, not the color scheme: couple name in script
  type, a divider, "THANK YOU" in spaced caps, the response message, and a Close
  button that dismisses the modal.
- The old "Find another invitation" ghost button is gone along with the inline
  panel — Close just dismisses the popup; the guest can still edit the name field
  underneath to look up someone else.
- Kept the accept/decline-aware messaging from step 13 rather than dropping it for
  the reference's generic wording: single-person responses still read personally,
  multi-person responses still list each name with accept/decline, comma-separated,
  now followed by one shared closing line (celebratory if everyone accepted, a
  softer line if everyone declined, a neutral one if mixed).
- **Reveal batch size changed from 10 to 5** throughout: the "Others named
  [Surname]" dropdown now offers "Show all" / "Show 5 more" (previously 10), and
  only offers "Show 5 more" as a distinct choice when more than 5 people remain.

**Also did a general cleanup pass on `script.js`** per your request:
- Removed unused per-guest `responseTime` tracking on the client — it was never
  read anywhere in the UI; the Sheet already stamps Response Time server-side via
  `Code.gs`, so tracking it twice was dead weight.
- Condensed `parseName`/`surnameOf`/`firstNameOf`/`titleCase` and `buildPersonRow`
  into shorter, more direct implementations (arrow functions and template-literal
  markup where that didn't hurt readability), grouped all DOM element lookups
  together near the top instead of scattered near their first use, and removed
  the now-unused `.btn-ghost` / `.summary-list` CSS rules left over from the old
  inline thank-you panel.
- Behavior is otherwise unchanged from step 13 (touched-only submission, suffix-
  aware surname matching, etc.) — this was a structure/readability pass, not a
  logic change beyond the modal switch and the 10→5 batch size.

---

## 15. Live Apps Script URL connected

You shared your deployed Apps Script Web App URL and asked not to have to paste it
in each time. `APPS_SCRIPT_URL` in `script.js` is now set to it directly, so the
site fetches the real guest list from the Sheet and writes real RSVPs to it by
default — the mock `GUEST_LIST` still sits in the file as an automatic fallback if
the Sheet is ever unreachable, but no manual step is needed anymore.

---

## 16. Thank-you message simplified — no more per-person listing

Corrected step 14: "copy the thank-you box" meant match the reference message
itself, not keep listing every person's individual response. `showThankYou()` now
always shows "Your response has been received." followed by one closing line
("We can't wait to celebrate with you!" unless everyone in that submission
declined, in which case "We'll miss you, but thank you for letting us know.") —
no names, no accept/decline enumeration, regardless of how many people (main
guest + any touched relatives) were part of that Confirm.

---

## 17. Basic abuse hardening on the Apps Script endpoint

You asked what could be done to blunt a troll exploiting the now-public Apps
Script URL (visible in the repo once pushed to GitHub). Added two lightweight
protections to `Code.gs`, both scoped to not affect a normal guest's one-time
RSVP:

- **Per-guest write cooldown** (`RSVP_COOLDOWN_SECONDS`, 3s): rejects a second
  write to the same Guest ID within the cooldown window, so a script hammering
  the endpoint against one row can't spam it — a real guest only ever submits
  once every few seconds at most anyway.
- **Stricter ID validation** (`GUEST_ID_PATTERN`): rejects any `id` that doesn't
  match the expected `G` + digits format outright, before it's compared against
  the Sheet at all.

Explicitly did **not** add a shared secret key embedded in `script.js` — flagged
to you that this would be false security, since anyone who can see the deployed
site's source can see the "secret" too.

**Flagged but not changed:** `?action=list` currently returns every guest's name
and current RSVP status to anyone who calls it directly, not just people using
the site — this is a real privacy exposure (a troll could scrape the whole guest
list without ever opening the invitation), not just a spam-attack risk. Fixing
it means moving name search server-side into Apps Script so it only ever returns
the guest(s) matching a query, which is a real architecture change (duplicated/
ported matching logic, an extra round trip per search) rather than a quick patch
— left as an open decision rather than made unilaterally.

---

## 18. Deadline updated, circling music disc added

**Deadline:** the RSVP deadline note now reads **October 15, 2026** (previously
November 8, 2026).

**Music disc:** added a fixed circling music-disc control, always visible in the
top-right corner regardless of scroll position or which screen (hero/board/RSVP)
is showing.
- Default state: spinning (CSS animation, ~3.2s per rotation) and in the site's
  navy/brass colors — represents "playing." An `<audio>` element with a `<source
  type="audio/mpeg">` is wired up for it to control; the `src` is left blank for
  now, ready for you to drop your actual mp3 file path in.
- Clicking it toggles to a **muted state**: the disc turns gray and stops
  spinning, and the audio is paused and muted. Clicking again reverses all of
  that — colored, spinning, and unmuted/playing again.
- Since the site also tries to start the music the moment the envelope is
  tapped (browsers block audio autoplay until a real user interaction happens,
  and the envelope tap is the first one on this page), it should begin playing
  right as the invitation opens rather than needing the disc to be clicked
  first — clicking the disc after that is purely a mute/pause control.

---

## 19. Real monogram image on the envelope seal; asset paths finalized

You shared the actual A&P monogram artwork and asked for it to replace the
placeholder text on the envelope seal, to live at `assets/photos/monogram.png`,
and for the background music file to move to `assets/bgm.mp3`.

- The seal's `A & P` SVG text is gone. In its place: the seal's inner circle
  is now a light backdrop (previously just an outline) so the monogram's navy
  linework actually shows up against it, with the `monogram.png` image laid on
  top and clipped to a circle so it sits neatly inside the seal's border ring
  rather than being a square image poking out.
- `bgMusic`'s `<source>` now points at `assets/bgm.mp3` directly (no more blank
  placeholder to fill in later).
- Expected file layout is now `assets/bgm.mp3` and `assets/photos/monogram.png`,
  both relative to `index.html` — same folder it's already in.

---

## 20. Monogram fixed: white artwork needs the navy backdrop back, sized up

You recolored the monogram artwork to white (still a transparent PNG), which is
why it went invisible against step 19's light cream seal backdrop — a white
mark needs a dark background, not a light one. Reverted the seal's inner circle
to `fill="none"` (its original state, before the monogram change, letting the
outer navy gradient circle show through as the backdrop) instead of the cream
fill. Also enlarged the monogram noticeably — clip radius 23→26, image box
54×54→70×70 — since it was reading too small at the old size regardless of
color.

---

## 21. Fixed startup delay on the background music

You noticed the song was delayed when playing. Cause: `preload="none"` on the
`<audio>` element meant the browser didn't fetch any of `bgm.mp3` until `play()`
was actually called on envelope tap — so playback had to wait on the download
to start and buffer at that exact moment. Changed to `preload="auto"`, so the
browser starts fetching the file in the background as soon as the page loads,
well before the envelope is tapped.

---

## 22. Fixed: music needed two disc clicks to actually start

You noticed the music only started after clicking the disc twice. Cause: the
click handler tracked its own `musicMuted` flag rather than checking the audio
element's real state. The envelope-tap autoplay attempt from step 18 is
commonly blocked by the browser's autoplay-with-sound policy, so the audio was
actually still paused even though the flag assumed it was "playing" — the first
click then just toggled that already-paused state to "muted" (a no-op you'd
never notice), and only the second click actually flipped it to play.

Fixed by having the click handler check `bgMusic.paused` / `bgMusic.muted`
directly each time instead of trusting a separately-tracked flag, so the very
first click always does the right thing regardless of whether the earlier
autoplay attempt silently succeeded or failed.

---

## 23. Fixed: music still not starting on envelope tap, only on disc click

Step 22's fix corrected the flag/state desync, but the music still only started
when the disc was clicked, not on the envelope tap. Root cause: some browsers
still refuse to start audio *with sound* the first time, even from a genuine
click handler — muted autoplay is the one thing browsers reliably allow without
any gesture at all.

Switched to that pattern instead of fighting the gate directly:
- `bgMusic.muted = true; bgMusic.play()` now runs immediately at page load
  (top-level, no click needed) — always permitted since it's silent.
- The envelope tap now just sets `bgMusic.muted = false` instead of calling
  `play()` fresh — since the track is already playing in the background,
  unmuting it doesn't re-trigger the autoplay restriction the way starting
  playback from scratch does.
- The disc toggle simplified to just flipping `muted` (with a `play()` fallback
  only if it's somehow paused) rather than pausing/resuming playback each
  click, since there's no more benefit to actually stopping playback versus
  muting it.

---

## 24. Added a "Tap for music" hint next to the disc

You asked for something pointing people toward the music disc so they don't
miss the song. Added a small pill-shaped hint bubble ("Tap for music") to the
left of the disc with a little pointer triangle aimed at it, gently bobbing to
catch the eye. It fades out on its own after 6 seconds, or immediately the
moment someone actually taps the disc — whichever comes first — so it doesn't
linger once it's done its job.

---

## 25. Music disc reworked: starts as a play button, then just mutes/unmutes

You pointed out that in some browsers the track can end up already playing
(silently or even audibly, depending on that browser's own autoplay/engagement
rules) without anyone touching the disc — so the disc's look needed to actually
reflect reality, and its job after that first play is just toggling sound on
and off, not "playing" and "stopping" as separate concepts.

- The disc now starts in a **muted, grayed-out, non-spinning state with a play
  triangle overlaid on it** — this matches its real starting state (`bgMusic`
  is always started muted under the hood, per step 23) instead of visually
  claiming to be "on" from the first frame.
- Whichever moment actually unmutes the audio — the envelope tap, or a direct
  click on the disc — now updates the disc's look at that exact moment: the
  play icon disappears, the disc turns colored and starts spinning, and its
  accessible label switches from "Play background music" to "Mute background
  music." Previously only the disc-click handler updated this, so unmuting via
  the envelope tap left the disc looking wrong (still showing "play") even
  though sound had already started — the next actual click would then mute
  already-playing audio unexpectedly, reproducing the "takes two clicks to
  behave right" issue from step 22 in a new form.
- After that first unmute, the disc is purely a mute/unmute switch — the
  underlying audio is never paused again, only muted, matching what you asked
  for ("after playing, its function is only mute and unmute").
- The "Tap for music" hint now also disappears the moment the envelope tap
  unmutes the audio, since it's no longer needed once sound has already
  started that way.

---

## 26. Corrected: muted-autoplay start was making the track start mid-way

Step 23's "start muted at page load, unmute later" approach (built to dodge
browser autoplay-with-sound blocks) had a real side effect: since the track had
already been playing silently since page load, the moment it got unmuted it
was already partway through — so people heard the song start mid-track instead
of from the beginning. You wanted the track to only ever start when the disc
itself is tapped, playing from 0:00.

**Removed entirely:**
- The `bgMusic.muted = true; bgMusic.play()` call that used to run automatically
  at page load.
- The envelope-tap handler no longer touches the music at all — tapping the
  envelope now only does the unsealing animation, nothing audio-related.
- The hint bubble's 6-second auto-hide timer — since the disc is now the only
  way to start the music at all (not just a fallback for browsers that blocked
  autoplay), it stays visible until it's actually tapped rather than
  disappearing on a timer regardless of whether anyone noticed it.

**New disc behavior:** the very first click checks if the audio has never
played (`bgMusic.paused`) — if so, it resets `currentTime` to 0, unmutes, and
plays, so the track always starts from the beginning exactly when the disc is
tapped. Every click after that just flips `muted` — the audio is never paused
again, matching "no pause happening, just mute and unmute."

---

## Still placeholder / not yet built (per the original phased plan)
- Real couple photos (three blank photo slots waiting for images)
- Real venue name, date confirmation, and map link
- Google Sheets + Apps Script backend walkthrough (queued as the next step —
  see step 10 above)
- Gallery, countdown, and other "final website" sections (Phase 5)
