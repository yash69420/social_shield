import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TestTube2,
  MailSearch,
  BrainCircuit,
  Settings,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  AlertCircle,
  Bookmark,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { STORAGE_KEYS } from "../config/constant";
import { useTheme } from "../lib/ThemeProvider";

const Sidebar = ({ isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();

  // Check Gmail connection status on component mount
  useEffect(() => {
    const gmailConnected =
      localStorage.getItem(STORAGE_KEYS.GMAIL_CONNECTED) === "true";
    setIsGmailConnected(gmailConnected);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const navigationItems = [
    {
      to: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      badge:
        location.pathname === "/dashboard" &&
        (isGmailConnected ? (
          <span className="ml-auto bg-[rgb(var(--accent))]/20 text-[rgb(var(--accent))] text-xs px-1.5 py-0.5 rounded">
            Active
          </span>
        ) : (
          <span className="ml-auto bg-yellow-700/60 text-yellow-200 text-xs px-1.5 py-0.5 rounded flex items-center">
            <AlertCircle className="h-3 w-3 mr-1" />
            Inactive
          </span>
        )),
    },
    {
      to: "/manual-testing",
      icon: TestTube2,
      label: "Manual Testing",
    },
    {
      to: "/email-analysis",
      icon: MailSearch,
      label: "Email Analysis",
      badge: (
        <span className="ml-auto text-xs font-medium px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300">
          New
        </span>
      ),
    },
    {
      to: "/llm-simulation",
      icon: BrainCircuit,
      label: "LLM Simulation",
    },
    { to: "/settings", icon: Settings, label: "Settings" },
    { to: "/faq", icon: HelpCircle, label: "FAQ" },
    { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  ];

  // On mobile, don't render sidebar at all - navigation will be handled by bottom nav or other means
  if (isMobile) {
    return null;
  }

  // Desktop sidebar only
  return (
    <div
      style={{
        width: isCollapsed ? "4rem" : "16rem",
        transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        background:
          "linear-gradient(135deg, rgba(8, 16, 45, 0.98), rgba(5, 11, 35, 0.96))",
        backdropFilter: "blur(12px)",
      }}
      className="fixed left-0 top-0 h-screen z-50 flex-col overflow-hidden hidden md:flex"
    >
      <Card className="flex-1 bg-transparent border-none flex flex-col">
        {/* Desktop Header */}
        <CardHeader className="border-b border-[rgba(120,140,255,0.08)] p-4 flex-shrink-0 h-[65px] flex items-center backdrop-blur-sm bg-[#050a20]/30">
          <div className="flex items-center justify-between w-full">
            <div
              className="overflow-hidden whitespace-nowrap"
              style={{
                opacity: isCollapsed ? 0 : 1,
                maxWidth: isCollapsed ? 0 : "200px",
                transition:
                  "opacity 0.2s ease-in-out, max-width 0.3s ease-in-out",
              }}
            >
              <CardTitle className="text-lg font-semibold text-[rgb(var(--foreground))] bg-clip-text bg-gradient-to-r from-[rgb(var(--primary))] to-[rgb(var(--accent))]">
                Social Shield
              </CardTitle>
            </div>
            <button
              onClick={toggleCollapse}
              className="p-1.5 hover:bg-[rgb(var(--primary))]/30 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--ring))] ml-auto flex-shrink-0"
              aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5 text-[rgb(var(--foreground))]" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-[rgb(var(--foreground))]" />
              )}
            </button>
          </div>
        </CardHeader>

        {/* Desktop Navigation */}
        <CardContent className="flex-1 p-2 flex flex-col justify-between overflow-y-auto">
          <nav>
            <div className="flex flex-col space-y-1">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center ${
                      isCollapsed ? "justify-center" : "space-x-3"
                    } p-3 rounded-md transition-colors ${
                      isActive
                        ? "bg-[#7E3FF2] text-white font-medium shadow-md"
                        : "text-[rgb(var(--foreground))] hover:bg-[#7E3FF2]/20 hover:text-[#7E3FF2]"
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background:
                            "radial-gradient(circle at center, #8028E0 0%, #6825C5 45%, #4B1D9E 100%)",
                        }
                      : {}
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <div
                    className="flex items-center justify-between w-full overflow-hidden whitespace-nowrap"
                    style={{
                      opacity: isCollapsed ? 0 : 1,
                      maxWidth: isCollapsed ? 0 : "100%",
                      transition:
                        "opacity 0.2s ease-in-out, max-width 0.3s ease-in-out",
                    }}
                  >
                    <span>{item.label}</span>
                    {item.badge}
                  </div>
                </NavLink>
              ))}
            </div>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sidebar;
