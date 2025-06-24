import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthData, clearAllData } from "../utils/auth";
import { Button } from "./ui/button";
import { LogOut, Settings, CheckCircle, AlertCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/DropdownMenu";
import { STORAGE_KEYS } from "../config/constant";

const MobileNavbar = ({ triggerOnboarding }) => {
  const navigate = useNavigate();
  const authData = getAuthData();
  const userInitials = authData?.user?.email
    ? authData.user.email.split("@")[0].substring(0, 2).toUpperCase()
    : "U";
  const userName = authData?.user?.email
    ? authData.user.email.split("@")[0]
    : "User";

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

  const completionPercentage = Math.round(
    (accountTasks.filter((task) => task.completed).length /
      accountTasks.length) *
      100
  );

  useEffect(() => {
    const isGmailConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";

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
        for (const key of possibleKeys) {
          const dataStr = localStorage.getItem(key);
          if (dataStr && dataStr !== "[]" && dataStr !== "{}") {
            hasPlayed = true;
            break;
          }
        }

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

        if (localStorage.getItem("has_accessed_simulation") === "true") {
          hasPlayed = true;
        }

        return hasPlayed;
      } catch (err) {
        return false;
      }
    }

    let hasTestedManually = false;
    try {
      const manualTestsStr = localStorage.getItem("manual_testing_results");
      hasTestedManually =
        manualTestsStr && JSON.parse(manualTestsStr).length > 0;
    } catch (e) {
      hasTestedManually = false;
    }

    if (window.location.pathname.includes("dashboard")) {
      localStorage.setItem("dashboard_viewed", "true");
    }
    const hasDashboardViewed =
      localStorage.getItem("dashboard_viewed") === "true";

    if (
      window.location.pathname.includes("simulation") ||
      window.location.pathname.includes("llm")
    ) {
      localStorage.setItem("has_accessed_simulation", "true");
    }

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
    <header className="md:hidden fixed top-3 left-4 right-4 z-50 bg-gradient-to-r from-slate-900/40 via-purple-900/30 to-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10 pb-1">
      <div className="flex items-center justify-between px-4 h-10">
        {/* Social Shield Title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent leading-tight truncate">
              Social Shield
            </span>
          </div>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="text-white/90 hover:bg-white/10 flex items-center gap-2 rounded-xl px-2 py-1 h-8 transition-all duration-300 border-0 hover:scale-105"
            >
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-purple-500/80 to-indigo-600/80 flex items-center justify-center text-white border border-white/20 relative shadow-lg transition-all duration-300 hover:shadow-purple-500/30">
                <span className="text-xs font-semibold">{userInitials}</span>
                {completionPercentage < 100 && (
                  <span className="absolute -top-0.5 -right-0.5 block h-1.5 w-1.5 rounded-full bg-amber-400 ring-1 ring-slate-900/50 animate-pulse shadow-sm" />
                )}
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl p-1 w-[calc(100vw-2rem)] max-w-xs"
            sideOffset={6}
            align="end"
            style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}
          >
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Signed in as
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {authData?.user?.email || "User"}
              </p>
            </div>

            {/* Smaller Account completion section */}
            <div className="px-2 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg mx-1 my-0.5">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[11px] font-medium text-purple-700 dark:text-purple-300">
                  Setup
                </p>
                <span
                  className={`text-[10px] font-semibold px-1 py-0.5 rounded-full ${
                    completionPercentage === 100
                      ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20"
                      : completionPercentage >= 75
                      ? "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20"
                      : completionPercentage >= 50
                      ? "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20"
                      : "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/20"
                  }`}
                >
                  {completionPercentage}%
                </span>
              </div>

              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full ${
                    completionPercentage === 100
                      ? "bg-green-500"
                      : completionPercentage >= 75
                      ? "bg-blue-500"
                      : completionPercentage >= 50
                      ? "bg-amber-500"
                      : "bg-amber-500"
                  } transition-all duration-500 ease-out`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>

              <div className="space-y-1">
                {accountTasks.map((task, index) => (
                  <div
                    key={index}
                    className="flex items-center text-[11px] py-0.5 px-1.5 cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-800/20 rounded-md transition-all duration-200"
                    onClick={task.action}
                  >
                    <div className="flex items-center gap-1 flex-1">
                      {task.completed ? (
                        <CheckCircle className="h-2.5 w-2.5 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-2.5 w-2.5 text-amber-500 flex-shrink-0" />
                      )}
                      <span
                        className={`${
                          task.completed
                            ? "text-green-600 dark:text-green-400"
                            : "text-purple-700 dark:text-purple-300"
                        } transition-colors truncate`}
                      >
                        {task.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu items */}
            <DropdownMenuItem
              className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 py-2 px-3 mt-1 rounded-lg transition-all duration-200"
              onClick={() => navigate("/settings")}
            >
              <Settings className="h-4 w-4 text-purple-500" />
              Account Settings
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-sm text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-2 py-2 px-3 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4 text-red-500" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default MobileNavbar;
