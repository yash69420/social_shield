import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TestTube2,
  MailSearch,
  BrainCircuit,
  Settings,
  HelpCircle,
  Bookmark,
} from "lucide-react";

const MobileNavigation = () => {
  const location = useLocation();

  const navigationItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { to: "/manual-testing", icon: TestTube2, label: "Test" },
    { to: "/email-analysis", icon: MailSearch, label: "Email" },
    { to: "/llm-simulation", icon: BrainCircuit, label: "LLM" },
    { to: "/faq", icon: HelpCircle, label: "FAQ" },
    { to: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <>
      <style>
        {`
          /* Custom responsive styles for very small screens */
          @media (max-width: 360px) {
            .mobile-nav-item {
              width: 1.75rem !important; /* 28px */
              height: 1.75rem !important; /* 28px */
            }
            .mobile-nav-icon {
              width: 0.875rem !important; /* 14px */
              height: 0.875rem !important; /* 14px */
            }
            .mobile-nav-container {
              padding: 0.375rem 0.75rem !important; /* px-3 py-1.5 */
            }
          }
          
          @media (max-width: 320px) {
            .mobile-nav-item {
              width: 1rem !important; /* 16px */
              height: 1rem !important; /* 16px */
            }
            .mobile-nav-icon {
              width: 0.5rem !important; /* 8px */
              height: 0.5rem !important; /* 8px */
            }
            .mobile-nav-container {
              padding: 0.125rem 0.25rem !important; /* px-1 py-0.5 */
              left: 0.25rem !important; /* left-1 */
              right: 0.25rem !important; /* right-1 */
            }
          }
        `}
      </style>
      <nav className="mobile-nav-container fixed bottom-4 left-4 right-4 z-50 flex md:hidden items-center justify-evenly px-3 py-2 rounded-full bg-slate-900/60 backdrop-blur-lg border border-white/10 shadow-2xl shadow-black/40">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`
                mobile-nav-item
                group 
                relative 
                flex 
                items-center 
                justify-center 
                w-8 
                h-8 
                rounded-full 
                transition-all 
                duration-300 
                ease-in-out
                focus:outline-none 
                focus-visible:ring-2 
                focus-visible:ring-purple-500 
                focus-visible:ring-offset-2 
                focus-visible:ring-offset-slate-900
                ${
                  isActive
                    ? "bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg shadow-purple-600/30"
                    : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                }
              `}
            >
              <div>
                <item.icon className="mobile-nav-icon h-3.5 w-3.5" />
              </div>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};

export default MobileNavigation;
