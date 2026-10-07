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
- `assets/photos/envelope/background1.png` (renamed by the couple)
- `assets/photos/envelope/envelope.png` ← file name is a guess; change the `src` in `index.html` if the real name differs
- `assets/bgm.mp3`

**How it's built:**
- `.stage` is a portrait frame sized to the background's 1455:2342 ratio (`height: 100dvh`, width capped to that ratio). On wide screens the photo isn't cropped; dark sides show instead.
- Everything inside is positioned in percentages of the stage; text sizes use container units (`cqw`), so the composition scales together.
- Text: "YOU'RE INVITED" and "12 . 08 . 2026" above the envelope; "CLICK THE ENVELOPE TO OPEN" near the bottom of the envelope. Font: Libre Baskerville (Google Fonts, 400/700).
- Current values (the couple's own, from their latest `styles.css`): background `23% 43% / 130% 130% no-repeat` (not cover); envelope `left: 3%; top: 22.4%; width: 100%`; heading `top: 21.9%`, 4.5cqw, letter-spacing .01em; date `top: 26.1%`, 3.5cqw; caption `bottom: 4%`, `right: 9%`, 2cqw.
- Clicking the envelope adds `.is-opened` to the stage (envelope lifts, scales slightly and fades; heading and date fade) and fires `invitation:open` on `document`.

**Adjustments by the couple (after the first version):** they edited `index.html` and `styles.css` directly; reasons weren't stated.
- Font Cormorant Garamond → **Libre Baskerville**.
- Heading `top` 27.5% → 16.5% (size 5.6 → 5.5cqw); date `top` 31.7% → 20.7%, size 3.9 → 4.5cqw, letter-spacing .14em → .10em.
- Envelope `top` 29% → 18%, `left` 1% → 3%, `width` 98% → 100%. The box extends 3% past the stage's right edge and is clipped; whether that's intended (transparent PNG margin) hasn't been checked.
- Caption `right: 9%` (was 0).
- Later edits: the values in "Current values" above; the "!!" was dropped from the heading.

**Persisted state (in the couple's `script.js`):** opening the envelope saves `rvsp-envelope-opened = true` in `localStorage`; on reload the page starts already opened (countdown showing, scroll unlocked). The same file holds the countdown timer (target 2026-12-08T00:00+08:00, ticking every second) and the music toggle. Storage reads and writes go through a small `storage` helper wrapped in `try/catch`, so a browser that blocks storage no longer stops the script (added in the cleanup pass).

**Background music:** spinning disc button fixed top-right, with a "Tap for music" hint that hides after the first tap. Starts muted, plays from the start on first tap, then toggles mute. Respects reduced-motion.

**Fix (countdown session): `.stage` now uses `overflow: clip`** (with `hidden` as fallback). With `hidden`, the stage is still a scroll container, so focusing or scrolling to the envelope button (which pokes 3% past the right edge) could shift the whole stage 18px sideways. Found when a test click moved the countdown scene. `clip` can't be scrolled.

---

## Countdown Scene (after the envelope opens)

Built from a screen recording of the Canva reference (first/last frame crops: x 656–1263, w 608; first frame y 19–1079, last frame y 0–1079). Previous chat ran out of tokens before producing anything usable; nothing from it carried over.

**Assets** in `assets/photos/countdown/` (couple-supplied; **not yet uploaded to Claude**, so everything below was tested with placeholder boxes at the stated pixel sizes):
- `background.png` 1467×2198 (the CSS actually loads `background2.png`, positioned `60% 70% / 125% 125%`)
- `base.png` 1106×949 — fixed parts: front of the envelope down to the polaroid, Save the Date sticker and "Click to know our love story" cloud
- `flap.png` 952×933 — the moving flap
- `content.png` 784×736 — "Together with our families" card through the rings

**Structure:** `<section class="countdown">` inside `.stage`. `.cd-bg` fills the stage (cover). `.cd-frame` is a 608:1080 box centered and fitted to the stage height, so the layers reproduce the video's proportions exactly (on a phone narrower than that ratio it squeezes slightly). Layer order back to front: flap, content, base, countdown text.

**Positions (percent of the 608×1080 frame; MEASURED FROM THE VIDEO, estimates until the real PNGs are checked):**
- flap `left 6.58%, top 11.57%, width 83.44% (the couple's value in `styles.css`)`
- content `left 14.47%, top 14.35%, width 69.1%`
- base `left .82%, top 31.85%, width 97%` (matches polaroid left edge, cloud right edge, bouquet bottom in the overlay test)
- Assumptions to verify: base top edge; whether `content.png` has transparent padding or baked-in tilt (the card tilts about −4° in the video; no CSS rotation applied); whether the flap png includes the envelope's back panel (I guessed it spans the envelope width, apex at the top).

**Animation (after click):** envelope fades out while the scene fades in (.7s). Flap swings open from the bottom hinge (`rotateX(90deg)` → 0, 1.1s, starts .3s in, 60% → 100% opacity). Card fades up 3% (1.6s, starts 1s in). Timings read from the video at 5fps. The flap sits behind the base the whole time, so the "closed" half of the swing is hidden rather than passing in front like the reference's translucent overlay.

**Countdown:** "COUNTING DAYS UNTIL WE SAY "I DO"" over DAYS : HOURS : MINUTES : SECONDS, sized and placed from the video (title center 84.35% down, digits 11cqw, labels 2.6cqw; overlay test matched). Target is **December 8, 2026 00:00 at +08:00 (Philippine time)**, which reproduces the video exactly (63d 01:55:12 at the recording time of Oct 5, 22:04:48). Stops at 00 once passed. Runs from page load; updates every second.

**Not done:** the "Click to know our love story" cloud isn't a button yet (it's part of `base.png`); nothing happens when it's clicked. The next scene is undecided.

---

## Story Section (below the countdown)

A scroll down from the countdown; same column width as the stage. Built from a screenshot of the Canva reference. The Flap Animation Fix that used to be in this log was disregarded at the couple's request and removed; the flap in the couple's `styles.css` is the real one.

**Assets** in `assets/photos/story/` (couple-supplied; **not uploaded to Claude**, so nothing here has been rendered with them):
- `photo-flower.png` 781×365: first photo with the flowers. The couple removed the music disc from it.
- `lovestory.png` 1046×699: title "Our Love Story" down to "Our Gallery" (assumed to include the navy gallery band).
- `background3.png` 1150×1616: behind both of the above.
- `collage.png` 1192×1731: the photo collage under the gallery title.

**Structure:** `<section class="story" id="story">` after `</main>`. `.story-top` carries `background3.png` (cover, top-aligned) with `photo-flower.png` at full width and `lovestory.png` at full width overlapping its bottom by `margin-top: -14cqw`, then `collage.png` flush underneath. Everything is width 100% of the column, so it scales with the page.

**Scrolling:** the page is locked while the envelope is closed. `body:has(.stage.is-opened){ overflow-y: auto }` unlocks it once the envelope opens (CSS only, so `script.js` was not changed; needs a browser with `:has()`).

**Decisions:** music disc not re-added to the photo, because the fixed corner disc is already on screen while scrolling (can be added). The "Click to see our wedding details" button is not needed and was not built.

**Gallery band:** the "Our Gallery" part of `lovestory.png` is transparent, so the page draws the band behind it: `.story-top::after`, anchored to the bottom of `.story-top`, hard top edge, `linear-gradient(90deg, #060a33 28%, #081c5f 80%)`. Colors and stops were sampled from the reference screenshot (dark navy on the left, brighter blue on the right). Height is `--gallery-band: 8cqw`, about 25px at the screenshot's 312px width. Assumes the title sits in the bottom 8cqw of the PNG; if the band is too short or tall, change that one value. The PNG sits above it (`z-index: 1`).

**Estimates, unverified:** the top padding (`5.8cqw`) and the `-14cqw` overlap were read off the screenshot (photo about 146px tall at 312px wide, title overlapping its bottom). Nudge those two numbers once the real PNGs are in.

---

## Entourage Section (below the story)

Built from the couple's full reference image (402×648) plus the cut-out pieces. Names come from Google Sheets. The loading code is appended to the bottom of the couple's real `script.js` inside its own IIFE, so it can't clash with the envelope, countdown or music code above it (it was briefly a separate `entourage.js`).

**Assets** in `assets/photos/weddingdeets/` (not uploaded to the real site folder by me; tested only against measurements):
- `background4.png` 1161×1740. It's a 3.8 MB PNG; converting it to JPG/WebP would load much faster.
- Heading pieces (transparent PNGs, headings only, with gaps left for the names): `entourage.png` 876×268, `parents-principal.png` 836×179, `assist-best-maid.png` 805×103, `secondary-candle-veil.png` 683×146, `bind-bride.png` 709×304, `bible-flower.png` 697×263.

**Structure:** `<section class="ent" id="entourage">` after the story, same column width. It is a 402:648 box (the reference's proportions) with the photo as background (`42% 50% / cover`). Six `img.ent-piece` and 15 `div.ent-names[data-ent=...]` are absolutely positioned in percent of that box. Text sizes use `cqw`, so everything scales together.

**Placements were measured, not guessed:** each piece was template-matched against the reference (all fit at a scale of 0.375 of their pixel size). Name-list centers and first-row heights were read off the reference. Names use Lora 600 at `2.1cqw`, line height `2.64cqw`. Pieces are in `styles.css` as `.ent-piece.title/.pp/.bm/.cv/.bb/.bf`; lists as `.ent-names[data-ent="..."]`.

**Google Sheet:** The entourage code calls the same Apps Script web app the old site used (`?action=entourage`, URL kept in `ENTOURAGE_API_URL` at the top of the file) and expects `{ ok: true, entourage: [ { role, name } ] }`. Roles are matched case-insensitively: parents of the groom / parents of the bride / primary principal (also "principal sponsor(s)") / best man / maid of honor / candle / veil / cord / groomsman(men) / bridesmaid(s) / bible bearer / coin bearer / ring bearer / flower girl(s). On failure a small message shows at the bottom of the section.

**Principal sponsors (assumption):** the design has two columns. Names starting with Mrs./Ms./Miss go on the right; everything else (Mr., and the "Ninong" filler row in the reference) goes on the left, both in sheet order so rows pair up. If no name has a prefix, the list is split in half. How the sheet really stores these hasn't been checked.

**Not verified:** nothing rendered with the real PNGs, and `Code.gs` (the backend) wasn't uploaded, so the sheet response is assumed from the old `script.js`. Because lists sit in fixed gaps, a role with more names than in the reference (for example 7 principal rows instead of 6) will run into the next heading.

---

## Side Navigation (jump dots, after the envelope opens)

A labeled jump nav for the one long scroll, designed with the ui-ux-pro-max guidance (smooth scroll to anchors, visible active state, 44px touch targets, labels in text, reduced motion respected, animate transform only). **Revised after the first version:** the "Menu" button and panel were dropped; the dots are always visible and there is only one blob.

**What it is:** a slim navy capsule of 4 dots, fixed at the **middle right** of the column (hidden until the envelope is open, then fades in after the countdown animation). Each dot is a 44px-tall tap target. Its **label sits to the left of the dot** ("label ●") and appears only on hover (hover-capable devices), on keyboard focus, or after a tap on touch devices. Labels: **Countdown**, **Our Love Story**, **Gallery**, **Wedding Entourage**, linking to `#countdown`, `#story`, `#gallery` (id on the collage image, `scroll-margin-top: 10cqw` so the "Our Gallery" title stays visible) and `#entourage`.

**Touch behavior:** the first tap on a dot only reveals the labels (so nobody taps blind); the next tap navigates. Labels hide again about 1.4s after navigating, on an outside tap, or on Escape. On hover devices a click navigates directly.

**Water animation:** one white blob marks the current section. On click it travels from the old dot to the new one (Web Animations: it stretches to `scale(.7, 1.8)` midway, then settles; 380ms plus 70ms per step, max 3 steps). An SVG "goo" filter (`#navGoo`) lets it blend slightly with the dots it passes. The earlier two-blob version (lead and tail) was removed because the tail looked like a trailing shadow. The blob also follows normal scrolling (the section whose top has passed 45% of the viewport is active), and during a nav click it stays on the chosen dot until the scroll settles. Reduced motion: instant scroll and no travel animation.

**Where:** markup (`<nav id="sideNav">`) in `index.html` before `<main>`; styles under "Side nav" in `styles.css`; logic at the bottom of `script.js` in its own IIFE. **To add a section:** give it an `id` and add one `<li><a class="nav-item" href="#id"><span class="nav-label">Label</span></a></li>`; the rail grows by 44px per item (`H` in the script and `.nav-item` height in CSS must match).

**Not verified:** not rendered or tested in a browser. Safari may draw the goo filter differently (worst case, plain circles). The capsule at the right edge may cover a little content; adjust `right` / size in `.side-nav` if so.

---

## Project Structure & Files

- Three files in one folder: `index.html`, `styles.css`, `script.js`.
- Code comments are short section headers only; the reasoning lives in this log. `--col` in `:root` is the shared column width used by the stage, story, entourage and side menu.
- Old files uploaded as reference: `index.html`, `styles.css`, `script.js`, `PROJECT_LOG.md` (all four overwritten on disk by the rebuild's same-named files in the last upload, so re-upload the old ones if needed).

---

## Where things stand

**Done:** opening scene, countdown scene, story section, entourage section, side navigation (all pending a real-image check on my side).

**Not started** (in the old version, may or may not return): Details (calendar, venues), RSVP with Google Sheets, Thank You screen. Scope of the rebuild not decided.

**Open questions:**
- Real envelope file name
- Real positions of flap / content / base and the story overlap once the PNGs are uploaded
- Whether the "Click to know our love story" cloud should scroll to `#story`
- What the "Click to know our love story" cloud opens
- Which old features come back
