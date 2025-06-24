import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import ManualTesting from "./pages/ManualTesting";
import EmailAnalysis from "./pages/EmailAnalysis";
import LLMSimulation from "./pages/LLMSimulation";
import Settings from "./pages/Settings";
import FAQ from "./pages/FAQ";
import { isAuthenticated } from "./utils/auth";
import Sidebar from "./components/Sidebar";
import MobileNavigation from "./components/MobileNavigation";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./lib/ThemeProvider";
import OnboardingTooltips from "./components/OnboardingTooltips";
import BookmarksPage from "./pages/BookmarksPage";
import { CustomToaster } from "./components/ui/toast";
import AuthCallback from "./components/AuthCallback";
import NotFound from "./components/NotFound";
import MobileNavbar from "./components/MobileNavbar";

// Context for onboarding state
export const OnboardingContext = React.createContext({
  showOnboarding: false,
  setShowOnboarding: () => {},
});

// Wrapper to provide location context to children
const LocationAwareTooltips = () => {
  const location = useLocation();
  const currentPage = location.pathname.split("/")[1] || "dashboard";
  const { showOnboarding, setShowOnboarding } =
    React.useContext(OnboardingContext);

  return (
    <OnboardingTooltips
      location={currentPage}
      visible={showOnboarding}
      onClose={() => setShowOnboarding(false)}
    />
  );
};

// Main layout component
const MainLayout = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { setShowOnboarding } = React.useContext(OnboardingContext);
  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-[#050B20]">
      {/* Background styling */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 15% 10%, rgba(50, 70, 150, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 85% 5%, rgba(60, 50, 140, 0.05) 0%, transparent 40%),
            linear-gradient(150deg, rgba(5, 12, 35, 0.99), rgba(3, 8, 25, 0.98))`,
          backgroundAttachment: "fixed",
          boxShadow:
            "inset 0 -60px 100px -20px rgba(0, 5, 30, 0.2), inset 0 3px 10px rgba(80, 100, 200, 0.04)",
        }}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      </div>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          // Only apply margin on desktop
          window.innerWidth >= 768
            ? isCollapsed
              ? "md:ml-16"
              : "md:ml-64"
            : ""
        }`}
        style={{
          backdropFilter: "blur(12px)",
          background:
            "linear-gradient(135deg, rgba(10, 20, 50, 0.12), rgba(5, 12, 35, 0.05))",
          boxShadow: "inset 1px 1px 0 0 rgba(255, 255, 255, 0.03)",
          borderLeft:
            window.innerWidth >= 768
              ? "1px solid rgba(80, 100, 180, 0.04)"
              : "none",
        }}
      >
        {/* Desktop Navbar */}
        <div className="hidden md:block">
          <Navbar triggerOnboarding={() => setShowOnboarding(true)} />
        </div>

        {/* Mobile Navbar */}
        <div className="md:hidden py-2">
          <MobileNavbar triggerOnboarding={() => setShowOnboarding(true)} />
        </div>

        {/* Main Content */}
        <main className="w-full">
          {/* Mobile Content Container - Removed min-h-screen and reduced padding */}
          <div className="md:hidden pt-16 px-3 pb-20">
            <div className="w-full max-w-full overflow-x-hidden">
              {children}
            </div>
          </div>

          {/* Desktop Content Container - Removed min-h-screen and reduced padding */}
          <div className="hidden md:block pt-16 px-4 pb-2">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />
      <LocationAwareTooltips />
    </div>
  );
};

// Route Guard HOC
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/" />;
  }

  return <MainLayout>{children}</MainLayout>;
};

// Main App with Router
const App = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <ThemeProvider>
      <CustomToaster />
      <OnboardingContext.Provider value={{ showOnboarding, setShowOnboarding }}>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manual-testing"
              element={
                <ProtectedRoute>
                  <ManualTesting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email-analysis"
              element={
                <ProtectedRoute>
                  <EmailAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/llm-simulation"
              element={
                <ProtectedRoute>
                  <LLMSimulation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/faq"
              element={
                <ProtectedRoute>
                  <FAQ />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookmarks"
              element={
                <ProtectedRoute>
                  <BookmarksPage />
                </ProtectedRoute>
              }
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" />} />
          </Routes>
        </Router>
      </OnboardingContext.Provider>
    </ThemeProvider>
  );
};

export default App;
