import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../config/constant";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get the code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");

        // Handle OAuth errors
        if (error) {
          console.error("OAuth error:", error);
          navigate("/?error=" + encodeURIComponent(error));
          return;
        }

        if (!code) {
          console.error("No authorization code found in URL");
          navigate("/?error=no_code");
          return;
        }

        // DEBUG: Log all environment variables
        // console.log("🔍 Debug Info:");
        // console.log("- API_URL:", API_URL);
        // console.log("- VITE_API_URL:", import.meta.env.VITE_API_URL);
        // console.log("- VITE_REDIRECT_URI:", import.meta.env.VITE_REDIRECT_URI);
        // console.log("- Current URL:", window.location.href);

        const apiUrl =
          API_URL || import.meta.env.VITE_API_URL || "http://localhost:5000";
        const redirectUri =
          import.meta.env.VITE_REDIRECT_URI ||
          "http://localhost:5173/auth/callback";

        // console.log("🚀 Sending to backend:");
        // console.log("- Backend URL:", `${apiUrl}/api/auth/google-login`);
        // console.log("- Redirect URI:", redirectUri);
        // console.log("- Auth Code:", code.substring(0, 10) + "...");

        const response = await fetch(`${apiUrl}/api/auth/google-login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: redirectUri,
          }),
          credentials: "include",
        });

        // console.log("Backend response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Backend error:", response.status, errorText);
          throw new Error(
            `Authentication failed: ${response.status} - ${errorText}`
          );
        }

        const data = await response.json();
        // console.log("Auth success:", !!data.token);

        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem(
            "auth_data",
            JSON.stringify({
              token: data.token,
              user: data.user,
            })
          );

          // console.log("Redirecting to dashboard...");
          navigate("/dashboard");
        } else {
          console.error("Invalid response from server:", data);
          navigate("/?error=invalid_response");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        navigate("/?error=" + encodeURIComponent(error.message));
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#13051D] to-purple-900">
      <div className="text-center p-8 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg shadow-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Processing authentication...
        </h2>
        <p className="text-purple-200">
          Please wait while we complete your login.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
