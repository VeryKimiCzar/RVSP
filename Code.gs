/* ================================================================
   Wedding RSVP — Google Apps Script backend
   Deploy this bound to the Google Sheet that holds the guest list.
   Sheet tab must be named exactly what SHEET_NAME says below, with
   headers in row 1: Guest ID | Guest Name | RSVP | Response Time | Note
   ================================================================ */

const SHEET_NAME = "Guests"; // change this if your tab is named differently

// Set this to any long random string of your own choosing, then keep it
// private — it's server-side only and is NEVER shipped to script.js or
// anywhere a site visitor can see it. It exists purely so *you* can pull
// the full guest list (?action=list&key=...) for your own checking without
// that same endpoint being open to anyone who finds the deployed URL.
const ADMIN_KEY = "qwerty";

// Rejects a second write to the same Guest ID within this many seconds —
// blunts a script hammering one row, without affecting a real guest who
// only ever submits once every few seconds at most anyway.
const RSVP_COOLDOWN_SECONDS = 3;

// Guest IDs must look like this (e.g. "G001") — anything else is rejected
// before it's even compared against the Sheet.
const GUEST_ID_PATTERN = /^G\d+$/;

// Basic global throttle across ALL visitors combined (Apps Script doesn't
// expose the caller's IP, so a true per-visitor limit isn't possible here —
// this is a blunt instrument to slow down a scraping/spam script, not a
// precise one). A real guest's whole visit is a handful of requests; this
// threshold is set well above normal traffic so it shouldn't ever trip
// during ordinary use.
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_SECONDS = 60;

function doGet(e) {
  if (isRateLimited()) {
    return respond({ ok: false, error: "Too many requests — please try again in a moment." });
  }

  const action = e.parameter.action;

  if (action === "search") {
    return respond(searchGuests(e.parameter.q));
  }
  if (action === "rsvp") {
    return respond(updateRsvp(e.parameter.id, e.parameter.name, e.parameter.status));
  }
  if (action === "list") {
    if (e.parameter.key !== ADMIN_KEY || ADMIN_KEY === "CHANGE_ME_TO_A_LONG_RANDOM_STRING") {
      return respond({ ok: false, error: "Not authorized" });
    }
    return respond(listGuests());
  }
  return respond({ ok: false, error: "Unknown action" });
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getAllGuestRows() {
  const rows = getSheet().getDataRange().getValues();
  const guests = [];
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (!id) continue; // skip blank rows
    guests.push({ id: id, name: rows[i][1], status: rows[i][2] || "Pending" });
  }
  return guests;
}

/* ----------------------------------------------------------------
   Name matching — mirrors script.js's parseName()/surnameOf() logic
   exactly, so search results here match what the site used to compute
   client-side. Keep these two in sync if you ever change one.
   ---------------------------------------------------------------- */
const NAME_SUFFIXES = ["jr", "sr", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];

function surnameOf(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toLowerCase();
  const lastToken = parts[parts.length - 1].replace(/\.$/, "").toLowerCase();
  const isSuffix = NAME_SUFFIXES.indexOf(lastToken) !== -1;
  return (isSuffix && parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1]).toLowerCase();
}

// Returns the single best match for the typed query, plus any other
// guests sharing that match's surname. Only ever returns ONE guest as the
// direct match (never a full list of everyone containing the query) —
// that's what keeps this from being usable to scrape the whole roster the
// way the old ?action=list endpoint was.
function searchGuests(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q || q.length > 100) return { ok: true, match: null, similar: [] };

  const guests = getAllGuestRows();
  const match =
    guests.find(g => g.name.toLowerCase() === q) ||
    guests.find(g => g.name.toLowerCase().indexOf(q) !== -1) ||
    null;

  if (!match) return { ok: true, match: null, similar: [] };

  const matchSurname = surnameOf(match.name);
  const similar = guests.filter(g => g.id !== match.id && surnameOf(g.name) === matchSurname);
  return { ok: true, match: match, similar: similar };
}

// Admin-only full export — never called by the public site, see doGet().
function listGuests() {
  return { ok: true, guests: getAllGuestRows() };
}

// Flips one guest's RSVP column and stamps Response Time. Never touches Note.
// Requires BOTH the Guest ID and the guest's exact name to match the same
// row — raises the bar against someone just guessing sequential IDs
// (G001, G002, ...) without actually knowing who they belong to.
function updateRsvp(id, name, status) {
  if (!id || !GUEST_ID_PATTERN.test(id)) {
    return { ok: false, error: "Invalid request" };
  }
  if (status !== "Attending" && status !== "Declined") {
    return { ok: false, error: "Invalid request" };
  }
  if (!name) {
    return { ok: false, error: "Invalid request" };
  }

  const cache = CacheService.getScriptCache();
  const cooldownKey = "rsvp_cooldown_" + id;
  if (cache.get(cooldownKey)) {
    return { ok: false, error: "Please wait a moment before submitting again." };
  }

  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const wantedName = name.trim().toLowerCase();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      if (String(rows[i][1]).trim().toLowerCase() !== wantedName) {
        return { ok: false, error: "Guest not found" };
      }
      const rowNum = i + 1; // sheet rows are 1-indexed, header is row 1
      sheet.getRange(rowNum, 3).setValue(status);     // column C: RSVP
      sheet.getRange(rowNum, 4).setValue(new Date());  // column D: Response Time
      cache.put(cooldownKey, "1", RSVP_COOLDOWN_SECONDS);
      return { ok: true, id: id, status: status };
    }
  }

  return { ok: false, error: "Guest not found" };
}

/* ----------------------------------------------------------------
   Basic global rate limit. Not per-visitor (Apps Script doesn't expose
   caller IPs to doGet), just a blunt shared counter — see the constants
   at the top for why the threshold is set where it is.
   ---------------------------------------------------------------- */
function isRateLimited() {
  const cache = CacheService.getScriptCache();
  const key = "global_request_count";
  const current = Number(cache.get(key) || 0);
  if (current >= RATE_LIMIT_MAX) return true;
  cache.put(key, String(current + 1), RATE_LIMIT_WINDOW_SECONDS);
  return false;
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
