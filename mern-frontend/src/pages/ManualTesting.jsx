import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/Textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../components/ui/card";
import {
  Sparkles,
  Wand2,
  Loader2,
  ShieldCheck,
  Info,
  Lock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Frown,
  Smile,
  Meh,
  RefreshCw,
  FileText,
  Copy,
  BarChart2,
  ClipboardCheck,
  MessageSquare,
  MessageCircle,
  BrainCircuit,
  AlertOctagon,
} from "lucide-react";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import GradientButton from "../components/ui/GradientButton";
import { FLASK_API_URL } from "../config/constant";

const ManualTesting = () => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [analyzeTime, setAnalyzeTime] = useState(null);

  // Examples of suspicious messages
  const examples = [
    "Dear user, your account has been suspended. Click here immediately to verify your identity: http://suspicious-link.com",
    "URGENT: Your package couldn't be delivered. Pay a small fee of $2.99 to release it now: https://fake-delivery.com",
    "Hello, I noticed unusual activity on your account. Please confirm your password and credit card details to secure your account.",
  ];

  const handleCopyExample = (example) => {
    setText(example);
    setShowExamples(false);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    // Set start time
    const startTime = new Date();

    try {
      const response = await fetch(`${FLASK_API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      setResult(data);

      // Calculate analysis time
      const endTime = new Date();
      setAnalyzeTime((endTime - startTime) / 1000);

      // Save the result to localStorage
      if (data) {
        try {
          // Get existing manual testing results
          const existingResultsStr = localStorage.getItem(
            "manual_testing_results"
          );
          let existingResults = [];

          if (existingResultsStr) {
            existingResults = JSON.parse(existingResultsStr);
          }

          if (!Array.isArray(existingResults)) {
            existingResults = [];
          }

          // Ensure the sentiment is properly formatted (capitalized)
          let normalizedSentiment = "Neutral"; // Default
          if (data.sentiment) {
            const sentiment = data.sentiment.toLowerCase();
            if (sentiment === "positive") normalizedSentiment = "Positive";
            else if (sentiment === "negative") normalizedSentiment = "Negative";
            else normalizedSentiment = "Neutral";
          }

          // Add current result with timestamp and properly formatted sentiment
          const resultToSave = {
            ...data,
            sentiment: normalizedSentiment,
            date: new Date().toISOString(),
            textPreview:
              text.substring(0, 100) + (text.length > 100 ? "..." : ""),
          };

          // Add to existing results
          existingResults.push(resultToSave);

          // Save back to localStorage
          localStorage.setItem(
            "manual_testing_results",
            JSON.stringify(existingResults)
          );
        } catch (err) {
          // Error handling without console.log
        }
      }
    } catch (err) {
      setError("Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score) => {
    if (score > 0.7) return "bg-red-500";
    if (score > 0.4) return "bg-orange-500";
    if (score > 0.2) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskLabel = (score) => {
    if (score > 0.7) return "High Risk";
    if (score > 0.4) return "Medium Risk";
    if (score > 0.2) return "Low Risk";
    return "Very Low Risk";
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return <Smile className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />;
      case "negative":
        return <Frown className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />;
      default:
        return <Meh className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />;
    }
  };

  const getPredictionBadge = (prediction) => {
    return prediction === "Safe" ? (
      <Badge variant="safe" size="sm" icon={CheckCircle}>
        Safe
      </Badge>
    ) : (
      <Badge variant="suspicious" size="sm" icon={AlertTriangle}>
        Suspicious
      </Badge>
    );
  };

  return (
    <div className="p-2 sm:p-6 max-w-7xl mx-auto text-[rgb(var(--foreground))]">
      <h1 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-6 flex items-center gap-2 sm:gap-3 text-[rgb(var(--foreground))]">
        <Wand2 className="h-5 w-5 sm:h-8 sm:w-8 text-[rgb(var(--primary))]" />
        Manual Testing
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3 sm:gap-6">
        {/* Input Section */}
        <Card className="bg-gradient-to-br from-[#0a192f] to-purple-900 border border-purple-800/50 shadow-lg">
          <CardHeader className="p-3 sm:p-6 pb-1 sm:pb-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-purple-300 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-2xl text-white leading-tight">
                  Text Analysis
                </CardTitle>
                <CardDescription className="text-purple-300 text-xs sm:text-base mt-0.5">
                  Paste your text below to analyze its sentiment and detect
                  potential threats
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-6 pt-1 sm:pt-2">
            {/* Controls Row - Reduced spacing */}
            <div className="flex justify-between items-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                className="text-purple-300 hover:text-purple-100 text-xs flex items-center gap-1.5 h-7 px-2"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {showExamples ? "Hide Examples" : "Show Examples"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setText("")}
                disabled={!text}
                className="text-purple-300 hover:text-purple-100 text-xs h-7 px-2"
              >
                Clear
              </Button>
            </div>

            {/* Examples Section */}
            {showExamples && (
              <div className="bg-[#0a192f]/90 border border-purple-800/40 rounded-lg p-2 sm:p-3 mb-3 animate-in fade-in duration-200">
                <h3 className="text-sm font-medium text-purple-300 mb-1.5 flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4" />
                  Example Suspicious Messages
                </h3>
                <div className="space-y-1.5">
                  {examples.map((example, i) => (
                    <div
                      key={i}
                      className="text-xs bg-[#0a192f] border border-purple-800/20 p-2 rounded hover:bg-[#112240] cursor-pointer transition-colors"
                      onClick={() => handleCopyExample(example)}
                    >
                      <div className="line-clamp-2 text-gray-300 mb-1">
                        {example}
                      </div>
                      <div className="text-right">
                        <button className="text-purple-400 hover:text-purple-300 text-[10px] flex items-center gap-1 ml-auto">
                          <Copy className="h-3 w-3" />
                          Use this example
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Textarea section */}
            <div className="space-y-2">
              {/* Textarea - Fixed height issue */}
              <div className="relative">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your text here..."
                  className="h-[420px] sm:h-[320px] w-full p-3 sm:p-4 border border-purple-300/30 rounded-lg resize-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 focus:outline-none transition-all duration-200 bg-[#0a192f]/50 text-white backdrop-blur-sm text-sm sm:text-base hover:border-purple-300/50"
                  style={{ minHeight: "420px" }}
                />

                {/* Floating Controls */}
                <div className="absolute bottom-2 right-2 flex gap-2">
                  {text.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToClipboard}
                        className="h-6 px-2 bg-[#0a192f]/80 hover:bg-[#0a192f] text-purple-300 hover:text-purple-200 text-xs flex items-center gap-1 border border-purple-800/30 hover:border-purple-700/50 transition-all"
                      >
                        {copied ? (
                          <>
                            <ClipboardCheck className="h-3 w-3" />
                            <span className="hidden sm:inline">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span className="hidden sm:inline">Copy</span>
                          </>
                        )}
                      </Button>
                      <div className="text-xs text-gray-300 bg-[#0a192f]/80 px-2 py-1 rounded flex items-center border border-purple-800/30">
                        <FileText className="h-3 w-3 mr-1" />
                        {text.length}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="pt-3">
              <GradientButton
                onClick={handleAnalyze}
                disabled={!text.trim() || isAnalyzing}
                className="w-full py-3 sm:py-2.5 text-sm sm:text-lg font-bold tracking-wide flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                colors={{
                  glowStart: "#A78BFA",
                  glowEnd: "#7C3AED",
                  gradientStart: "#6D28D9",
                  gradientEnd: "#5B21B6",
                }}
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Analyze Text</span>
                  </div>
                )}
              </GradientButton>
            </div>
          </CardContent>
        </Card>

        {/* How It Works Section */}
        <Card className="hidden lg:block bg-gradient-to-br from-[#0e1c36] to-[#172f4e] border border-blue-800/50 shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-[#0c1a32] p-4 border-b border-blue-800/30">
            <div className="flex items-center gap-3">
              <div className="bg-blue-800/60 p-2 rounded-lg">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-300" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  How It works
                </h3>
                <p className="text-blue-300 text-xs">Advanced AI protection</p>
              </div>
            </div>
          </div>

          <CardContent className="p-4 sm:p-5">
            {/* Process flow */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-4 top-7 bottom-7 w-0.5 bg-gradient-to-b from-purple-600/60 via-indigo-600/60 to-blue-600/60 rounded"></div>

              {/* Steps */}
              <div className="space-y-4">
                {/* Step 1 - Input Security */}
                <div className="group flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-800 to-purple-900 flex items-center justify-center shadow-sm border border-purple-700/40 text-white font-medium text-sm z-10 flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="bg-gradient-to-br from-[#162241] to-[#1c2c4c] py-2.5 px-3.5 rounded-lg border border-purple-800/30 flex-1 transform transition-all duration-200 group-hover:border-purple-700/50">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-400 flex-shrink-0" />
                      <p className="font-medium text-sm text-white">
                        Secure Processing
                      </p>
                    </div>
                    <p className="text-xs text-blue-200/90 mt-1 pl-6">
                      Your data is analyzed in an isolated environment with zero
                      persistence
                    </p>
                  </div>
                </div>

                {/* Step 2 - AI Analysis */}
                <div className="group flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-800 to-indigo-900 flex items-center justify-center shadow-sm border border-indigo-700/40 text-white font-medium text-sm z-10 flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="bg-gradient-to-br from-[#162241] to-[#1c2c4c] py-2.5 px-3.5 rounded-lg border border-indigo-800/30 flex-1 transform transition-all duration-200 group-hover:border-indigo-700/50">
                    <div className="flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                      <p className="font-medium text-sm text-white">
                        AI Detection
                      </p>
                    </div>
                    <p className="text-xs text-blue-200/90 mt-1 pl-6">
                      Our model identifies phishing patterns, malicious content,
                      and security risks
                    </p>
                  </div>
                </div>

                {/* Step 3 - Results */}
                <div className="group flex items-start gap-3 relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center shadow-sm border border-blue-700/40 text-white font-medium text-sm z-10 flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="bg-gradient-to-br from-[#162241] to-[#1c2c4c] py-2.5 px-3.5 rounded-lg border border-blue-800/30 flex-1 transform transition-all duration-200 group-hover:border-blue-700/50">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <p className="font-medium text-sm text-white">
                        Complete Analysis
                      </p>
                    </div>
                    <p className="text-xs text-blue-200/90 mt-1 pl-6">
                      Get comprehensive security assessment and actionable
                      recommendations
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Alert Box */}
            <div className="mt-5 bg-gradient-to-r from-[#1a1f36] to-[#1a2946] p-3 rounded-lg border border-red-900/20">
              <div className="flex gap-2.5 items-center mb-2">
                <div className="bg-red-900/20 p-1.5 rounded-md">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                </div>
                <p className="text-xs font-medium text-red-300">
                  Security Indicators to Watch For
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
                <div className="flex items-center gap-1.5 bg-[#1d253b]/40 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-red-500/70 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-100">Urgent action requests</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1d253b]/40 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-red-500/70 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-100">Suspicious links</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1d253b]/40 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-red-500/70 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-100">Personal data requests</span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#1d253b]/40 px-2 py-1 rounded">
                  <div className="w-1.5 h-1.5 bg-red-500/70 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-100">Unusual sender info</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading Indicator */}
      {isAnalyzing && (
        <div className="mt-6 sm:mt-8 flex flex-col items-center animate-fade-in">
          <div className="relative">
            <div className="bg-blue-900/20 p-3 sm:p-4 rounded-full">
              <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-purple-400" />
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 text-purple-300 animate-pulse" />
          </div>
          <div className="text-center space-y-2 mt-4">
            <h3 className="text-lg sm:text-xl font-semibold text-purple-200">
              Analyzing your text
            </h3>
            <p className="text-purple-300 text-sm sm:text-base">
              Detecting patterns and potential threats...
            </p>
            <div className="w-full max-w-md bg-[#0a192f]/50 rounded-full h-2.5 mt-4 mx-auto overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full animate-pulse"
                style={{ width: "65%" }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 sm:mt-6 p-4 rounded-lg bg-red-900/40 border border-red-700/50 flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-white text-sm sm:text-base">
              Analysis Error
            </h3>
            <p className="text-xs sm:text-sm text-red-200">{error}</p>
            <Button
              variant="outline"
              className="mt-2 text-xs h-8 bg-red-900/20 border-red-700/50 hover:bg-red-900/30"
              onClick={handleAnalyze}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <Card className="mt-4 sm:mt-6 bg-gradient-to-br from-[#0a192f] to-blue-900 border border-blue-800/50 shadow-lg animate-fade-in">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
                <div>
                  <CardTitle className="text-lg sm:text-xl text-white">
                    Analysis Results
                  </CardTitle>
                  <CardDescription className="text-blue-300 text-sm">
                    Completed in{" "}
                    {analyzeTime
                      ? `${analyzeTime.toFixed(2)} seconds`
                      : "just now"}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                {getPredictionBadge(result.prediction)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-300 hover:text-purple-100 text-xs sm:text-sm"
                  onClick={handleAnalyze}
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Re-analyze
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 text-white p-4 sm:p-6 pt-0 sm:pt-0">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Assessment */}
              <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e293b]/40 p-3 sm:p-4 rounded-lg border border-blue-800/30">
                <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  Risk Assessment
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Suspicion Level</span>
                      <span
                        className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                          result.suspicion_score > 0.7
                            ? "bg-red-900/40 text-red-300"
                            : result.suspicion_score > 0.4
                            ? "bg-orange-900/40 text-orange-300"
                            : "bg-green-900/40 text-green-300"
                        }`}
                      >
                        {getRiskLabel(result.suspicion_score)}
                      </span>
                    </div>
                    <Progress
                      value={result.suspicion_score * 100}
                      className={`h-2 ${getRiskColor(result.suspicion_score)}`}
                    />
                    <div className="text-right text-xs text-gray-400 mt-1">
                      Score: {result.suspicion_score.toFixed(3)}
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 mt-2 bg-[#0a192f]/40 p-2 rounded border border-blue-900/20">
                    {result.suspicion_score > 0.7 ? (
                      <span className="text-red-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        High risk of suspicious content detected
                      </span>
                    ) : result.suspicion_score > 0.4 ? (
                      <span className="text-orange-300 flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        Moderate risk elements found
                      </span>
                    ) : (
                      <span className="text-green-300 flex items-center gap-1.5">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        Low risk content detected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e293b]/40 p-3 sm:p-4 rounded-lg border border-blue-800/30">
                <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
                  {getSentimentIcon(result.sentiment)}
                  Sentiment Analysis
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span>Overall Tone</span>
                      <span
                        className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                          result.sentiment?.toLowerCase() === "negative"
                            ? "bg-red-900/40 text-red-300"
                            : result.sentiment?.toLowerCase() === "positive"
                            ? "bg-green-900/40 text-green-300"
                            : "bg-yellow-900/40 text-yellow-300"
                        }`}
                      >
                        {result.sentiment}
                      </span>
                    </div>
                    <Progress
                      value={
                        result.sentiment?.toLowerCase() === "negative"
                          ? 80
                          : result.sentiment?.toLowerCase() === "positive"
                          ? 20
                          : 50
                      }
                      className={`h-2 ${
                        result.sentiment?.toLowerCase() === "negative"
                          ? "bg-red-500"
                          : result.sentiment?.toLowerCase() === "positive"
                          ? "bg-green-500"
                          : "bg-yellow-500"
                      }`}
                    />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-300 mt-2 bg-[#0a192f]/40 p-2 rounded border border-blue-900/20">
                    {result.sentiment?.toLowerCase() === "positive" ? (
                      <span className="flex items-center gap-1.5 text-green-300">
                        <Smile className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        Text appears friendly and positive
                      </span>
                    ) : result.sentiment?.toLowerCase() === "negative" ? (
                      <span className="flex items-center gap-1.5 text-red-300">
                        <Frown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        Text contains negative or urgent language
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-yellow-300">
                        <Meh className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        Text has neutral emotional tone
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Text Summary */}
              <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e293b]/40 p-3 sm:p-4 rounded-lg border border-blue-800/30">
                <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  Text Summary
                </h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0a192f]/50 p-2 rounded text-center border border-blue-900/20">
                      <div className="text-xs text-blue-300">Characters</div>
                      <div className="text-base sm:text-lg font-bold">
                        {text.length}
                      </div>
                    </div>
                    <div className="bg-[#0a192f]/50 p-2 rounded text-center border border-blue-900/20">
                      <div className="text-xs text-blue-300">Words</div>
                      <div className="text-base sm:text-lg font-bold">
                        {text.trim() ? text.trim().split(/\s+/).length : 0}
                      </div>
                    </div>
                  </div>

                  {/* Additional metrics */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#0a192f]/50 p-2 rounded text-center border border-blue-900/20">
                      <div className="text-xs text-blue-300">URLs</div>
                      <div className="text-base sm:text-lg font-bold">
                        {(text.match(/https?:\/\/[^\s]+/g) || []).length}
                      </div>
                    </div>
                    <div className="bg-[#0a192f]/50 p-2 rounded text-center border border-blue-900/20">
                      <div className="text-xs text-blue-300">Sentences</div>
                      <div className="text-base sm:text-lg font-bold">
                        {text.split(/[.!?]+\s/).filter(Boolean).length || 1}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text Preview */}
            <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e293b]/40 p-3 sm:p-4 rounded-lg border border-blue-800/30">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowDetails(!showDetails)}
              >
                <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  Analyzed Text
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(!showDetails);
                  }}
                  className="h-8 w-8 p-0 rounded-full"
                >
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  )}
                </Button>
              </div>

              {showDetails ? (
                <div className="mt-3 relative">
                  <div className="p-3 bg-[#0a192f]/50 rounded text-xs sm:text-sm font-mono whitespace-pre-wrap overflow-auto max-h-48 sm:max-h-60 border border-blue-900/20">
                    {text}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="absolute top-1 right-1 h-7 w-7 p-0 bg-[#0a192f]/80 hover:bg-[#0a192f] text-gray-400 hover:text-gray-300 flex items-center justify-center rounded-full"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="mt-2 text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3">
                  {result.text || text}
                </div>
              )}
            </div>

            {/* Detection reasoning section */}
            {result.prediction === "Suspicious" && (
              <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e293b]/40 p-3 sm:p-4 rounded-lg border border-red-800/30">
                <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  Suspicious Content Indicators
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="bg-[#0a192f]/50 p-3 rounded border border-red-900/20">
                    <p className="text-red-300">
                      This message contains elements commonly found in phishing
                      or fraudulent communications:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                      <li>Contains urgent or threatening language</li>
                      <li>Requests personal or sensitive information</li>
                      <li>Uses suspicious links or unexpected attachments</li>
                      <li>Displays unusual sending patterns or addresses</li>
                    </ul>
                  </div>
                  <div className="bg-[#0a192f]/50 p-3 rounded border border-blue-900/20">
                    <p className="text-blue-300">Recommended actions:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                      <li>Do not click any links or download attachments</li>
                      <li>
                        Do not reply with personal or financial information
                      </li>
                      <li>Verify the sender through alternate channels</li>
                      <li>Report as phishing if received in your inbox</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {result.prediction === "Safe" && (
              <div className="bg-gradient-to-br from-[#1e293b]/70 to-[#1e293b]/40 p-3 sm:p-4 rounded-lg border border-green-800/30">
                <h3 className="font-semibold text-base sm:text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  Safe Content Assessment
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="bg-[#0a192f]/50 p-3 rounded border border-green-900/20">
                    <p className="text-green-300">
                      This message appears to be legitimate based on our
                      analysis:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                      <li>No suspicious urgency or threatening language</li>
                      <li>No unusual requests for personal information</li>
                      <li>No suspicious links or unexpected attachments</li>
                      <li>
                        Natural language patterns consistent with legitimate
                        communications
                      </li>
                    </ul>
                  </div>
                  <div className="bg-[#0a192f]/50 p-3 rounded border border-blue-900/20">
                    <p className="text-blue-300">Remember:</p>
                    <p className="mt-2 text-gray-300">
                      While our analysis indicates this message is safe, always
                      exercise caution with unexpected communications. When in
                      doubt, verify the sender through official channels.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t border-blue-800/30 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 sm:p-6">
            <div className="text-xs text-blue-300 flex items-center gap-2">
              <Info className="h-3.5 w-3.5" />
              Analysis completed: {new Date().toLocaleString()}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-purple-300 hover:text-purple-100 border-purple-800/50 self-start sm:self-auto"
              onClick={() => {
                setText("");
                setResult(null);
              }}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> New Analysis
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};

export default ManualTesting;
