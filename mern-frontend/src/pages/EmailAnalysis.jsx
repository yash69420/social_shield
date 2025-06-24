import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import EmailDisplay from "../components/EmailDisplay";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import {
  Mail,
  Lock,
  Shield,
  AlertTriangle,
  Eye,
  FileX,
  ChevronRight,
  Activity,
  RefreshCw,
  Inbox,
  Search,
  CheckCircle,
  ShieldCheck,
  X,
  BarChart2,
  Filter,
  Download,
  FileText,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { getAuthData } from "../utils/auth";
import { STORAGE_KEYS } from "../config/constant";
import { useNavigate } from "react-router-dom";
import BookmarkButton from "../components/BookmarkButton";
import ExportButton from "../components/ExportButton";
import DebugButton from "../components/DebugButton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../components/ui/DropdownMenu";

const EmailAnalysis = memo(({ token }) => {
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({});
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const navigate = useNavigate();

  // Memoize the token prop
  const memoizedToken = useMemo(() => token, [token]);

  // Memoized callback for analysis completion
  const handleAnalysisComplete = useCallback((results) => {
    setAnalysisResults((prev) => ({ ...prev, ...results }));
  }, []);

  // Sample counts - replace with actual data
  const emailCount = 24;
  const suspiciousCount = 5;
  const safeCount = 16;
  const analyzedCount = 21;

  useEffect(() => {
    const gmailConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
    setIsGmailConnected(gmailConnected);
  }, []);

  useEffect(() => {
    const loadAnalysisResults = () => {
      const storedResults = localStorage.getItem("email_analysis_results");
      if (storedResults) {
        try {
          setAnalysisResults(JSON.parse(storedResults));
        } catch (err) {
          console.error("Failed to parse analysis results:", err);
        }
      }
    };

    loadAnalysisResults();

    const handleStorageChange = (e) => {
      if (e.key === "email_analysis_results") {
        loadAnalysisResults();
      }
    };

    const handleAnalysisUpdate = () => {
      loadAnalysisResults();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("analysisResultsUpdated", handleAnalysisUpdate);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "analysisResultsUpdated",
        handleAnalysisUpdate
      );
    };
  }, []);

  const handleRefresh = () => {
    // Implement your refresh logic
  };

  const handleAnalyzeAll = () => {
    // Implement your analyze all logic
  };

  // Memoize the EmailDisplay component to prevent unnecessary re-renders
  const memoizedEmailDisplay = useMemo(
    () => (
      <EmailDisplay
        token={memoizedToken}
        onAnalysisComplete={handleAnalysisComplete}
      />
    ),
    [memoizedToken, handleAnalysisComplete]
  );

  return (
    <div className="p-6 max-w-7xl mx-auto text-foreground">
      <div className="flex items-center gap-3 mb-8">
        <Activity className="w-7 h-7 text-purple-500" />
        <h1 className="text-3xl font-bold text-foreground">Email Analysis</h1>
      </div>

      {!isGmailConnected ? (
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-[#0a192f] to-blue-900 border border-blue-800/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-blue-300" />
                <div>
                  <CardTitle className="text-2xl text-white">
                    Connect Your Gmail
                  </CardTitle>
                  <CardDescription className="text-blue-300">
                    Analyze your emails for security threats
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/40">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-400" />
                      Email Analysis Features
                    </h3>

                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-100">
                          Detect phishing attempts and suspicious content
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Eye className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-100">
                          Get sentiment analysis on your emails
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-blue-300 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-100">
                          View threat statistics and security reports
                        </span>
                      </li>
                    </ul>

                    <div className="mt-4">
                      <Button
                        className="w-full relative text-white shadow-md hover:shadow-blue-500/50 transition-all duration-300 border border-blue-400/30"
                        style={{
                          background:
                            "radial-gradient(circle at center, #3B82F6 0%, #2563EB 45%, #1D4ED8 100%)",
                        }}
                        onClick={() => navigate("/settings")}
                      >
                        <span className="relative z-10 flex items-center justify-center">
                          <Mail className="h-4 w-4 mr-1.5" />
                          Connect Gmail
                        </span>
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800/40">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-400" />
                      Your Privacy Matters
                    </h3>

                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2">
                        <Lock className="h-4 w-4 text-green-300 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-100">
                          Your email content is <strong>never stored</strong> on
                          our servers
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-300 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-100">
                          Analysis happens securely in real-time
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <FileX className="h-4 w-4 text-green-300 mt-0.5 flex-shrink-0" />
                        <span className="text-blue-100">
                          We only store analysis results, never the content
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-green-900/20 border border-green-800/40 rounded-lg">
                    <p className="text-sm text-green-300 flex items-start gap-2">
                      <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      Your connection can be revoked at any time from the
                      Settings page
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-blue-800/30 pt-4">
              <div className="text-sm text-blue-300 px-2">
                Don't want to connect Gmail? You can still use our{" "}
                <a
                  onClick={() => navigate("/manual-testing")}
                  className="text-blue-200 underline cursor-pointer"
                >
                  Manual Testing
                </a>{" "}
                and{" "}
                <a
                  onClick={() => navigate("/llm-simulation")}
                  className="text-blue-200 underline cursor-pointer"
                >
                  LLM Simulation
                </a>{" "}
                features.
              </div>
            </CardFooter>
          </Card>

          <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900 border border-purple-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                Manual Analysis Alternative
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-purple-300 mb-4">
                Don't want to connect your Gmail account? You can still analyze
                any suspicious emails by manually pasting their content:
              </p>
              <Button
                variant="default"
                className="relative text-white shadow-md hover:shadow-purple-500/50 transition-all duration-300 border border-purple-400/30"
                style={{
                  background:
                    "radial-gradient(circle at center, #8B5CF6 0%, #7C3AED 45%, #6D28D9 100%)",
                }}
                onClick={() => navigate("/manual-testing")}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Go to Manual Testing
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          <Card className="bg-[#0a192f] border-blue-900/50 shadow-xl">
            <CardContent className="p-6">
              {memoizedEmailDisplay}
              {Object.keys(analysisResults).length > 0 && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center sm:justify-end gap-2 mt-4 sm:mt-6 pt-4 border-t border-blue-800/30">
                  {/* Mobile-friendly export dropdown */}
                  <div className="w-full sm:w-auto relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          className="relative text-white shadow-md hover:shadow-blue-500/50 transition-all duration-300 border border-blue-400/30 w-full sm:w-auto h-10 sm:h-9 text-sm active:scale-95"
                          style={{
                            background:
                              "radial-gradient(circle at center, #4B91F1 0%, #3B82F6 45%, #2563EB 100%)",
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          <span>Export Results</span>
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-56 bg-[rgb(var(--background))] border border-[rgb(var(--border))] shadow-lg z-[100]"
                        align="end"
                        sideOffset={5}
                        collisionPadding={16}
                      >
                        <DropdownMenuItem
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
                          className="flex items-center gap-2 hover:bg-[rgb(var(--primary))]/10 focus:bg-[rgb(var(--primary))]/10 py-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
                          <span className="text-[rgb(var(--foreground))]">
                            Export as CSV
                          </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            try {
                              import("../utils/export").then((exportModule) => {
                                const data = Object.values(analysisResults);
                                if (data.length > 0) {
                                  exportModule.exportToExcel(
                                    data,
                                    `email-analysis-${
                                      new Date().toISOString().split("T")[0]
                                    }.xlsx`
                                  );
                                }
                              });
                            } catch (err) {
                              console.warn("Excel export failed:", err);
                            }
                          }}
                          className="flex items-center gap-2 hover:bg-[rgb(var(--primary))]/10 focus:bg-[rgb(var(--primary))]/10 py-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
                          <span className="text-[rgb(var(--foreground))]">
                            Export as Excel
                          </span>
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          onClick={() => {
                            try {
                              import("../utils/export").then((exportModule) => {
                                const data = Object.values(analysisResults);
                                if (data.length > 0) {
                                  exportModule.exportToPDF(
                                    data,
                                    "Email Analysis",
                                    `email-analysis-${
                                      new Date().toISOString().split("T")[0]
                                    }.pdf`
                                  );
                                }
                              });
                            } catch (err) {
                              console.warn("PDF export failed:", err);
                            }
                          }}
                          className="flex items-center gap-2 hover:bg-[rgb(var(--primary))]/10 focus:bg-[rgb(var(--primary))]/10 py-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-[rgb(var(--primary))]" />
                          <span className="text-[rgb(var(--foreground))]">
                            Export as PDF
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
});

EmailAnalysis.displayName = "EmailAnalysis";

export default EmailAnalysis;
