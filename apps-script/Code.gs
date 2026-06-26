const SPREADSHEET_ID = '19e1jMJQJUd46aXYiG7mbHDpH4T1fObDkI5tjMbHdL9c';

function doGet(e) {
  return routeGet(e);
}

function doPost(e) {
  return routePost(e);
}

function jsonResponse(payload, callback) {
  if (callback) {
    if (!/^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: false, error: 'Invalid callback' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }
  return JSON.parse(e.postData.contents);
}
