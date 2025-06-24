import React, { useState, useRef } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../components/ui/card";
import {
  Shield,
  Database,
  Mail,
  Brain,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Star,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const FAQ = () => {
  // State to track expanded questions
  const [expanded, setExpanded] = useState(null);

  // Create refs for each FAQ item content to measure height
  const contentRefs = useRef([]);

  // Add CSS for the smooth slide animation
  const slidingStyles = `
    .accordion-content {
      transition: height 0.35s cubic-bezier(0.4, 0, 0.2, 1), 
                  opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      height: 0;
      opacity: 0;
      overflow: hidden;
    }
    
    .accordion-content.expanded {
      opacity: 1;
    }
    
    .accordion-icon {
      transition: transform 0.3s ease;
    }
    
    .accordion-icon.rotated {
      transform: rotate(180deg);
    }
    
    .accordion-item {
      transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    
    .accordion-item.expanded {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: rgba(124, 58, 237, 0.3);
    }
  `;

  const toggleQuestion = (index) => {
    if (expanded === index) {
      setExpanded(null);
    } else {
      setExpanded(index);
    }
  };

  // FAQ items
  const faqItems = [
    {
      question: "How does Social Shield handle my data?",
      answer: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm leading-relaxed">
            Social Shield prioritizes your privacy and data security. Here's how
            we handle your data:
          </p>
          <ul className="list-disc pl-5 space-y-2 sm:space-y-3 text-sm leading-relaxed">
            <li>All your data is encrypted in transit and at rest</li>
            <li>
              Email content is only analyzed when you specifically request it
            </li>
            <li>We do not permanently store the content of your emails</li>
            <li>Analysis results are stored only in your account</li>
            <li>We do not share your data with third parties</li>
          </ul>
          <div className="flex items-start mt-4 bg-blue-900/20 rounded-lg p-3 sm:p-4">
            <Database className="h-4 w-4 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-300 leading-relaxed">
              You maintain control of your data and can delete it at any time.
            </p>
          </div>
        </div>
      ),
      icon: <Shield className="h-5 w-5 text-purple-400" />,
    },
    {
      question: "Can I use Social Shield without connecting my Gmail account?",
      answer: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm leading-relaxed">
            Yes! While connecting your Gmail account enables automatic email
            analysis, you can use Social Shield without any email connection:
          </p>
          <ul className="list-disc pl-5 space-y-2 sm:space-y-3 text-sm leading-relaxed">
            <li>
              Use the <strong>Manual Testing</strong> feature to analyze any
              suspicious text or email
            </li>
            <li>
              Practice with the <strong>LLM Simulation</strong> to improve your
              threat detection skills
            </li>
            <li>Access educational resources and security tips</li>
          </ul>
          <div className="flex items-start mt-4 bg-green-900/20 rounded-lg p-3 sm:p-4">
            <Mail className="h-4 w-4 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-300 leading-relaxed">
              You can manually paste any email content for analysis without
              connecting your inbox.
            </p>
          </div>
        </div>
      ),
      icon: <Mail className="h-5 w-5 text-purple-400" />,
    },
    {
      question: "How does the LLM Simulation scoring work?",
      answer: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm leading-relaxed">
            The LLM Simulation tests your ability to identify phishing attempts
            and security threats:
          </p>
          <ul className="list-disc pl-5 space-y-2 sm:space-y-3 text-sm leading-relaxed">
            <li>
              You're presented with simulated emails containing potential
              security indicators
            </li>
            <li>Each correct identification earns you points</li>
            <li>
              Your score is calculated based on accuracy (correct
              identifications ÷ total attempts)
            </li>
            <li>
              The game tracks your performance over time to show improvement
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3 sm:gap-4">
            <Badge
              variant="secondary"
              className="bg-purple-900/30 text-purple-300 text-sm px-3 py-2"
            >
              <Star className="h-3 w-3 mr-2" /> Beginner: 0-50%
            </Badge>
            <Badge
              variant="secondary"
              className="bg-blue-900/30 text-blue-300 text-sm px-3 py-2"
            >
              <Star className="h-3 w-3 mr-2" /> Intermediate: 51-80%
            </Badge>
            <Badge
              variant="secondary"
              className="bg-green-900/30 text-green-300 text-sm px-3 py-2"
            >
              <Star className="h-3 w-3 mr-2" /> Expert: 81-100%
            </Badge>
          </div>
          <div className="flex items-start mt-4 bg-purple-900/20 rounded-lg p-3 sm:p-4">
            <Brain className="h-4 w-4 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-purple-300 leading-relaxed">
              Regular practice can significantly improve your threat detection
              skills!
            </p>
          </div>
        </div>
      ),
      icon: <Brain className="h-5 w-5 text-purple-400" />,
    },
    {
      question: "How can I improve my threat detection score?",
      answer: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm leading-relaxed">
            Here are proven ways to improve your threat detection abilities:
          </p>
          <ul className="list-disc pl-5 space-y-2 sm:space-y-3 text-sm leading-relaxed">
            <li>Practice regularly with the LLM Simulation</li>
            <li>
              Pay close attention to common phishing indicators (suspicious
              links, urgency, etc.)
            </li>
            <li>Review the feedback provided after each simulation attempt</li>
            <li>Learn from the security tips in the sidebar</li>
            <li>
              Use the Manual Testing feature to analyze suspicious content you
              receive
            </li>
          </ul>
          <div className="flex items-start mt-4 bg-yellow-900/20 rounded-lg p-3 sm:p-4">
            <Sparkles className="h-4 w-4 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-300 leading-relaxed">
              The more you practice, the better you'll become at identifying
              threats!
            </p>
          </div>
        </div>
      ),
      icon: <Star className="h-5 w-5 text-purple-400" />,
    },
    {
      question: "How can I delete my account data?",
      answer: (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-sm leading-relaxed">
            You have complete control over your account data:
          </p>
          <ol className="list-decimal pl-5 space-y-2 sm:space-y-3 text-sm leading-relaxed">
            <li>
              Navigate to <strong>Settings</strong> using the sidebar
            </li>
            <li>Scroll to the "Delete Account Data" section</li>
            <li>Type "delete" in the confirmation box</li>
            <li>Click the "Delete My Data" button</li>
          </ol>
          <div className="flex items-start mt-4 bg-red-900/20 rounded-lg p-3 sm:p-4">
            <AlertCircle className="h-4 w-4 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300 leading-relaxed">
              This action is irreversible. All your data, including analysis
              history and scores, will be permanently deleted.
            </p>
          </div>
        </div>
      ),
      icon: <Trash2 className="h-5 w-5 text-purple-400" />,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mt-8 sm:mt-12 pb-6 sm:pb-8 text-[rgb(var(--foreground))] px-3 sm:px-4 lg:px-0">
        <style>{slidingStyles}</style>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 sm:mb-8 flex items-center gap-3 text-[rgb(var(--foreground))]">
          <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-[rgb(var(--primary))]" />
          <span className="leading-tight">Frequently Asked Questions</span>
        </h1>

        <Card className="w-full bg-[#070F2B] border-gray-800 shadow-lg">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center">
              <HelpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 mr-2 sm:mr-3" />
              <CardTitle className="text-lg sm:text-xl font-semibold text-white bg-clip-text bg-gradient-to-r from-purple-400 to-blue-300">
                Frequently Asked Questions
              </CardTitle>
            </div>
            <CardDescription className="text-gray-400 text-sm mt-2">
              Find answers to common questions about Social Shield
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={`accordion-item border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 ${
                  expanded === index
                    ? "bg-gray-900/30 expanded"
                    : "bg-gray-900/10 hover:bg-gray-900/20"
                }`}
              >
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full px-4 sm:px-5 py-4 sm:py-5 flex items-center justify-between text-left focus:outline-none touch-manipulation"
                >
                  <div className="flex items-center min-w-0 flex-1">
                    <span className="mr-3 sm:mr-4 text-purple-500 flex-shrink-0">
                      {item.icon}
                    </span>
                    <span className="font-medium text-gray-200 text-sm sm:text-base leading-relaxed">
                      {item.question}
                    </span>
                  </div>
                  <div
                    className={`accordion-icon flex-shrink-0 ml-3 ${
                      expanded === index ? "rotated" : ""
                    }`}
                  >
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </button>

                <div
                  className={`accordion-content ${
                    expanded === index ? "expanded" : ""
                  }`}
                  ref={(el) => (contentRefs.current[index] = el)}
                  style={{
                    height:
                      expanded === index
                        ? contentRefs.current[index]?.scrollHeight + "px"
                        : "0px",
                  }}
                >
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-gray-300 border-t border-gray-800/50 pt-4 sm:pt-5">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-gray-800/40">
              <p className="text-sm text-gray-400 text-center mb-4 sm:mb-6">
                Still have questions? Contact our support team for assistance.
              </p>
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-purple-800/50 hover:bg-purple-900/30 text-purple-300 text-sm px-4 py-2.5"
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;
