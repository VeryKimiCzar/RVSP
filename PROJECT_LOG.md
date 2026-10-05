# Wedding Invitation Site (Rebuild) — Project Log

Couple: **Arvin & Precious** · Wedding: **December 8, 2026** · RSVP deadline (from the old log): October 15, 2026

This is a from-scratch rebuild. The earlier prototype (`index.html`, `styles.css`, `script.js`, `Code.gs`, old `PROJECT_LOG.md`) is kept **as reference only** — borrow ideas or code from it when asked, but don't assume anything in it carries over. **Name clash warning:** the old log has the same file name as this one; keep them in separate folders.

---

## Standing Instructions

- **Update this file as part of every task**, not only when asked. Each change (design pass, bug fix, feature, revert) gets its own entry, grouped by topic rather than strict chronological order.
- **Watch conversation length and suggest a fresh chat proactively.** Signals: 3+ rounds of edits to the same large file in one conversation, roughly 15–20+ exchanges since files were last uploaded, or drifting across unrelated topics. Say so directly, and be upfront that this is a heuristic based on visible signals, not a precise measurement.
- **When starting a new chat**, upload all current project files plus this log. The log gives the reasoning; the files give the exact current code. Neither replaces the other.

---

## Opening Scene (envelope)

The first screen guests see. Built first, from a screenshot of the Canva reference design.

**Assets (supplied by the couple, all PNG):** background photo 1455×2342; envelope 1097×692 (one whole image; florals, pearls and seal are part of it).

**Expected file paths** (not yet verified against the real files):
- `assets/photos/envelope/background.png`
- `assets/photos/envelope/envelope.png` ← file name is a guess; change the `src` in `index.html` if the real name differs
- `assets/bgm.mp3`

**How it's built:**
- `.stage` is a portrait frame sized to the background's 1455:2342 ratio (`height: 100dvh`, width capped to that ratio). On wide screens the photo isn't cropped; dark sides show instead.
- Everything inside is positioned in percentages of the stage; text sizes use container units (`cqw`), so the composition scales together.
- Text: "YOU'RE INVITED!!" and "12 . 08 . 2026" above the envelope; "CLICK THE ENVELOPE TO OPEN" near the bottom of the envelope. Font: Libre Baskerville (Google Fonts, 400/700).
- Current positions (the couple's own values): envelope `left: 3%; top: 18%; width: 100%`, heading `top: 16.5%`, date `top: 20.7%`, caption `bottom: 4%` with `right: 9%`.
- Clicking the envelope adds `.is-opened` to the stage (envelope lifts, scales slightly and fades; heading and date fade) and fires `invitation:open` on `document`.

**Adjustments by the couple (after the first version):** they edited `index.html` and `styles.css` directly; reasons weren't stated.
- Font Cormorant Garamond → **Libre Baskerville**.
- Heading `top` 27.5% → 16.5% (size 5.6 → 5.5cqw); date `top` 31.7% → 20.7%, size 3.9 → 4.5cqw, letter-spacing .14em → .10em.
- Envelope `top` 29% → 18%, `left` 1% → 3%, `width` 98% → 100%. The box extends 3% past the stage's right edge and is clipped; whether that's intended (transparent PNG margin) hasn't been checked.
- Caption `right: 9%` (was 0).

**Background music:** spinning disc button fixed top-right, with a "Tap for music" hint that hides after the first tap. Starts muted, plays from the start on first tap, then toggles mute. Respects reduced-motion.

**Fix (countdown session): `.stage` now uses `overflow: clip`** (with `hidden` as fallback). With `hidden`, the stage is still a scroll container, so focusing or scrolling to the envelope button (which pokes 3% past the right edge) could shift the whole stage 18px sideways. Found when a test click moved the countdown scene. `clip` can't be scrolled.

---

## Countdown Scene (after the envelope opens)

Built from a screen recording of the Canva reference (first/last frame crops: x 656–1263, w 608; first frame y 19–1079, last frame y 0–1079). Previous chat ran out of tokens before producing anything usable; nothing from it carried over.

**Assets** in `assets/photos/countdown/` (couple-supplied; **not yet uploaded to Claude**, so everything below was tested with placeholder boxes at the stated pixel sizes):
- `background.png` 1467×2198
- `base.png` 1106×949 — fixed parts: front of the envelope down to the polaroid, Save the Date sticker and "Click to know our love story" cloud
- `flap.png` 952×933 — the moving flap
- `content.png` 784×736 — "Together with our families" card through the rings

**Structure:** `<section class="countdown">` inside `.stage`. `.cd-bg` fills the stage (cover). `.cd-frame` is a 608:1080 box centered and fitted to the stage height, so the layers reproduce the video's proportions exactly (on a phone narrower than that ratio it squeezes slightly). Layer order back to front: flap, content, base, countdown text.

**Positions (percent of the 608×1080 frame; MEASURED FROM THE VIDEO, estimates until the real PNGs are checked):**
- flap `left 6.58%, top 11.57%, width 87.2%`
- content `left 14.47%, top 14.35%, width 69.1%`
- base `left .82%, top 31.85%, width 97%` (matches polaroid left edge, cloud right edge, bouquet bottom in the overlay test)
- Assumptions to verify: base top edge; whether `content.png` has transparent padding or baked-in tilt (the card tilts about −4° in the video; no CSS rotation applied); whether the flap png includes the envelope's back panel (I guessed it spans the envelope width, apex at the top).

**Animation (after click):** envelope fades out while the scene fades in (.7s). Flap swings open from the bottom hinge (`rotateX(180deg)` → 0, 1.1s, starts .3s in, 60% → 100% opacity). Card fades up 3% (1.6s, starts 1s in). Timings read from the video at 5fps. The flap sits behind the base the whole time, so the "closed" half of the swing is hidden rather than passing in front like the reference's translucent overlay.

**Countdown:** "COUNTING DAYS UNTIL WE SAY "I DO"" over DAYS : HOURS : MINUTES : SECONDS, sized and placed from the video (title center 84.35% down, digits 11cqw, labels 2.6cqw; overlay test matched). Target is **December 8, 2026 00:00 at +08:00 (Philippine time)**, which reproduces the video exactly (63d 01:55:12 at the recording time of Oct 5, 22:04:48). Stops at 00 once passed. Runs from page load; updates every second.

**Not done:** the "Click to know our love story" cloud isn't a button yet (it's part of `base.png`); nothing happens when it's clicked. The next scene is undecided.

---

## Project Structure & Files

- Three files in one folder: `index.html`, `styles.css`, `script.js`.
- No code comments except one short note on the stage sizing. The reasoning lives in this log.
- Old files uploaded as reference: `index.html`, `styles.css`, `script.js`, `PROJECT_LOG.md` (all four overwritten on disk by the rebuild's same-named files in the last upload, so re-upload the old ones if needed).

---

## Where things stand

**Done:** opening scene (pending real-image check); countdown scene (built to measured positions, pending real-image check).

**Not started** (in the old version, may or may not return): Love Story page, Entourage, Details (calendar, venues), RSVP with Google Sheets, Thank You screen. Scope of the rebuild not decided.

**Open questions:**
- Real envelope file name
- Real positions of flap / content / base once the PNGs are uploaded
- What the "Click to know our love story" cloud opens
- Which old features come back
