import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { API_URL } from "../config/constant";
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Info,
  Trophy,
  Brain,
  Target,
  TrendingUp,
  Lock,
  BarChart2,
  FileText,
  Share2,
  HelpCircle,
  AlertCircle,
} from "lucide-react";
import { getAuthData } from "../utils/auth";
import axios from "axios";
import { Progress } from "../components/ui/progress";
import GradientButton from "../components/ui/GradientButton";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const LLMSimulation = () => {
  // console.log("🔥 LLMSimulation component is MOUNTING!");
  // console.log(
  //   "🔥 Component render started at:",
  //   new Date().toLocaleTimeString()
  // );

  const authData = getAuthData();
  // console.log("🔥 AuthData:", authData);
  const user = authData?.user || null;
  const [email, setEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30-second timer for answering
  const timerRef = useRef(null); // Ref to store the timer interval
  const [finalScorePercentage, setFinalScorePercentage] = useState(0);
  const [previousScores, setPreviousScores] = useState([]);
  const isApiCallInProgress = useRef(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showingInstructions, setShowingInstructions] = useState(false);
  const isGeneratingEmail = useRef(false);
  const [componentError, setComponentError] = useState(null);

  useEffect(() => {
    let timer;
    // Only fetch on initial mount if user exists and scores not loaded yet
    if (user && user.email && !scoresLoaded) {
      timer = setTimeout(() => {
        fetchPreviousScores();
      }, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [user, scoresLoaded]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleError = (error) => {
      // console.error("🚨 Component Error:", error);
      setComponentError(error.message);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  useEffect(() => {
    // Prevent any direct Google API calls by blocking undefined key usage
    const originalFetch = window.fetch;

    window.fetch = function (url, options = {}) {
      // Block direct googleapis calls with undefined keys
      if (
        typeof url === "string" &&
        url.includes("googleapis.com") &&
        url.includes("key=undefined")
      ) {
        // console.error(
        //   "🚨 BLOCKED: Attempted direct Google API call with undefined key:",
        //   url
        // );
        // console.trace("Call originated from:");
        return Promise.reject(
          new Error("Direct Google API calls not allowed from frontend")
        );
      }

      // Log all googleapis calls for debugging
      if (typeof url === "string" && url.includes("googleapis.com")) {
        // console.warn("⚠️ Direct Google API call detected:", url);
        // console.trace("Call stack:");
      }

      return originalFetch.apply(this, arguments);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // Add protective environment check
  useEffect(() => {
    // Ensure no leaked API keys in frontend
    if (window.GEMINI_API_KEY || window.GOOGLE_API_KEY) {
      // console.error("🚨 API KEY LEAKED TO FRONTEND! Removing...");
      delete window.GEMINI_API_KEY;
      delete window.GOOGLE_API_KEY;
    }
  }, []);

  const finishGame = async (finalScore = score) => {
    setLoading(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const scorePercentage = calculateScorePercentage(finalScore, 3);
    setFinalScorePercentage(scorePercentage);

    // Create the new score object that will be saved regardless of API success
    const newScore = {
      email: user?.email || "anonymous",
      score: scorePercentage,
      date: new Date().toISOString(),
      savedLocally: false,
    };

    // Save score without setting cooldown
    try {
      if (
        user &&
        user.email &&
        typeof user.email === "string" &&
        user.email.includes("@")
      ) {
        const response = await apiClient.post(
          "/api/scores",
          {
            email: user.email,
            score: scorePercentage,
            date: new Date().toISOString(),
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: authData?.token ? `Bearer ${authData.token}` : "",
            },
          }
        );

        if (response.data && response.data.success) {
          // console.log("Score saved to backend successfully");
          newScore.savedLocally = false;
        }
      }
    } catch (error) {
      // console.error("Error saving score to backend:", error);
    }

    // Update local storage without cooldown
    try {
      const existingScores = JSON.parse(
        localStorage.getItem("llm_game_scores") || "[]"
      );
      existingScores.unshift(newScore);
      localStorage.setItem(
        "llm_game_scores",
        JSON.stringify(existingScores.slice(0, 10))
      );
      setPreviousScores(existingScores);
    } catch (error) {
      // console.error("Error saving score to localStorage:", error);
    }

    setGameStarted(false);
  };

  const generateEmail = async () => {
    if (attempts >= 3 || isGeneratingEmail.current) return;

    isGeneratingEmail.current = true;
    setLoading(true);
    setFeedback("");
    setIsCorrect(null);

    try {
      const promptType = Math.random() > 0.5 ? "suspicious" : "legitimate";

      // Use API_URL from constants instead of hardcoded URL
      const response = await fetch(`${API_URL}/api/gemini/generate-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptType: promptType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      // console.log("Response from backend:", data);

      if (data.candidates && data.candidates.length > 0) {
        const emailText = data.candidates[0].content.parts[0].text;
        let subject = "Important Message";
        let body = emailText;

        // Try to extract subject if it exists
        const subjectMatch = emailText.match(/Subject:(.+?)(?:\n|$)/i);
        if (subjectMatch) {
          subject = subjectMatch[1].trim();
          body = emailText.replace(/Subject:.+?(?:\n|$)/i, "").trim();
        }

        // Create sender based on email type
        const sender =
          promptType === "suspicious"
            ? generateSuspiciousSender()
            : generateLegitimateSender();

        // Filter and format the body to keep only important content
        body = filterEmailContent(body);

        // Ensure body is exactly 290 characters
        body = ensureCharacterLength(body, 290);

        // Analyze content to determine threat status
        const isThreat = analyzeEmailContent(body, subject, sender);

        // console.log(
        //   `Email generated as ${isThreat ? "THREAT" : "SAFE"}: ${subject}`
        // );
        // console.log(`Email length: ${body.length} characters`);

        setEmail({
          from: sender,
          subject: subject,
          body: body,
          isThreat: isThreat,
          analysis: {
            threatIndicators: detectThreatIndicators(body, subject, sender),
            safetyIndicators: detectSafetyIndicators(body, subject, sender),
          },
        });

        startTimer();
      } else {
        throw new Error("No email generated");
      }
    } catch (error) {
      // console.error("Error generating email:", error);
      setFeedback(`Failed to generate email: ${error.message}`);
    } finally {
      setLoading(false);
      isGeneratingEmail.current = false;
    }
  };

  // Function to filter email content to keep only important parts
  const filterEmailContent = (content) => {
    // Remove common email fluff like long signatures, unnecessary pleasantries
    let filtered = content
      .replace(/Best regards,[\s\S]*$/i, "") // Remove signatures
      .replace(/Sincerely,[\s\S]*$/i, "")
      .replace(/Thank you[\s\S]*?,$/, "") // Remove closing thank yous
      .replace(/^Dear\s+[^,]*,\s*/i, "") // Remove opening salutations
      .replace(/^Hello\s+[^,]*,\s*/i, "")
      .replace(/^Hi\s+[^,]*,\s*/i, "")
      .replace(/Please\s+do\s+not\s+hesitate\s+to\s+contact\s+me.*$/, "") // Remove standard closing phrases
      .replace(/I\s+look\s+forward\s+to\s+hearing\s+from\s+you.*$/, "")
      .replace(/^\s+|\s+$/g, ""); // Trim whitespace

    // Prioritize content with potential indicators (both threat and safe)
    const importantPhrases = [
      "account",
      "password",
      "login",
      "click",
      "link",
      "urgent",
      "payment",
      "verify",
      "security",
      "bank",
      "transaction",
      "document",
      "review",
      "deadline",
      "project",
      "meeting",
      "update",
    ];

    // Check if any important content remains
    if (filtered.length < 100) {
      return content.trim(); // If we filtered too much, return the original
    }

    return filtered;
  };

  // Function to ensure the email is exactly the target length
  const ensureCharacterLength = (text, targetLength) => {
    if (text.length === targetLength) {
      return text;
    } else if (text.length > targetLength) {
      // Trim down to target length, trying to preserve complete words
      return text.substring(0, targetLength - 3) + "...";
    } else {
      // Extend to target length with generic content
      const shortfall = targetLength - text.length;

      // Add padding that makes sense in context
      const padding =
        "\n\nPlease review this information at your earliest convenience. ";
      return text + padding.substring(0, shortfall);
    }
  };

  // Generate realistic but slightly off senders for suspicious emails
  const generateSuspiciousSender = () => {
    const legitimateDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ];
    const suspiciousDomains = [
      "grnail.com",
      "yah00.com",
      "hotrnail.com",
      "0utlook.com",
      "googgle.com",
      "amaz0n.com",
      "paypa1.com",
      "bankservice.net",
    ];

    const names = [
      "John",
      "Mary",
      "Support",
      "Service",
      "Team",
      "Admin",
      "Security",
      "Bank",
    ];
    const name = names[Math.floor(Math.random() * names.length)];
    const domain =
      suspiciousDomains[Math.floor(Math.random() * suspiciousDomains.length)];

    return `${name} <${name.toLowerCase()}@${domain}>`;
  };

  // Generate legitimate sender addresses
  const generateLegitimateSender = () => {
    const legitimateDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "company.com",
    ];
    const names = [
      "John",
      "Jane",
      "Olivia",
      "Emma",
      "Ava",
      "Sophia",
      "Isabella",
      "Mia",
      "Liam",
      "Miyu",
      "Miyuki",
      "Miyu",
      "Miyuki",
      "Miyu",
      "Miyuki",
      "Miyu",
      "Mary",
      "Alex",
      "Sarah",
      "Team",
      "HR",
      "IT",
      "Office",
    ];

    const name = names[Math.floor(Math.random() * names.length)];
    const domain =
      legitimateDomains[Math.floor(Math.random() * legitimateDomains.length)];

    return `${name} <${name.toLowerCase()}@${domain}>`;
  };

  // Improved threat analysis that uses multiple factors
  const analyzeEmailContent = (body, subject, sender) => {
    const threatScore = detectThreatIndicators(body, subject, sender).length;
    const safetyScore = detectSafetyIndicators(body, subject, sender).length;

    // Email is a threat if it has more threat indicators than safety indicators
    return threatScore > safetyScore;
  };

  // Detect threat indicators in email
  const detectThreatIndicators = (body, subject, sender) => {
    const combinedText = `${subject} ${body} ${sender}`.toLowerCase();

    const threatIndicators = [
      // Urgency triggers
      {
        pattern: /urgent|immediate action|right away|asap|expires soon/i,
        weight: 2,
      },

      // Credential related
      { pattern: /password|login|account|verify|confirm your/i, weight: 2 },

      // Financial triggers
      {
        pattern: /bank|credit card|payment|invoice|transaction|transfer/i,
        weight: 1,
      },

      // Action demands
      { pattern: /click|download|open attachment|link below/i, weight: 1 },

      // Suspicious domains in sender
      {
        pattern: /grnail|yah00|0utlook|googgle|amaz0n|paypa1|bankservice/i,
        weight: 3,
      },

      // Threats or consequences
      {
        pattern: /suspended|limited|blocked|unauthorized|suspicious activity/i,
        weight: 2,
      },

      // Unusual requests
      {
        pattern: /gift card|wire transfer|western union|bitcoin|crypto/i,
        weight: 2,
      },
    ];

    return threatIndicators
      .filter((indicator) => indicator.pattern.test(combinedText))
      .map((indicator) => ({
        type: indicator.pattern.toString().replace(/\/|i/g, ""),
        weight: indicator.weight,
      }));
  };

  // Detect safety indicators in email
  const detectSafetyIndicators = (body, subject, sender) => {
    const combinedText = `${subject} ${body} ${sender}`.toLowerCase();

    const safetyIndicators = [
      // Professional/formal language
      {
        pattern: /meeting|agenda|report|project|schedule|team|update/i,
        weight: 1,
      },

      // Common business topics
      {
        pattern: /quarterly|review|presentation|document|discussion/i,
        weight: 1,
      },

      // Legitimate domains
      {
        pattern:
          /@gmail\.com|@yahoo\.com|@hotmail\.com|@outlook\.com|@company\.com/i,
        weight: 2,
      },

      // Personalization
      { pattern: /hi [a-z]+|hello [a-z]+|dear [a-z]+/i, weight: 1 },

      // Collaborative language
      {
        pattern: /please share|would you mind|what do you think|your thoughts/i,
        weight: 1,
      },

      // Professional closing
      { pattern: /regards|sincerely|thank you|thanks|best wishes/i, weight: 1 },
    ];

    return safetyIndicators
      .filter((indicator) => indicator.pattern.test(combinedText))
      .map((indicator) => ({
        type: indicator.pattern.toString().replace(/\/|i/g, ""),
        weight: indicator.weight,
      }));
  };

  const skipEmail = () => {
    if (attempts >= 3) return;

    setFeedback("You skipped this email. Moving to the next question.");
    setAttempts((prev) => prev + 1);
    clearInterval(timerRef.current); // Stop the timer

    // Automatically move to the next question after a short delay
    setTimeout(() => {
      if (attempts + 1 >= 3) {
        // If this was the last attempt, stop loading and clear any pending processes
        finishGame();
      } else {
        setEmail(null); // Remove the current email
        generateEmail(); // Generate the next email
      }
    }, 2000); // 2 seconds delay before moving to the next question
  };

  const handleGuess = (isThreat) => {
    if (!email || attempts >= 3) return;

    const correct = isThreat === email.isThreat;
    setIsCorrect(correct);

    let newScore = score;
    if (correct) {
      newScore = score + 1;
      setScore(newScore);

      // Provide educational feedback about why the assessment was correct
      if (isThreat) {
        const threatReasons = email.analysis.threatIndicators
          .map((i) => i.type.replace(/\\|\(|\)|/g, ""))
          .slice(0, 2)
          .join(", ");

        setFeedback(
          `Correct! Good catch! This email contains suspicious elements: ${threatReasons}.`
        );
      } else {
        setFeedback("Correct! This is a legitimate email.");
      }
    } else {
      if (isThreat) {
        // Explain why the safe email was actually safe
        const safetyReasons = email.analysis.safetyIndicators
          .map((i) => i.type.replace(/\\|\(|\)|/g, ""))
          .slice(0, 2)
          .join(", ");

        setFeedback(
          `Incorrect! This was actually a safe email. Look for legitimate elements like: ${safetyReasons}.`
        );
      } else {
        // Explain why the threatening email was actually threatening
        const threatReasons = email.analysis.threatIndicators
          .map((i) => i.type.replace(/\\|\(|\)|/g, ""))
          .slice(0, 2)
          .join(", ");

        setFeedback(
          `Incorrect! This was a threat. Watch out for: ${threatReasons}.`
        );
      }
    }

    setAttempts((prev) => prev + 1);
    clearInterval(timerRef.current);

    setTimeout(() => {
      if (attempts + 1 >= 3) {
        finishGame(newScore); // Pass the known new score value
      } else {
        generateEmail();
      }
    }, 2000);
  };

  const resetGame = () => {
    setScore(0);
    setAttempts(0);
    setEmail(null);
    setIsCorrect(null);
    setFeedback("");
    setLoading(false);
    clearInterval(timerRef.current);
    setGameStarted(true);
    generateEmail();
  };

  const startGame = () => {
    setGameStarted(true);
    generateEmail();
  };

  const fetchFullEmailDetails = async (emailId) => {
    try {
      const currentToken = authData?.token || user.token;
      if (!currentToken) {
        // console.error("No token available for email fetch");
        return null;
      }

      const response = await fetch(`${API_URL}/api/gmail/emails/${emailId}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "X-User-Email": user.email.toLowerCase(),
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        // console.error(`Failed to fetch email ${emailId}: ${errorText}`);
        return null;
      }

      const emailData = await response.json();
      // console.log("Email Data:", emailData);

      // Extract subject and from from the API response
      const subjectHeader = emailData.payload.headers.find(
        (header) => header.name === "Subject"
      );
      const fromHeader = emailData.payload.headers.find(
        (header) => header.name === "From"
      );

      const subject = subjectHeader ? subjectHeader.value : "No Subject";
      const from = fromHeader ? fromHeader.value : "Unknown Sender";

      // Parse sender information properly
      let senderEmail = from;

      // If the from field contains an email in <> format, extract it
      const emailMatch = from.match(/<([^>]*)>/);
      if (emailMatch && emailMatch[1]) {
        senderEmail = emailMatch[1];
      }

      // Ensure we have basic email structure
      return {
        id: emailId,
        subject: subject,
        from: from, // Keep the original from value which includes name
        senderEmail: senderEmail, // Store just the email separately
        date: emailData.internalDate
          ? new Date(parseInt(emailData.internalDate)).toLocaleString()
          : new Date().toLocaleString(),
        body: emailData.snippet || "No content available",
        snippet: emailData.snippet || "",
        ...emailData,
      };
    } catch (err) {
      // console.error("Error fetching full email:", err);
      return null;
    }
  };

  // Update how emails are displayed in the UI to prevent revealing answers
  const renderEmailBody = (body) => {
    // Remove any explicit indicators that could give away the answer
    const sanitizedBody = body
      .replace(/\*\*Example \d+: (Safe|Threat) \(True\)\*\*/gi, "") // Remove classification headers
      .replace(/\(safe\)|\(threat\)|\(phishing\)/gi, "") // Remove explicit labels
      .replace(/this is (a safe|an unsafe|a threatening) email/gi, "")
      .replace(/this email is (safe|a threat|suspicious)/gi, "")
      .trim();

    return sanitizedBody;
  };

  // Toggle showing/hiding tutorial
  const toggleTutorial = () => {
    setShowTutorial(!showTutorial);
  };

  // Toggle showing/hiding instructions
  const toggleInstructions = () => {
    setShowingInstructions(!showingInstructions);
  };

  const startTimer = () => {
    setTimeLeft(30); // Reset to 30 seconds

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current);
          setFeedback("Time's up! Moving to the next question.");

          setAttempts((currentAttempts) => {
            const newAttempts = currentAttempts + 1;

            setTimeout(() => {
              if (newAttempts >= 3) {
                finishGame();
              } else {
                setEmail(null);
                generateEmail();
              }
            }, 2000);

            return newAttempts;
          });

          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const calculateScorePercentage = (score, totalQuestions) => {
    return Math.round((score / totalQuestions) * 100);
  };

  const fetchPreviousScores = async () => {
    try {
      const localScores = JSON.parse(
        localStorage.getItem("llm_game_scores") || "[]"
      );
      setPreviousScores(localScores);

      if (user && user.email && authData?.token) {
        const response = await fetch(`${API_URL}/api/scores`, {
          headers: {
            Authorization: `Bearer ${authData.token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const backendScores = await response.json();
          if (backendScores && Array.isArray(backendScores)) {
            const mergedScores = [...backendScores, ...localScores]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10);

            setPreviousScores(mergedScores);
          }
        }
      }

      setScoresLoaded(true);
    } catch (error) {
      // console.error("Error fetching previous scores:", error);
      const localScores = JSON.parse(
        localStorage.getItem("llm_game_scores") || "[]"
      );
      setPreviousScores(localScores);
      setScoresLoaded(true);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto text-[rgb(var(--foreground))]">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 text-[rgb(var(--foreground))]">
        <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8 text-[rgb(var(--primary))]" />
        LLM Simulation
      </h1>

      {componentError && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/20 border border-red-800/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm text-red-300">
            <p className="font-medium">Component Error Detected:</p>
            <p className="break-words">{componentError}</p>
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900 mb-4 sm:mb-6">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300 flex-shrink-0 mt-1 sm:mt-0" />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl sm:text-2xl text-white leading-tight">
                Threat Detection Game
              </CardTitle>
              <CardDescription className="text-purple-300 text-sm sm:text-base mt-1">
                Test your skills by identifying threat emails generated by an
                LLM
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
          {!gameStarted ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 p-0.5 sm:p-1 rounded-lg shadow-lg mb-3 sm:mb-4">
                <div className="bg-[#0a192f] p-4 sm:p-6 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-3 sm:gap-0">
                    <h3 className="font-semibold text-white text-lg sm:text-2xl flex items-center gap-2">
                      <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                      Phishing Detection Challenge
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleTutorial}
                      className="bg-[#1a2a3a] border-blue-800/30 text-purple-300 hover:bg-blue-900/50 text-xs sm:text-sm h-8 sm:h-9 self-start sm:self-auto"
                    >
                      <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {showTutorial ? "Hide Tutorial" : "How to Play"}
                    </Button>
                  </div>

                  {showTutorial && (
                    <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border border-purple-800/30">
                      <h4 className="text-purple-300 font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                        How the Game Works:
                      </h4>
                      <ol className="space-y-2 sm:space-y-3 text-gray-300 list-decimal list-inside text-xs sm:text-sm">
                        <li className="flex items-start">
                          <span className="text-purple-300 font-medium mr-1 sm:mr-2 inline-block w-4 sm:w-5 text-xs sm:text-sm">
                            1.
                          </span>
                          <span>
                            You'll be shown{" "}
                            <span className="text-purple-300 font-medium">
                              3
                            </span>{" "}
                            different emails generated by AI
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-300 font-medium mr-1 sm:mr-2 inline-block w-4 sm:w-5 text-xs sm:text-sm">
                            2.
                          </span>
                          <span>
                            Examine the{" "}
                            <span className="text-purple-300 font-medium">
                              sender
                            </span>
                            ,{" "}
                            <span className="text-purple-300 font-medium">
                              subject
                            </span>
                            , and{" "}
                            <span className="text-purple-300 font-medium">
                              content
                            </span>{" "}
                            carefully
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-300 font-medium mr-1 sm:mr-2 inline-block w-4 sm:w-5 text-xs sm:text-sm">
                            3.
                          </span>
                          <span>
                            Decide if the email is{" "}
                            <span className="text-red-400 font-medium">
                              suspicious
                            </span>{" "}
                            or{" "}
                            <span className="text-green-400 font-medium">
                              safe
                            </span>
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-300 font-medium mr-1 sm:mr-2 inline-block w-4 sm:w-5 text-xs sm:text-sm">
                            4.
                          </span>
                          <span>
                            You'll get{" "}
                            <span className="text-purple-300 font-medium">
                              feedback
                            </span>{" "}
                            after each decision to help you learn
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-300 font-medium mr-1 sm:mr-2 inline-block w-4 sm:w-5 text-xs sm:text-sm">
                            5.
                          </span>
                          <span>
                            Your{" "}
                            <span className="text-purple-300 font-medium">
                              score
                            </span>{" "}
                            is saved whether you're connected to Gmail or not
                          </span>
                        </li>
                      </ol>

                      <div className="mt-3 sm:mt-4">
                        <h4 className="text-purple-300 font-semibold mb-2 text-sm sm:text-base">
                          What to Look For:
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <div className="bg-red-900/30 p-2 sm:p-3 rounded border border-red-800/30">
                            <h5 className="font-medium text-red-300 mb-1 flex items-center gap-1 text-xs sm:text-sm">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                              Threat Indicators
                            </h5>
                            <ul className="text-gray-300 text-xs space-y-1 sm:space-y-1.5">
                              <li>• Mismatched or misspelled email domains</li>
                              <li>• Urgent requests for action</li>
                              <li>• Requests for sensitive information</li>
                              <li>• Suspicious links or attachments</li>
                            </ul>
                          </div>
                          <div className="bg-green-900/30 p-2 sm:p-3 rounded border border-green-800/30">
                            <h5 className="font-medium text-green-300 mb-1 flex items-center gap-1 text-xs sm:text-sm">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              Safety Indicators
                            </h5>
                            <ul className="text-gray-300 text-xs space-y-1 sm:space-y-1.5">
                              <li>• Legitimate email domains</li>
                              <li>• Expected business communication</li>
                              <li>• Personalized content</li>
                              <li>• Professional language and format</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
                    Welcome to the Threat Detection Challenge! This game helps
                    you develop real-world skills to identify phishing emails
                    and protect yourself from online threats. Your scores are
                    tracked whether you're connected to Gmail or not.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-blue-800/30 flex flex-col items-center">
                      <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mb-1 sm:mb-2" />
                      <h4 className="font-medium text-white mb-1 text-sm sm:text-base">
                        3 Challenges
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300 text-center">
                        Identify if each email is safe or suspicious
                      </p>
                    </div>
                    <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-purple-800/30 flex flex-col items-center">
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-400 mb-1 sm:mb-2" />
                      <h4 className="font-medium text-white mb-1 text-sm sm:text-base">
                        30 Seconds
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300 text-center">
                        Time limit for each decision just like real life
                      </p>
                    </div>
                    <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-green-800/30 flex flex-col items-center">
                      <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-green-400 mb-1 sm:mb-2" />
                      <h4 className="font-medium text-white mb-1 text-sm sm:text-base">
                        Build Skills
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300 text-center">
                        Learn what makes an email suspicious
                      </p>
                    </div>
                  </div>

                  {previousScores.length > 0 && (
                    <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-blue-800/30 mb-3 sm:mb-4">
                      <h3 className="font-medium text-white mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        Your Previous Scores
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2">
                        {previousScores.slice(0, 3).map((prevScore, index) => (
                          <div key={index} className="flex items-center">
                            <div className="w-1/3 text-xs sm:text-sm text-gray-400">
                              {new Date(prevScore.date).toLocaleDateString()}
                            </div>
                            <div className="w-2/3">
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={Math.round(prevScore.score)}
                                  className="h-2 sm:h-2.5"
                                  indicatorClassName={
                                    Math.round(prevScore.score) >= 80
                                      ? "bg-green-500"
                                      : Math.round(prevScore.score) >= 60
                                      ? "bg-blue-500"
                                      : "bg-purple-500"
                                  }
                                />
                                <span className="text-xs sm:text-sm font-medium text-white">
                                  {Math.round(prevScore.score)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-green-900/20 p-2 sm:p-3 rounded-lg border border-green-800/30 flex items-start gap-2 mb-3 sm:mb-4">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-green-300">
                      <span className="font-medium">
                        Your scores are always saved
                      </span>{" "}
                      - whether you're connected to Gmail or not. They'll appear
                      in your dashboard statistics to track your progress over
                      time.
                    </p>
                  </div>

                  <GradientButton
                    onClick={startGame}
                    className="w-full py-3 sm:py-4 text-lg sm:text-xl font-extrabold tracking-wide flex items-center justify-center gap-2 mb-3 sm:mb-4"
                    colors={{
                      glowStart: "#C4B5FD",
                      glowEnd: "#8B5CF6",
                      gradientStart: "#6D28D9",
                      gradientEnd: "#5B21B6",
                    }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 sm:h-6 sm:w-7 mr-2" />
                      Start Challenge
                    </span>
                  </GradientButton>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4 sm:space-y-6">
                {attempts < 3 && (
                  <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-0.5 sm:p-1 rounded-lg shadow-lg">
                    <div className="bg-[#1a2a3a] p-4 sm:p-6 rounded-lg">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
                        <h3 className="font-semibold text-white text-lg sm:text-xl">
                          Challenge {attempts + 1} of 3
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleInstructions}
                          className="bg-purple-900/50 border-purple-500 text-purple-300 hover:bg-purple-800 text-xs sm:text-sm h-8 sm:h-9 self-start sm:self-auto"
                        >
                          <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          {showingInstructions ? "Hide Tips" : "Show Tips"}
                        </Button>
                      </div>

                      {showingInstructions && (
                        <div className="bg-[#0a1525] p-2 sm:p-3 rounded-lg mb-3 sm:mb-4 border border-blue-800/30">
                          <h4 className="text-purple-300 font-semibold mb-2 text-sm sm:text-base">
                            Quick Tips:
                          </h4>
                          <ul className="space-y-1 sm:space-y-1.5 text-gray-300 text-xs sm:text-sm">
                            <li className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <span>
                                Check for misspelled domains (like "amaz0n"
                                instead of "amazon")
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400 mt-0.5 flex-shrink-0" />
                              <span>
                                Be wary of urgent requests demanding immediate
                                action
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <span>
                                Legitimate emails typically don't ask for
                                sensitive information
                              </span>
                            </li>
                          </ul>

                          <div className="mb-2 sm:mb-3 mt-3 sm:mt-4">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                                <span className="text-xs sm:text-sm text-blue-300">
                                  Time Remaining
                                </span>
                              </div>
                              <span className="text-xs sm:text-sm font-medium text-white">
                                {timeLeft}s
                              </span>
                            </div>
                            <Progress
                              value={(timeLeft / 30) * 100}
                              className="h-1.5 sm:h-2"
                              indicatorClassName={
                                timeLeft > 20
                                  ? "bg-green-500"
                                  : timeLeft > 10
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }
                            />
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                              <div className="bg-purple-900/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-purple-300 font-medium text-xs sm:text-sm flex items-center gap-1">
                                <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                                Score: {score}
                              </div>
                              <div className="text-xs sm:text-sm text-purple-300">
                                <span className="text-white font-medium">
                                  {3 - attempts}
                                </span>{" "}
                                {3 - attempts === 1 ? "email" : "emails"}{" "}
                                remaining
                              </div>
                            </div>
                            <Button
                              onClick={skipEmail}
                              disabled={attempts >= 3}
                              variant="outline"
                              size="sm"
                              className="border-purple-600 text-purple-300 hover:bg-purple-900/50 text-xs sm:text-sm h-7 sm:h-8 self-start sm:self-auto"
                            >
                              Skip Email
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center items-center p-4 sm:p-6">
                    <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-purple-300" />
                  </div>
                ) : (
                  email &&
                  attempts < 3 && (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-0.5 sm:p-1 rounded-lg shadow-lg">
                        <div className="bg-[#1a2a3a] p-4 sm:p-6 rounded-lg">
                          <h3 className="font-semibold text-white text-lg sm:text-xl border-b border-blue-800/30 pb-2">
                            Is this email safe or suspicious?
                          </h3>
                          <div className="text-gray-300 space-y-3 sm:space-y-4 mt-4">
                            <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-blue-800/20">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3 border-b border-blue-800/20 pb-2">
                                <span className="font-semibold text-blue-300 text-sm sm:text-base sm:w-20">
                                  From:
                                </span>
                                <span className="text-white text-sm sm:text-base break-all">
                                  {email.from}
                                </span>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3 border-b border-blue-800/20 pb-2">
                                <span className="font-semibold text-blue-300 text-sm sm:text-base sm:w-20">
                                  Subject:
                                </span>
                                <span className="text-white font-medium text-sm sm:text-base break-words">
                                  {email.subject}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2">
                                <span className="font-semibold text-blue-300 text-sm sm:text-base">
                                  Body:
                                </span>
                                <div className="bg-[#0a192f] p-3 sm:p-4 rounded-lg border border-blue-800/20">
                                  <p className="text-gray-300 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                                    {renderEmailBody(email.body)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Button
                          onClick={() => handleGuess(true)}
                          disabled={attempts >= 3}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-red-700/30 disabled:opacity-50 py-4 sm:py-6 text-base sm:text-lg transition-all rounded-lg"
                        >
                          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                          <span className="font-medium">
                            Mark as Suspicious
                          </span>
                        </Button>
                        <Button
                          onClick={() => handleGuess(false)}
                          disabled={attempts >= 3}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-green-700/30 disabled:opacity-50 py-4 sm:py-6 text-base sm:text-lg transition-all rounded-lg"
                        >
                          <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                          <span className="font-medium">Mark as Safe</span>
                        </Button>
                      </div>
                    </div>
                  )
                )}

                {feedback && attempts < 3 && (
                  <div
                    className={`bg-gradient-to-r ${
                      isCorrect
                        ? "from-green-900 to-green-800"
                        : "from-red-900 to-red-800"
                    } p-0.5 sm:p-1 rounded-lg shadow-lg`}
                  >
                    <div className="p-4 sm:p-5 rounded-lg flex items-start gap-2 sm:gap-3">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400 flex-shrink-0 mt-1" />
                      )}
                      <div className="space-y-1">
                        <h4 className="font-medium text-white text-sm sm:text-base">
                          {isCorrect ? "Great job!" : "Not quite right"}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-300">
                          {feedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {attempts >= 3 && (
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-0.5 sm:p-1 rounded-lg shadow-lg">
                      <div className="bg-[#1a2a3a] p-4 sm:p-6 rounded-lg">
                        <div className="text-center mb-4 sm:mb-6">
                          <h3 className="font-bold text-white text-xl sm:text-2xl mb-3 sm:mb-4 flex items-center justify-center gap-2">
                            <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-400" />
                            Challenge Complete!
                          </h3>

                          <div className="inline-flex items-center justify-center">
                            <div className="relative">
                              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-purple-900 to-blue-900 flex items-center justify-center mb-2">
                                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-[#0a192f] flex items-center justify-center text-2xl sm:text-4xl font-bold">
                                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text">
                                    {Math.round(finalScorePercentage)}%
                                  </span>
                                </div>
                              </div>
                              {score === 3 && (
                                <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 bg-yellow-500 rounded-full p-1 sm:p-1.5 shadow-lg animate-bounce">
                                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                </div>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-300 mb-2 text-sm sm:text-base">
                            You scored{" "}
                            <span className="text-white font-medium">
                              {score}
                            </span>{" "}
                            out of{" "}
                            <span className="text-white font-medium">3</span>{" "}
                            correct answers
                          </p>

                          <div className="flex justify-center gap-2 sm:gap-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full"
                              >
                                {i < score ? (
                                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-purple-900/20 p-2 sm:p-3 rounded-lg border border-purple-700/30 mb-4 sm:mb-6 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                          <p className="text-xs sm:text-sm text-purple-300">
                            <span className="font-medium">
                              Your score has been saved
                            </span>{" "}
                            and will appear in your dashboard statistics
                          </p>
                        </div>

                        <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-blue-800/30 mb-4 sm:mb-6">
                          <h4 className="font-medium text-white mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                            <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                            Your Phishing Detection Skills
                          </h4>

                          <div className="space-y-4 sm:space-y-5">
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs sm:text-sm mb-1">
                                <span className="text-gray-300">
                                  Threat Recognition
                                </span>
                                <span className="text-white font-medium">
                                  {finalScorePercentage >= 80
                                    ? "Expert"
                                    : finalScorePercentage >= 60
                                    ? "Skilled"
                                    : finalScorePercentage >= 40
                                    ? "Developing"
                                    : "Novice"}
                                </span>
                              </div>
                              <Progress
                                value={finalScorePercentage}
                                className="h-1.5 sm:h-2"
                                indicatorClassName={
                                  finalScorePercentage >= 80
                                    ? "bg-green-500"
                                    : finalScorePercentage >= 60
                                    ? "bg-blue-500"
                                    : finalScorePercentage >= 40
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                                }
                              />
                            </div>

                            <div className="pt-2">
                              <h5 className="text-white font-medium mb-2 text-sm sm:text-base">
                                {finalScorePercentage >= 80
                                  ? "Expert Tips:"
                                  : "Areas for Improvement:"}
                              </h5>
                              <ul className="space-y-1.5 sm:space-y-2">
                                {finalScorePercentage < 80 && (
                                  <li className="flex items-start gap-2">
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mt-1 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-gray-300">
                                      Pay closer attention to the email domain
                                      in the sender's address
                                    </span>
                                  </li>
                                )}
                                {finalScorePercentage < 70 && (
                                  <li className="flex items-start gap-2">
                                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 mt-1 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-gray-300">
                                      Be cautious of emails creating a sense of
                                      urgency
                                    </span>
                                  </li>
                                )}
                                {finalScorePercentage >= 80 && (
                                  <li className="flex items-start gap-2">
                                    <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 mt-1 flex-shrink-0" />
                                    <span className="text-xs sm:text-sm text-gray-300">
                                      You're doing great! Remember to always
                                      verify unexpected requests via another
                                      channel
                                    </span>
                                  </li>
                                )}
                                <li className="flex items-start gap-2">
                                  <Info className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 mt-1 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-300">
                                    Challenge yourself regularly to keep your
                                    skills sharp
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>

                        {previousScores.length > 0 && (
                          <div className="bg-[#0a1525] p-3 sm:p-4 rounded-lg border border-blue-800/30 mb-3 sm:mb-4">
                            <h4 className="font-medium text-white mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                              <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                              Your Progress
                            </h4>
                            <div className="space-y-2 sm:space-y-3">
                              {previousScores
                                .slice(0, 5)
                                .map((prevScore, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <div className="w-1/3 text-xs sm:text-sm text-gray-400">
                                      {new Date(
                                        prevScore.date
                                      ).toLocaleDateString()}
                                    </div>
                                    <div className="w-2/3">
                                      <div className="flex items-center gap-2">
                                        <Progress
                                          value={Math.round(prevScore.score)}
                                          className="h-2 sm:h-2.5"
                                          indicatorClassName={
                                            Math.round(prevScore.score) >= 80
                                              ? "bg-green-500"
                                              : Math.round(prevScore.score) >=
                                                60
                                              ? "bg-blue-500"
                                              : "bg-purple-500"
                                          }
                                        />
                                        <span className="text-xs sm:text-sm font-medium text-white">
                                          {Math.round(prevScore.score)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-6">
                      <Button
                        onClick={() => (window.location.href = "/dashboard")}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-blue-700/30 py-3 sm:py-4 text-base sm:text-lg transition-all rounded-lg"
                      >
                        <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        <span className="font-medium">View Dashboard</span>
                      </Button>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-0.5 sm:p-1 rounded-lg shadow-lg">
                      <div className="bg-[#1a2a3a] p-3 sm:p-4 rounded-lg">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                          <h4 className="font-medium text-white flex items-center gap-1 text-sm sm:text-base">
                            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400" />
                            Share Your Results
                          </h4>
                          <Button
                            onClick={() => alert("Share feature coming soon!")}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-300 hover:bg-blue-900/50 text-xs sm:text-sm h-7 sm:h-8 self-start sm:self-auto"
                          >
                            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-300 mt-2">
                          Challenge your friends to beat your score and improve
                          their phishing detection skills too!
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-0.5 sm:p-1 rounded-lg shadow-lg">
                      <div className="bg-[#1a2a3a] p-3 sm:p-4 rounded-lg">
                        <h4 className="font-medium text-white mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                          <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                          Learn More About Email Security
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <Button
                            variant="outline"
                            onClick={() => alert("Resources coming soon!")}
                            className="text-left justify-start border-blue-800 text-blue-300 hover:bg-blue-900/50 text-xs sm:text-sm h-8 sm:h-10"
                          >
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            <span>Phishing Detection Guide</span>
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => alert("Resources coming soon!")}
                            className="text-left justify-start border-blue-800 text-blue-300 hover:bg-blue-900/50 text-xs sm:text-sm h-8 sm:h-10"
                          >
                            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            <span>Email Security Best Practices</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="border-t border-blue-800/30 pt-3 sm:pt-4 rounded-b-lg p-4 sm:p-6">
          <div className="text-xs sm:text-sm text-blue-300 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <span>
              Your scores are saved whether you're connected to Gmail or not.
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() => (window.location.href = "/dashboard")}
              className="text-purple-300 hover:text-purple-100 text-xs sm:text-sm h-6 sm:h-8 p-0 self-start sm:self-auto"
            >
              <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              View Dashboard
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LLMSimulation;
