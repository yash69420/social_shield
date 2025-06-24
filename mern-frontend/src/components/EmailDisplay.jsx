import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { API_URL, STORAGE_KEYS } from "../config/constant";
import { getAuthData } from "../utils/auth";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Frown,
  Smile,
  Meh,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  MessageSquare,
  Calendar,
  User,
  Filter,
  RefreshCw,
  Clock,
  X,
  ExternalLink,
  Search,
  Inbox,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import axios from "axios";
import BookmarkButton from "./BookmarkButton";
import Input from "./ui/input";
import GradientButton from "./ui/GradientButton";
import { Card, CardContent } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./ui/DropdownMenu";

// OPTIMIZATION: Move the component function outside of React.memo first
function EmailDisplayComponent({ token }) {
  // Add the style element here, before any state
  const updatedSlidingStyles = `
    /* Tab bar sliding animations */
    .tab-container {
      position: relative;
    }
    
    .tab-container::after {
      content: '';
      position: absolute;
      bottom: 0;
      height: 3px;
      border-radius: 3px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .tab-container.all::after {
      left: 0;
      width: 25%;
      background-color: rgb(37, 99, 235);
    }
    
    .tab-container.suspicious::after {
      left: 25%;
      width: 25%;
      background-color: rgb(220, 38, 38);
    }
    
    .tab-container.safe::after {
      left: 50%;
      width: 25%;
      background-color: rgb(22, 163, 74);
    }
    
    .tab-container.analyzed::after {
      left: 75%;
      width: 25%;
      background-color: rgb(147, 51, 234);
    }
    
    .tab-button {
      position: relative;
      z-index: 10;
      transition: transform 0.2s ease;
    }
    
    .tab-button.active {
      transform: translateY(-2px);
    }

    /* New styles for email expansion */
    .email-content {
      transition: max-height 0.3s ease, opacity 0.3s ease;
      overflow: hidden;
      opacity: 0;
      max-height: 0; /* Collapsed state */
    }

    .email-content.expanded {
      opacity: 1;
      max-height: 500px; /* Adjust as needed for your content */
    }

    /* Enhanced email expansion animations */
    .email-expand-container {
      overflow: hidden;
      transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
      max-height: 0;
      opacity: 0;
      will-change: max-height, opacity; /* Optimize for hardware acceleration */
    }

    .email-expand-container.expanded {
      opacity: 1;
      max-height: 1000px; /* Adjust as needed for your content */
    }

    /* Enhanced chevron rotation */
    .email-chevron {
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform; /* Optimize for hardware acceleration */
    }

    .email-chevron.rotated {
      transform: rotate(180deg);
    }

    /* Add a slight delay for smoother transitions */
    .email-item {
      transition: transform 0.3s ease, opacity 0.3s ease;
      transition-delay: 0.05s;
    }

    .email-item:hover {
      transform: translateY(-2px);
    }
  `;

  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [analyzingEmailId, setAnalyzingEmailId] = useState(null);
  const [analysisResults, setAnalysisResults] = useState({});
  const [expandedEmailId, setExpandedEmailId] = useState(null);
  const [analyzingAllEmails, setAnalyzingAllEmails] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState("right");
  const [prevFilter, setPrevFilter] = useState("all");

  // Inside the component, add a ref for the expanded content
  const contentRef = useRef(null);

  // OPTIMIZATION: Add these state variables and refs after your existing state
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false); // NEW: Track if component is initialized
  const fetchTimeoutRef = useRef(null);

  // OPTIMIZATION: Email cache with 5-minute expiry
  const emailsCacheRef = useRef({
    data: [],
    timestamp: null,
    userEmail: null,
  });

  // OPTIMIZATION: Memoize the token to prevent unnecessary changes
  const memoizedToken = useMemo(() => token, [token]);

  // OPTIMIZATION: Memoized validation function - STREAMLINED
  const validateRequestParams = useCallback(() => {
    const issues = [];
    if (!authToken && !memoizedToken) issues.push("No token available");
    if (!userEmail) issues.push("No user email");
    if (!connectionStatus) issues.push("No connection status");

    return issues;
  }, [authToken, memoizedToken, userEmail, connectionStatus]);

  // ===== STEP 3: SMALL OPTIMIZATION - Consolidated Error Management =====

  // Utility function to manage errors more efficiently
  const errorManager = useMemo(
    () => ({
      clear: () => setError(""),
      set: (message) => setError(message),
      setWithTimeout: (message, timeout = 5000) => {
        setError(message);
        setTimeout(() => setError(""), timeout);
      },
      conditional: (condition, message) => {
        if (condition) setError(message);
        else setError("");
      },
    }),
    []
  );

  // OPTIMIZATION: Optimized auth useEffect with IMMEDIATE initialization for first load
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const authData = getAuthData();
      if (!mounted) return;

      if (authData?.token) {
        const currentToken = authData.token || memoizedToken || "";
        let email = authData.user?.email || authData.email;

        if (!email) {
          if (mounted) {
            setError("User email not found. Please log in again.");
            setLoading(false);
          }
          return;
        }

        email = email.toLowerCase();

        // OPTIMIZATION: Batch state updates to prevent multiple re-renders
        const isGmailConnected =
          localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
        const connectedEmail = localStorage.getItem(STORAGE_KEYS.GMAIL_EMAIL);
        const connectionValid =
          isGmailConnected &&
          connectedEmail &&
          connectedEmail.toLowerCase() === email.toLowerCase();

        if (mounted) {
          // Batch all state updates together
          setAuthToken(currentToken);
          setUserEmail(email);
          setConnectionStatus(connectionValid);
          setIsInitialized(true); // NEW: Mark as initialized

          if (!connectionValid && isGmailConnected) {
            localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
            localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
            localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);
            setError(
              "Connected Gmail account does not match your logged-in email. Please reconnect."
            );
            setLoading(false);
          }
        }
      } else {
        if (mounted) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          setIsInitialized(true); // Mark as initialized even on error
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, [memoizedToken]);

  // OPTIMIZATION: Memoized fetch full email details (MOVED BEFORE fetchEmails to fix dependency order)
  const fetchFullEmailDetails = useCallback(
    async (emailId) => {
      try {
        const currentToken = authToken || memoizedToken;
        if (!currentToken) {
          return null;
        }

        const response = await fetch(`${API_URL}/api/gmail/emails/${emailId}`, {
          headers: {
            Authorization: `Bearer ${currentToken}`,
            "X-User-Email": userEmail.toLowerCase(),
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch emails: ${response.status} - ${errorText}`
          );
        }

        const emailData = await response.json();

        // Extract subject and from from the API response
        const subjectHeader = emailData.payload.headers.find(
          (header) => header.name === "Subject"
        );
        const fromHeader = emailData.payload.headers.find(
          (header) => header.name === "From"
        );

        // Extract date from headers
        const dateHeader = emailData.payload.headers.find(
          (header) => header.name === "Date"
        );

        const subject = subjectHeader ? subjectHeader.value : "No Subject";
        const from = fromHeader
          ? fromHeader.value.replace(/[<>]/g, "")
          : "Unknown Sender";

        // Extract only the email address
        const email = from.match(/<(.*)>/) ? from.match(/<(.*)>/)[1] : from;

        // Get date from header or fall back to internalDate
        const emailDate = dateHeader
          ? dateHeader.value
          : emailData.internalDate
          ? new Date(parseInt(emailData.internalDate)).toLocaleString()
          : "Apr 18, 2025";

        // Ensure we have basic email structure
        return {
          id: emailId,
          subject: subject,
          from: email, // Only show the email address
          date: emailDate, // Use the extracted date
          body: emailData.snippet || "No content available",
          snippet: emailData.snippet || "",
          ...emailData,
        };
      } catch (err) {
        return null;
      }
    },
    [authToken, memoizedToken, userEmail]
  );

  // OPTIMIZATION: VASTLY IMPROVED fetch function - REMOVED artificial delays and optimized cache
  const fetchEmails = useCallback(
    async (forceRefresh = false) => {
      // Prevent multiple simultaneous calls
      if (isFetching && !forceRefresh) {
        return;
      }

      // OPTIMIZATION: Smart cache check - more lenient for initial loads
      const now = Date.now();
      const cacheValid =
        emailsCacheRef.current.timestamp &&
        now - emailsCacheRef.current.timestamp < 5 * 60 * 1000 &&
        emailsCacheRef.current.userEmail === userEmail;

      // OPTIMIZATION: Use cache more aggressively for better UX, unless force refresh
      if (
        !forceRefresh &&
        cacheValid &&
        emailsCacheRef.current.data.length > 0
      ) {
        setEmails(emailsCacheRef.current.data);
        setFilteredEmails(emailsCacheRef.current.data);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // OPTIMIZATION: Streamlined validation - only check critical requirements
      if (!connectionStatus || !userEmail || (!authToken && !memoizedToken)) {
        if (!forceRefresh) {
          setLoading(false);
          setRefreshing(false);
        }
        return;
      }

      const currentToken = authToken || memoizedToken;

      setIsFetching(true);
      setError("");

      const axiosInstance = axios.create({
        baseURL: API_URL,
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
          "X-User-Email": userEmail.toLowerCase(),
        },
      });

      try {
        const response = await axiosInstance.get("/api/gmail/emails");

        if (
          response.data.userEmail &&
          response.data.userEmail.toLowerCase() !== userEmail.toLowerCase()
        ) {
          localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
          localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
          localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);
          setConnectionStatus(false);
          throw new Error(
            `Logged-in email (${userEmail}) does not match connected Gmail account (${response.data.userEmail}). For security reasons, you must use the same email.`
          );
        }

        let validEmails = [];
        if (!response.data.messages || response.data.messages.length === 0) {
          setEmails([]);
          setFilteredEmails([]);
        } else {
          const fullEmails = await Promise.all(
            response.data.messages.map(
              async (email) => await fetchFullEmailDetails(email.id)
            )
          );

          validEmails = fullEmails.filter(Boolean);
        }

        // OPTIMIZATION: Update cache
        emailsCacheRef.current = {
          data: validEmails,
          timestamp: now,
          userEmail: userEmail,
        };

        setEmails(validEmails);
        setFilteredEmails(validEmails);
      } catch (err) {
        console.error("❌ Axios Error Details:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message,
          url: err.config?.url,
          headers: err.config?.headers,
        });

        // More specific error messages
        if (err.response?.status === 404) {
          setError(
            `User not found. Please check your Gmail connection. (Email: ${userEmail})`
          );
        } else if (err.response?.status === 401) {
          setError("Authentication failed. Please log in again.");
        } else if (err.response?.status === 403) {
          setError("Access denied. Please check your Gmail permissions.");
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to fetch emails"
          );
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setIsFetching(false);
      }
    },
    [
      authToken,
      memoizedToken,
      userEmail,
      connectionStatus,
      fetchFullEmailDetails,
      isFetching,
    ]
  );

  // OPTIMIZATION: COMPLETELY REWRITTEN fetch trigger - NO MORE 500ms DELAY!
  useEffect(() => {
    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // OPTIMIZATION: Only proceed if initialized and we have required data
    if (
      !isInitialized ||
      !connectionStatus ||
      !userEmail ||
      (!authToken && !memoizedToken)
    ) {
      return;
    }

    // OPTIMIZATION: For FIRST load, fetch IMMEDIATELY with minimal delay
    // For subsequent updates, use small debounce to prevent rapid calls
    const isFirstLoad =
      emails.length === 0 && !emailsCacheRef.current.data.length;
    const delay = isFirstLoad ? 0 : 150; // 0ms for first load, 150ms for updates

    fetchTimeoutRef.current = setTimeout(() => {
      fetchEmails();
    }, delay);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [
    isInitialized,
    connectionStatus,
    userEmail,
    authToken,
    memoizedToken,
    fetchEmails,
  ]);

  // OPTIMIZATION: Faster filter handling - reduced delay for better UX
  useEffect(() => {
    if (emails.length === 0) {
      setFilteredEmails([]);
      return;
    }

    // OPTIMIZATION: Reduce delay for initial load, keep small delay for subsequent filters
    const isInitialLoad = filteredEmails.length === 0;
    const delay = isInitialLoad ? 0 : 50; // 0ms for initial, 50ms for smooth transitions

    const filterTimeout = setTimeout(() => {
      // First filter by search term
      let filtered = emails;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = emails.filter(
          (email) =>
            email.subject?.toLowerCase().includes(term) ||
            email.from?.toLowerCase().includes(term) ||
            email.snippet?.toLowerCase().includes(term) ||
            email.body?.toLowerCase().includes(term)
        );
      }

      // Then filter by category
      switch (activeFilter) {
        case "suspicious":
          setFilteredEmails(
            filtered.filter(
              (email) => analysisResults[email.id]?.prediction === "Suspicious"
            )
          );
          break;
        case "safe":
          setFilteredEmails(
            filtered.filter(
              (email) => analysisResults[email.id]?.prediction === "Safe"
            )
          );
          break;
        case "analyzed":
          setFilteredEmails(
            filtered.filter((email) => analysisResults[email.id] !== undefined)
          );
          break;
        case "unanalyzed":
          setFilteredEmails(
            filtered.filter((email) => analysisResults[email.id] === undefined)
          );
          break;
        default:
          setFilteredEmails(filtered);
      }
    }, delay);

    // Cleanup the timeout to avoid memory leaks
    return () => clearTimeout(filterTimeout);
  }, [
    emails,
    analysisResults,
    activeFilter,
    searchTerm,
    filteredEmails.length,
  ]);

  // OPTIMIZATION: Memoized utility functions
  const getRiskColor = useCallback((score) => {
    if (score > 0.7) return "bg-red-500";
    if (score > 0.4) return "bg-orange-500";
    if (score > 0.2) return "bg-yellow-500";
    return "bg-green-500";
  }, []);

  const getRiskLabel = useCallback((score) => {
    if (score > 0.7) return "High Risk";
    if (score > 0.4) return "Medium Risk";
    if (score > 0.2) return "Low Risk";
    return "Very Low Risk";
  }, []);

  const getSentimentIcon = useCallback((sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return <Smile className="h-5 w-5 text-green-400" />;
      case "negative":
        return <Frown className="h-5 w-5 text-red-400" />;
      default:
        return <Meh className="h-5 w-5 text-yellow-400" />;
    }
  }, []);

  const getPredictionBadge = useCallback((prediction) => {
    return prediction === "Safe" ? (
      <Badge variant="safe" size="sm" icon={CheckCircle}>
        Safe
      </Badge>
    ) : (
      <Badge variant="suspicious" size="sm" icon={AlertCircle}>
        Suspicious
      </Badge>
    );
  }, []);

  // ✅ FIXED: Improved mobile-compatible analyze function with better error handling
  const handleAnalyze = useCallback(
    async (emailId, emailContent) => {
      // console.log("🔍 Starting analysis for email:", emailId);

      // ✅ FIXED: Prevent multiple simultaneous analyses
      if (analyzingEmailId && analyzingEmailId !== emailId) {
        // console.log("⏸️ Another analysis in progress, skipping");
        return;
      }

      setAnalyzingEmailId(emailId);
      setError("");

      // ✅ FIXED: Better content validation
      const contentToAnalyze =
        emailContent ||
        emails.find((e) => e.id === emailId)?.body ||
        emails.find((e) => e.id === emailId)?.snippet ||
        "No content available";

      if (!contentToAnalyze.trim()) {
        setError("No email content to analyze");
        setAnalyzingEmailId(null);
        return;
      }

      // ✅ FIXED: Create AbortController for mobile timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000); // Increased to 60 seconds for mobile networks

      try {
        // ✅ FIXED: Better API URL handling with multiple fallbacks
        const getApiUrl = () => {
          // Try environment variable first
          const envUrl = import.meta.env.VITE_FLASK_API_URL;
          if (envUrl && envUrl !== "undefined") {
            return envUrl;
          }

          // Fallback URLs based on current environment
          const currentHost = window.location.hostname;
          if (currentHost === "localhost" || currentHost === "127.0.0.1") {
            return "http://localhost:5000";
          }

          // Production fallback - use environment variable
          return import.meta.env.VITE_FLASK_API_URL || "http://localhost:5000";
        };

        const flaskApiUrl = getApiUrl();
        const apiUrl = `${flaskApiUrl}/predict`;

        // console.log("🌐 Making API request to:", apiUrl);
        // console.log("📱 User agent:", navigator.userAgent);
        // console.log("🔗 Current origin:", window.location.origin);

        // ✅ FIXED: Mobile-optimized fetch request
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            // ✅ FIXED: Mobile-specific headers
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            // ✅ FIXED: Add origin header for CORS
            ...(window.location.origin && {
              Origin: window.location.origin,
            }),
          },
          body: JSON.stringify({ text: contentToAnalyze }),
          signal: controller.signal,
          // ✅ FIXED: Mobile network optimization
          mode: "cors",
          credentials: "omit", // Avoid credentials issues on mobile
          redirect: "follow",
        });

        // Clear the timeout since request completed
        clearTimeout(timeoutId);

        // console.log("📡 Response status:", response.status);
        // console.log("📡 Response ok:", response.ok);

        if (!response.ok) {
          let errorText;
          try {
            const errorData = await response.json();
            errorText =
              errorData.error || errorData.message || `HTTP ${response.status}`;
          } catch (textErr) {
            try {
              errorText = await response.text();
            } catch (finalErr) {
              errorText = `HTTP ${response.status} ${response.statusText}`;
            }
          }

          // ✅ FIXED: Better mobile error messages
          if (response.status === 0 || !response.status) {
            throw new Error(
              "Unable to connect to analysis service. Please check your internet connection."
            );
          } else if (response.status >= 500) {
            throw new Error(
              `Server error (${response.status}). The analysis service is temporarily unavailable.`
            );
          } else if (response.status === 404) {
            throw new Error(
              "Analysis service not found. Please try again later."
            );
          } else if (response.status === 403 || response.status === 401) {
            throw new Error("Access denied to analysis service.");
          } else if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again."
            );
          } else {
            throw new Error(`Analysis failed: ${errorText}`);
          }
        }

        let data;
        try {
          const responseText = await response.text();
          // console.log("📄 Raw response:", responseText);
          data = JSON.parse(responseText);
        } catch (parseErr) {
          console.error("❌ JSON parse error:", parseErr);
          throw new Error(
            "Invalid response from analysis service. Please try again."
          );
        }

        // console.log("✅ Analysis result:", data);

        // ✅ FIXED: Validate response data structure
        if (!data || typeof data !== "object") {
          throw new Error("Invalid response format from analysis service");
        }

        // Ensure required fields exist with defaults
        const suspicionScore =
          typeof data.suspicion_score === "number" ? data.suspicion_score : 0.5;
        const prediction =
          data.prediction || (suspicionScore > 0.5 ? "Suspicious" : "Safe");
        const sentiment = data.sentiment || "neutral";

        // Find the original email to get detailed data
        const originalEmail = emails.find((e) => e.id === emailId);
        const emailDate =
          originalEmail?.date || new Date().toLocaleDateString();

        const result = {
          suspicion_score: suspicionScore,
          prediction: prediction,
          sentiment: sentiment,
          id: emailId,
          subject: originalEmail?.subject || "No Subject",
          from: originalEmail?.from || "Unknown Sender",
          date: emailDate,
          analyzedAt: new Date().toLocaleString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          headers: originalEmail?.payload?.headers || [],
          // Add safe defaults for optional fields
          suspicious_factors: data.suspicious_factors || [],
          safety_factors: data.safety_factors || [],
          method: data.method || "unknown",
        };

        setAnalysisResults((prev) => ({
          ...prev,
          [emailId]: result,
        }));

        // Automatically expand the email to show the results
        setExpandedEmailId(emailId);

        // console.log("✅ Analysis completed successfully");
      } catch (err) {
        // Clear timeout on error
        clearTimeout(timeoutId);

        console.error("❌ Analysis error:", err);

        // ✅ FIXED: Enhanced mobile error handling
        let errorMessage = "Failed to analyze email";

        if (err.name === "AbortError") {
          errorMessage =
            "Analysis timed out. Please check your connection and try again.";
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (
          err.message.includes("CORS") ||
          err.message.includes("cross-origin")
        ) {
          errorMessage =
            "Connection blocked. Please ensure you have a stable internet connection.";
        } else if (
          err.message.includes("ERR_NETWORK") ||
          err.message.includes("ERR_INTERNET_DISCONNECTED")
        ) {
          errorMessage =
            "No internet connection. Please check your network settings.";
        } else if (
          err.message.includes("timeout") ||
          err.message.includes("Timeout")
        ) {
          errorMessage =
            "Request timed out. Mobile networks can be slow - please try again.";
        } else if (
          err.message.includes("TypeError") &&
          err.message.includes("fetch")
        ) {
          errorMessage =
            "Unable to connect to analysis service. Please try again with a better connection.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);

        // ✅ FIXED: Add helpful suggestion for mobile users
        // console.log("💡 Mobile troubleshooting suggestions:");
        // console.log("- Ensure you have a stable internet connection");
        // console.log("- Try switching between WiFi and mobile data");
        // console.log("- Close other apps that might be using bandwidth");
        // console.log("- Try again in a few moments");
      } finally {
        clearTimeout(timeoutId);
        setAnalyzingEmailId(null);
      }
    },
    [emails, analyzingEmailId]
  );

  // ✅ FIXED: Simplified button click handler for better mobile compatibility
  const handleAnalyzeClick = useCallback(
    (e, emailId, emailContent) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent double-clicks on mobile
      if (analyzingEmailId === emailId) {
        return;
      }

      // console.log("🔍 Button clicked for email:", emailId);
      handleAnalyze(emailId, emailContent);
    },
    [analyzingEmailId, handleAnalyze]
  );

  // OPTIMIZATION: Memoized toggle function
  const toggleEmailExpansion = useCallback((emailId) => {
    setExpandedEmailId((prevId) => (prevId === emailId ? null : emailId));
  }, []);

  // OPTIMIZATION: Memoized format function
  const formatEmailBody = useCallback((body) => {
    if (!body) return "No content available";

    // Remove quoted text (lines starting with >)
    const cleanedBody = body
      .split("\n")
      .filter((line) => !line.trim().startsWith(">"))
      .join("\n");

    // Trim whitespace and limit length
    return (
      cleanedBody.trim().slice(0, 1000) +
      (cleanedBody.length > 1000 ? "..." : "")
    );
  }, []);

  // OPTIMIZATION: Memoized analyze all function
  const handleAnalyzeAllEmails = useCallback(async () => {
    if (emails.length === 0) {
      setError("No emails to analyze.");
      return;
    }

    setAnalyzingAllEmails(true);
    setAnalyzeSuccess(false);
    setError("");

    try {
      // Create array of emails with their content
      const emailData = emails.map((email) => ({
        id: email.id,
        subject: email.subject || "No Subject",
        from: email.from || "Unknown Sender",
        date: email.date,
        body: email.body || email.snippet || "",
      }));

      // Use environment variable
      const response = await fetch(
        `${import.meta.env.VITE_FLASK_API_URL}/api/analyze-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken || memoizedToken}`,
          },
          body: JSON.stringify({
            email: userEmail,
            emails: emailData,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server responded with ${response.status}: ${errorText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Update analysis results with the returned data
        const newResults = {};

        data.results.forEach((result) => {
          // Find the original email
          const originalEmail = emails.find((e) => e.id === result.id);

          // Use the date that was already extracted when fetching the email
          const emailDate = originalEmail?.date || "Apr 18, 2025";

          newResults[result.id] = {
            ...result,
            subject: originalEmail?.subject || "No Subject",
            from: originalEmail?.from || "Unknown Sender",
            date: emailDate, // Use the date from the original email
            analyzedAt: new Date().toLocaleString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            headers: originalEmail?.payload?.headers || [],
          };
        });

        setAnalysisResults((prev) => ({
          ...prev,
          ...newResults,
        }));

        // Save to localStorage for dashboard access
        try {
          const existingResultsStr = localStorage.getItem(
            "email_analysis_results"
          );
          const existingResults = existingResultsStr
            ? JSON.parse(existingResultsStr)
            : {};
          const updatedResults = { ...existingResults, ...newResults };
          localStorage.setItem(
            "email_analysis_results",
            JSON.stringify(updatedResults)
          );
          setAnalyzeSuccess(true);
          setTimeout(() => setAnalyzeSuccess(false), 3000);
        } catch (storageError) {
          console.error("Error saving to localStorage:", storageError);
        }
      }
    } catch (err) {
      console.error("Error analyzing all emails:", err);
      setError(`Failed to analyze all emails: ${err.message}`);
    } finally {
      setAnalyzingAllEmails(false);
    }
  }, [emails, authToken, memoizedToken, userEmail]);

  // OPTIMIZATION: Memoized tab position function
  const getTabPosition = useCallback((tabName) => {
    const tabPositions = {
      all: 0,
      suspicious: 1,
      safe: 2,
      analyzed: 3,
      unanalyzed: 4,
    };
    return tabPositions[tabName] || 0;
  }, []);

  // OPTIMIZATION: Streamlined auth update handler with performance improvements
  useEffect(() => {
    const handleForceAuthUpdate = (event) => {
      const { token, user, email } = event.detail;

      if (token && email) {
        const lowercaseEmail = email.toLowerCase();

        // Check Gmail connection
        const isGmailConnected =
          localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
        const connectedEmail = localStorage.getItem(STORAGE_KEYS.GMAIL_EMAIL);
        const connectionValid =
          isGmailConnected &&
          connectedEmail &&
          connectedEmail.toLowerCase() === lowercaseEmail;

        // Batch all state updates for better performance
        setAuthToken(token);
        setUserEmail(lowercaseEmail);
        setConnectionStatus(connectionValid);
        setLoading(false);
        setIsInitialized(true);
      }
    };

    window.addEventListener("forceAuthUpdate", handleForceAuthUpdate);
    return () =>
      window.removeEventListener("forceAuthUpdate", handleForceAuthUpdate);
  }, []);

  // OPTIMIZATION: Enhanced refresh function with instant feedback
  const refreshEmails = useCallback(async () => {
    setRefreshing(true);
    setError(""); // Clear any existing errors
    await fetchEmails(true); // Force refresh
  }, [fetchEmails]);

  // OPTIMIZATION: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  if (!connectionStatus && !loading) {
    return (
      <div className="bg-gradient-to-br from-[#0a192f] to-blue-900 p-6 rounded-lg border border-blue-800/50 shadow-lg">
        <h3 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-blue-300" />
          Recent Emails
        </h3>
        <div className="p-4 bg-blue-800/40 border border-blue-600/50 rounded-md text-blue-200">
          Please connect your Gmail account to view your emails.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#0a192f] to-blue-900 p-3 sm:p-6 rounded-lg border border-blue-800/50 shadow-lg">
      <style dangerouslySetInnerHTML={{ __html: updatedSlidingStyles }} />
      {/* Header with title and user email */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl sm:text-2xl font-semibold text-white flex items-center gap-2 mb-1 sm:mb-2">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
              Your Inbox
            </h3>
            {/* User email displayed directly under the title */}
            <div className="text-blue-300 text-xs sm:text-sm flex items-center">
              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
              <span className="truncate">{userEmail}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshEmails}
              disabled={refreshing}
              className="bg-transparent border-blue-700/40 text-blue-300 hover:bg-blue-800/30 hover:text-blue-100 text-xs sm:text-sm h-8 sm:h-9"
            >
              <RefreshCw
                className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleAnalyzeAllEmails}
              disabled={analyzingAllEmails || filteredEmails.length === 0}
              className="relative text-white shadow-md hover:shadow-purple-500/50 transition-all duration-300 border border-purple-400/30 text-xs sm:text-sm h-8 sm:h-9"
              style={{
                background:
                  "radial-gradient(circle at center, #8B5CF6 0%, #7C3AED 45%, #6D28D9 100%)",
              }}
            >
              {analyzingAllEmails ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5 animate-spin" />
                  <span className="hidden xs:inline">Analyzing...</span>
                  <span className="xs:hidden">Analyzing...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                  <span>Analyze All</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and filter toggle for mobile */}
      <div className="flex gap-2 mb-3 sm:mb-4 sm:hidden">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2.5 sm:pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400/70" />
          </div>
          <Input
            type="text"
            placeholder="Search emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 sm:pl-10 py-1.5 sm:py-2 bg-blue-950/50 border-blue-900/60 text-blue-100 placeholder:text-blue-400/50 w-full rounded-md text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="bg-transparent border-blue-700/40 text-blue-300 px-2 h-8"
        >
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Filter tabs with sliding indicator */}
      <div
        className={`mb-3 sm:mb-4 transition-all duration-300 ease-in-out ${
          isFilterOpen ? "block opacity-100" : "hidden sm:block sm:opacity-100"
        }`}
      >
        <div
          className={`tab-container ${activeFilter} bg-blue-950/50 backdrop-blur-sm rounded-lg p-0.5 sm:p-1 flex overflow-x-auto hide-scrollbar`}
        >
          <button
            onClick={() => {
              const newDirection =
                getTabPosition("all") < getTabPosition(activeFilter)
                  ? "left"
                  : "right";
              setTransitionDirection(newDirection);
              setPrevFilter(activeFilter);
              setActiveFilter("all");
            }}
            className={`tab-button ${
              activeFilter === "all" ? "active" : ""
            } flex-1 flex items-center justify-center whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm ${
              activeFilter === "all"
                ? "text-white font-medium"
                : "text-blue-300 hover:bg-blue-800/30"
            }`}
          >
            <Inbox
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-300 ${
                activeFilter === "all" ? "scale-110" : ""
              }`}
            />
            <span className="hidden xs:inline">All</span>
            <span className="xs:hidden">All</span>
            {emails.length > 0 && (
              <span
                className={`ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full transition-colors duration-300 ${
                  activeFilter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-blue-800/50 text-blue-200"
                }`}
              >
                {emails.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              const newDirection =
                getTabPosition("suspicious") < getTabPosition(activeFilter)
                  ? "left"
                  : "right";
              setTransitionDirection(newDirection);
              setPrevFilter(activeFilter);
              setActiveFilter("suspicious");
            }}
            className={`tab-button ${
              activeFilter === "suspicious" ? "active" : ""
            } flex-1 flex items-center justify-center whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm ${
              activeFilter === "suspicious"
                ? "text-white font-medium"
                : "text-blue-300 hover:bg-blue-800/30"
            }`}
          >
            <AlertTriangle
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-300 ${
                activeFilter === "suspicious" ? "scale-110" : ""
              }`}
            />
            <span className="hidden sm:inline">Suspicious</span>
            <span className="sm:hidden">Sus</span>
            {emails.filter(
              (email) => analysisResults[email.id]?.prediction === "Suspicious"
            ).length > 0 && (
              <span
                className={`ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full transition-colors duration-300 ${
                  activeFilter === "suspicious"
                    ? "bg-red-500 text-white"
                    : "bg-blue-800/50 text-blue-200"
                }`}
              >
                {
                  emails.filter(
                    (email) =>
                      analysisResults[email.id]?.prediction === "Suspicious"
                  ).length
                }
              </span>
            )}
          </button>

          <button
            onClick={() => {
              const newDirection =
                getTabPosition("safe") < getTabPosition(activeFilter)
                  ? "left"
                  : "right";
              setTransitionDirection(newDirection);
              setPrevFilter(activeFilter);
              setActiveFilter("safe");
            }}
            className={`tab-button ${
              activeFilter === "safe" ? "active" : ""
            } flex-1 flex items-center justify-center whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm ${
              activeFilter === "safe"
                ? "text-white font-medium"
                : "text-blue-300 hover:bg-blue-800/30"
            }`}
          >
            <ShieldCheck
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-300 ${
                activeFilter === "safe" ? "scale-110" : ""
              }`}
            />
            <span className="hidden sm:inline">Safe</span>
            <span className="sm:hidden">Safe</span>
            {emails.filter(
              (email) => analysisResults[email.id]?.prediction === "Safe"
            ).length > 0 && (
              <span
                className={`ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full transition-colors duration-300 ${
                  activeFilter === "safe"
                    ? "bg-green-500 text-white"
                    : "bg-blue-800/50 text-blue-200"
                }`}
              >
                {
                  emails.filter(
                    (email) => analysisResults[email.id]?.prediction === "Safe"
                  ).length
                }
              </span>
            )}
          </button>

          <button
            onClick={() => {
              const newDirection =
                getTabPosition("analyzed") < getTabPosition(activeFilter)
                  ? "left"
                  : "right";
              setTransitionDirection(newDirection);
              setPrevFilter(activeFilter);
              setActiveFilter("analyzed");
            }}
            className={`tab-button ${
              activeFilter === "analyzed" ? "active" : ""
            } flex-1 flex items-center justify-center whitespace-nowrap px-2 sm:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 ease-in-out text-xs sm:text-sm ${
              activeFilter === "analyzed"
                ? "text-white font-medium"
                : "text-blue-300 hover:bg-blue-800/30"
            }`}
          >
            <CheckCircle
              className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 transition-transform duration-300 ${
                activeFilter === "analyzed" ? "scale-110" : ""
              }`}
            />
            <span className="hidden sm:inline">Analyzed</span>
            <span className="sm:hidden">Done</span>
            {emails.filter((email) => analysisResults[email.id] !== undefined)
              .length > 0 && (
              <span
                className={`ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded-full transition-colors duration-300 ${
                  activeFilter === "analyzed"
                    ? "bg-purple-500 text-white"
                    : "bg-blue-800/50 text-blue-200"
                }`}
              >
                {
                  emails.filter(
                    (email) => analysisResults[email.id] !== undefined
                  ).length
                }
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search bar - hidden on mobile */}
      <div className="hidden sm:block mb-4 sm:mb-5">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-blue-400/70" />
          </div>
          <Input
            type="text"
            placeholder="Search subject, sender or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 py-2 bg-blue-950/50 border-blue-900/60 text-blue-100 placeholder:text-blue-400/50 w-full rounded-md"
          />
          {searchTerm && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-300"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Success message */}
      {analyzeSuccess && (
        <div className="p-2 sm:p-3 mb-3 sm:mb-4 bg-green-900/40 border border-green-600/50 rounded-md flex items-start gap-2 sm:gap-3">
          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm text-green-200">
              All emails analyzed successfully! Dashboard metrics have been
              updated.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-6 sm:py-8 bg-blue-900/30 rounded-lg border border-blue-800/30">
          <div className="relative">
            <div className="p-2 sm:p-3 bg-blue-800/50 rounded-full">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-purple-300" />
            </div>
            <Sparkles className="absolute top-0 right-0 h-4 w-4 sm:h-5 sm:w-5 text-purple-300 animate-pulse" />
          </div>
          <p className="text-blue-200 mt-3 sm:mt-4 font-medium text-sm sm:text-base">
            Loading your emails...
          </p>
          <p className="text-blue-400 text-xs sm:text-sm mt-1">
            This may take a moment
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 sm:p-4 mb-3 sm:mb-4 bg-red-900/40 border border-red-700/50 rounded-md flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base">
              Error
            </h3>
            <p className="text-xs sm:text-sm text-red-200 break-words">
              {error}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-300 hover:text-red-100 hover:bg-red-900/50 ml-auto p-1"
            onClick={() => setError("")}
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )}

      {/* Email list */}
      {filteredEmails.length > 0 && (
        <div style={{ minHeight: "200px" }}>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filteredEmails.map((email) => {
              const hasAnalysis = analysisResults[email.id] !== undefined;
              const isExpanded = expandedEmailId === email.id;
              const isSuspicious =
                hasAnalysis &&
                analysisResults[email.id].prediction === "Suspicious";

              return (
                <div
                  key={email.id}
                  className={`bg-[#1a2a3a]/70 rounded-lg border transition-all duration-300 ease-in-out overflow-hidden ${
                    isExpanded ? "shadow-lg" : "hover:shadow-md"
                  } ${
                    isSuspicious
                      ? "border-red-500/30"
                      : hasAnalysis
                      ? "border-green-500/30"
                      : "border-blue-800/30"
                  }`}
                >
                  {/* Header section - always visible */}
                  <div
                    className={`p-3 sm:p-4 cursor-pointer group ${
                      isExpanded
                        ? isSuspicious
                          ? "bg-red-900/20 border-b border-red-500/30"
                          : hasAnalysis
                          ? "bg-green-900/20 border-b border-green-500/30"
                          : "bg-blue-900/20 border-b border-blue-800/30"
                        : "hover:bg-blue-900/10"
                    }`}
                    onClick={() => toggleEmailExpansion(email.id)}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-1.5">
                          {/* Email status indicators */}
                          {hasAnalysis && (
                            <div className="flex-shrink-0 order-2 sm:order-1">
                              {isSuspicious ? (
                                <Badge
                                  variant="suspicious"
                                  size="sm"
                                  icon={AlertCircle}
                                  className="animate-pulse text-xs"
                                >
                                  Suspicious
                                </Badge>
                              ) : (
                                <Badge
                                  variant="safe"
                                  size="sm"
                                  icon={CheckCircle}
                                  className="text-xs"
                                >
                                  Safe
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Subject line */}
                          <h3 className="font-medium text-white truncate text-sm sm:text-base order-1 sm:order-2">
                            {email.subject || "No Subject"}
                          </h3>
                        </div>

                        {/* Meta information */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-x-3 sm:gap-y-1 flex-wrap text-xs sm:text-sm">
                          <span className="text-blue-300 inline-flex items-center gap-1">
                            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate max-w-[200px] sm:max-w-[200px]">
                              {email.from || "Unknown"}
                            </span>
                          </span>

                          <span className="text-blue-400/70 inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span>
                              {new Date(email.date).toLocaleDateString()}
                            </span>
                          </span>

                          {hasAnalysis && (
                            <span className="text-purple-300/70 inline-flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                              <span>
                                Analyzed: {analysisResults[email.id].analyzedAt}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Preview text */}
                        <p className="text-gray-300 mt-1.5 sm:mt-2 line-clamp-2 text-xs sm:text-sm">
                          {email.snippet ||
                            formatEmailBody(email.body).slice(0, 100)}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-1.5 ml-2">
                        {!hasAnalysis && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-gradient-to-r from-purple-600/80 to-indigo-600/80 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow-purple-500/20 transition-all duration-200 text-[10px] sm:text-xs h-7 sm:h-7 px-2 sm:px-2 min-w-[60px] sm:min-w-[70px] z-10"
                            onClick={(e) =>
                              handleAnalyzeClick(
                                e,
                                email.id,
                                email.body || email.snippet || ""
                              )
                            }
                            disabled={analyzingEmailId === email.id}
                          >
                            {analyzingEmailId === email.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Zap className="h-3 w-3 mr-1 flex-shrink-0" />
                              </>
                            )}
                          </Button>
                        )}

                        <div className="p-0.5 sm:p-1 rounded-full bg-blue-800/30">
                          <ChevronDown
                            className={`h-4 w-4 sm:h-5 sm:w-5 text-blue-200 email-chevron ${
                              isExpanded ? "rotated" : ""
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div
                      className={`email-expand-container ${
                        isExpanded ? "expanded" : ""
                      }`}
                      ref={contentRef}
                      style={{
                        maxHeight: isExpanded
                          ? `${contentRef.current?.scrollHeight || 1000}px`
                          : "0",
                      }}
                    >
                      <div className="p-3 sm:p-4 bg-blue-900/10">
                        {/* Email body */}
                        <div className="mb-3 sm:mb-4">
                          <div className="p-3 sm:p-4 bg-[#0a192f]/60 rounded-lg border border-blue-800/20 text-xs sm:text-sm whitespace-pre-wrap overflow-auto max-h-48 sm:max-h-60 text-blue-100">
                            {formatEmailBody(email.body)}
                          </div>
                        </div>

                        {/* Analysis results */}
                        {hasAnalysis ? (
                          <div className="mt-3 sm:mt-4 bg-[#1e293b]/70 p-3 sm:p-4 rounded-lg border border-blue-800/30">
                            <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                              Security Analysis Results
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                              {/* Risk Assessment */}
                              <div className="bg-[#0d1829]/80 p-3 sm:p-4 rounded-lg border border-blue-700/20 shadow-sm">
                                <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                                  <span className="text-white">
                                    Risk Assessment
                                  </span>
                                </h3>
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                                      <span className="text-blue-200">
                                        Suspicion Level
                                      </span>
                                      <span className="font-medium text-white">
                                        {getRiskLabel(
                                          analysisResults[email.id]
                                            .suspicion_score
                                        )}
                                      </span>
                                    </div>
                                    <div className="bg-blue-900/30 h-2 sm:h-2.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${getRiskColor(
                                          analysisResults[email.id]
                                            .suspicion_score
                                        )}`}
                                        style={{
                                          width: `${
                                            analysisResults[email.id]
                                              .suspicion_score * 100
                                          }%`,
                                        }}
                                      ></div>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 sm:mt-2">
                                      <span className="text-[10px] sm:text-xs text-blue-300">
                                        Safe
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-blue-300 font-medium">
                                        Score:{" "}
                                        {analysisResults[
                                          email.id
                                        ].suspicion_score.toFixed(3)}
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-red-300">
                                        Risky
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Sentiment Analysis */}
                              <div className="bg-[#0d1829]/80 p-3 sm:p-4 rounded-lg border border-blue-700/20 shadow-sm">
                                <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
                                  {getSentimentIcon(
                                    analysisResults[email.id].sentiment
                                  )}
                                  <span className="text-white">
                                    Sentiment Analysis
                                  </span>
                                </h3>
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                                      <span className="text-blue-200">
                                        Overall Tone
                                      </span>
                                      <span className="font-medium capitalize text-white">
                                        {analysisResults[
                                          email.id
                                        ].sentiment?.toLowerCase() || "neutral"}
                                      </span>
                                    </div>

                                    <div className="bg-blue-900/30 h-2 sm:h-2.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          analysisResults[
                                            email.id
                                          ].sentiment?.toLowerCase() ===
                                          "negative"
                                            ? "bg-red-500"
                                            : analysisResults[
                                                email.id
                                              ].sentiment?.toLowerCase() ===
                                              "positive"
                                            ? "bg-green-500"
                                            : "bg-yellow-500"
                                        }`}
                                        style={{
                                          width: `${
                                            analysisResults[
                                              email.id
                                            ].sentiment?.toLowerCase() ===
                                            "negative"
                                              ? "80%"
                                              : analysisResults[
                                                  email.id
                                                ].sentiment?.toLowerCase() ===
                                                "positive"
                                              ? "20%"
                                              : "50%"
                                          }`,
                                        }}
                                      ></div>
                                    </div>

                                    <div className="flex justify-between mt-1 sm:mt-2">
                                      <span className="text-[10px] sm:text-xs text-green-300">
                                        Positive
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-yellow-300">
                                        Neutral
                                      </span>
                                      <span className="text-[10px] sm:text-xs text-red-300">
                                        Negative
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Prediction */}
                              <div className="bg-[#0d1829]/80 p-3 sm:p-4 rounded-lg border border-blue-700/20 shadow-sm flex flex-col sm:col-span-2 lg:col-span-1">
                                <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 flex items-center gap-2">
                                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                                  <span className="text-white">
                                    Final Assessment
                                  </span>
                                </h3>

                                <div className="flex-1 flex flex-col items-center justify-center">
                                  <div
                                    className={`p-3 sm:p-4 rounded-full ${
                                      analysisResults[email.id].prediction ===
                                      "Safe"
                                        ? "bg-green-900/20 border border-green-700/30"
                                        : "bg-red-900/20 border border-red-700/30"
                                    }`}
                                  >
                                    {analysisResults[email.id].prediction ===
                                    "Safe" ? (
                                      <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-400" />
                                    ) : (
                                      <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
                                    )}
                                  </div>

                                  <span
                                    className={`mt-2 sm:mt-3 text-base sm:text-lg font-semibold ${
                                      analysisResults[email.id].prediction ===
                                      "Safe"
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {analysisResults[email.id].prediction}
                                  </span>

                                  <span className="text-[10px] sm:text-xs text-blue-300 mt-1 sm:mt-2 text-center">
                                    {analysisResults[email.id].prediction ===
                                    "Safe"
                                      ? "This email appears to be legitimate"
                                      : "This email contains suspicious elements"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Key Indicators - Hidden on mobile */}
                            <div className="hidden sm:block mt-4 sm:mt-6 bg-[#0d1829]/80 p-3 sm:p-4 rounded-lg border border-blue-700/20">
                              <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-3 text-white">
                                Key Indicators
                              </h3>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                  <h4 className="text-blue-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                                    Suspicious Factors
                                  </h4>
                                  <ul className="space-y-1 sm:space-y-1.5">
                                    {analysisResults[email.id]
                                      .suspicious_factors?.length > 0 ? (
                                      analysisResults[
                                        email.id
                                      ].suspicious_factors.map(
                                        (factor, idx) => (
                                          <li
                                            key={idx}
                                            className="text-xs sm:text-sm text-red-200 flex items-start gap-2"
                                          >
                                            <span className="inline-block h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                                            {factor}
                                          </li>
                                        )
                                      )
                                    ) : (
                                      <li className="text-xs sm:text-sm text-gray-400">
                                        No major suspicious factors detected
                                      </li>
                                    )}
                                  </ul>
                                </div>

                                <div>
                                  <h4 className="text-blue-300 text-xs sm:text-sm font-medium mb-2 flex items-center gap-1.5">
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                                    Safety Indicators
                                  </h4>
                                  <ul className="space-y-1 sm:space-y-1.5">
                                    {analysisResults[email.id].safety_factors
                                      ?.length > 0 ? (
                                      analysisResults[
                                        email.id
                                      ].safety_factors.map((factor, idx) => (
                                        <li
                                          key={idx}
                                          className="text-xs sm:text-sm text-green-200 flex items-start gap-2"
                                        >
                                          <span className="inline-block h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></span>
                                          {factor}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-xs sm:text-sm text-gray-400">
                                        No significant safety indicators found
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                              <span className="text-blue-400">
                                Analyzed at:{" "}
                                {analysisResults[email.id].analyzedAt}
                              </span>

                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/50 text-xs h-7 sm:h-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAnalyze(email.id, email.body);
                                }}
                              >
                                <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
                                Re-analyze
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-center items-center mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-900/20 rounded-lg border border-blue-800/30">
                            <div className="text-center">
                              <p className="text-blue-200 mb-1 sm:mb-2 text-xs sm:text-sm">
                                This email hasn't been analyzed yet.
                              </p>
                              <p className="text-blue-300 text-xs">
                                Hover over the email and click the "Analyze"
                                button to check for suspicious content.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredEmails.length === 0 && (
        <div style={{ minHeight: "200px" }}>
          <div className="p-4 sm:p-6 bg-blue-900/30 border border-blue-800/30 rounded-lg text-center">
            <div className="inline-flex items-center justify-center p-2.5 sm:p-3 bg-blue-800/40 rounded-full mb-2 sm:mb-3">
              <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2">
              No emails found
            </h3>
            <p className="text-blue-300 max-w-md mx-auto text-xs sm:text-sm">
              {activeFilter !== "all"
                ? `No emails match the "${activeFilter}" filter. Try changing your filter or refresh.`
                : "Your inbox is empty or emails are still loading. Try refreshing."}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 sm:mt-4 border-blue-700/50 text-blue-300 hover:bg-blue-800/50 text-xs sm:text-sm h-8"
              onClick={() => {
                if (activeFilter !== "all") {
                  setActiveFilter("all");
                } else {
                  refreshEmails();
                }
              }}
            >
              {activeFilter !== "all" ? "Show all emails" : "Refresh emails"}
            </Button>
          </div>
        </div>
      )}

      {/* Export button */}
      {Object.keys(analysisResults).length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-end gap-2 mt-4 sm:mt-6 pt-4 border-t border-blue-800/30">
          <GradientButton
            onClick={() => {
              try {
                import("../utils/export").then((exportModule) => {
                  const data = Object.values(analysisResults);
                  if (data.length > 0) {
                    exportModule.exportToCSV(
                      data,
                      `email-analysis-${
                        new Date().toISOString().split("T")[0]
                      }.csv`
                    );
                  }
                });
              } catch (err) {
                console.warn("CSV export failed:", err);
              }
            }}
            className="w-full sm:w-auto px-4 py-2 text-white rounded-md flex items-center justify-center transition-all duration-300 relative shadow-md hover:shadow-blue-500/50 border border-blue-400/30 text-sm"
            colors={{
              glowStart: "#7DD3FC",
              glowEnd: "#0EA5E9",
              gradientStart: "#0EA5E9",
              gradientEnd: "#0369A1",
            }}
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Download className="h-4 w-4" />
              <span>Export Results</span>
            </div>
          </GradientButton>
        </div>
      )}
    </div>
  );
}

// OPTIMIZATION: Properly memoize the component
const EmailDisplay = React.memo(EmailDisplayComponent);

// OPTIMIZATION: Set display name for React DevTools
EmailDisplay.displayName = "EmailDisplay";

export default EmailDisplay;
