import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Info,
  ShieldCheck,
  BarChart2,
  Zap,
  Mail,
  Settings,
  HelpCircle,
  Shield,
  AlertTriangle,
  Award,
  TrendingUp,
} from "lucide-react";
import { Button } from "./ui/button";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "senti_analysis_onboarding_completed";

const OnboardingTooltips = ({ location, visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  // Reset current step when visibility changes
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  // Define tooltips based on current page
  const pageTooltips = {
    dashboard: [
      {
        title: "Welcome to Social Shield!",
        description:
          "Your intelligent email security assistant that helps identify threats and keep your inbox secure.",
        position: "center",
        icon: <Shield className="h-6 w-6" />,
      },
      {
        title: "Dashboard Overview",
        description:
          "View your email security metrics, threat levels, and sentiment analysis in one convenient place.",
        position: "top-center",
        target: ".dashboard-overview",
        icon: <BarChart2 className="h-6 w-6" />,
      },
      {
        title: "Connect Gmail",
        description:
          "Securely connect your Gmail to automatically analyze incoming emails and detect phishing attempts.",
        position: "bottom-right",
        target: ".gmail-connect-section",
        icon: <Mail className="h-6 w-6" />,
        action: {
          label: "Connect Gmail",
          onClick: () => {
            localStorage.setItem(STORAGE_KEY, "true");
            onClose();
            setTimeout(() => navigate("/settings"), 50);
          },
        },
      },
      {
        title: "Threat Detection Challenge",
        description:
          "Test and improve your phishing detection skills with our interactive simulation game.",
        position: "bottom-left",
        target: ".llm-simulation-card",
        icon: <Award className="h-6 w-6" />,
        action: {
          label: "Try Challenge",
          onClick: () => {
            localStorage.setItem(STORAGE_KEY, "true");
            onClose();
            setTimeout(() => navigate("/llm-simulation"), 50);
          },
        },
      },
      {
        title: "Email Analysis",
        description:
          "See recent threats detected, view sentiment analysis, and check detailed email security metrics.",
        position: "bottom-right",
        target: ".recent-emails-section",
        icon: <AlertTriangle className="h-6 w-6" />,
      },
    ],
    settings: [
      {
        title: "Gmail Security Integration",
        description:
          "Connect your Gmail to enable real-time threat detection and advanced security analysis.",
        position: "bottom-right",
        target: ".gmail-connect-button",
        icon: <Mail className="h-6 w-6" />,
      },
      {
        title: "Privacy First",
        description:
          "We never store your email content. Analysis happens in real-time, and only results are saved.",
        position: "top-center",
        target: ".privacy-section",
        icon: <Shield className="h-6 w-6" />,
      },
      {
        title: "Data Control",
        description:
          "You have full control over your data. Delete your account or analysis history at any time.",
        position: "bottom-left",
        target: ".data-controls-section",
        icon: <Settings className="h-6 w-6" />,
      },
    ],
    "email-analysis": [
      {
        title: "Email Security Hub",
        description:
          "Your central place for analyzing emails and identifying potential security threats.",
        position: "top-center",
        icon: <Shield className="h-6 w-6" />,
      },
      {
        title: "Threat Detection",
        description:
          "Our AI analyzes email content, links, and sender information to identify suspicious patterns.",
        position: "right",
        target: ".analyze-button",
        icon: <AlertTriangle className="h-6 w-6" />,
      },
      {
        title: "Risk Indicators",
        description:
          "We highlight specific elements that make an email suspicious, helping you learn to spot threats.",
        position: "bottom-left",
        target: ".suspicious-factors",
        icon: <Info className="h-6 w-6" />,
      },
      {
        title: "Sentiment Analysis",
        description:
          "We analyze emotional tone to help identify manipulation tactics used in phishing attempts.",
        position: "bottom-right",
        target: ".sentiment-indicator",
        icon: <BarChart2 className="h-6 w-6" />,
      },
    ],
    "llm-simulation": [
      {
        title: "Phishing Detection Challenge",
        description:
          "Sharpen your threat detection skills by identifying suspicious emails in this interactive game.",
        position: "top-center",
        icon: <Award className="h-6 w-6" />,
      },
      {
        title: "How It Works",
        description:
          "You'll be presented with realistic emails. Your task is to determine if they're legitimate or suspicious.",
        position: "bottom-right",
        target: ".game-tutorial",
        icon: <HelpCircle className="h-6 w-6" />,
      },
      {
        title: "Learn While Playing",
        description:
          "After each decision, you'll receive feedback explaining why the email was safe or suspicious.",
        position: "bottom-left",
        target: ".feedback-section",
        icon: <Info className="h-6 w-6" />,
      },
      {
        title: "Track Your Progress",
        description:
          "Your scores are saved and displayed on your dashboard, helping you improve over time.",
        position: "top-right",
        target: ".score-section",
        icon: <TrendingUp className="h-6 w-6" />,
      },
    ],
    "manual-testing": [
      {
        title: "Manual Email Analysis",
        description:
          "Test any suspicious email without connecting your Gmail account.",
        position: "top-center",
        icon: <ShieldCheck className="h-6 w-6" />,
      },
      {
        title: "How To Use",
        description:
          "Simply paste the full email content including headers and click 'Analyze' to get results.",
        position: "bottom-right",
        target: ".analyze-manual-button",
        icon: <Info className="h-6 w-6" />,
      },
      {
        title: "Privacy Assured",
        description:
          "Your pasted email content is analyzed in real-time and never stored on our servers.",
        position: "bottom-left",
        target: ".privacy-note",
        icon: <Shield className="h-6 w-6" />,
      },
    ],
  };

  // Get current page tooltips
  const tooltips = pageTooltips[location] || [];

  const handleNext = () => {
    if (currentStep < tooltips.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  };

  const skipOnboarding = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  };

  if (!visible || tooltips.length === 0) return null;

  const currentTooltip = tooltips[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tooltips.length - 1;

  // Highlight target element if exists
  const highlightTargetElement = () => {
    if (!currentTooltip.target) return null;

    const targetElement = document.querySelector(currentTooltip.target);
    if (!targetElement) return null;

    const rect = targetElement.getBoundingClientRect();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-40 pointer-events-none"
      >
        <div
          className="absolute bg-purple-500/10 border-2 border-purple-500/40 rounded-lg shadow-lg"
          style={{
            top: rect.top - 4 + "px",
            left: rect.left - 4 + "px",
            width: rect.width + 8 + "px",
            height: rect.height + 8 + "px",
          }}
        >
          <div className="absolute inset-0 animate-pulse-slow rounded-lg border border-purple-500/60"></div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Fixed positioning wrapper to ensure tooltip stays centered on scroll */}
      <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center pointer-events-none">
        {/* Semi-transparent overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
          onClick={skipOnboarding}
        />

        {/* Target element highlight */}
        {highlightTargetElement()}

        {/* Centered Tooltip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative w-[90%] max-w-[450px] rounded-xl shadow-xl shadow-purple-200/30 dark:shadow-purple-900/20 pointer-events-auto overflow-hidden"
          >
            {/* Background gradient matching navbar dropdown */}
            <div className="absolute inset-0 bg-gradient-to-b from-white to-purple-50 dark:from-purple-900 dark:to-gray-900 pointer-events-none" />

            {/* Border overlay */}
            <div className="absolute inset-0 border border-purple-200/50 dark:border-purple-800/50 rounded-xl pointer-events-none" />

            {/* Tooltip header */}
            <div className="relative flex items-center justify-between p-5 border-b border-purple-200/50 dark:border-purple-800/50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-800/40 text-purple-500 dark:text-purple-300 shadow-sm">
                  {currentTooltip.icon || <Info className="h-6 w-6" />}
                </div>
                <h3 className="font-semibold text-purple-700 dark:text-purple-300 text-xl">
                  {currentTooltip.title}
                </h3>
              </div>
              <button
                onClick={skipOnboarding}
                className="text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors rounded-full p-1.5 hover:bg-purple-100/50 dark:hover:bg-purple-800/30"
                aria-label="Close tooltip"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tooltip content */}
            <div className="relative p-6">
              <p className="text-purple-700 dark:text-purple-300 text-base leading-relaxed">
                {currentTooltip.description}
              </p>

              {/* Target element mention if applicable */}
              {currentTooltip.target && (
                <div className="mt-4 py-2 px-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-600 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                  <span className="font-medium text-purple-700 dark:text-purple-200">
                    Look at:{" "}
                  </span>
                  {currentTooltip.target.replace(".", "").replace("-", " ")}
                </div>
              )}

              {/* Optional action button */}
              {currentTooltip.action && (
                <Button
                  className="mt-6 w-full bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all border-0"
                  size="lg"
                  onClick={currentTooltip.action.onClick}
                >
                  {currentTooltip.action.label}
                </Button>
              )}
            </div>

            {/* Tooltip footer */}
            <div className="relative flex items-center justify-between p-5 border-t border-purple-200/50 dark:border-purple-800/50 rounded-b-xl bg-purple-50/70 dark:bg-purple-900/20">
              <div className="flex items-center gap-2">
                {Array.from({ length: tooltips.length }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`h-3 w-3 rounded-full transition-colors duration-150 ${
                      index === currentStep
                        ? "bg-purple-600 dark:bg-purple-400"
                        : "bg-purple-300/50 dark:bg-purple-700/50 hover:bg-purple-400/70 dark:hover:bg-purple-600/70"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3">
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrevious}
                    className="text-purple-600 dark:text-purple-300 hover:text-purple-700 dark:hover:text-purple-200 hover:bg-purple-100/70 dark:hover:bg-purple-800/30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                )}

                <Button
                  variant={isLastStep ? "default" : "outline"}
                  size="sm"
                  onClick={handleNext}
                  className={
                    isLastStep
                      ? "bg-purple-600 hover:bg-purple-700 text-white font-medium border-0"
                      : "border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-800/30 hover:text-purple-700 dark:hover:text-purple-200"
                  }
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Got it
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default OnboardingTooltips;
