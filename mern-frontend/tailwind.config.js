/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx}"],
    darkMode: "class", // Enable class-based dark mode
    theme: {
        extend: {
            screens: {
                'xs': '475px',
                // Add custom breakpoints if needed
            },
            spacing: {
                'safe-top': 'env(safe-area-inset-top)',
                'safe-bottom': 'env(safe-area-inset-bottom)',
                'safe-left': 'env(safe-area-inset-left)',
                'safe-right': 'env(safe-area-inset-right)',
            },
            colors: {
                // Light mode colors
                light: {
                    background: "#f8fafc",
                    foreground: "#0f172a",
                    card: "#ffffff",
                    "card-foreground": "#1e293b",
                    primary: "#6d28d9",
                    "primary-foreground": "#f8fafc",
                    secondary: "#f1f5f9",
                    "secondary-foreground": "#1e293b",
                    accent: "#9333ea",
                    "accent-foreground": "#f8fafc",
                    border: "#e2e8f0",
                    input: "#e2e8f0",
                    ring: "#8b5cf6",
                },
                // Dark mode colors (keeping your current dark theme)
                dark: {
                    background: "#070F2B",
                    foreground: "#f8fafc",
                    card: "#0a192f",
                    "card-foreground": "#e2e8f0",
                    primary: "#9333ea",
                    "primary-foreground": "#f8fafc",
                    secondary: "#1e293b",
                    "secondary-foreground": "#f8fafc",
                    accent: "#8b5cf6",
                    "accent-foreground": "#f8fafc",
                    border: "#1e293b",
                    input: "#1e293b",
                    ring: "#9333ea",
                },
            },
            fontFamily: {
                sans: ['Sora', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
                mono: ['Sora', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
            },
            letterSpacing: {
                tightest: '-0.03em',
                tighter: '-0.02em',
                tight: '-0.01em',
                normal: '0',
                wide: '0.01em',
            },
        },
    },
    plugins: [],
};
