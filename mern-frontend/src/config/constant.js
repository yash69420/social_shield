// API and OAuth configuration
export const API_URL = import.meta.env.VITE_API_URL;
export const FLASK_API_URL = import.meta.env.VITE_FLASK_API_URL;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

// OAuth scopes (these are fixed values, not environment-dependent)
export const LOGIN_SCOPE = "openid email profile";
export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

// Local storage keys (these are fixed values, not environment-dependent)
export const STORAGE_KEYS = {
    TOKEN: "token",
    USER: "user",
    GMAIL_CONNECTED: "gmailConnected",
    GMAIL_EMAIL: "gmailEmail",
    EXPECTED_GMAIL: "expectedGmail"
};