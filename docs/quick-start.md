# 🚀 Quick Start Guide

Get Social Shield up and running in under 5 minutes!

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and npm 9+ ([Download](https://nodejs.org/))
- **Python 3.9+** and pip ([Download](https://python.org/))
- **MongoDB** ([Download](https://mongodb.com/try/download/community) or use [Atlas](https://cloud.mongodb.com/))
- **Git** ([Download](https://git-scm.com/))

## 🏃‍♂️ 5-Minute Setup

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/social-shield.git
cd social-shield

# Install all dependencies (this may take 2-3 minutes)
npm run install-all
```

### Step 2: Environment Setup

```bash
# Copy environment templates
cp senti-analysis/.env.example senti-analysis/.env
cp senti-analysis-backend/.env.example senti-analysis-backend/.env
cp senti-analysis-flask-backend/.env.example senti-analysis-flask-backend/.env
```

### Step 3: Configure Environment Variables

Edit each `.env` file with your credentials:

#### Frontend (`.env` in `senti-analysis/`)

```bash
VITE_API_URL=http://localhost:5000
VITE_FLASK_API_URL=http://localhost:5001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

#### Backend (`.env` in `senti-analysis-backend/`)

```bash
MONGODB_URI=mongodb://localhost:27017/social-shield
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
REDIRECT_URI=http://localhost:5000/api/auth/google/callback
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
FLASK_API_URL=http://localhost:5001
```

#### ML Service (`.env` in `senti-analysis-flask-backend/`)

```bash
HUGGINGFACE_API_TOKEN=your_huggingface_token
USE_LOCAL_MODEL=true
FLASK_ENV=development
```

### Step 4: Start All Services

```bash
# Option A: Use the convenient script
npm run dev-all

# Option B: Start each service manually in separate terminals
# Terminal 1: Backend API
cd senti-analysis-backend && npm run dev

# Terminal 2: ML Service
cd senti-analysis-flask-backend && python app.py

# Terminal 3: Frontend
cd senti-analysis && npm run dev
```

### Step 5: Open Your Browser

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:5001

## 🔑 Getting API Keys (Optional for Basic Testing)

### Google OAuth (Required for Gmail Integration)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Gmail API**
4. Create **OAuth 2.0 Client ID** credentials
5. Add redirect URI: `http://localhost:5000/api/auth/google/callback`

### Gemini API (Required for AI Analysis)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy to `GEMINI_API_KEY` in backend `.env`

### Hugging Face (Optional - for local models)

1. Sign up at [Hugging Face](https://huggingface.co/)
2. Go to [Settings → Tokens](https://huggingface.co/settings/tokens)
3. Create new token with read permissions

## ✅ Verify Installation

### 1. Check Services are Running

```bash
# Check backend
curl http://localhost:5000/health

# Check ML service
curl http://localhost:5001/health

# Check frontend (should show React app)
open http://localhost:5173
```

### 2. Test API Endpoints

```bash
# Test ML analysis (without authentication)
curl -X POST http://localhost:5001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test email!",
    "subject": "Test Email",
    "sender": "test@example.com"
  }'
```

Expected response:

```json
{
  "success": true,
  "analysis": {
    "sentiment": "positive",
    "suspicion_score": 0.1,
    "prediction": "Safe"
  }
}
```

## 🎯 What's Next?

### 🔐 Set Up Authentication

1. Configure Google OAuth credentials
2. Test login flow
3. Connect Gmail account

### 📧 Analyze Your First Email

1. Navigate to Email Analysis page
2. Click "Analyze Emails"
3. View sentiment and security analysis

### 📊 Explore the Dashboard

1. Check analytics and metrics
2. View analysis history
3. Export reports

### 🎮 Try the Gaming Features

1. Visit LLM Simulation page
2. Practice phishing detection
3. Track your security score

## 🚨 Common Issues & Solutions

### Port Already in Use

```bash
# Kill processes on specific ports
npx kill-port 5000 5001 5173

# Or use different ports in .env files
```

### MongoDB Connection Error

```bash
# Start MongoDB (macOS with Homebrew)
brew services start mongodb-community

# Start MongoDB (Windows)
net start MongoDB

# Or use MongoDB Atlas (cloud) instead
```

### Python Dependencies Error

```bash
# Create virtual environment
cd senti-analysis-flask-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Node.js Version Issues

```bash
# Check Node.js version (should be 18+)
node --version

# Install/update Node.js from https://nodejs.org/
```

## 📚 Additional Resources

- **[Full Documentation](./README.md)** - Complete setup guide
- **[API Reference](./api.md)** - All endpoints and examples
- **[Architecture Guide](./architecture.md)** - System overview
- **[Troubleshooting](./troubleshooting.md)** - Common issues

## 💬 Get Help

Stuck? Here's how to get help:

1. **Check the logs** in your terminal windows
2. **Search GitHub Issues** for similar problems
3. **Create a new issue** with error details
4. **Join our Discord** for real-time support

---

**🎉 Congratulations!** You now have Social Shield running locally. Start analyzing emails and exploring the features!

---

_Need more detailed setup instructions? Check out the [complete installation guide](./installation.md)._
