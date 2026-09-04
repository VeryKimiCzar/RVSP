const SHEET_NAME = "Guests";
const ENTOURAGE_SHEET_NAME = "Entourage";

const ADMIN_KEY = "CHANGE_ME_TO_A_LONG_RANDOM_STRING";

const RSVP_COOLDOWN_SECONDS = 3;

const GUEST_ID_PATTERN = /^G\d+$/;

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
  if (action === "entourage") {
    return respond(listEntourage());
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

const GUEST_CACHE_KEY = "guest_rows_cache_v1";
const GUEST_CACHE_TTL_SECONDS = 30;

function getAllGuestRows() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(GUEST_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  const rows = getSheet().getDataRange().getValues();
  const guests = [];
  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    if (!id) continue;
    guests.push({ id: id, name: rows[i][1], status: rows[i][2] || "Pending" });
  }

  cache.put(GUEST_CACHE_KEY, JSON.stringify(guests), GUEST_CACHE_TTL_SECONDS);
  return guests;
}

function invalidateGuestCache() {
  CacheService.getScriptCache().remove(GUEST_CACHE_KEY);
}

const NAME_SUFFIXES = ["jr", "sr", "i", "ii", "iii", "iv", "v", "vi", "vii", "viii"];

function surnameOf(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toLowerCase();
  const lastToken = parts[parts.length - 1].replace(/\.$/, "").toLowerCase();
  const isSuffix = NAME_SUFFIXES.indexOf(lastToken) !== -1;
  return (isSuffix && parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1]).toLowerCase();
}

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

function listGuests() {
  return { ok: true, guests: getAllGuestRows() };
}

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
      const rowNum = i + 1;
      sheet.getRange(rowNum, 3).setValue(status);
      sheet.getRange(rowNum, 4).setValue(new Date());
      cache.put(cooldownKey, "1", RSVP_COOLDOWN_SECONDS);
      invalidateGuestCache();
      return { ok: true, id: id, status: status };
    }
  }

  return { ok: false, error: "Guest not found" };
}

const ENTOURAGE_CACHE_KEY = "entourage_cache_v1";
const ENTOURAGE_CACHE_TTL_SECONDS = 300;

function listEntourage() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(ENTOURAGE_CACHE_KEY);
  if (cached) return { ok: true, entourage: JSON.parse(cached) };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ENTOURAGE_SHEET_NAME);
  if (!sheet) return { ok: true, entourage: [] };

  const rows = sheet.getDataRange().getValues();
  const entourage = [];

  for (let i = 1; i < rows.length; i++) {
    const role = rows[i][0];
    const name = rows[i][1];
    if (!role || !name) continue;
    entourage.push({
      role: String(role).trim(),
      name: String(name).trim(),
      order: Number(rows[i][2]) || 0
    });
  }

  entourage.sort((a, b) => a.order - b.order);
  cache.put(ENTOURAGE_CACHE_KEY, JSON.stringify(entourage), ENTOURAGE_CACHE_TTL_SECONDS);
  return { ok: true, entourage: entourage };
}

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
