import React from "react";
import { Toaster, toast } from "react-hot-toast";
import { Bookmark, Info, Check, X } from "lucide-react";

// Create a custom toaster component with glossy purple styling
export const CustomToaster = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: "rgba(126, 34, 206, 0.85)", // Semi-transparent purple
        color: "#faf5ff",
        border: "1px solid rgba(168, 85, 247, 0.2)",
        fontSize: "14px",
        maxWidth: "350px",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", // Reduced shadow
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      },
      success: {
        style: {
          background: "rgba(16, 185, 129, 0.85)",
          borderLeft: "2px solid rgba(34, 197, 94, 0.5)", // More subtle border
        },
        iconTheme: {
          primary: "#f0fdf4",
          secondary: "rgba(16, 185, 129, 0.85)",
        },
      },
      error: {
        style: {
          background: "rgba(239, 68, 68, 0.85)",
          borderLeft: "2px solid rgba(220, 38, 38, 0.5)",
        },
        iconTheme: {
          primary: "#fef2f2",
          secondary: "rgba(239, 68, 68, 0.85)",
        },
      },
    }}
  />
);

// Helper function to get icon based on toast type
const getIcon = (type) => {
  switch (type) {
    case "success":
      return <Check className="h-5 w-5 text-white" />;
    case "error":
      return <X className="h-5 w-5 text-white" />;
    case "info":
      return <Info className="h-5 w-5 text-white" />;
    case "bookmark":
      return <Bookmark className="h-5 w-5 text-purple-200" />;
    default:
      return null;
  }
};

// Custom toast functions
export const useToast = () => {
  const addToast = (message, type = "default") => {
    const icon = getIcon(type);

    // Common options for all toast types
    const commonOptions = {
      icon,
      style: {
        background: "linear-gradient(to bottom, #7e22ce, #9333ea)", // Purple gradient
        color: "#faf5ff",
        borderLeft: "4px solid #a855f7",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      },
    };

    // Use appropriate toast type method or custom styling
    switch (type) {
      case "success":
        return toast.success(message, {
          ...commonOptions,
          style: {
            ...commonOptions.style,
            background: "linear-gradient(to bottom, #10b981, #34d399)",
            borderLeft: "4px solid #22c55e",
          },
        });
      case "error":
        return toast.error(message, {
          ...commonOptions,
          style: {
            ...commonOptions.style,
            background: "linear-gradient(to bottom, #ef4444, #f87171)",
            borderLeft: "4px solid #dc2626",
          },
        });
      case "bookmark":
        return toast(message, {
          ...commonOptions,
          style: {
            ...commonOptions.style,
            background: "linear-gradient(to bottom, #7e22ce, #9333ea)",
            borderLeft: "4px solid #a855f7",
          },
        });
      case "info":
        return toast(message, {
          ...commonOptions,
          style: {
            ...commonOptions.style,
            background: "linear-gradient(to bottom, #3b82f6, #60a5fa)",
            borderLeft: "4px solid #2563eb",
          },
        });
      default:
        return toast(message, commonOptions);
    }
  };

  return { addToast };
};
