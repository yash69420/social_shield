import { API_URL, STORAGE_KEYS } from "../config/constant";

export const exchangeCodeForToken = async (code, redirectUri) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/google-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                code,
                redirect_uri: redirectUri
            }),
            credentials: "omit",
            mode: 'cors',
            cache: 'no-cache',
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        });

        if (!response.ok) {
            let errorMessage = "Failed to authenticate";
            try {
                const errorData = await response.json();
                errorMessage = `${errorMessage}: ${JSON.stringify(errorData)}`;
            } catch (e) {
                errorMessage = `${errorMessage}: ${await response.text()}`;
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw error;
    }
};

export const saveAuthData = ({ token, user }) => {
    if (!token || !user) {
        return false;
    }

    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return true;
};

export const getAuthData = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const userJson = localStorage.getItem(STORAGE_KEYS.USER);

    try {
        const user = userJson ? JSON.parse(userJson) : null;
        return token && user ? { token, user } : null;
    } catch (error) {
        clearAuthData();
        return null;
    }
};

// Helper to consistently get user email
export const getUserEmail = () => {
    const authData = getAuthData();
    if (!authData) return null;

    // Return user email in a consistent manner
    return authData.user.email || (authData.user.profile ? authData.user.profile.email : null);
};

export const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem("auth");  // For backward compatibility
};

export const clearGmailData = () => {
    // Clear only Gmail-related keys
    localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);
};

export const clearAllData = () => {
    // Clear everything on full logout
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
};

export const isAuthenticated = () => !!localStorage.getItem(STORAGE_KEYS.TOKEN);

export const isGmailConnected = () => {
    const gmailConnected = localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
    const connectedEmail = localStorage.getItem(STORAGE_KEYS.GMAIL_EMAIL);
    const userEmail = getUserEmail();

    // Gmail is only considered connected if the connected email matches the user's email
    return gmailConnected && connectedEmail && userEmail && connectedEmail === userEmail;
};

// Function to completely log out the user and clear all data
export const completeLogout = () => {
    // Clear authentication data
    clearAuthData();

    // Clear Gmail connection data
    localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);

    // Clear analysis results
    localStorage.removeItem("email_analysis_results");

    // Clear any OAuth tokens or timestamps
    localStorage.removeItem("oauth_timestamp");

    // Clear all local storage
    // Be careful with this approach as it might clear items not related to your app
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.includes("senti")) {
            localStorage.removeItem(key);
        }
    }

    // Clear all session storage
    sessionStorage.clear();

    // Return true to indicate success
    return true;
};