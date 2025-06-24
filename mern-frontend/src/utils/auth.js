import { API_URL, STORAGE_KEYS } from "../config/constant";

export const exchangeCodeForToken = async (code, redirectUri) => {
    try {
        const response = await fetch(`${API_URL}/api/auth/google-login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem(STORAGE_KEYS.TOKEN)}`
            },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
            credentials: "include",
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to authenticate: ${errorText}`);
        }

        return response.json();
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
    try {
        // Method 1: Try the new combined format first
        const authDataStr = localStorage.getItem('auth_data');
        if (authDataStr) {
            const authData = JSON.parse(authDataStr);
            return authData;
        }

        // Method 2: Build from separate keys (your current setup)
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            return null;
        }

        const user = JSON.parse(userStr);
        const result = {
            token: token,
            user: user,
            email: user.email
        };

        return result;

    } catch (error) {
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

export const checkBackendConnection = async () => {
    const urlVariations = [
        { url: `${API_URL}/api/test`, mode: 'cors' },
        { url: `${API_URL}/api/test`, mode: 'cors' },
        { url: `${API_URL}/api/test`, mode: 'cors' },
        // Try with specific port and no-cors as last resort
        { url: `${API_URL}/api/test`, mode: 'no-cors' },
    ];

    for (const variation of urlVariations) {
        try {
            const fetchOptions = {
                method: 'GET',
                headers: { "Accept": "application/json" },
                mode: variation.mode,
                cache: 'no-cache'
            };

            // For no-cors, we can't include certain headers
            if (variation.mode === 'no-cors') {
                delete fetchOptions.headers;
            }

            const response = await fetch(variation.url, fetchOptions);

            // For no-cors mode, we can't access the response content,
            // but if we get here without an error, the server is responding
            if (variation.mode === 'no-cors') {
                return {
                    connected: true,
                    status: "unknown", // Can't access status in no-cors mode
                    message: "Connected to backend (limited access mode)",
                    url: variation.url
                };
            }

            const data = await response.json();

            return {
                connected: true,
                status: response.status,
                message: data.message || "Connected to backend",
                url: variation.url
            };
        } catch (error) {
            // Continue to next variation
        }
    }

    // Try a simple fetch with minimal options as last resort
    try {
        await fetch(`${API_URL}/api/test`);
        return {
            connected: true,
            message: "Connected with minimal options",
        };
    } catch (finalError) {
        // If all attempts failed, provide diagnostic information
        return {
            connected: false,
            errorType: "network",
            message: "Failed to connect to backend server using all methods",
            possibleReasons: [
                "Backend server is not running",
                "Port 5000 is blocked or in use by another application",
                "Network connectivity issues",
                "CORS configuration issues"
            ]
        };
    }
};

// Function to completely log out the user and clear all data
export const completeLogout = () => {
    // Clear authentication data
    clearAuthData();

    // Clear Gmail connection data
    localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);
    localStorage.removeItem("GMAIL_CONNECTED");
    localStorage.removeItem("GMAIL_EMAIL");
    localStorage.removeItem("EXPECTED_GMAIL");

    // Clear analysis results
    localStorage.removeItem("email_analysis_results");
    localStorage.removeItem("manual_testing_results");

    // Clear simulation and game data
    localStorage.removeItem("llm_game_scores");
    localStorage.removeItem("has_accessed_simulation");
    localStorage.removeItem("lastPlayedTime");
    localStorage.removeItem("dashboard_viewed");
    localStorage.removeItem("dashboard_config");

    // Clear bookmarks data
    localStorage.removeItem("Social Shield_bookmarks");
    localStorage.removeItem("Social Shield_bookmark_folders");

    // Clear onboarding data
    localStorage.removeItem("senti_analysis_onboarding_completed");

    // Clear theme preferences
    localStorage.removeItem("theme");

    // Clear any debug/log information
    localStorage.removeItem("loglevel");

    // Clear any OAuth tokens or timestamps
    localStorage.removeItem("oauth_timestamp");

    // Ensure we clear ALL items that include 'senti'
    for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (
            key.toLowerCase().includes("senti") ||
            key.toLowerCase().includes("simulation") ||
            key.toLowerCase().includes("scores") ||
            key.toLowerCase().includes("game") ||
            key.toLowerCase().includes("dashboard") ||
            key.toLowerCase().includes("manual_testing") ||
            key.toLowerCase().includes("analysis") ||
            key.toLowerCase().includes("gmail")
        )) {
            localStorage.removeItem(key);
        }
    }

    // Clear all session storage
    sessionStorage.clear();

    // Return true to indicate success
    return true;
};

// Add this helper function to check auth validity
export const checkAuthData = () => {
    const authData = getAuthData();
    return {
        hasAuth: !!authData,
        hasToken: !!(authData?.token),
        hasUser: !!(authData?.user),
        hasEmail: !!(authData?.email || authData?.user?.email)
    };
};