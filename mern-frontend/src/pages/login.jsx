import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  exchangeCodeForToken,
  saveAuthData,
  isAuthenticated,
  clearAllData,
} from "../utils/auth";
import {
  GOOGLE_CLIENT_ID,
  REDIRECT_URI,
  LOGIN_SCOPE,
} from "../config/constant";
import { Card, CardContent } from "../components/ui/card";
import { Loader2, Shield, Lock } from "lucide-react";

const Login = () => {
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setAuthError("");

    if (isAuthenticated()) {
      navigate("/dashboard");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");
    const source = urlParams.get("source");
    const state = urlParams.get("state");

    if (source === "gmail" || (state && state.includes("gmail"))) {
      return;
    }

    if (error) {
      setAuthError(
        "Authentication failed: " +
          (error === "access_denied" ? "Access was denied" : error)
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (code) {
      handleAuthCode(code);
    }
  }, [navigate]);

  const handleAuthCode = async (code) => {
    setAuthError("");
    setIsLoading(true);

    try {
      const data = await exchangeCodeForToken(code, REDIRECT_URI);

      if (!data || !data.token || !data.user) {
        throw new Error("Invalid authentication response");
      }

      if (
        !data.user.email &&
        (!data.user.profile || !data.user.profile.email)
      ) {
        throw new Error("Email address not provided by authentication");
      }

      const saved = saveAuthData(data);

      if (!saved) {
        throw new Error("Failed to save authentication data");
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      navigate("/dashboard");
    } catch (error) {
      setAuthError(error.message || "Failed to connect to server");
      clearAllData();
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_REDIRECT_URI;

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&response_type=code` +
      `&scope=email profile` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Dark purple glowy gradient background */}
      <div className="fixed inset-0 bg-[#13051D] -z-10"></div>

      {/* Optimized gradient elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-indigo-700/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-1/2 right-1/2 w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-4 py-6 mx-auto">
        {/* Clean and minimal heading design */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
            Social Shield
          </h1>
          <h2 className="relative text-xl font-medium tracking-wide bg-gradient-to-r from-purple-400 via-pink-300 to-blue-400 bg-clip-text text-transparent">
            AI-Powered Email Security
          </h2>
          <div className="relative mt-3 mx-auto w-16 h-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-400 animate-pulse"></div>
          </div>
        </div>

        {/* Better proportioned card with reduced size */}
        <Card className="bg-white/10 backdrop-blur-sm border border-white/10 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            {/* Refined welcome message */}
            <div className="mb-6 text-center">
              <h3 className="text-white text-lg font-medium mb-1">Welcome</h3>
              <p className="text-purple-200/80 text-xs">
                Sign in to access your secure dashboard
              </p>
            </div>

            {authError && (
              <div className="bg-red-900/20 p-3 mb-6 rounded-lg border border-red-500/30">
                <p className="text-red-300 text-sm">{authError}</p>
              </div>
            )}

            {/* Button with shiny hover effect */}
            <div className="relative overflow-hidden rounded-md">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="btn-intense-purple w-full relative text-white rounded-md py-3 text-base font-bold tracking-wide overflow-hidden cursor-pointer"
                style={{
                  background:
                    "radial-gradient(circle at center, #9061F9 0%, #7E3FF2 45%, #6825C5 100%)",
                  transition: "none",
                }}
              >
                <span className="relative z-10 flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      <span>Sign in with Google</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Better spaced footer message */}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-purple-200/60 text-xs">
              <Lock className="h-3 w-3" />
              <span>Secure authentication • Zero data sharing</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add keyframes for the vertical shine animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shineEffectVertical {
          0% {
            background-position: 0 200%;
          }
          100% {
            background-position: 0 -100%;
          }
        }
      `,
        }}
      />
    </div>
  );
};

export default Login;
