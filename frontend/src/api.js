// Central place for the backend base URL.
// The rest of the legacy pages (login.js, ReturnForm.js, ReturnsTable.js)
// still hardcode "http://127.0.0.1:5000" directly - left untouched on
// purpose so we don't risk breaking the existing employee flow.
export const API_BASE = "http://127.0.0.1:5000";
