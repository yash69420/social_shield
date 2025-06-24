from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from config import MODEL_CONFIG
import json
import datetime
import os
import gc
import requests
import time
import psutil
import pickle
from collections import defaultdict
import random

app = Flask(__name__)

# CORS configuration using environment variables
def get_allowed_origins():
    """Get allowed origins from environment variables"""
    origins = []
    
    # Add frontend URLs from environment
    if os.getenv('FRONTEND_URL'):
        origins.append(os.getenv('FRONTEND_URL'))
    
    if os.getenv('FRONTEND_URL_ALT'):
        origins.append(os.getenv('FRONTEND_URL_ALT'))
    
    # Add additional origins if specified
    if os.getenv('ADDITIONAL_ORIGINS'):
        additional = os.getenv('ADDITIONAL_ORIGINS').split(',')
        origins.extend([origin.strip() for origin in additional])
    
    # Only add localhost for development if no other origins specified
    if not origins and os.getenv('FLASK_ENV') == 'development':
        origins = [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
        ]
    
    return origins

# Configure CORS with dynamic origins
CORS(app, origins=get_allowed_origins(), supports_credentials=True)

# ✅ FIXED: Improved preflight handler with mobile support
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        # Get the origin from request
        origin = request.headers.get('Origin', '')
        
        # Define allowed origins - use environment variable for production
        allowed_origins = [
            "http://localhost:3000",
            "http://localhost:5173", 
            "http://localhost:5174",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
        ]
        
        # Add production domain from environment variable
        if os.getenv('FRONTEND_URL'):
            allowed_origins.append(os.getenv('FRONTEND_URL'))
        
        response = jsonify()
        
        # Check if origin is allowed or if it's a mobile browser
        if origin in allowed_origins or not origin or 'mobile' in request.headers.get('User-Agent', '').lower():
            response.headers.add("Access-Control-Allow-Origin", origin if origin else "*")
        else:
            response.headers.add("Access-Control-Allow-Origin", "*")
            
        response.headers.add('Access-Control-Allow-Headers', 
                           "Content-Type,Authorization,X-User-Email,Cache-Control,Pragma,Expires,Origin,X-Requested-With")
        response.headers.add('Access-Control-Allow-Methods', "GET,POST,PUT,DELETE,OPTIONS")
        response.headers.add('Access-Control-Allow-Credentials', 'false')  # Disabled for mobile
        response.headers.add('Access-Control-Max-Age', '86400')  # Cache preflight for 24 hours
        
        # ✅ FIXED: Add mobile-specific headers
        response.headers.add('Vary', 'Origin')
        response.headers.add('Cache-Control', 'no-cache, no-store, must-revalidate')
        
        return response

# Global variables - only load models if NOT in production
IS_PRODUCTION = os.getenv('RENDER') is not None or os.getenv('RAILWAY_ENVIRONMENT') is not None

local_model = None
local_tokenizer = None
suspicion_model = None
tokenizer = None

if not IS_PRODUCTION:
    # Load models only in development
    try:
        tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        suspicion_model = BertForSequenceClassification.from_pretrained(
            "bert-base-uncased", 
            num_labels=1
        )
        suspicion_model.load_state_dict(
            torch.load(MODEL_CONFIG['model_path'], map_location=torch.device('cpu'), weights_only=True),
            strict=False
        )
        suspicion_model.eval()
        print("✅ Local model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading local model: {e}")
        suspicion_model = None
else:
    print("🚀 Running in production - using HF API only")

def get_memory_usage():
    """Get current memory usage"""
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    memory_mb = memory_info.rss / 1024 / 1024
    return memory_mb

def get_sentiment_from_suspicion_score(score):
    if score <= 0.3:
        return "positive"
    elif score <= 0.7:
        return "neutral"
    else:
        return "negative"

def load_model_lazy():
    """No longer needed - using HF API"""
    print("✅ Using Hugging Face API - no local model loading required")
    return True

def load_local_model():
    """Load local model for development"""
    global local_model, local_tokenizer
    
    try:
        model_path = MODEL_CONFIG['local_model_path']
        print(f"🔍 Loading local model from: {model_path}")
        
        # Check different model formats
        if os.path.exists(os.path.join(model_path, 'model.pkl')):
            with open(os.path.join(model_path, 'model.pkl'), 'rb') as f:
                local_model = pickle.load(f)
            print("✅ Loaded pickled model")
            
        elif os.path.exists(os.path.join(model_path, 'pytorch_model.bin')):
            from transformers import AutoTokenizer, AutoModelForSequenceClassification
            local_tokenizer = AutoTokenizer.from_pretrained(model_path)
            local_model = AutoModelForSequenceClassification.from_pretrained(model_path)
            print("✅ Loaded PyTorch model")
            
        elif model_path.endswith('.pkl'):
            with open(model_path, 'rb') as f:
                local_model = pickle.load(f)
            print("✅ Loaded direct pickle file")
            
        return True
        
    except Exception as e:
        print(f"❌ Error loading local model: {e}")
        return False

def predict_with_model(text):
    """Predict using the BERT model"""
    try:
        if suspicion_model is None:
            return 0.5, "Safe"  # Fallback if model not loaded
            
        # Tokenize input
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)

        with torch.no_grad():
            outputs = suspicion_model(**inputs)
            logits = outputs.logits
            suspicion_score = torch.sigmoid(logits)[0].item()
            prediction = "Suspicious" if suspicion_score > MODEL_CONFIG['threshold'] else "Safe"
            
        return suspicion_score, prediction
    except Exception as e:
        print(f"❌ Model prediction error: {e}")
        return 0.5, "Safe"

def rule_based_fraud_detection(text):
    """
    Enhanced rule-based fraud detection for obvious cases
    Returns (suspicion_score, prediction, triggered_rules) or None
    """
    text_lower = text.lower()
    triggered_rules = []
    score_multiplier = 0
    
    # High-risk phrase patterns (almost always fraud)
    high_risk_patterns = [
        "account has been suspended",
        "account will be suspended", 
        "click here immediately",
        "verify your identity",
        "account has been compromised",
        "urgent action required",
        "suspended due to",
        "verify immediately",
        "click to verify",
        "account locked",
        "update your information",
        "confirm your identity",
        "security alert",
        "unusual activity"
    ]
    
    # Fraud keywords
    fraud_keywords = [
        'suspended', 'verify', 'immediately', 'urgent', 'click here', 
        'compromised', 'expire', 'update', 'confirm', 'account', 
        'security', 'locked', 'restricted', 'action required',
        'unauthorized', 'violation', 'terminated'
    ]
    
    # Suspicious URL patterns
    suspicious_urls = [
        'http://', 'bit.ly', 'tinyurl', 'suspicious-link', 
        'phishing', 'fake', 'temp', 'short', '.tk', '.ml'
    ]
    
    # Check high-risk patterns
    for pattern in high_risk_patterns:
        if pattern in text_lower:
            triggered_rules.append(f"High-risk pattern: '{pattern}'")
            score_multiplier += 0.35
    
    # Count fraud keywords
    keyword_count = sum(1 for keyword in fraud_keywords if keyword in text_lower)
    if keyword_count >= 2:
        triggered_rules.append(f"Multiple fraud keywords: {keyword_count}")
        score_multiplier += keyword_count * 0.12
    
    # Check for suspicious URLs
    for url_pattern in suspicious_urls:
        if url_pattern in text_lower:
            triggered_rules.append(f"Suspicious URL: '{url_pattern}'")
            score_multiplier += 0.25
    
    # Check for urgency + action combinations
    urgency_words = ['immediate', 'urgent', 'now', 'asap', 'quickly', 'soon']
    action_words = ['click', 'verify', 'update', 'confirm', 'login', 'access']
    
    has_urgency = any(word in text_lower for word in urgency_words)
    has_action = any(word in text_lower for word in action_words)
    
    if has_urgency and has_action:
        triggered_rules.append("Urgency + Action combination")
        score_multiplier += 0.2
    
    # Calculate final score
    final_score = min(0.95, score_multiplier)
    
    # If significant fraud indicators, override ML model
    if final_score >= 0.4 or len(triggered_rules) >= 2:
        return final_score, "Suspicious", triggered_rules
    
    return None

def predict_with_hf_api(text):
    """Use Hugging Face API for model inference"""
    try:
        API_URL = f"https://api-inference.huggingface.co/models/{MODEL_CONFIG['huggingface_model_name']}"
        headers = {"Authorization": f"Bearer {MODEL_CONFIG['use_auth_token']}"}
        
        payload = {"inputs": text}
        response = requests.post(API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            
            # Handle different response formats
            if isinstance(result, list) and len(result) > 0:
                if isinstance(result[0], list):
                    # Format: [[{"label": "NEGATIVE", "score": 0.8}]]
                    scores = result[0]
                elif isinstance(result[0], dict):
                    # Format: [{"label": "NEGATIVE", "score": 0.8}]
                    scores = result
                else:
                    print(f"⚠️ Unexpected HF API response format: {result}")
                    return 0.5, "Safe"
                
                # Convert to suspicion score
                for item in scores:
                    if item.get('label') in ['NEGATIVE', 'SUSPICIOUS', 'FRAUD']:
                        suspicion_score = item.get('score', 0.5)
                        break
                else:
                    # If no negative/suspicious label found, use inverse of positive
                    for item in scores:
                        if item.get('label') in ['POSITIVE', 'SAFE']:
                            suspicion_score = 1.0 - item.get('score', 0.5)
                            break
                    else:
                        suspicion_score = 0.5
                
                prediction = "Suspicious" if suspicion_score > MODEL_CONFIG['threshold'] else "Safe"
                return suspicion_score, prediction
            else:
                print(f"⚠️ Unexpected HF API response: {result}")
                return 0.5, "Safe"
        else:
            print(f"❌ HF API error: {response.status_code} - {response.text}")
            return 0.5, "Safe"
            
    except Exception as e:
        print(f"❌ HF API request failed: {e}")
        return 0.5, "Safe"

def enhanced_predict_with_postprocessing(text):
    """
    Enhanced prediction that combines:
    1. Rule-based detection (your smart logic)
    2. HF API for ML inference
    3. Post-processing and score adjustment
    """
    
    # STEP 1: Rule-based detection (your existing logic)
    rule_result = rule_based_fraud_detection(text)
    if rule_result:
        score, prediction, rules = rule_result
        print(f"🚨 RULE-BASED DETECTION: {prediction} (score: {score:.3f})")
        print(f"🔍 Triggered rules: {rules}")
        return {
            "suspicion_score": score,
            "prediction": prediction,
            "method": "rule_based",
            "details": {"triggered_rules": rules}
        }
    
    # STEP 2: Get ML prediction from HF API or local model
    if IS_PRODUCTION or suspicion_model is None:
        # Use HF API in production
        ml_score, ml_prediction = predict_with_hf_api(text)
        method = "hf_api"
    else:
        # Use local model in development
        ml_score, ml_prediction = predict_with_model(text)
        method = "local_model"
    
    # STEP 3: Post-processing and score adjustment
    final_score = ml_score
    final_prediction = ml_prediction
    adjustments = []
    
    # Your smart post-processing logic
    text_lower = text.lower()
    
    # Boost score for certain patterns
    urgency_boost = 0
    if any(word in text_lower for word in ['urgent', 'immediate', 'asap', 'quickly']):
        urgency_boost += 0.1
        adjustments.append("urgency_detected")
    
    # Boost for suspicious URLs
    if any(url in text_lower for url in ['bit.ly', 'tinyurl', 'http://']):
        urgency_boost += 0.15
        adjustments.append("suspicious_url")
    
    # Boost for financial terms
    if any(term in text_lower for term in ['bank', 'account', 'payment', 'credit card']):
        urgency_boost += 0.1
        adjustments.append("financial_context")
    
    # Apply adjustments
    final_score = min(0.95, ml_score + urgency_boost)
    final_prediction = "Suspicious" if final_score > MODEL_CONFIG['threshold'] else "Safe"
    
    print(f"🤖 ML Model: {ml_prediction} (score: {ml_score:.3f}) via {method}")
    if adjustments:
        print(f"⚡ Post-processing adjustments: {adjustments} (+{urgency_boost:.2f})")
    print(f"✅ Final: {final_prediction} (score: {final_score:.3f})")
    
    return {
        "suspicion_score": final_score,
        "prediction": final_prediction,
        "method": f"{method}_with_postprocessing",
        "details": {
            "ml_score": ml_score,
            "ml_prediction": ml_prediction,
            "adjustments": adjustments,
            "boost_applied": urgency_boost
        }
    }

@app.route('/', methods=['GET'])
def home():
    """Updated root endpoint"""
    return jsonify({
        "message": "Sentiment Analysis API is running",
        "status": "ok",
        "method": "bert_model",
        "model": "bert-base-uncased",
        "endpoints": {
            "test": "/api/test",
            "predict": "/predict",
            "analyze_all": "/api/analyze-all",
            "metrics": "/api/metrics",
            "memory_status": "/api/memory-status",
            "debug_model": "/api/debug-model",
            "test_hf_api": "/api/test-hf-api",
            "delete_data": "/api/delete-user-data"
        }
    })

def simple_fraud_check(text):
    """Simple fraud detection for obvious cases"""
    text_lower = text.lower()
    
    # High-risk phrases that are almost always fraud
    fraud_phrases = [
        "account has been suspended", "click here immediately", 
        "verify your identity", "account compromised", 
        "urgent action required", "account locked"
    ]
    
    # Count fraud indicators
    fraud_score = 0
    for phrase in fraud_phrases:
        if phrase in text_lower:
            fraud_score += 0.3
    
    # Additional fraud keywords
    fraud_words = ['suspended', 'verify', 'immediately', 'urgent', 'compromised']
    word_count = sum(1 for word in fraud_words if word in text_lower)
    
    if word_count >= 3:
        fraud_score += 0.4
    
    # If we have strong fraud indicators, return high score
    if fraud_score >= 0.6:
        return min(0.9, fraud_score)
    
    return None  # Let the model decide

def predict_email(text):
    """Enhanced prediction with simple fraud check"""
    
    # First: Check for obvious fraud patterns
    simple_check = simple_fraud_check(text)
    if simple_check is not None:
        prediction = "Suspicious" if simple_check > MODEL_CONFIG['threshold'] else "Safe"
        print(f"🚨 Simple fraud check: {prediction} (score: {simple_check:.3f})")
        return simple_check, prediction, "simple_check"
    
    # Second: Use BERT model
    try:
        if suspicion_model is None:
            return 0.3, "Safe", "model_unavailable"
            
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=512)
        
        with torch.no_grad():
            outputs = suspicion_model(**inputs)
            logits = outputs.logits
            suspicion_score = torch.sigmoid(logits)[0].item()
            prediction = "Suspicious" if suspicion_score > MODEL_CONFIG['threshold'] else "Safe"
            
        print(f"🤖 BERT model: {prediction} (score: {suspicion_score:.3f})")
        return suspicion_score, prediction, "bert_model"
        
    except Exception as e:
        print(f"❌ Model error: {e}")
        return 0.3, "Safe", "error"

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        text = data.get("text", "")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        print(f"🔍 Analyzing: {text[:50]}...")
        
        # Use enhanced prediction with post-processing
        result = enhanced_predict_with_postprocessing(text)
        sentiment = get_sentiment_from_suspicion_score(result["suspicion_score"])

        response = {
            "text": text,
            "prediction": result["prediction"],
            "suspicion_score": round(result["suspicion_score"], 3),
            "sentiment": sentiment,
            "method": result["method"],
            "threshold": MODEL_CONFIG['threshold'],
            "details": result.get("details", {})
        }
        
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/analyze-all', methods=['POST'])
def analyze_all_emails():
    """Analyze all emails using enhanced prediction"""
    try:
        data = request.json
        if not data or 'email' not in data or 'emails' not in data:
            return jsonify({"error": "Missing email or emails data"}), 400
            
        user_email = data['email']
        emails = data['emails']
        
        if not emails:
            return jsonify({"error": "No emails provided"}), 400
            
        print(f"Analyzing {len(emails)} emails for {user_email}")
        
        # Process each email with enhanced prediction
        results = []
        for email in emails:
            try:
                text = email['body']
                
                if not text:
                    continue
                
                # Use enhanced prediction with post-processing
                analysis_result = enhanced_predict_with_postprocessing(text)
                sentiment = get_sentiment_from_suspicion_score(analysis_result["suspicion_score"])
                
            except Exception as e:
                print(f"Error analyzing email: {str(e)}")
                analysis_result = {
                    "suspicion_score": 0.1,
                    "prediction": "Safe"
                }
                sentiment = "neutral"
            
            results.append({
                "id": email['id'],
                "suspicion_score": round(analysis_result["suspicion_score"], 3),
                "sentiment": sentiment,
                "prediction": analysis_result["prediction"]
            })
        
        update_user_metrics(user_email, results, emails)
        
        return jsonify({
            "success": True,
            "message": f"Successfully analyzed {len(results)} emails",
            "results": results
        })
        
    except Exception as e:
        print(f"Error in analyze_all_emails: {str(e)}")
        return jsonify({"error": "Failed to analyze emails", "details": str(e)}), 500

def update_user_metrics(user_email, analysis_results, emails):
    """Update user metrics based on analysis results"""
    try:
        # Calculate threat level
        suspicious_count = sum(1 for result in analysis_results if result['prediction'] == 'Suspicious')
        total_count = len(analysis_results)
        
        # Only update if we have results
        if total_count > 0:
            threat_level = round((suspicious_count / total_count) * 100)
            safe_percentage = 100 - threat_level
            
            # Calculate monthly breakdown
            monthly_data = calculate_monthly_breakdown(emails, analysis_results)
            
            # Calculate threat types
            threat_types = calculate_threat_types(analysis_results)
            
            # Store metrics
            metrics = {
                "threat_level": threat_level,
                "safe_percentage": safe_percentage,
                "monthly_breakdown": monthly_data,
                "threat_types": threat_types,
                "last_updated": datetime.datetime.now().isoformat()
            }
            
            # Create metrics directory if it doesn't exist
            os.makedirs('metrics', exist_ok=True)
            
            # Store metrics in a file named after the user's email
            filename = f"metrics/{user_email.replace('@', '_at_')}.json"
            with open(filename, 'w') as f:
                json.dump(metrics, f)
                
            print(f"Stored metrics for {user_email}")
    except Exception as e:
        print(f"Error updating metrics: {str(e)}")

def calculate_monthly_breakdown(emails, analysis_results):
    """Calculate monthly breakdown of safe vs suspicious emails"""
    try:
        # Create a mapping of email ID to analysis result
        result_map = {result['id']: result for result in analysis_results}
        
        # Group by month
        monthly_data = {}
        
        for email in emails:
            if email['id'] in result_map:
                result = result_map[email['id']]
                
                # Extract month from email date
                try:
                    # Try to parse date string, handle different formats
                    if isinstance(email['date'], str):
                        try:
                            date_obj = datetime.datetime.strptime(email['date'], "%Y-%m-%dT%H:%M:%S.%fZ")
                        except ValueError:
                            try:
                                date_obj = datetime.datetime.strptime(email['date'], "%m/%d/%Y, %I:%M:%S %p")
                            except ValueError:
                                try:
                                    date_obj = datetime.datetime.strptime(email['date'], "%m/%d/%Y, %I:%M %p")
                                except ValueError:
                                    # Default to current date if parsing fails
                                    date_obj = datetime.datetime.now()
                    else:
                        # If date is already a datetime or timestamp
                        date_obj = datetime.datetime.now()
                    
                    month = date_obj.strftime("%b")  # Short month name
                    
                    # Initialize month data if not exists
                    if month not in monthly_data:
                        monthly_data[month] = {"detected": 0, "safe": 0, "month": month}
                    
                    # Count as detected or safe
                    if result['prediction'] == 'Suspicious':
                        monthly_data[month]["detected"] += 1
                    else:
                        monthly_data[month]["safe"] += 1
                        
                except Exception as date_error:
                    print(f"Error parsing date: {str(date_error)}")
        
        # Convert to list for frontend
        return list(monthly_data.values())
    except Exception as e:
        print(f"Error calculating monthly breakdown: {str(e)}")
        return []

def calculate_threat_types(analysis_results):
    """Calculate breakdown of different threat types"""
    # This would ideally use a more sophisticated approach to categorize threats
    suspicious_results = [r for r in analysis_results if r['prediction'] == 'Suspicious']
    
    if not suspicious_results:
        return [
            {"name": "Phishing", "value": 0},
            {"name": "Impersonation", "value": 0},
            {"name": "Malware", "value": 0},
            {"name": "Other", "value": 0}
        ]
    
    # Simple classification based on suspicion score
    phishing = 0
    impersonation = 0
    malware = 0
    other = 0
    
    for result in suspicious_results:
        score = result['suspicion_score']
        if score > 0.8:
            phishing += 1
        elif score > 0.6:
            impersonation += 1
        elif score > 0.4:
            malware += 1
        else:
            other += 1
    
    total = len(suspicious_results)
    
    return [
        {"name": "Phishing", "value": round((phishing / total) * 100) if total > 0 else 0},
        {"name": "Impersonation", "value": round((impersonation / total) * 100) if total > 0 else 0},
        {"name": "Malware", "value": round((malware / total) * 100) if total > 0 else 0},
        {"name": "Other", "value": round((other / total) * 100) if total > 0 else 0}
    ]

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    """Get dashboard metrics for a user"""
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email is required"}), 400
    
    try:
        # Read metrics from file if it exists
        metrics_file = f"metrics/{email.replace('@', '_at_')}.json"
        
        if os.path.exists(metrics_file):
            with open(metrics_file, 'r') as f:
                metrics = json.load(f)
                
            return jsonify(metrics)
        else:
            # Return default metrics if no stored metrics found
            return jsonify({
                "threat_level": 0,
                "safe_percentage": 100,
                "monthly_breakdown": [],
                "threat_types": [
                    {"name": "Phishing", "value": 0},
                    {"name": "Impersonation", "value": 0},
                    {"name": "Malware", "value": 0},
                    {"name": "Other", "value": 0}
                ],
                "last_updated": None
            })
    except Exception as e:
        print(f"Error getting metrics: {str(e)}")
        return jsonify({"error": "Failed to retrieve metrics"}), 500

@app.route('/api/test', methods=['GET'])
def test_connection():
    return jsonify({
        "status": "ok",
        "message": "Flask backend is running and accessible",
        "timestamp": datetime.datetime.now().isoformat()
    })

@app.route('/api/delete-user-data', methods=['DELETE'])
def delete_user_data():
    """Delete all data associated with a user"""
    try:
        data = request.json
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
            
        user_email = data['email']
        
        # Delete metrics file if it exists
        metrics_file = f"metrics/{user_email.replace('@', '_at_')}.json"
        if os.path.exists(metrics_file):
            os.remove(metrics_file)
            print(f"Deleted metrics file for {user_email}")
            
        return jsonify({
            "success": True,
            "message": f"Successfully deleted data for {user_email}"
        })
        
    except Exception as e:
        print(f"Error deleting user data: {str(e)}")
        return jsonify({"error": "Failed to delete user data", "details": str(e)}), 500

@app.route('/api/memory-status', methods=['GET'])
def memory_status():
    """Updated memory status for HF API usage"""
    try:
        memory_mb = get_memory_usage()
        return jsonify({
            "memory_usage_mb": round(memory_mb, 2),
            "memory_limit_mb": 512,
            "memory_percentage": round((memory_mb / 512) * 100, 1),
            "using_hf_api": False,
            "local_model_loaded": suspicion_model is not None,
            "model_name": "bert-base-uncased",
            "api_method": "bert_model"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/debug-model', methods=['GET'])
def debug_model():
    """Debug info for HF API setup"""
    try:
        memory_usage = get_memory_usage()
        
        model_info = {
            "memory_usage_mb": round(memory_usage, 2),
            "using_hf_api": False,
            "local_model_loaded": suspicion_model is not None,
            "model_config": MODEL_CONFIG,
            "api_url": None,
            "auth_token_present": False,
            "method": "bert_model"
        }
        
        return jsonify(model_info)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/test-hf-api', methods=['POST'])
def test_hf_api():
    """Test endpoint for your specific HF model"""
    try:
        data = request.json if request.json else {}
        text = data.get("text", "Your account has been compromised! Click here immediately to secure it.")
        
        print(f"🧪 Testing your HF model with: {text}")
        
        # Test our new HF API function
        suspicion_score, prediction = predict_with_hf_api(text)
        sentiment = get_sentiment_from_suspicion_score(suspicion_score)
        
        return jsonify({
            "success": True,
            "text": text,
            "prediction": prediction,
            "suspicion_score": round(suspicion_score, 3),
            "sentiment": sentiment,
            "method": "bert_model_test",
            "model_name": "bert-base-uncased"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "method": "bert_model_test"
        }), 500

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin', '')
    user_agent = request.headers.get('User-Agent', '').lower()
    
    # Define allowed origins
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    
    # Add production domain from environment variable
    if os.getenv('FRONTEND_URL'):
        allowed_origins.append(os.getenv('FRONTEND_URL'))
    
    # ✅ FIXED: Better origin handling for mobile devices
    if origin:
        if origin in allowed_origins or 'mobile' in user_agent or 'android' in user_agent or 'iphone' in user_agent:
            response.headers['Access-Control-Allow-Origin'] = origin
        else:
            # For unknown origins, still allow but log for security monitoring
            response.headers['Access-Control-Allow-Origin'] = origin
            print(f"⚠️ Request from unknown origin: {origin}")
    else:
        # No origin header (can happen with mobile apps)
        response.headers['Access-Control-Allow-Origin'] = '*'
    
    # ✅ FIXED: Comprehensive headers for mobile compatibility
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-User-Email,Cache-Control,Pragma,Expires,Origin,X-Requested-With'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,PUT,DELETE,OPTIONS'
    response.headers['Access-Control-Allow-Credentials'] = 'false'  # Disabled for mobile
    response.headers['Access-Control-Max-Age'] = '86400'
    
    # ✅ FIXED: Mobile-specific response headers
    response.headers['Vary'] = 'Origin'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    
    # ✅ FIXED: Cache control for mobile networks
    if request.endpoint in ['predict', 'analyze_all_emails']:
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    
    return response

# ✅ FIXED: Add a test endpoint specifically for mobile debugging
@app.route('/api/mobile-test', methods=['GET', 'POST', 'OPTIONS'])
def mobile_test():
    """Test endpoint specifically for mobile debugging"""
    return jsonify({
        "status": "ok",
        "message": "Mobile connection test successful",
        "method": request.method,
        "origin": request.headers.get('Origin', 'No origin'),
        "user_agent": request.headers.get('User-Agent', 'No user agent'),
        "timestamp": datetime.datetime.now().isoformat(),
        "headers": dict(request.headers),
        "mobile_detected": any(mobile in request.headers.get('User-Agent', '').lower() 
                             for mobile in ['mobile', 'android', 'iphone', 'ipad'])
    })

if __name__ == '__main__':
    # ✅ FIXED: Better port configuration
    port = int(os.environ.get('PORT', 3000))  # Changed default from 3000 to 5000
    print(f"🚀 Starting Flask server on port {port}")
    print(f"🌐 Server will be accessible at: http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
