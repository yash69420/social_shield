import React, { useState, useRef, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import GmailConnector from "../components/gmailconnector";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Mail,
  Trash2,
  AlertTriangle,
  X,
  Lock,
  Eye,
  EyeOff,
  FileText,
  Database,
  CheckCircle,
  MailCheck,
  Shield,
  Clock,
  Zap,
  HelpCircle,
  Check,
  RefreshCw,
  Bell,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getAuthData, completeLogout } from "../utils/auth";
import axios from "axios";
import { STORAGE_KEYS, API_URL } from "../config/constant";
import { useToast } from "../components/ui/toast";
import GradientButton from "../components/ui/GradientButton";

// Custom Modal Component - Fixed with smaller width
const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Handle outside clicks
      const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          onClose();
        }
      };

      // Handle Escape key
      const handleEscapeKey = (event) => {
        if (event.key === "Escape") {
          onClose();
        }
      };

      // Prevent scrolling
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscapeKey);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscapeKey);
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Portal the modal directly to document.body
  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        transition: "all 0.2s ease-out",
      }}
    >
      <div
        ref={modalRef}
        className="modal-content"
        style={{
          backgroundColor: "#0a192f",
          border: "1px solid rgba(30, 41, 59, 0.8)",
          color: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.4)",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflow: "auto",
          margin: "1rem",
          position: "relative",
          zIndex: 10000,
          animation: "modalFadeIn 0.25s ease-out forwards",
        }}
      >
        <style>
          {`
            @keyframes modalFadeIn {
              from {
                opacity: 0;
                transform: scale(0.98);
              }
              to {
                opacity: 1;
                transform: scale(1);
              }
            }
            
            .modal-content::-webkit-scrollbar {
              width: 6px;
            }
            
            .modal-content::-webkit-scrollbar-track {
              background: rgba(15, 23, 42, 0.6);
            }
            
            .modal-content::-webkit-scrollbar-thumb {
              background: rgba(51, 65, 85, 0.6);
              border-radius: 3px;
            }
            
            .modal-content::-webkit-scrollbar-thumb:hover {
              background: rgba(71, 85, 105, 0.8);
            }

            @media (max-width: 640px) {
              .modal-content {
                max-width: calc(100vw - 2rem) !important;
                margin: 1rem !important;
              }
            }
          `}
        </style>
        {children}
      </div>
    </div>,
    document.body
  );
};

const Settings = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showPrivacyInfo, setShowPrivacyInfo] = useState(false);
  const [activeTab, setActiveTab] = useState("gmail");
  const [gmailConnected, setGmailConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { addToast } = useToast();

  // Flag to completely disable toasts until user interaction
  const allowToastsRef = useRef(false);

  // Key ref to keep GmailConnector stable across renders
  const gmailConnectorKey = useRef(`gmail-connector-${Date.now()}`);

  // Initialize connection state without triggering effects
  useEffect(() => {
    const isConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
    setGmailConnected(isConnected);

    // Wait a bit before allowing toasts to ensure all initial rendering is complete
    const timer = setTimeout(() => {
      allowToastsRef.current = true;
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Custom state setter that only updates if there's a real change
  const updateGmailConnected = useCallback(
    (newState) => {
      setGmailConnected((prevState) => {
        if (prevState !== newState) {
          // Only show toast if we're allowing toasts AND there's an actual state change
          if (allowToastsRef.current) {
            if (newState) {
              addToast(
                "Gmail successfully connected! Your emails are now protected.",
                "success"
              );
            } else {
              addToast(
                "Gmail disconnected. Reconnect anytime to restore protection.",
                "info"
              );
            }
          }
          return newState;
        }
        return prevState;
      });
    },
    [addToast]
  );

  const authData = getAuthData();
  const user = authData?.user || null;

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError("Please type 'delete' to confirm");
      return;
    }

    if (!user || !user.email) {
      setDeleteError("No user found. Please log in again.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      // Call the API to delete user data
      const response = await axios.delete(`${API_URL}/api/user/delete`, {
        data: { email: user.email },
        headers: {
          "Content-Type": "application/json",
          Authorization: authData?.token ? `Bearer ${authData.token}` : "",
        },
      });

      // Handle successful deletion
      setDeleteSuccess(true);
      addToast("Account deleted successfully. Redirecting...", "success");

      // Clear ALL local storage and session data after a short delay
      setTimeout(() => {
        completeLogout();
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError(
        error.response?.data?.message ||
          "An error occurred while deleting your account. Please try again."
      );
      addToast("Failed to delete account. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.setItem(STORAGE_KEYS.GMAIL_CONNECTED, "false");
    updateGmailConnected(false);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  const handleDarkModeToggle = () => {
    const newTheme = !darkMode ? "dark" : "light";
    localStorage.setItem("theme", newTheme);
    setDarkMode(!darkMode);
    // Apply theme to document
    document.documentElement.className = newTheme;
  };

  // Simple toggle button instead of Switch component
  const Toggle = ({ checked, onChange, label }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );

  // Define tabs with improved properties
  const tabs = [
    {
      id: "gmail",
      label: "Gmail Connection",
      icon: <Mail className="h-4 w-4" />,
    },
    {
      id: "data",
      label: "Data Management",
      icon: <Database className="h-4 w-4" />,
    },
  ];

  // Enhanced tab styles CSS
  const tabStyles = `
    .settings-tabs {
      position: relative;
      overflow: hidden;
      border-radius: 0.75rem;
      background: linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8));
      backdrop-filter: blur(8px);
      padding: 0.25rem;
      border: 1px solid rgba(99, 102, 241, 0.2);
      box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.3), 
                  inset 0 1px 1px rgba(255, 255, 255, 0.07);
    }
    
    .tab-indicator {
      position: absolute;
      height: 85%;
      z-index: 0;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 0.5rem;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      background: linear-gradient(to right, #7c3aed, #6366f1);
      box-shadow: 0 0 12px rgba(123, 0, 255, 0.4);
    }
    
    .tab-indicator.gmail {
      left: 0.25rem;
      width: calc(50% - 0.5rem);
    }
    
    .tab-indicator.data {
      left: calc(50% + 0.25rem);
      width: calc(50% - 0.5rem);
    }
    
    .tab-button {
      position: relative;
      z-index: 10;
      transition: all 0.3s ease;
    }
    
    .tab-button.active .tab-icon {
      transform: scale(1.15);
      filter: drop-shadow(0 0 3px rgba(255, 255, 255, 0.5));
    }
    
    .tab-button.active .tab-text {
      font-weight: 500;
    }
    
    .tab-icon {
      transition: all 0.3s ease;
    }
  `;

  const closeDeleteModal = () => {
    if (!isDeleting) {
      setDeleteModalOpen(false);
      setDeleteConfirmText("");
      setDeleteError("");
      setDeleteSuccess(false);
    }
  };

  return (
    <div className="p-1 sm:p-3 lg:p-6 max-w-4xl mx-auto text-[rgb(var(--foreground))]">
      {/* Add the CSS styles */}
      <style>{tabStyles}</style>

      <div className="flex justify-between items-center mb-2 sm:mb-3 lg:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2 sm:gap-3 text-[rgb(var(--foreground))]">
          <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-[rgb(var(--primary))]" />
          Settings
        </h1>
      </div>

      {/* PROMINENT GMAIL CONNECTION SECTION */}
      <Card className="bg-gradient-to-b from-white to-purple-50 dark:from-purple-900 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/50 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20 mb-2 sm:mb-3 lg:mb-6">
        <div className="p-2 sm:p-3 md:p-4 lg:p-5 flex flex-col gap-2 sm:gap-3 items-center">
          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full border border-purple-200/70 dark:border-purple-700/30">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-purple-500 dark:text-purple-400" />
          </div>

          <div className="flex-grow text-center">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-purple-700 dark:text-purple-300">
              {gmailConnected ? "Gmail Connected" : "Connect Your Gmail"}
            </h2>
            <p className="text-purple-700 dark:text-purple-300 text-xs sm:text-sm opacity-80 mb-1 sm:mb-2 max-w-md mx-auto">
              {gmailConnected
                ? "Your Gmail account is connected for email security analysis"
                : "Enable email security analysis by connecting your Gmail account"}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-center">
            {!gmailConnected ? (
              <div
                key={gmailConnectorKey.current}
                className="relative overflow-hidden rounded-md w-full sm:w-auto"
              >
                <GmailConnector
                  onConnect={(connected) => {
                    if (connected) {
                      updateGmailConnected(true);
                    }
                  }}
                >
                  {({ handleConnect, isConnecting }) => (
                    <GradientButton
                      onClick={handleConnect}
                      className="py-1.5 sm:py-2 lg:py-2.5 px-3 sm:px-4 lg:px-6 text-sm sm:text-base lg:text-lg font-bold tracking-wide flex items-center justify-center gap-2 w-full sm:min-w-[200px]"
                      colors={{
                        glowStart: "#A78BFA",
                        glowEnd: "#7C3AED",
                        gradientStart: "#6D28D9",
                        gradientEnd: "#5B21B6",
                      }}
                    >
                      {isConnecting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 animate-spin" />
                          <span className="text-xs sm:text-sm lg:text-base">
                            Connecting...
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                          <span className="text-xs sm:text-sm lg:text-base">
                            Connect Gmail
                          </span>
                        </div>
                      )}
                    </GradientButton>
                  )}
                </GmailConnector>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center border border-purple-500/30 dark:border-purple-700/30 rounded-md px-2 sm:px-3 py-1 sm:py-1.5 w-full sm:w-auto">
                <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto justify-center sm:justify-start">
                  <div className="text-purple-500 dark:text-purple-400">
                    <MailCheck className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5" />
                  </div>

                  <div className="min-w-0 flex-1 sm:flex-none">
                    <span className="text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-medium truncate block">
                      {user?.email || "Your Gmail"}
                    </span>
                  </div>

                  <div className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      Connected
                    </span>
                  </div>

                  <button
                    onClick={handleDisconnect}
                    className="relative group ml-1 sm:ml-1.5 lg:ml-2.5 pl-1 sm:pl-1.5 lg:pl-2.5 border-l border-purple-500/20 dark:border-purple-700/30"
                  >
                    <div className="relative overflow-hidden px-1 sm:px-1.5 lg:px-2.5 py-0.5 sm:py-1 rounded-md">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/5 group-hover:via-red-500/10 group-hover:to-red-500/5 transition-all duration-300 ease-out"></div>
                      <span className="relative z-10 text-xs font-medium text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300 transition-colors">
                        Disconnect
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-1 sm:left-1.5 lg:left-2.5 right-1 sm:right-1.5 lg:right-2.5 h-[1px] bg-red-500/0 group-hover:bg-red-500/30 transform origin-left scale-x-0 group-hover:scale-x-100 transition-all duration-300 ease-out"></div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!gmailConnected && (
          <div className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-purple-50 dark:bg-purple-900/20 border-t border-purple-200/50 dark:border-purple-800/50">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-purple-700 dark:text-purple-300 text-xs">
                Connecting your Gmail account is required for complete security
                protection
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Professional tab navigation */}
      <div className="mb-2 sm:mb-3 lg:mb-6">
        <div className="settings-tabs">
          {/* Moving background indicator */}
          <div className={`tab-indicator ${activeTab}`}></div>

          {/* Tab buttons */}
          <div className="flex relative z-10">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button flex items-center gap-1 sm:gap-2 py-1.5 sm:py-2 lg:py-2.5 px-2 sm:px-3 lg:px-5 rounded-md transition-all duration-300 basis-1/2 justify-center ${
                  activeTab === tab.id
                    ? "active text-white"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                <span
                  className={`tab-icon transition-transform duration-300 ${
                    activeTab === tab.id ? "text-white" : "opacity-70"
                  }`}
                >
                  {tab.icon}
                </span>
                <span className="tab-text ml-0.5 sm:ml-1 lg:ml-1.5 text-xs sm:text-sm lg:text-base">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content - Fixed positioning */}
      <div className="relative">
        {/* Gmail tab content */}
        {activeTab === "gmail" && (
          <div className="transition-opacity duration-300 ease-in-out">
            <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900 mb-2 sm:mb-3 lg:mb-6 border border-purple-800/50 shadow-lg">
              <CardHeader className="p-2 sm:p-3 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-300" />
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-2xl text-white">
                      Gmail Connection Details
                    </CardTitle>
                    <CardDescription className="text-purple-300 text-xs sm:text-sm">
                      How your Gmail connection works with our security features
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 lg:space-y-6 p-2 sm:p-3 lg:p-6 pt-0">
                {/* Gmail Connection Process */}
                <div className="bg-[#1a2a3a] p-2 sm:p-3 lg:p-5 rounded-lg border border-purple-800/30">
                  <h3 className="font-semibold text-white mb-1.5 sm:mb-2 lg:mb-4 flex items-center gap-2">
                    <MailCheck className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-400" />
                    <span className="text-xs sm:text-sm lg:text-base">
                      How Gmail Connection Works
                    </span>
                  </h3>

                  <ol className="space-y-1.5 sm:space-y-2 lg:space-y-4 relative border-l border-purple-800 pl-3 sm:pl-4 lg:pl-8 pb-1">
                    <li className="mb-2 sm:mb-3 lg:mb-10">
                      <div className="absolute w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-purple-900 rounded-full -left-2.5 sm:-left-3 lg:-left-4 flex items-center justify-center border border-purple-700">
                        <span className="text-purple-300 font-bold text-xs">
                          1
                        </span>
                      </div>
                      <h4 className="text-purple-300 font-medium text-xs sm:text-sm lg:text-base">
                        Secure Authorization
                      </h4>
                      <p className="text-purple-100 text-xs mt-0.5 sm:mt-1">
                        You'll be redirected to Google's secure login page where
                        you'll grant us read-only access to your emails
                      </p>
                    </li>

                    <li className="mb-2 sm:mb-3 lg:mb-10">
                      <div className="absolute w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-purple-900 rounded-full -left-2.5 sm:-left-3 lg:-left-4 flex items-center justify-center border border-purple-700">
                        <span className="text-purple-300 font-bold text-xs">
                          2
                        </span>
                      </div>
                      <h4 className="text-purple-300 font-medium text-xs sm:text-sm lg:text-base">
                        Email Analysis
                      </h4>
                      <p className="text-purple-100 text-xs mt-0.5 sm:mt-1">
                        Our system will scan your recent emails to detect
                        potential phishing threats and security risks
                      </p>
                    </li>

                    <li className="mb-2 sm:mb-3 lg:mb-6">
                      <div className="absolute w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-purple-900 rounded-full -left-2.5 sm:-left-3 lg:-left-4 flex items-center justify-center border border-purple-700">
                        <span className="text-purple-300 font-bold text-xs">
                          3
                        </span>
                      </div>
                      <h4 className="text-purple-300 font-medium text-xs sm:text-sm lg:text-base">
                        Realtime Protection
                      </h4>
                      <p className="text-purple-100 text-xs mt-0.5 sm:mt-1">
                        Get instant alerts when suspicious emails are detected
                        in your inbox
                      </p>
                    </li>

                    <li>
                      <div className="absolute w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-green-800 rounded-full -left-2.5 sm:-left-3 lg:-left-4 flex items-center justify-center border border-green-700">
                        <CheckCircle className="h-3 w-3 sm:h-3 sm:w-3 lg:h-4 lg:w-4 text-green-300" />
                      </div>
                      <h4 className="text-green-300 font-medium text-xs sm:text-sm lg:text-base">
                        Revoke Anytime
                      </h4>
                      <p className="text-purple-100 text-xs mt-0.5 sm:mt-1">
                        You can disconnect your Gmail account at any time from
                        this settings page
                      </p>
                    </li>
                  </ol>
                </div>

                {/* Benefits Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 lg:gap-4">
                  <div className="bg-[#0a1525] p-2 sm:p-3 lg:p-4 rounded-lg border border-purple-800/30">
                    <div className="bg-purple-900/30 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                      <Shield className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium text-white mb-0.5 sm:mb-1 lg:mb-2 text-xs sm:text-sm lg:text-base">
                      Threat Detection
                    </h4>
                    <p className="text-xs text-purple-200">
                      Advanced algorithms identify sophisticated phishing
                      attempts that normal filters miss
                    </p>
                  </div>

                  <div className="bg-[#0a1525] p-2 sm:p-3 lg:p-4 rounded-lg border border-purple-800/30">
                    <div className="bg-purple-900/30 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium text-white mb-0.5 sm:mb-1 lg:mb-2 text-xs sm:text-sm lg:text-base">
                      Real-time Analysis
                    </h4>
                    <p className="text-xs text-purple-200">
                      Receive instant notifications when suspicious emails are
                      detected
                    </p>
                  </div>

                  <div className="bg-[#0a1525] p-2 sm:p-3 lg:p-4 rounded-lg border border-purple-800/30">
                    <div className="bg-purple-900/30 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 lg:mb-3">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-400" />
                    </div>
                    <h4 className="font-medium text-white mb-0.5 sm:mb-1 lg:mb-2 text-xs sm:text-sm lg:text-base">
                      Historical Scanning
                    </h4>
                    <p className="text-xs text-purple-200">
                      Review past emails to identify threats you might have
                      missed
                    </p>
                  </div>
                </div>

                {/* Privacy Information Section */}
                <div className="bg-[#1a2a3a] p-2 sm:p-3 lg:p-5 rounded-lg border border-purple-800/30">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <Lock className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-400" />
                      <span className="text-xs sm:text-sm lg:text-base">
                        Your Privacy & Security
                      </span>
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPrivacyInfo(!showPrivacyInfo)}
                      className="text-purple-300 border-purple-800 hover:bg-purple-900/50 text-xs sm:text-sm px-2 py-1"
                    >
                      {showPrivacyInfo ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      )}
                      {showPrivacyInfo ? "Hide Details" : "Show Details"}
                    </Button>
                  </div>

                  {showPrivacyInfo && (
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-purple-200 bg-[#0a1525] p-2 sm:p-3 rounded-md border border-purple-800/20 mb-2 sm:mb-3">
                      <p>
                        <span className="text-white font-medium">
                          Data Storage:
                        </span>{" "}
                        We never store the content of your emails on our
                        servers. Only analysis results and security metrics are
                        saved.
                      </p>
                      <p>
                        <span className="text-white font-medium">
                          Access Level:
                        </span>{" "}
                        We request read-only access to your emails. We cannot
                        send, delete or modify any emails in your account.
                      </p>
                      <p>
                        <span className="text-white font-medium">
                          Data Processing:
                        </span>{" "}
                        Email analysis happens in real-time and is not
                        permanently stored. Our systems analyze patterns without
                        human intervention.
                      </p>
                      <p>
                        <span className="text-white font-medium">
                          Google Compliance:
                        </span>{" "}
                        Our application is compliant with Google's API Services
                        User Data Policy and undergoes regular security audits.
                      </p>
                    </div>
                  )}

                  <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-200">
                        <span className="text-white">Zero email storage</span> -
                        we never store your email content
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-200">
                        <span className="text-white">Read-only access</span> -
                        we cannot modify or send emails
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-purple-200">
                        <span className="text-white">Revoke anytime</span> -
                        disconnect instantly from this page
                      </span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t border-purple-800/30 pt-2 sm:pt-3 lg:pt-4 p-2 sm:p-3 lg:p-6">
                <div className="text-xs sm:text-sm text-purple-300 flex items-center gap-2">
                  <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                  If you experience any connection issues, please{" "}
                  <a href="/contact" className="text-purple-200 underline">
                    contact support
                  </a>{" "}
                  for assistance.
                </div>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Data Management tab content */}
        {activeTab === "data" && (
          <div className="transition-opacity duration-300 ease-in-out">
            <Card className="bg-gradient-to-br from-[#0a192f] to-blue-900 border border-blue-800/50 shadow-lg">
              <CardHeader className="p-2 sm:p-3 lg:p-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Database className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-300" />
                  <div>
                    <CardTitle className="text-base sm:text-lg lg:text-2xl text-white">
                      Data Management
                    </CardTitle>
                    <CardDescription className="text-blue-300 text-xs sm:text-sm">
                      Control your personal data and privacy settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 lg:space-y-6 p-2 sm:p-3 lg:p-6 pt-0">
                {/* Data stored section - with same aggressive spacing */}
                <div className="bg-[#1a2a3a] p-2 sm:p-3 lg:p-5 rounded-lg border border-purple-800/30">
                  <h3 className="font-semibold text-white mb-1.5 sm:mb-2 lg:mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-purple-400" />
                    <span className="text-xs sm:text-sm lg:text-base">
                      Your Data We Store
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 lg:gap-4 mb-2 sm:mb-3 lg:mb-4">
                    <div className="bg-[#0a1525] p-2 sm:p-3 rounded-lg border border-purple-800/20">
                      <h4 className="text-purple-300 font-medium mb-1 sm:mb-2 text-xs sm:text-sm">
                        Account Information
                      </h4>
                      <ul className="space-y-1 text-xs text-gray-300">
                        <li className="flex items-start gap-1.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                          <span>Your email address</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                          <span>Profile name and picture (from Google)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                          <span>Authentication tokens</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-[#0a1525] p-2 sm:p-3 rounded-lg border border-purple-800/20">
                      <h4 className="text-purple-300 font-medium mb-1 sm:mb-2 text-xs sm:text-sm">
                        Usage Data
                      </h4>
                      <ul className="space-y-1 text-xs text-gray-300">
                        <li className="flex items-start gap-1.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                          <span>LLM simulation game scores</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                          <span>Email analysis results (not content)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-purple-400 mt-1.5"></div>
                          <span>Feature usage statistics</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-900/20 p-2 sm:p-3 rounded border border-green-800/30 text-xs sm:text-sm text-green-300 flex items-start gap-2">
                    <Lock className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 text-green-400" />
                    <span>
                      We <strong>never</strong> store the actual content of your
                      emails. Only analysis results and metadata are saved to
                      protect your privacy.
                    </span>
                  </div>
                </div>

                {/* Data deletion section - compressed */}
                <div className="bg-gradient-to-r from-red-900/20 to-red-950/40 p-0.5 sm:p-1 rounded-lg">
                  <div className="bg-[#1a2a3a] p-2 sm:p-3 lg:p-5 rounded-lg">
                    <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
                      <div className="bg-red-900/30 p-1.5 sm:p-2 rounded-full">
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">
                          Delete Your Account & Data
                        </h3>
                        <p className="text-gray-300 text-xs sm:text-sm mb-2 sm:mb-3 lg:mb-4">
                          This will permanently delete all your data, including
                          your profile information, game scores, email analysis,
                          and any other data associated with your account.
                        </p>

                        <div className="bg-red-900/20 p-2 sm:p-3 rounded-md border border-red-800/40 mb-2 sm:mb-3 lg:mb-4">
                          <h4 className="text-red-300 font-medium mb-1 sm:mb-2 text-xs sm:text-sm">
                            What Gets Deleted:
                          </h4>
                          <ul className="space-y-1 text-xs text-gray-300">
                            <li className="flex items-start gap-1.5">
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>
                                Your account and authentication information
                              </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>
                                All saved scores from the LLM simulation game
                              </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>
                                Email analysis results and security metrics
                              </span>
                            </li>
                            <li className="flex items-start gap-1.5">
                              <X className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <span>
                                Gmail connection and associated tokens
                              </span>
                            </li>
                          </ul>
                        </div>

                        <div className="flex justify-end">
                          <GradientButton
                            onClick={() => setDeleteModalOpen(true)}
                            className="w-full sm:flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded-md flex items-center justify-center transition-all duration-300 relative shadow-md hover:shadow-red-500/50 border border-red-400/30 text-xs sm:text-sm"
                            colors={{
                              glowStart: "#FF7E7E",
                              glowEnd: "#FF0000",
                              gradientStart: "#FF0000",
                              gradientEnd: "#B91C1C",
                            }}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Delete Account</span>
                            </div>
                          </GradientButton>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-800/30 p-2 sm:p-3 lg:p-4 rounded-lg border border-yellow-700/30">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 flex-shrink-0" />
                    <div className="text-xs sm:text-sm text-yellow-200">
                      <p className="font-medium text-yellow-100">
                        Important Data Deletion Note
                      </p>
                      <p className="mb-1 sm:mb-2">
                        Account deletion is permanent and cannot be reversed.
                        You will need to create a new account if you wish to
                        return.
                      </p>
                      <p>
                        According to our data retention policy, complete removal
                        from all systems and backups may take up to 30 days.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal - Fixed */}
      <Modal isOpen={deleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="bg-red-900/50 p-1.5 sm:p-2 rounded-full">
                <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  Delete Your Account
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                  This action is permanent and cannot be undone
                </p>
              </div>
            </div>
            <button
              onClick={closeDeleteModal}
              className="text-gray-400 hover:text-white bg-gray-800/50 rounded-full p-1 hover:bg-gray-700/50 transition-colors"
              disabled={isDeleting}
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Warning banner */}
          <div className="bg-red-900/30 border border-red-700 rounded-md p-3 sm:p-4 mb-4 sm:mb-5">
            <div className="flex gap-2 sm:gap-3">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-red-200">
                <p className="font-medium text-red-100 mb-1">
                  Warning: This cannot be undone
                </p>
                <p>
                  All your data will be permanently deleted, including your
                  account information, game scores, and analysis results.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="py-2">
            <div className="bg-[#1a2a3a] p-3 sm:p-4 rounded-md border border-red-800/30 mb-4">
              <p className="text-xs sm:text-sm text-gray-300 mb-2">
                To confirm deletion, please type{" "}
                <span className="font-bold text-red-300">delete</span> in the
                field below:
              </p>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="w-full px-3 py-2 bg-[#0a1525] border border-red-800/50 rounded-md text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 mt-1 text-sm"
                disabled={isDeleting || deleteSuccess}
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <div className="bg-red-900/30 p-3 rounded-md border border-red-800 mb-4">
                <p className="text-red-300 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {deleteError}
                </p>
              </div>
            )}

            {deleteSuccess && (
              <div className="bg-green-900/30 p-3 sm:p-4 rounded-md border border-green-800 mb-4">
                <p className="text-green-300 text-xs sm:text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  Your account and data have been scheduled for deletion. You
                  will be redirected to the login page.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between mt-4 sm:mt-6 gap-2 sm:gap-3">
            <button
              onClick={closeDeleteModal}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded-md transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <GradientButton
              onClick={handleDeleteAccount}
              className={`flex-1 px-3 sm:px-4 py-2 text-white rounded-md flex items-center justify-center transition-all duration-300 relative shadow-md hover:shadow-red-500/50 border border-red-400/30 text-sm sm:text-base ${
                deleteConfirmText.toLowerCase() !== "delete" ||
                isDeleting ||
                deleteSuccess
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              disabled={
                deleteConfirmText.toLowerCase() !== "delete" ||
                isDeleting ||
                deleteSuccess
              }
              colors={{
                glowStart: "#FF7E7E",
                glowEnd: "#FF0000",
                gradientStart: "#FF0000",
                gradientEnd: "#B91C1C",
              }}
            >
              {isDeleting ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  <span>Deleting...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Confirm Deletion</span>
                </div>
              )}
            </GradientButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
