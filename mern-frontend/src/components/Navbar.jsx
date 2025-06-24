import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthData, clearAllData } from "../utils/auth";
import { Button } from "./ui/button";
import {
  LogOut,
  Settings,
  Bell,
  Sun,
  Moon,
  Zap,
  HelpCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/DropdownMenu";
import { useTheme } from "../lib/ThemeProvider";
import { STORAGE_KEYS } from "../config/constant";

const Navbar = ({ triggerOnboarding }) => {
  const navigate = useNavigate();
  const authData = getAuthData();
  const userInitials = authData?.user?.email
    ? authData.user.email.split("@")[0].substring(0, 2).toUpperCase()
    : "U";
  const userName = authData?.user?.email
    ? authData.user.email.split("@")[0]
    : "User";
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  // State for account tasks
  const [accountTasks, setAccountTasks] = useState([
    {
      name: "Connect Gmail Account",
      completed: false,
      action: () => navigate("/settings"),
    },
    {
      name: "Try Threat Detection Game",
      completed: false,
      action: () => navigate("/llm-simulation"),
    },
    {
      name: "Test Message Manually",
      completed: false,
      action: () => navigate("/manual-testing"),
    },
    {
      name: "Check Security Dashboard",
      completed: false,
      action: () => navigate("/dashboard"),
    },
  ]);

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (accountTasks.filter((task) => task.completed).length /
      accountTasks.length) *
      100
  );

  // Add a function to manually mark the game as completed when button is clicked
  const markGameAsCompleted = () => {
    localStorage.setItem("has_accessed_simulation", "true");
    setAccountTasks((prev) =>
      prev.map((task, idx) => (idx === 1 ? { ...task, completed: true } : task))
    );
  };

  // Check task completion status
  useEffect(() => {
    // Check Gmail connection
    const isGmailConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";

    // For the game scores, we need to check the correct localStorage key
    function checkGameCompletion() {
      try {
        const possibleKeys = [
          "llm_simulation_scores",
          "game_scores",
          "scores",
          "simulation_results",
          "simulation_scores",
        ];

        let hasPlayed = false;

        // Check all possible keys
        for (const key of possibleKeys) {
          const dataStr = localStorage.getItem(key);
          if (dataStr && dataStr !== "[]" && dataStr !== "{}") {
            hasPlayed = true;
            break;
          }
        }

        // Also check if there are any keys that contain "score" or "simulation"
        Object.keys(localStorage).forEach((key) => {
          if (
            (key.includes("score") ||
              key.includes("simulation") ||
              key.includes("game")) &&
            !hasPlayed
          ) {
            const value = localStorage.getItem(key);
            if (value && value !== "[]" && value !== "{}") {
              hasPlayed = true;
            }
          }
        });

        // Check for specific flag
        if (localStorage.getItem("has_accessed_simulation") === "true") {
          hasPlayed = true;
        }

        return hasPlayed;
      } catch (err) {
        return false;
      }
    }

    // Check if user has tested messages manually
    let hasTestedManually = false;
    try {
      const manualTestsStr = localStorage.getItem("manual_testing_results");
      hasTestedManually =
        manualTestsStr && JSON.parse(manualTestsStr).length > 0;
    } catch (e) {
      hasTestedManually = false;
    }

    // For dashboard viewed, mark it true if we're on dashboard
    if (window.location.pathname.includes("dashboard")) {
      localStorage.setItem("dashboard_viewed", "true");
    }
    const hasDashboardViewed =
      localStorage.getItem("dashboard_viewed") === "true";

    // Check if on simulation page and mark accordingly
    if (
      window.location.pathname.includes("simulation") ||
      window.location.pathname.includes("llm")
    ) {
      localStorage.setItem("has_accessed_simulation", "true");
    }

    // Update task completion status
    setAccountTasks((prev) =>
      prev.map((task, index) => ({
        ...task,
        completed:
          index === 0
            ? isGmailConnected
            : index === 1
            ? checkGameCompletion()
            : index === 2
            ? hasTestedManually
            : index === 3
            ? hasDashboardViewed
            : false,
      }))
    );
  }, [window.location.pathname]);

  const handleLogout = () => {
    clearAllData();
    navigate("/");
  };

  return (
    <header className="fixed top-0 right-0 left-64 z-40">
      <div className="px-5 py-3 flex justify-end items-center h-[65px]">
        {/* Right side - Minimal actions */}
        <div className="flex items-center space-x-4">
          {/* Help button */}
          <button
            onClick={triggerOnboarding}
            className="p-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--primary))]/10 hover:text-[rgb(var(--primary))] rounded-md relative focus:outline-none group transition-colors duration-200"
            title="Show guide"
          >
            <HelpCircle className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span className="absolute -top-1 -right-1 block h-2 w-2 rounded-full bg-[rgb(var(--primary))] ring-2 ring-[rgb(var(--card))] animate-pulse"></span>
          </button>

          {/* Notifications */}
          <button className="p-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--primary))]/10 hover:text-[rgb(var(--primary))] rounded-md relative focus:outline-none transition-colors duration-200">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[rgb(var(--primary))] ring-1 ring-[rgb(var(--card))]"></span>
          </button>

          {/* Settings */}
          <button
            onClick={() => navigate("/settings")}
            className="p-2 text-[rgb(var(--foreground))] hover:bg-[rgb(var(--primary))]/10 hover:text-[rgb(var(--primary))] rounded-md focus:outline-none transition-colors duration-200"
          >
            <Settings className="h-5 w-5 transition-transform hover:rotate-45" />
          </button>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-[rgb(var(--foreground))] hover:bg-[rgb(var(--primary))]/10 flex items-center gap-2 rounded-md px-2 py-1 transition-colors duration-200"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium">{userName}</span>
                  <div className="flex items-center text-xs">
                    <span
                      className={`${
                        completionPercentage === 100
                          ? "text-green-500"
                          : completionPercentage >= 75
                          ? "text-blue-400"
                          : completionPercentage >= 50
                          ? "text-amber-400"
                          : "text-amber-500"
                      } transition-colors duration-200`}
                    >
                      {completionPercentage}% Complete
                    </span>
                  </div>
                </div>
                <div className="h-9 w-9 rounded-full bg-[rgb(var(--primary))]/20 flex items-center justify-center text-[rgb(var(--foreground))] border border-[rgb(var(--primary))]/30 relative shadow-sm transition-transform hover:scale-105">
                  {userInitials}
                  {completionPercentage < 100 && (
                    <span className="absolute -top-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-amber-500 ring-1 ring-[rgb(var(--card))] animate-pulse"></span>
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-gradient-to-b from-white to-purple-50 dark:from-purple-900 dark:to-gray-900 border border-purple-200/50 dark:border-purple-800/50 shadow-lg shadow-purple-200/30 dark:shadow-purple-900/20 rounded-lg p-1 w-72"
              sideOffset={5}
              align="end"
              style={{ maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}
            >
              <div className="px-4 py-3 border-b border-purple-200/50 dark:border-purple-800/50">
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-1">
                  Signed in as
                </p>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300 truncate">
                  {authData?.user?.email || "User"}
                </p>
              </div>

              {/* Account completion section with refined styling */}
              <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/20">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                    Account Setup
                  </p>
                  <span
                    className={`text-xs font-medium ${
                      completionPercentage === 100
                        ? "text-green-500"
                        : completionPercentage >= 75
                        ? "text-blue-400"
                        : completionPercentage >= 50
                        ? "text-amber-400"
                        : "text-amber-500"
                    }`}
                  >
                    {completionPercentage}% Complete
                  </span>
                </div>

                <div className="w-full h-1.5 bg-purple-200/50 dark:bg-purple-800/50 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full ${
                      completionPercentage === 100
                        ? "bg-green-500"
                        : completionPercentage >= 75
                        ? "bg-blue-400"
                        : completionPercentage >= 50
                        ? "bg-amber-400"
                        : "bg-amber-500"
                    } transition-all duration-300 ease-out`}
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>

                <div className="space-y-1.5">
                  {accountTasks.map((task, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-xs py-1.5 px-2 cursor-pointer hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 rounded-md transition-colors duration-150"
                      onClick={task.action}
                    >
                      <div className="flex items-center gap-2">
                        {task.completed ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        <span
                          className={`${
                            task.completed
                              ? "text-green-500"
                              : "text-purple-700 dark:text-purple-300"
                          } transition-colors`}
                        >
                          {task.name}
                        </span>
                      </div>
                      {!task.completed && (
                        <span className="text-purple-700 dark:text-purple-300 text-xs font-medium">
                          Complete
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <DropdownMenuItem
                className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 mt-1 transition-colors duration-150"
                onClick={() => navigate("/settings")}
              >
                <Settings className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-sm text-purple-700 dark:text-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100/70 dark:hover:from-purple-900/20 dark:hover:to-purple-800/10 flex items-center gap-2 py-2 transition-colors duration-150"
              >
                <LogOut className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
