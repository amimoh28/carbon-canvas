const WAITLIST_SHEET_NAME = "Waitlist";
const WAITLIST_HEADERS = [
  "Timestamp",
  "Name",
  "Age group",
  "Email",
  "Phone",
  "Source",
  "User agent",
];

/**
 * Health check for the deployed web app.
 */
function doGet() {
  return jsonResponse_({
    ok: true,
    service: "carbon-canvas-waitlist",
  });
}

/**
 * Receives application/x-www-form-urlencoded data from /api/waitlist.
 * This script should be bound to the Google Sheet that stores signups.
 */
function doPost(event) {
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(10000);

    const params = (event && event.parameter) || {};
    const name = clean_(params.name, 100);
    const age = clean_(params.age, 20);
    const email = clean_(params.email, 160).toLowerCase();
    const phone = clean_(params.phone, 40);
    const source = clean_(params.source, 120);
    const userAgent = clean_(params.userAgent, 300);

    if (!name || (!email && !phone)) {
      return jsonResponse_({
        ok: false,
        error: "missing_fields",
      });
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) {
      throw new Error("This Apps Script must be bound to a Google Sheet.");
    }

    let sheet = spreadsheet.getSheetByName(WAITLIST_SHEET_NAME);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(WAITLIST_SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(WAITLIST_HEADERS);
      sheet.setFrozenRows(1);
    }

    // Prevent obvious duplicate contacts from being added repeatedly.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1 && (email || phone)) {
      const contactRows = sheet
        .getRange(2, 4, lastRow - 1, 2)
        .getDisplayValues();

      const duplicate = contactRows.some(function (row) {
        const existingEmail = clean_(row[0], 160).toLowerCase();
        const existingPhone = clean_(row[1], 40);
        return (email && existingEmail === email) || (phone && existingPhone === phone);
      });

      if (duplicate) {
        return jsonResponse_({ ok: true, duplicate: true });
      }
    }

    sheet.appendRow([
      new Date(),
      name,
      age,
      email,
      phone,
      source,
      userAgent,
    ]);

    return jsonResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse_({
      ok: false,
      error: "server_error",
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {
      // The lock may not have been acquired if waitLock failed.
    }
  }
}

function clean_(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
