import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import GmailConnector from "../components/gmailconnector";
// import EmailDisplay from "./EmailDisplay";
import { getAuthData, clearAuthData } from "../utils/auth";
import { STORAGE_KEYS, API_URL } from "../config/constant";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import {
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Award,
  Info,
  BarChart2,
  ChevronRight,
  Loader2,
  Mail,
  FileText,
  Wand2,
  MessageCircle,
  Clock,
  BrainCircuit,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import GradientButton from "../components/ui/GradientButton";

// Sample data
const threatsByTypeData = [
  { name: "Phishing", value: 65 },
  { name: "Impersonation", value: 18 },
  { name: "Malware", value: 12 },
  { name: "Other", value: 5 },
];

const monthlyDetectionData = [
  { month: "Jan", detected: 14, safe: 86 },
  { month: "Feb", detected: 18, safe: 88 },
  { month: "Mar", detected: 12, safe: 92 },
  { month: "Apr", detected: 27, safe: 73 },
  { month: "May", detected: 23, safe: 77 },
  { month: "Jun", detected: 34, safe: 66 },
  { month: "Jul", detected: 21, safe: 79 },
  { month: "Aug", detected: 15, safe: 85 },
  { month: "Sep", detected: 19, safe: 81 },
  { month: "Oct", detected: 24, safe: 76 },
  { month: "Nov", detected: 31, safe: 69 },
  { month: "Dec", detected: 22, safe: 78 },
];

const COLORS = ["#9b87f5", "#7e69ab", "#c1ff72", "#a8e558"];

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Dashboard metrics
  const [threatScore, setThreatScore] = useState(12);
  const [safeEmails, setSafeEmails] = useState(94);
  const [userScore, setUserScore] = useState(78);

  // Add state for game scores
  const [gameScores, setGameScores] = useState([]);
  const [averageGameScore, setAverageGameScore] = useState(0);
  const isApiCallInProgress = useRef(false);

  // Add state for analyzed emails
  const [analyzedEmails, setAnalyzedEmails] = useState([]);
  const [analyzedEmailsLoading, setAnalyzedEmailsLoading] = useState(true);

  // Add these state variables
  const [metrics, setMetrics] = useState({
    threatLevel: 0,
    safePercentage: 0,
    monthlyBreakdown: [],
    threatTypes: [],
  });
  const [metricsLoading, setMetricsLoading] = useState(true);

  // Add state for monthly data
  const [monthlyData, setMonthlyData] = useState([]);

  // Add this line in the metrics state
  const [threatTypes, setThreatTypes] = useState([]);

  // Add this state for manual testing results
  const [manualTestResults, setManualTestResults] = useState([]);
  const [manualTestsLoading, setManualTestsLoading] = useState(true);

  // Add this state for connecting status
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchGameScores = useCallback(async (email, token) => {
    if (isApiCallInProgress.current) return;

    try {
      isApiCallInProgress.current = true;

      // Use the Node.js backend URL (port 5000)
      const response = await axios.get(`${API_URL}/api/scores`, {
        params: { email },
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      if (response.data && response.data.scores) {
        const scores = response.data.scores;
        setGameScores(scores);

        // Calculate average score
        if (scores.length > 0) {
          const total = scores.reduce((sum, score) => sum + score.score, 0);
          const avg = Math.round(total / scores.length);
          setAverageGameScore(avg);
          setUserScore(avg); // Update the user score with the average game score
        }
      }
    } catch (error) {
      console.error("Error fetching game scores:", error);
    } finally {
      isApiCallInProgress.current = false;
    }
  }, []);

  const fetchAnalyzedEmails = useCallback(async (email, token) => {
    setAnalyzedEmailsLoading(true);
    try {
      // First, get email IDs that have been analyzed from localStorage
      const analysisResultsStr = localStorage.getItem("email_analysis_results");
      if (!analysisResultsStr) {
        setAnalyzedEmails([]);
        setAnalyzedEmailsLoading(false);
        return;
      }

      const analysisResults = JSON.parse(analysisResultsStr);
      if (!analysisResults || Object.keys(analysisResults).length === 0) {
        setAnalyzedEmails([]);
        setAnalyzedEmailsLoading(false);
        return;
      }

      // Transform analysis results into the format we need
      const analyzedEmailsList = Object.entries(analysisResults).map(
        ([emailId, result]) => {
          return {
            id: emailId,
            subject: result.subject || "No Subject",
            sender: result.from || "Unknown Sender",
            date: result.analyzedAt || new Date().toLocaleString(),
            score: Math.round(result.suspicion_score * 100),
            threat: result.prediction !== "Safe",
            prediction: result.prediction,
            sentiment: result.sentiment,
          };
        }
      );

      // Sort by date (most recent first)
      analyzedEmailsList.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      // Take the most recent 10 instead of 5
      setAnalyzedEmails(analyzedEmailsList.slice(0, 10));
    } catch (error) {
      console.error("Error fetching analyzed emails:", error);
    } finally {
      setAnalyzedEmailsLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async (email, token) => {
    try {
      setMetricsLoading(true);

      // Use environment variable
      const response = await axios.get(
        `${import.meta.env.VITE_FLASK_API_URL}/api/metrics`,
        {
          params: { email },
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      if (response.data) {
        setMetrics({
          threatLevel: response.data.threat_level || 0,
          safePercentage: response.data.safe_percentage || 100,
          monthlyBreakdown: response.data.monthly_breakdown || [],
          threatTypes: response.data.threat_types || [],
        });

        // Update the state variables used in the UI
        setThreatScore(response.data.threat_level || 0);
        setSafeEmails(response.data.safe_percentage || 100);

        // ✅ FIXED: Only update if we have actual data, don't fall back to hardcoded
        if (
          response.data.monthly_breakdown &&
          response.data.monthly_breakdown.length > 0
        ) {
          setMonthlyData(response.data.monthly_breakdown);
        } else {
          // ✅ FIXED: Set empty array instead of hardcoded data
          setMonthlyData([]);
        }

        // If we have threat types data, update the chart data
        if (
          response.data.threat_types &&
          response.data.threat_types.length > 0
        ) {
          setThreatTypes(response.data.threat_types);
        } else {
          // ✅ FIXED: Set empty array instead of hardcoded data
          setThreatTypes([]);
        }
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
      // ✅ FIXED: Don't fall back to sample data, show empty state
      setMonthlyData([]);
      setThreatTypes([]);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const fetchManualTestResults = useCallback(() => {
    setManualTestsLoading(true);
    try {
      // Get manual test results from localStorage
      const manualResultsStr = localStorage.getItem("manual_testing_results");
      if (!manualResultsStr) {
        setManualTestResults([]);
        return;
      }

      const results = JSON.parse(manualResultsStr);
      if (!results || !Array.isArray(results)) {
        setManualTestResults([]);
        return;
      }

      // Sort by date (most recent first)
      results.sort((a, b) => new Date(b.date) - new Date(a.date));

      setManualTestResults(results);
    } catch (error) {
      console.error("Error fetching manual test results:", error);
      setManualTestResults([]);
    } finally {
      setManualTestsLoading(false);
    }
  }, []);

  const handleAuthCode = useCallback(async (code) => {
    // console.log("handleAuthCode not implemented in Dashboard component");
  }, []);

  useEffect(() => {
    // Get URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const errorParam = urlParams.get("error");
    const source = urlParams.get("source");

    // Check authentication
    const authData = getAuthData();
    if (!authData || !authData.token) {
      navigate("/");
      return;
    }

    setUser(authData.user);
    setToken(authData.token);

    // Check Gmail connection status
    const gmailConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
    const connectedEmail = localStorage.getItem(STORAGE_KEYS.GMAIL_EMAIL);
    const userEmail = authData.user.email;

    // Verify the connected email matches the user's email
    if (gmailConnected && connectedEmail) {
      if (connectedEmail.toLowerCase() === userEmail.toLowerCase()) {
        setIsGmailConnected(true);
      } else {
        // Different email connected - reset connection
        localStorage.removeItem(STORAGE_KEYS.GMAIL_CONNECTED);
        localStorage.removeItem(STORAGE_KEYS.GMAIL_EMAIL);
        localStorage.removeItem(STORAGE_KEYS.EXPECTED_GMAIL);
        setIsGmailConnected(false);
        setError(
          "Connected Gmail account does not match your logged-in email. Please reconnect."
        );
      }
    } else {
      setIsGmailConnected(false);
    }

    // Fetch game scores when component mounts
    if (authData?.user?.email) {
      fetchGameScores(authData.user.email, authData.token);
      fetchAnalyzedEmails(authData.user.email, authData.token);
      fetchMetrics(authData.user.email, authData.token);
    }

    // Fetch manual testing results
    fetchManualTestResults();

    setLoading(false);

    if (code) {
      // Check if the code might be expired
      const oauthTimestamp = parseInt(
        localStorage.getItem("oauth_timestamp") || "0"
      );
      const currentTime = Date.now();
      const timeDifference = currentTime - oauthTimestamp;

      // If more than 4 minutes have passed, warn the user
      if (timeDifference > 240000) {
        // console.warn(
        //   "Authorization code may have expired (time elapsed: " +
        //     Math.round(timeDifference / 1000) +
        //     " seconds)"
        // );
      }

      handleAuthCode(code);
    }
  }, [
    navigate,
    fetchGameScores,
    fetchAnalyzedEmails,
    fetchMetrics,
    fetchManualTestResults,
    handleAuthCode,
  ]);

  const handleGmailConnection = (connected, newToken) => {
    setIsGmailConnected(connected);

    // Update token if provided (useful when token is refreshed)
    if (newToken && newToken !== token) {
      setToken(newToken);
    }
  };

  const handleLogout = () => {
    clearAuthData();
    navigate("/");
  };

  const testDirectConnection = async () => {
    try {
      // Use environment variable
      const response = await fetch(
        `${import.meta.env.VITE_FLASK_API_URL}/api/test`
      );
      const data = await response.json();
      // console.log("Direct connection test successful:", data);
      alert("Connection successful! " + JSON.stringify(data));
    } catch (error) {
      console.error("Direct connection test failed:", error);
      alert("Connection failed: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="bg-gradient-to-br from-[#0a192f] to-red-900 max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-white">
              Session Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-300">
              Your session has expired. Please{" "}
              <button
                onClick={() => navigate("/")}
                className="text-red-300 underline font-semibold"
              >
                log in
              </button>{" "}
              again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto text-[rgb(var(--foreground))]">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-[rgb(var(--foreground))]">
        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-[rgb(var(--primary))]" />
        Dashboard
      </h1>

      {error && (
        <Card className="bg-gradient-to-br from-[#0a192f] to-red-900 mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <p className="text-red-300 text-sm sm:text-base">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isGmailConnected && (
        <>
          <Card className="bg-gradient-to-br from-[#0a192f] to-blue-900 mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
                Connect Your Gmail Account
              </CardTitle>
              <CardDescription className="text-blue-300 text-sm sm:text-base">
                Connect your Gmail to enable email threat analysis and dashboard
                features
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <p className="text-blue-300 text-sm sm:text-base">
                    To access all dashboard analytics and protect your inbox,
                    please connect your Gmail account:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-blue-200 text-sm sm:text-base">
                      <ShieldCheck className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      Analyze emails for security threats
                    </li>
                    <li className="flex items-center gap-2 text-blue-200 text-sm sm:text-base">
                      <AlertTriangle className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      Get real-time phishing alerts
                    </li>
                    <li className="flex items-center gap-2 text-blue-200 text-sm sm:text-base">
                      <BarChart2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      View detailed threat analytics
                    </li>
                  </ul>
                  <div className="flex justify-center pt-4">
                    <GradientButton
                      onClick={() => navigate("/settings")}
                      className="w-full py-3 px-4 sm:py-2.5 sm:px-6 text-base sm:text-lg font-bold tracking-wide flex items-center justify-center gap-2"
                      colors={{
                        glowStart: "#93C5FD",
                        glowEnd: "#3B82F6",
                        gradientStart: "#2563EB",
                        gradientEnd: "#1D4ED8",
                      }}
                    >
                      <div className="flex items-center justify-center w-full">
                        <Mail className="h-4 w-4 mr-2" />
                        Connect Gmail
                      </div>
                    </GradientButton>
                  </div>
                </div>

                <div className="bg-blue-900/20 p-3 sm:p-4 rounded-lg border border-blue-800/40">
                  <h3 className="font-medium text-white mb-3 text-base sm:text-lg">
                    Why Connect Gmail?
                  </h3>
                  <p className="text-xs sm:text-sm text-blue-200 mb-4">
                    Social Shield provides advanced email security through
                    AI-powered analysis that helps you identify and respond to
                    threats before they can cause harm.
                  </p>
                  <div className="bg-blue-900/40 p-2 sm:p-3 rounded border border-blue-700/30">
                    <p className="text-xs text-blue-300">
                      <strong>Privacy Note:</strong> We only analyze emails with
                      your permission and never store email content. Your
                      privacy and data security are our top priorities.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0a192f] to-indigo-900 mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-300" />
                Manual Testing Results
              </CardTitle>
              <CardDescription className="text-indigo-300 text-sm sm:text-base">
                View results from your manually tested emails
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {manualTestResults.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-4 sm:space-y-5">
                    {/* Summary Stats */}
                    <div className="bg-indigo-900/20 p-3 sm:p-4 rounded-lg border border-indigo-800/40">
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <BarChart2 className="h-4 w-4 text-indigo-400" />
                        Test Summary
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-indigo-900/40 p-2 sm:p-3 rounded-lg border border-indigo-800/30">
                          <div className="text-xs text-indigo-300 mb-1">
                            Average Risk Score
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-white">
                            {Math.round(
                              manualTestResults.reduce(
                                (sum, item) => sum + item.suspicion_score * 100,
                                0
                              ) / Math.max(manualTestResults.length, 1)
                            )}
                            %
                          </div>
                        </div>

                        <div className="bg-indigo-900/40 p-2 sm:p-3 rounded-lg border border-indigo-800/30">
                          <div className="text-xs text-indigo-300 mb-1">
                            Last Tested
                          </div>
                          <div className="text-sm sm:text-md font-medium text-white">
                            {manualTestResults.length > 0
                              ? new Date(
                                  manualTestResults[0].date
                                ).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 bg-indigo-900/40 p-2 sm:p-3 rounded-lg border border-indigo-800/30">
                          <div className="flex justify-between mb-1">
                            <span className="text-xs text-indigo-300">
                              Safe vs. Suspicious
                            </span>
                            <span className="text-xs text-indigo-300">
                              {
                                manualTestResults.filter(
                                  (r) => r.prediction === "Safe"
                                ).length
                              }{" "}
                              /{" "}
                              {
                                manualTestResults.filter(
                                  (r) => r.prediction === "Suspicious"
                                ).length
                              }
                            </span>
                          </div>
                          <div className="flex w-full h-2 bg-indigo-900/50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${
                                  manualTestResults.length
                                    ? (manualTestResults.filter(
                                        (r) => r.prediction === "Safe"
                                      ).length /
                                        manualTestResults.length) *
                                      100
                                    : 0
                                }%`,
                              }}
                            ></div>
                            <div
                              className="h-full bg-red-500"
                              style={{
                                width: `${
                                  manualTestResults.length
                                    ? (manualTestResults.filter(
                                        (r) => r.prediction === "Suspicious"
                                      ).length /
                                        manualTestResults.length) *
                                      100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <GradientButton
                        onClick={() => navigate("/manual-testing")}
                        className="w-full py-2.5 px-4 sm:py-2 sm:px-6 mt-3 text-sm sm:text-base font-bold tracking-wide flex items-center justify-center gap-2"
                        colors={{
                          glowStart: "#A5B4FC",
                          glowEnd: "#6366F1",
                          gradientStart: "#4F46E5",
                          gradientEnd: "#4338CA",
                        }}
                      >
                        <div className="flex items-center justify-center w-full">
                          <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          Go to Manual Testing
                        </div>
                      </GradientButton>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-5">
                    {/* Sentiment Analysis Card */}
                    <div className="bg-indigo-900/20 p-3 sm:p-4 rounded-lg border border-indigo-800/40">
                      <h3 className="font-medium text-white mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <BarChart2 className="h-4 w-4 text-indigo-400" />
                        Sentiment Analysis
                      </h3>
                      <div className="h-32 sm:h-40 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            {(() => {
                              // Prepare data with explicit colors assigned
                              const sentimentData = [
                                {
                                  name: "Positive",
                                  value: manualTestResults.filter(
                                    (r) =>
                                      r.sentiment?.toLowerCase() === "positive"
                                  ).length,
                                  fill: "#4ade80", // Green
                                },
                                {
                                  name: "Neutral",
                                  value: manualTestResults.filter(
                                    (r) =>
                                      r.sentiment?.toLowerCase() === "neutral"
                                  ).length,
                                  fill: "#facc15", // Yellow
                                },
                                {
                                  name: "Negative",
                                  value: manualTestResults.filter(
                                    (r) =>
                                      r.sentiment?.toLowerCase() === "negative"
                                  ).length,
                                  fill: "#f87171", // Red
                                },
                              ].filter((item) => item.value > 0);

                              return (
                                <Pie
                                  data={sentimentData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={
                                    window.innerWidth < 640 ? 25 : 40
                                  }
                                  outerRadius={
                                    window.innerWidth < 640 ? 45 : 60
                                  }
                                  paddingAngle={5}
                                  dataKey="value"
                                  nameKey="name"
                                  label={({ name, percent }) =>
                                    window.innerWidth < 640
                                      ? `${(percent * 100).toFixed(0)}%`
                                      : `${name} ${(percent * 100).toFixed(0)}%`
                                  }
                                >
                                  {sentimentData.map((entry, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={entry.fill}
                                    />
                                  ))}
                                </Pie>
                              );
                            })()}
                            <Tooltip
                              formatter={(value) => [
                                `${value} messages`,
                                "Count",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                        <div className="flex items-center gap-2 bg-indigo-900/40 p-1.5 rounded border border-indigo-800/30">
                          <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0"></div>
                          <span className="text-xs text-green-300">
                            Positive
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-900/40 p-1.5 rounded border border-indigo-800/30">
                          <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0"></div>
                          <span className="text-xs text-yellow-300">
                            Neutral
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-indigo-900/40 p-1.5 rounded border border-indigo-800/30">
                          <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0"></div>
                          <span className="text-xs text-red-300">Negative</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-900/20 p-6 sm:p-8 rounded-lg border border-indigo-800/40 flex flex-col items-center justify-center">
                  <MessageCircle className="h-12 w-12 sm:h-14 sm:w-14 text-indigo-400 mb-4" />
                  <h3 className="text-white font-medium text-center mb-2 text-base sm:text-lg">
                    No Manual Tests Yet
                  </h3>
                  <p className="text-indigo-300 text-xs sm:text-sm text-center mb-6 max-w-md">
                    Test suspicious emails or messages without connecting Gmail.
                    Our AI will analyze them for potential threats and provide
                    detailed results.
                  </p>
                  <GradientButton
                    onClick={() => navigate("/manual-testing")}
                    className="w-full py-2.5 px-4 sm:py-2 sm:px-6 text-sm sm:text-base font-bold tracking-wide flex items-center justify-center gap-2"
                    colors={{
                      glowStart: "#A5B4FC",
                      glowEnd: "#6366F1",
                      gradientStart: "#4F46E5",
                      gradientEnd: "#4338CA",
                    }}
                  >
                    <div className="flex items-center justify-center w-full">
                      <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Go to Manual Testing
                    </div>
                  </GradientButton>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900 mb-4 sm:mb-6">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-white flex items-center gap-2 text-lg sm:text-xl">
                <Award className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
                Test Your Threat Detection Skills
              </CardTitle>
              <CardDescription className="text-blue-300 text-sm sm:text-base">
                This feature works without Gmail connection and tracks your
                progress
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-purple-300 mb-4 text-sm sm:text-base">
                    While you're setting up Gmail, you can still test your
                    threat detection skills with our simulation game. Your
                    scores are saved and will appear on your dashboard.
                  </p>
                  <GradientButton
                    onClick={() => navigate("/llm-simulation")}
                    className="w-full py-3 px-4 sm:py-2 sm:px-6 text-base sm:text-lg font-bold tracking-wide flex items-center justify-center gap-2"
                    colors={{
                      glowStart: "#A78BFA",
                      glowEnd: "#7C3AED",
                      gradientStart: "#6D28D9",
                      gradientEnd: "#5B21B6",
                    }}
                  >
                    <div className="flex items-center justify-center w-full">
                      <Award className="h-4 w-4 sm:h-6 sm:w-6 mr-2" />
                      Try Threat Detection Simulation
                    </div>
                  </GradientButton>
                </div>

                {gameScores.length > 0 && (
                  <div className="bg-purple-900/20 p-3 sm:p-4 rounded-lg border border-purple-800/40">
                    <h3 className="font-medium text-white mb-3 text-sm sm:text-base">
                      Your Game History
                    </h3>
                    <div className="space-y-2">
                      {gameScores.slice(0, 3).map((score, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-purple-300">
                            {new Date(score.date).toLocaleDateString()}
                          </span>
                          <span className="font-bold text-purple-200">
                            {Math.round(score.score)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-800/40">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-300">Average Score:</span>
                        <span className="font-bold text-purple-200">
                          {averageGameScore}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {isGmailConnected && (
        <div className="space-y-4 sm:space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-[#0a192f] to-red-800">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-red-200">
                  Current Threat Level
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {metricsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-red-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl sm:text-3xl font-bold text-red-300 flex items-center">
                        {threatScore}%
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 ml-2 text-red-300" />
                      </div>
                      <span className="text-xs text-red-200">
                        Based on last 30 days
                      </span>
                    </div>
                    <Progress
                      value={threatScore}
                      className="h-2 mt-3 bg-red-700"
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0a192f] to-green-900">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-green-300">
                  Safe Emails
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {metricsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-green-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl sm:text-3xl font-bold text-green-400 flex items-center">
                        {safeEmails}%
                        <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 ml-2 text-green-400" />
                      </div>
                      <span className="text-xs text-green-300">
                        Based on last 30 days
                      </span>
                    </div>
                    <Progress
                      value={safeEmails}
                      className="h-2 mt-3 bg-green-800"
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900 sm:col-span-2 lg:col-span-1">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-xs sm:text-sm font-medium text-purple-200">
                  Threat Detection Skill
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {gameScores.length > 0 ? (
                  <>
                    <div className="flex items-end justify-between">
                      <div className="text-2xl sm:text-3xl font-bold text-purple-300 flex items-center">
                        {averageGameScore}%
                        <Award className="h-4 w-4 sm:h-5 sm:w-5 ml-2 text-purple-300" />
                      </div>
                      <span className="text-xs text-purple-200">
                        {gameScores.length} games played
                      </span>
                    </div>
                    <Progress
                      value={averageGameScore}
                      className="h-2 mt-3 bg-purple-800"
                    />

                    <div className="mt-4">
                      <GradientButton
                        onClick={() => navigate("/llm-simulation")}
                        className="text-xs w-full flex items-center justify-between py-2 px-4"
                        colors={{
                          glowStart: "#A78BFA",
                          glowEnd: "#7C3AED",
                          gradientStart: "#6D28D9",
                          gradientEnd: "#5B21B6",
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span>Try the simulation</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </GradientButton>
                    </div>
                  </>
                ) : (
                  <div className="py-2">
                    <p className="text-xs sm:text-sm text-purple-300 mb-4">
                      No simulation games played yet. Test your threat detection
                      skills!
                    </p>
                    <GradientButton
                      onClick={() => navigate("/llm-simulation")}
                      className="w-full py-3 px-4 sm:py-4 sm:px-6 text-sm sm:text-lg font-bold tracking-wide flex items-center justify-center gap-2"
                      colors={{
                        glowStart: "#A78BFA",
                        glowEnd: "#7C3AED",
                        gradientStart: "#6D28D9",
                        gradientEnd: "#5B21B6",
                      }}
                    >
                      <div className="flex items-center justify-center w-full">
                        <Award className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                        Try Threat Detection Simulation
                      </div>
                    </GradientButton>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base sm:text-lg">
                    Fraud Detection by Month
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Info className="h-4 w-4 text-purple-300" />
                  </Button>
                </div>
                <CardDescription className="text-purple-300 text-xs sm:text-sm">
                  Monthly breakdown of detected vs safe emails
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {metricsLoading ? (
                  <div className="flex justify-center items-center py-8 h-48 sm:h-64">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-400" />
                  </div>
                ) : monthlyData.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center bg-purple-800/20 rounded-lg border border-purple-800/30 h-48 sm:h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart2 className="h-12 w-12 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-300 text-sm font-medium mb-2">
                        No Email Data Yet
                      </p>
                      <p className="text-purple-400 text-xs">
                        Analyze emails to see monthly breakdown data here.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyData}
                        margin={{
                          top: 20,
                          right: window.innerWidth < 640 ? 10 : 30,
                          left: window.innerWidth < 640 ? 0 : 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4c1d95" />
                        <XAxis
                          dataKey="month"
                          stroke="#9b87f5"
                          fontSize={window.innerWidth < 640 ? 10 : 12}
                        />
                        <YAxis
                          stroke="#9b87f5"
                          fontSize={window.innerWidth < 640 ? 10 : 12}
                        />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="detected" stackId="a" fill="#9b87f5" />
                        <Bar dataKey="safe" stackId="a" fill="#c1ff72" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base sm:text-lg">
                    Email Sentiment
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <Info className="h-4 w-4 text-purple-300" />
                  </Button>
                </div>
                <CardDescription className="text-purple-300 text-xs sm:text-sm">
                  Breakdown of email emotional tone analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {metricsLoading ? (
                  <div className="flex justify-center items-center py-8 h-48 sm:h-64">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-400" />
                  </div>
                ) : analyzedEmails.length === 0 ? (
                  <div className="p-4 sm:p-6 text-center bg-purple-800/20 rounded-lg border border-purple-800/30 h-48 sm:h-64 flex items-center justify-center">
                    <p className="text-purple-300 text-xs sm:text-sm">
                      No sentiment data available yet. Analyze emails to see
                      sentiments.
                    </p>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center">
                    {(() => {
                      // Prepare data
                      const sentimentData = [
                        {
                          name: "Positive",
                          value: analyzedEmails.filter(
                            (email) =>
                              email.sentiment?.toLowerCase() === "positive"
                          ).length,
                        },
                        {
                          name: "Neutral",
                          value: analyzedEmails.filter(
                            (email) =>
                              email.sentiment?.toLowerCase() === "neutral"
                          ).length,
                        },
                        {
                          name: "Negative",
                          value: analyzedEmails.filter(
                            (email) =>
                              email.sentiment?.toLowerCase() === "negative"
                          ).length,
                        },
                      ].filter((item) => item.value > 0);

                      // Map sentiment to colors explicitly
                      const COLORS = {
                        Positive: "#4ade80",
                        Neutral: "#facc15",
                        Negative: "#f87171",
                      };

                      return (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sentimentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={window.innerWidth < 640 ? 40 : 60}
                              outerRadius={window.innerWidth < 640 ? 65 : 90}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value, percent }) =>
                                window.innerWidth < 640
                                  ? `${(percent * 100).toFixed(0)}%`
                                  : `${name} ${(percent * 100).toFixed(0)}%`
                              }
                            >
                              {sentimentData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[entry.name]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => [
                                `${value} emails`,
                                "Count",
                              ]}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </div>
                )}
              </CardContent>

              {/* Legend with sentiment indicators */}
              {analyzedEmails.length > 0 && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0"></div>
                    <span className="text-xs text-green-300">Positive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0"></div>
                    <span className="text-xs text-yellow-300">Neutral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400 flex-shrink-0"></div>
                    <span className="text-xs text-red-300">Negative</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Recent Emails Section */}
          <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-base sm:text-lg">
                  Recent Email Analysis
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-purple-600 flex-shrink-0"
                  onClick={() => navigate("/email-analysis")}
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              {analyzedEmailsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-purple-400" />
                </div>
              ) : analyzedEmails.length === 0 ? (
                <div className="p-4 sm:p-6 text-center bg-purple-800/20 rounded-lg border border-purple-800/30">
                  <p className="text-purple-300 mb-4 text-xs sm:text-sm">
                    You haven't analyzed any emails yet.
                  </p>
                  <Button
                    variant="default"
                    className="bg-purple-700 hover:bg-purple-800 text-white cursor-pointer text-xs sm:text-sm py-2 px-4"
                    onClick={() => navigate("/email-analysis")}
                  >
                    Go to Email Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Only show the first 5 emails */}
                  {analyzedEmails.slice(0, 5).map((email, index) => (
                    <div
                      key={index}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg gap-3 ${
                        email.threat
                          ? "bg-gradient-to-br from-red-800 to-red-900 hover:from-red-700 hover:to-red-800"
                          : "bg-gradient-to-br from-green-800 to-green-900 hover:from-green-700 hover:to-green-800"
                      } transition-colors`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center ${
                            email.threat ? "bg-red-100" : "bg-green-100"
                          }`}
                        >
                          {email.threat ? (
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white text-sm sm:text-base truncate">
                            {email.subject}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-300 truncate">
                            From: {email.sender} | {email.date}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                          email.threat
                            ? "bg-red-100 text-red-500"
                            : "bg-green-100 text-green-500"
                        }`}
                      >
                        {email.threat
                          ? `Threat Score: ${email.score}%`
                          : `Safe Score: ${100 - email.score}%`}
                      </div>
                    </div>
                  ))}

                  {/* Add button to view more */}
                  {analyzedEmails.length > 5 && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="default"
                        className="bg-purple-700 hover:bg-purple-800 text-white w-full cursor-pointer text-xs sm:text-sm py-2 px-4"
                        onClick={() => navigate("/email-analysis")}
                      >
                        View All {analyzedEmails.length} Analyzed Emails
                        <ChevronRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Show button anyway if there are any emails */}
                  {analyzedEmails.length > 0 && analyzedEmails.length <= 5 && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="default"
                        className="bg-purple-700 hover:bg-purple-800 text-white cursor-pointer text-xs sm:text-sm py-2 px-4"
                        onClick={() => navigate("/email-analysis")}
                      >
                        Go to Email Analysis
                        <ChevronRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
