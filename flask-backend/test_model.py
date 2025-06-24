import requests # type: ignore
from colorama import init, Fore, Style # type: ignore
from datetime import datetime
import os

# Initialize colorama for Windows
init()

def test_model():
    # Use environment variable for API URL, fallback to localhost for development
    base_url = os.getenv('FLASK_API_URL', 'http://localhost:5000')
    url = f"{base_url}/predict"
    test_cases = [
        {
            "text": "Congratulations! You've won $1,000,000. Click here to claim your prize!",
            "category": "Phishing",
            "expected_sentiment": "alarming"
        },
        {
            "text": "Hi John, please find attached the meeting minutes from yesterday.",
            "category": "Safe",
            "expected_sentiment": "informative"
        },
        {
            "text": "URGENT: Your account has been suspended. Verify your details now!",
            "category": "Suspicious",
            "expected_sentiment": "urgent"
        },
        {
            "text": "Dear valued customer, we detected unusual activity. Click here to verify.",
            "category": "Suspicious",
            "expected_sentiment": "alarming"
        },
        {
            "text": "Team meeting scheduled for tomorrow at 10 AM in Conference Room A.",
            "category": "Safe",
            "expected_sentiment": "informative"
        },
        {
            "text": "Your password will expire in 24 hours. Update it here: http://suspicious-link.com",
            "category": "Suspicious",
            "expected_sentiment": "urgent"
        }
    ]

    print(f"\n{Fore.CYAN}📊 Email Analysis Results{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'='*60}{Style.RESET_ALL}\n")
    print(f"🕒 Test Run: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    for i, case in enumerate(test_cases, 1):
        try:
            response = requests.post(url, json={"text": case["text"]})
            result = response.json()
            
            # Print formatted results
            print(f"{Fore.YELLOW}📧 Test Case #{i}{Style.RESET_ALL}")
            print(f"{'─'*60}")
            
            # Email Text
            print(f"📝 {Fore.WHITE}Email:{Style.RESET_ALL}")
            print(f"{case['text'][:100]}...")
            
            # Predictions Section
            print(f"\n🎯 {Fore.WHITE}Classification Results:{Style.RESET_ALL}")
            
            # Category prediction
            print(f"├─ Category:")
            print(f"│  ├─ Expected: {case['category']}")
            prediction = result['prediction']
            pred_color = Fore.GREEN if prediction.lower() == case['category'].lower() else Fore.RED
            print(f"│  └─ Predicted: {pred_color}{prediction}{Style.RESET_ALL}")
            
            # Sentiment analysis
            print(f"├─ Sentiment:")
            print(f"│  ├─ Expected: {case['expected_sentiment']}")
            sentiment = result.get('sentiment', 'N/A')
            sentiment_color = Fore.GREEN if sentiment.lower() == case['expected_sentiment'].lower() else Fore.YELLOW
            print(f"│  └─ Detected: {sentiment_color}{sentiment}{Style.RESET_ALL}")
            
            # Confidence scores
            print(f"└─ Confidence Scores:")
            confidence = result['confidence']
            conf_color = (
                Fore.RED if confidence > 0.8 
                else Fore.YELLOW if confidence > 0.5 
                else Fore.GREEN
            )
            print(f"   ├─ Classification: {conf_color}{confidence:.1%}{Style.RESET_ALL}")
            if 'sentiment_confidence' in result:
                print(f"   └─ Sentiment: {conf_color}{result['sentiment_confidence']:.1%}{Style.RESET_ALL}")
            
            print(f"\n{'─'*60}\n")

        except Exception as e:
            print(f"{Fore.RED}❌ Error in Test Case #{i}:{Style.RESET_ALL}")
            print(f"└─ {str(e)}\n")

if __name__ == "__main__":
    test_model()