import React, { useState, useEffect, useCallback } from "react";
import { API_URL, STORAGE_KEYS } from "../config/constant";
import {
  getAuthData,
  getUserEmail,
  clearGmailData,
  checkBackendConnection,
} from "../utils/auth";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import GradientButton from "./ui/GradientButton";

const GmailConnector = ({ onConnect, children }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    connected: false,
  });

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      const status = await checkBackendConnection();
      setBackendStatus({ checked: true, ...status });

      if (!status.connected && status.errorType === "cors") {
        setError(
          "CORS issue detected. Your backend server may have CORS restrictions."
        );
      } else if (!status.connected) {
        setError(`Unable to connect to backend server: ${status.message}`);
      }
    };

    checkConnection();
  }, []);

  // Enhanced connection status checker - strictly checks email match
  const checkConnectionStatus = useCallback(() => {
    const gmailConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
    const connectedEmail = localStorage.getItem(STORAGE_KEYS.GMAIL_EMAIL);
    const currentEmail = userEmail || getUserEmail();

    if (gmailConnected && connectedEmail && currentEmail) {
      // Strict email comparison (case-insensitive)
      if (connectedEmail.toLowerCase() === currentEmail.toLowerCase()) {
        setIsConnected(true);
        if (onConnect) onConnect(true, authToken);
        return true;
      } else {
        // If emails don't match, reset connection
        console.warn(
          "Connected Gmail email doesn't match current user, resetting connection"
        );
        clearGmailData();
        setIsConnected(false);
        setError(
          `Gmail is connected to a different account (${connectedEmail}). Please reconnect with your current account (${currentEmail}).`
        );
        return false;
      }
    }

    setIsConnected(false);
    return false;
  }, [userEmail, authToken, onConnect]);

  // Load user data from localStorage
  useEffect(() => {
    setIsLoading(true);

    let email = getUserEmail();
    const authData = getAuthData();

    if (authData && authData.token) {
      setAuthToken(authData.token);

      if (authData.user && authData.user.email) {
        email = authData.user.email.toLowerCase();
      }

      if (email) {
        setUserEmail(email);

        setTimeout(() => {
          checkConnectionStatus();
          setIsLoading(false);
        }, 100);
      } else {
        setError("User email not found. Please log in again.");
        setIsLoading(false);
      }
    } else {
      setError("Authentication token not found. Please log in again.");
      setIsLoading(false);
    }
  }, [checkConnectionStatus]);

  // Reset connection on errors
  const resetConnection = useCallback(() => {
    clearGmailData();
    setIsConnected(false);

    const email = getUserEmail();
    if (email) {
      setUserEmail(email);
    }
  }, []);

  // Verify Gmail connection with additional email checks
  const verifyGmailConnection = async (authCode) => {
    try {
      // Get current email before sending request
      const currentEmail = userEmail || getUserEmail();
      if (!currentEmail) {
        throw new Error("User email not detected. Please log in again.");
      }

      const token = authToken || localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/gmail/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: authCode,
          email: currentEmail.toLowerCase(), // Always send lowercase email for consistent comparison
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Verification failed: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      if (data.success && data.email) {
        // Strict check to ensure emails match exactly (case-insensitive)
        if (data.email.toLowerCase() !== currentEmail.toLowerCase()) {
          throw new Error(
            `Connected Gmail account (${data.email}) does not match your logged-in email (${currentEmail}). For security reasons, you must use the same email.`
          );
        }

        localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, "true");
        localStorage.setItem(
          STORAGE_KEYS.GMAIL_EMAIL,
          data.email.toLowerCase()
        );
        setIsConnected(true);
        setError("");
        if (onConnect) onConnect(true, token);
      } else {
        throw new Error(data.message || "Could not verify Gmail connection");
      }
    } catch (err) {
      setError(err.message || "Failed to verify Gmail connection");
      resetConnection();
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle connect action with enhanced security checks
  const handleConnect = async () => {
    setError("");

    // Get fresh email and token data for this operation
    const email = userEmail || getUserEmail();
    const token = authToken || localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!email || !token) {
      setError("Missing authentication information. Please log in again.");
      return;
    }

    setIsConnecting(true);

    try {
      // Store the expected email before initiating the flow
      localStorage.setItem(STORAGE_KEYS.EXPECTED_GMAIL, email.toLowerCase());

      const response = await fetch(`${API_URL}/api/gmail/auth`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to initiate Gmail connection: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error("Invalid response from server: No authentication URL");
      }

      const width = 600,
        height = 700;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;
      const oauthWindow = window.open(
        data.url,
        "GoogleOAuth",
        `width=${width},height=${height},top=${top},left=${left}`
      );

      const handleMessage = (event) => {
        if (new URL(API_URL).origin !== event.origin) {
          return;
        }

        if (event.data && event.data.gmailConnected !== undefined) {
          if (event.data.gmailConnected === true && event.data.email) {
            // Verify the connected email matches the expected email
            const expectedEmail = localStorage.getItem(
              STORAGE_KEYS.EXPECTED_GMAIL
            );
            if (!expectedEmail) {
              setError(
                "Session data lost during authentication. Please try again."
              );
              setIsConnecting(false);
              return;
            }

            if (
              event.data.email.toLowerCase() !== expectedEmail.toLowerCase()
            ) {
              setError(
                `Connected Gmail account (${event.data.email}) does not match your logged-in email (${expectedEmail}). For security reasons, you must use the same email.`
              );
              setIsConnecting(false);
              return;
            }

            localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, "true");
            localStorage.setItem(
              STORAGE_KEYS.GMAIL_EMAIL,
              event.data.email.toLowerCase()
            );
            setIsConnected(true);
            setError("");
            if (onConnect) onConnect(true, authToken);
          } else if (event.data.error) {
            setError(`Gmail connection failed: ${event.data.error}`);
          }

          setIsConnecting(false);
          window.removeEventListener("message", handleMessage);
        }
      };

      window.addEventListener("message", handleMessage);
    } catch (err) {
      setError(err.message || "Failed to connect Gmail");
      setIsConnecting(false);
    }
  };

  // Process OAuth callback with strict email verification
  useEffect(() => {
    if (isConnected || isConnecting) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (code && state) {
      window.history.replaceState({}, document.title, window.location.pathname);
      checkGmailStatus(true);
    } else if (error) {
      setError(`Gmail connection failed: ${error}`);
      setIsConnecting(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Test connection
  const testConnection = async () => {
    if (!isConnected) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/gmail/test`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "X-User-Email": userEmail.toLowerCase(),
        },
      });

      if (!response.ok) {
        throw new Error(`Connection test failed: ${response.status}`);
      }

      const data = await response.json();
      return true;
    } catch (err) {
      return false;
    }
  };

  // Handle disconnect action
  const handleDisconnect = async () => {
    try {
      await fetch(`${API_URL}/api/gmail/disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      // Continue with disconnection anyway
    }

    localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
    localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);
    setIsConnected(false);
    setError("");
    if (onConnect) onConnect(false);
  };

  // Check Gmail connection status with email verification
  const checkGmailStatus = async (isAfterOAuth = false) => {
    if (!authToken) {
      return;
    }

    try {
      setIsLoading(true);

      // Get current email before sending request
      const currentEmail = userEmail || getUserEmail();
      if (!currentEmail) {
        throw new Error("User email not detected. Please log in again.");
      }

      const response = await fetch(`${API_URL}/api/gmail/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
          "X-Expected-Email": currentEmail.toLowerCase(), // Send expected email in header
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get Gmail status: ${response.status}`);
      }

      const data = await response.json();

      if (data.connected && data.email) {
        // Strict email comparison
        if (data.email.toLowerCase() !== currentEmail.toLowerCase()) {
          throw new Error(
            `Connected Gmail account (${data.email}) does not match your logged-in email (${currentEmail}). For security reasons, you must use the same email.`
          );
        }

        localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, "true");
        localStorage.setItem(
          STORAGE_KEYS.GMAIL_EMAIL,
          data.email.toLowerCase()
        );

        setUserEmail(data.email);
        setIsConnected(true);
        setError("");

        if (onConnect) onConnect(true, authToken);
      } else {
        if (isAfterOAuth) {
          setError("Gmail connection failed. Please try again.");
          resetConnection();
        } else {
          resetConnection();
        }
      }
    } catch (err) {
      setError(`Failed to check Gmail status: ${err.message}`);
      if (isAfterOAuth) {
        resetConnection();
      }
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!isConnected && !isConnecting && !isLoading && authToken) {
      checkGmailStatus();
    }
  }, [authToken]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-purple-300" />
        </div>
      ) : (
        <>
          {error && (
            <div className="bg-red-800 p-4 rounded-lg border border-red-600">
              <div className="flex items-center gap-2 text-red-200">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {typeof children === "function"
            ? children({
                handleConnect,
                isConnecting,
                isConnected,
                error,
              })
            : children}
        </>
      )}
    </div>
  );
};

export default GmailConnector;
