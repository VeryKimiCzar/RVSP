/* ================================================================
   Wedding RSVP — Google Apps Script backend
   Deploy this bound to the Google Sheet that holds the guest list.
   Sheet tab must be named exactly what SHEET_NAME says below, with
   headers in row 1: Guest ID | Guest Name | RSVP | Response Time | Note
   ================================================================ */

const SHEET_NAME = "Guests"; // change this if your tab is named differently

function doGet(e) {
  const action = e.parameter.action;

  if (action === "list") {
    return respond(listGuests());
  }
  if (action === "rsvp") {
    return respond(updateRsvp(e.parameter.id, e.parameter.status));
  }
  return respond({ ok: false, error: "Unknown action" });
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

// Returns every guest row as { id, name, status } — Note column is
// intentionally left out since it's manual-only and never shown on site.
function listGuests() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const guests = [];

  for (let i = 1; i < rows.length; i++) {
    const id = rows[i][0];
    const name = rows[i][1];
    const rsvp = rows[i][2];
    if (!id) continue; // skip blank rows
    guests.push({ id: id, name: name, status: rsvp || "Pending" });
  }

  return { ok: true, guests: guests };
}

// Flips one guest's RSVP column and stamps Response Time. Never touches Note.
function updateRsvp(id, status) {
  if (!id || (status !== "Attending" && status !== "Declined")) {
    return { ok: false, error: "Invalid request" };
  }

  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      const rowNum = i + 1; // sheet rows are 1-indexed, header is row 1
      sheet.getRange(rowNum, 3).setValue(status);    // column C: RSVP
      sheet.getRange(rowNum, 4).setValue(new Date()); // column D: Response Time
      return { ok: true, id: id, status: status };
    }
  }

  return { ok: false, error: "Guest not found" };
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
