import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  Bug,
  Server,
  Database,
  Zap,
  RefreshCw,
  Trash2,
  Eye,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Shield,
  Key,
  Globe,
  Monitor,
  Terminal,
  Activity,
  Info,
} from "lucide-react";
import { API_URL } from "../config/constant";

const DebugPanel = ({
  gameState,
  authData,
  user,
  email,
  score,
  attempts,
  loading,
  gameStarted,
  previousScores,
  onTestBackendEnv,
  onTestGeminiAPI,
  onGenerateEmail,
  onResetGame,
  onClearLocalStorage,
  onStartGame,
  onFinishGame,
}) => {
  const [showFullState, setShowFullState] = useState(false);
  const [testResults, setTestResults] = useState({});

  // Enhanced debug functions with detailed logging
  const debugLog = (category, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `🐛 [${category}] ${timestamp}: ${message}`;
    console.log(logMessage, data || "");
    return { timestamp, category, message, data };
  };

  const testAPIConnectivity = async () => {
    debugLog("API_TEST", "Starting comprehensive API connectivity test...");

    const tests = [
      {
        name: "Backend Ping",
        url: `${API_URL}/ping`,
        method: "GET",
      },
      {
        name: "Backend Test",
        url: `${API_URL}/api/test`,
        method: "GET",
      },
      {
        name: "Backend Config",
        url: `${API_URL}/api/config-test`,
        method: "GET",
      },
      {
        name: "Gemini Debug",
        url: `${API_URL}/api/gemini/debug`,
        method: "GET",
      },
      {
        name: "Gemini Test API",
        url: `${API_URL}/api/gemini/test-api`,
        method: "GET",
      },
    ];

    const results = {};

    for (const test of tests) {
      try {
        debugLog("API_TEST", `Testing ${test.name}...`, { url: test.url });
        const startTime = Date.now();

        const response = await fetch(test.url, {
          method: test.method,
          headers: { "Content-Type": "application/json" },
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        const data = await response.json();

        results[test.name] = {
          success: response.ok,
          status: response.status,
          responseTime: `${responseTime}ms`,
          data: data,
        };

        debugLog("API_TEST", `${test.name} completed`, {
          status: response.status,
          responseTime: `${responseTime}ms`,
          success: response.ok,
        });
      } catch (error) {
        results[test.name] = {
          success: false,
          error: error.message,
        };
        debugLog("API_TEST", `${test.name} failed`, { error: error.message });
      }
    }

    setTestResults(results);
    debugLog("API_TEST", "All API tests completed", results);
    alert(
      `API Tests Completed!\nCheck console for details.\n\nResults:\n${JSON.stringify(
        results,
        null,
        2
      )}`
    );
  };

  const testGeminiEmailGeneration = async () => {
    debugLog("GEMINI_TEST", "Testing email generation...");

    try {
      const response = await fetch(`${API_URL}/api/gemini/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptType: "suspicious" }),
      });

      const data = await response.json();
      debugLog("GEMINI_TEST", "Email generation response", data);

      if (response.ok) {
        alert("✅ Email generation successful! Check console for details.");
      } else {
        alert(`❌ Email generation failed: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      debugLog("GEMINI_TEST", "Email generation error", {
        error: error.message,
      });
      alert(`❌ Email generation error: ${error.message}`);
    }
  };

  const inspectGameState = () => {
    const state = {
      gameStarted,
      loading,
      score,
      attempts,
      email: email
        ? {
            from: email.from,
            subject: email.subject,
            bodyLength: email.body?.length,
            isThreat: email.isThreat,
          }
        : null,
      user: user
        ? {
            email: user.email,
            name: user.name,
          }
        : null,
      authData: authData
        ? {
            hasToken: !!authData.token,
            tokenLength: authData.token?.length,
          }
        : null,
      previousScoresCount: previousScores.length,
      localStorage: {
        gameScores: localStorage.getItem("llm_game_scores"),
        lastPlayed: localStorage.getItem("llm_game_last_played"),
        authData: localStorage.getItem("authData"),
      },
    };

    debugLog("GAME_STATE", "Current game state inspection", state);
    setShowFullState(!showFullState);
  };

  const testLocalStorage = () => {
    debugLog("STORAGE_TEST", "Testing localStorage functionality...");

    try {
      // Test write
      const testKey = "debug_test_" + Date.now();
      const testValue = { test: true, timestamp: new Date().toISOString() };
      localStorage.setItem(testKey, JSON.stringify(testValue));

      // Test read
      const retrieved = JSON.parse(localStorage.getItem(testKey));

      // Test delete
      localStorage.removeItem(testKey);

      debugLog("STORAGE_TEST", "localStorage test successful", { retrieved });
      alert("✅ localStorage working correctly!");
    } catch (error) {
      debugLog("STORAGE_TEST", "localStorage test failed", {
        error: error.message,
      });
      alert(`❌ localStorage error: ${error.message}`);
    }
  };

  const simulateError = () => {
    debugLog("ERROR_SIM", "Simulating error for testing...");
    throw new Error("This is a simulated error for debugging purposes");
  };

  const clearAllData = () => {
    if (confirm("⚠️ This will clear ALL local data. Continue?")) {
      debugLog("DATA_CLEAR", "Clearing all local data...");
      localStorage.removeItem("llm_game_scores");
      localStorage.removeItem("llm_game_last_played");
      localStorage.removeItem("authData");
      debugLog("DATA_CLEAR", "All local data cleared");
      alert("🗑️ All local data cleared!");
      window.location.reload();
    }
  };

  const logSystemInfo = () => {
    const systemInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      window: {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      },
      location: {
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        search: window.location.search,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      memory: performance.memory
        ? {
            usedJSHeapSize:
              Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) +
              "MB",
            totalJSHeapSize:
              Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) +
              "MB",
          }
        : "Not available",
    };

    debugLog("SYSTEM_INFO", "System information", systemInfo);
    console.table(systemInfo);
  };

  return (
    <Card className="bg-yellow-500/5 border-yellow-500/30 mb-6">
      <CardHeader>
        <CardTitle className="text-yellow-300 flex items-center gap-2">
          <Bug className="h-5 w-5" />
          🐛 Advanced Debug Panel
          <span className="text-xs bg-yellow-900/30 px-2 py-1 rounded">
            DEVELOPMENT MODE
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Testing Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-2">
            <h4 className="text-yellow-200 font-semibold flex items-center gap-1">
              <Server className="h-4 w-4" /> Backend Tests
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={onTestBackendEnv}
                size="sm"
                className="bg-blue-900/30 border border-blue-600/50 text-blue-200 hover:bg-blue-800/50 text-xs"
              >
                <Database className="h-3 w-3 mr-1" />
                Test Backend Env
              </Button>
              <Button
                onClick={testAPIConnectivity}
                size="sm"
                className="bg-green-900/30 border border-green-600/50 text-green-200 hover:bg-green-800/50 text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Full API Test
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-yellow-200 font-semibold flex items-center gap-1">
              <Zap className="h-4 w-4" /> Gemini Tests
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={onTestGeminiAPI}
                size="sm"
                className="bg-purple-900/30 border border-purple-600/50 text-purple-200 hover:bg-purple-800/50 text-xs"
              >
                <Key className="h-3 w-3 mr-1" />
                Test Gemini API
              </Button>
              <Button
                onClick={testGeminiEmailGeneration}
                size="sm"
                className="bg-pink-900/30 border border-pink-600/50 text-pink-200 hover:bg-pink-800/50 text-xs"
              >
                <Mail className="h-3 w-3 mr-1" />
                Generate Test Email
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-yellow-200 font-semibold flex items-center gap-1">
              <Settings className="h-4 w-4" /> Game Controls
            </h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={onGenerateEmail}
                size="sm"
                className="bg-orange-900/30 border border-orange-600/50 text-orange-200 hover:bg-orange-800/50 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Force Generate
              </Button>
              <Button
                onClick={onResetGame}
                size="sm"
                className="bg-red-900/30 border border-red-600/50 text-red-200 hover:bg-red-800/50 text-xs"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reset Game
              </Button>
            </div>
          </div>
        </div>

        {/* System & Data Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Button
            onClick={inspectGameState}
            size="sm"
            className="bg-cyan-900/30 border border-cyan-600/50 text-cyan-200 hover:bg-cyan-800/50 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Inspect State
          </Button>
          <Button
            onClick={testLocalStorage}
            size="sm"
            className="bg-indigo-900/30 border border-indigo-600/50 text-indigo-200 hover:bg-indigo-800/50 text-xs"
          >
            <Database className="h-3 w-3 mr-1" />
            Test Storage
          </Button>
          <Button
            onClick={logSystemInfo}
            size="sm"
            className="bg-teal-900/30 border border-teal-600/50 text-teal-200 hover:bg-teal-800/50 text-xs"
          >
            <Monitor className="h-3 w-3 mr-1" />
            System Info
          </Button>
          <Button
            onClick={clearAllData}
            size="sm"
            className="bg-red-900/50 border border-red-600/50 text-red-200 hover:bg-red-800/70 text-xs"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear All Data
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="bg-gray-900/50 p-3 rounded text-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-300">
            <div>
              Game Started:{" "}
              <span className="text-yellow-300">
                {gameStarted ? "Yes" : "No"}
              </span>
            </div>
            <div>
              Score: <span className="text-yellow-300">{score}/3</span>
            </div>
            <div>
              Attempts: <span className="text-yellow-300">{attempts}</span>
            </div>
            <div>
              Loading:{" "}
              <span className="text-yellow-300">{loading ? "Yes" : "No"}</span>
            </div>
            <div>
              User:{" "}
              <span className="text-yellow-300">
                {user?.email || "Anonymous"}
              </span>
            </div>
            <div>
              Email:{" "}
              <span className="text-yellow-300">
                {email ? "Loaded" : "None"}
              </span>
            </div>
            <div>
              Scores:{" "}
              <span className="text-yellow-300">{previousScores.length}</span>
            </div>
            <div>
              Backend: <span className="text-yellow-300">Render</span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="bg-gray-900/70 p-3 rounded">
            <h5 className="text-yellow-200 font-medium mb-2">
              Latest Test Results:
            </h5>
            <div className="space-y-1 text-xs">
              {Object.entries(testResults).map(([test, result]) => (
                <div key={test} className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-3 w-3 text-green-400" />
                  ) : (
                    <XCircle className="h-3 w-3 text-red-400" />
                  )}
                  <span className="text-gray-300">{test}:</span>
                  <span
                    className={
                      result.success ? "text-green-300" : "text-red-300"
                    }
                  >
                    {result.success
                      ? `${result.status} (${result.responseTime})`
                      : result.error}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full State Inspector */}
        {showFullState && (
          <div className="bg-black/50 p-3 rounded border border-yellow-600/30">
            <h5 className="text-yellow-200 font-medium mb-2">
              Full Game State:
            </h5>
            <pre className="text-xs text-gray-300 overflow-auto max-h-48">
              {JSON.stringify(
                {
                  gameStarted,
                  loading,
                  score,
                  attempts,
                  email,
                  user,
                  authData: authData ? { hasToken: !!authData.token } : null,
                  previousScores,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        <div className="text-xs text-yellow-400/70 flex items-center gap-1">
          <Info className="h-3 w-3" />
          Debug panel active. Check browser console for detailed logs.
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
