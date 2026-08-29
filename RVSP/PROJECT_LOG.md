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

**Still placeholder / not yet built (per the original phased plan):**
- Real couple photos (three blank photo slots waiting for images)
- Real venue name, date confirmation, and map link
- Google Sheets + Apps Script backend (Phase 3–4 from the original brief) —
  `findGuest()` and `submitRSVP()` in `script.js` are written so they can be swapped
  for real API calls without touching the rest of the code
- Gallery, countdown, and other "final website" sections (Phase 5)
