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

const MinimalMobileNav = () => {
  const location = useLocation();

  const mainItems = [
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
          .mobile-nav-container {
            position: fixed;
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
            z-index: 50;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            padding: 0.5rem;
            gap: 0.25rem; /* Reduced gap for more items */
            background: rgba(20, 25, 40, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(120, 140, 255, 0.2);
            border-radius: 9999px; /* Pill shape */
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 95vw; /* Ensure it doesn't overflow viewport */
            overflow-x: auto; /* Allow horizontal scrolling if needed */
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* IE and Edge */
          }

          .mobile-nav-container::-webkit-scrollbar {
            display: none; /* Chrome, Safari and Opera */
          }

          @media (min-width: 768px) {
            .mobile-nav-container {
              display: none;
            }
          }

          /* Responsive sizing for different screen sizes */
          @media (max-width: 480px) {
            .mobile-nav-container {
              gap: 0.125rem; /* Even smaller gap on very small screens */
              padding: 0.375rem;
            }
          }

          .nav-item {
            display: flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            transition: all 0.2s ease-in-out;
            color: rgba(255, 255, 255, 0.7);
            position: relative;
            border-radius: 0.75rem;
            flex-shrink: 0; /* Prevent items from shrinking */
          }
          
          .nav-item-inner {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 48px; /* Slightly smaller for more items */
            height: 48px; /* Slightly smaller for more items */
            gap: 0.1rem;
            transition: all 0.2s ease-in-out;
          }

          /* Further reduce size on very small screens */
          @media (max-width: 480px) {
            .nav-item-inner {
              width: 44px;
              height: 44px;
            }
          }

          @media (max-width: 380px) {
            .nav-item-inner {
              width: 40px;
              height: 40px;
            }
          }

          .nav-item:hover .nav-item-inner {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
          }

          .nav-item.active .nav-item-inner {
            color: #ffffff;
            background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
            transform: scale(1.05);
            border-radius: 0.75rem;
          }
          
          /* Hide label by default */
          .nav-item span {
            font-size: 0.6rem; /* Slightly smaller font */
            font-weight: 500;
            line-height: 1;
            opacity: 0;
            transform: translateY(3px);
            transition: all 0.2s ease-in-out;
            position: absolute;
            bottom: 4px; /* Adjusted for smaller container */
            white-space: nowrap; /* Prevent text wrapping */
          }

          /* Show label only for active item */
          .nav-item.active span {
            opacity: 1;
            transform: translateY(0);
          }
          
          .nav-item:not(.active):hover span {
             opacity: 1;
             transform: translateY(0);
          }
          
           .nav-item:not(.active):hover .nav-icon {
             transform: translateY(-4px); /* Slightly less movement */
           }
           
           .nav-item.active .nav-icon {
              transform: translateY(-4px); /* Slightly less movement */
           }

          .nav-icon {
            width: 1.25rem; /* Slightly smaller icons */
            height: 1.25rem;
            transition: all 0.2s ease-in-out;
          }

          /* Even smaller icons on very small screens */
          @media (max-width: 380px) {
            .nav-icon {
              width: 1.125rem;
              height: 1.125rem;
            }
          }
        `}
      </style>

      <nav className="mobile-nav-container">
        {mainItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <div className="nav-item-inner">
              <div className="nav-icon">
                <item.icon />
              </div>
              <span>{item.label}</span>
            </div>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default MinimalMobileNav;
