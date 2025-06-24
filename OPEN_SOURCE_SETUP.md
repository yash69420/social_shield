# 🚀 Sentiment Analysis - Open Source Setup Guide

**✅ COMPLETELY OPEN SOURCE FRIENDLY - NO HARDCODED CREDENTIALS**

This guide will help you set up the Sentiment Analysis application locally. All sensitive credentials are now properly configured through environment variables, making it safe for open source distribution.

## 🔒 Security Status

✅ **All hardcoded API keys removed**  
✅ **Environment variable configuration**  
✅ **Proper .gitignore for sensitive files**  
✅ **JWT token authentication**  
✅ **CORS properly configured**  
✅ **No secrets in source code**

## 📁 Project Structure

```
senti-analysis-main/
├── senti-analysis/              # React frontend (Vite)
├── senti-analysis-backend/      # Node.js API server (Express)
├── senti-analysis-flask-backend/ # Python ML service (Flask)
└── OPEN_SOURCE_SETUP.md         # This setup guide
```

## ⚙️ Environment Variables

### 1. **Frontend Environment (.env in senti-analysis/)**

Create `.env` file with:

```bash
# Backend API URLs
VITE_API_URL=http://localhost:5000
VITE_FLASK_API_URL=http://localhost:5000

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Development Settings
VITE_NODE_ENV=development
```

### 2. **Backend Environment (.env in senti-analysis-backend/)**

Create `.env` file with:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/senti-analysis

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Security Keys (generate strong random strings)
JWT_SECRET=your_very_strong_jwt_secret_key_here_at_least_32_characters
SESSION_SECRET=your_session_secret_here

# AI API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Service URLs
FRONTEND_URL=http://localhost:5173
FLASK_API_URL=http://localhost:5000

# Development Settings
NODE_ENV=development
PORT=5000
```

### 3. **Flask Backend Environment (.env in senti-analysis-flask-backend/)**

```bash
# AI Model Configuration
HUGGINGFACE_API_TOKEN=your_huggingface_api_token_here
LOCAL_MODEL_PATH=./models
USE_LOCAL_MODEL=true

# Development Settings
FLASK_ENV=development
PORT=5000
```

## 🛠️ Installation & Setup

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MongoDB (local or Atlas)

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/sentiment-analysis.git
cd sentiment-analysis

# Install frontend dependencies
cd senti-analysis
npm install

# Install backend dependencies
cd ../senti-analysis-backend
npm install

# Install Flask backend dependencies
cd ../senti-analysis-flask-backend
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create `.env` files in each directory using the templates above.

### 3. Start Development Servers

```bash
# Terminal 1: Start Node.js backend
cd senti-analysis-backend
npm start

# Terminal 2: Start Flask backend
cd senti-analysis-flask-backend
python app.py

# Terminal 3: Start frontend
cd senti-analysis
npm run dev
```

## 🔧 Configuration Guide

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - Your production URL (when deploying)

### MongoDB Setup

- **Local**: Install MongoDB Community Edition
- **Cloud**: Use MongoDB Atlas free tier (512MB)

### AI API Keys

- **Gemini**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Hugging Face**: Get from [Hugging Face Tokens](https://huggingface.co/settings/tokens)

## 🌐 Deployment

### Environment Variables for Production

When deploying, update these environment variables:

```bash
# Frontend
VITE_API_URL=https://your-backend-domain.com
VITE_FLASK_API_URL=https://your-flask-backend-domain.com
VITE_REDIRECT_URI=https://your-backend-domain.com/api/auth/google/callback

# Backend
FRONTEND_URL=https://your-frontend-domain.com
NODE_ENV=production
COOKIE_DOMAIN=.your-domain.com  # Optional: for subdomain cookies

# Flask
FRONTEND_URL=https://your-frontend-domain.com
```

### Hosting Recommendations

- **Frontend**: Vercel, Netlify
- **Node.js Backend**: Render, Railway, Heroku
- **Flask Backend**: Render, Railway, PythonAnywhere
- **Database**: MongoDB Atlas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Test your changes locally
- Update documentation if needed
- Ensure no hardcoded values are added

## 🐛 Troubleshooting

### Common Issues

1. **CORS errors**: Check FRONTEND_URL environment variable
2. **OAuth errors**: Verify Google Console redirect URIs
3. **Database connection**: Check MongoDB URI and network access
4. **AI API errors**: Verify API keys and quotas

### Getting Help

- Check existing issues on GitHub
- Create a new issue with:
  - Clear description
  - Steps to reproduce
  - Environment details
  - Error messages/logs

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Google Gemini API for AI capabilities
- Hugging Face for ML models
- MongoDB for database services
- React and Node.js communities
