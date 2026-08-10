// Central backend base URL.
//
// In production: set REACT_APP_API_URL to your deployed backend URL
//   e.g. https://your-backend.onrender.com
//
// In local development: either set it in frontend/.env or leave it
// unset to fall back to the local Flask server at http://127.0.0.1:5000
export const API_BASE =
  process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
