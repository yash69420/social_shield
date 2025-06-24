const express = require("express");
const cors = require("cors");
const session = require("express-session");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const gmailRoutes = require("./routes/gmailRoutes");
const scoreRoutes = require('./routes/scoreRoutes');
const userRoutes = require('./routes/userRoutes');
const Score = require('./models/score');
const MongoStore = require('connect-mongo');
const geminiRoutes = require("./routes/geminiRoutes");

// Add detailed error logging for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    // console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Load environment variables
dotenv.config();
const app = express();

// CORS configuration - use environment variables instead of hardcoded URLs
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    process.env.FRONTEND_URL_ALT || 'http://localhost:5173',
    ...(process.env.ADDITIONAL_ORIGINS ? process.env.ADDITIONAL_ORIGINS.split(',') : [])
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Additional CORS headers for development
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

// Add security headers for production
app.use((req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    }
    next();
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB connected successfully");
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        console.error("🔧 Please check your MONGODB_URI in .env file");
        if (!process.env.MONGODB_URI) {
            console.error("⚠️  MONGODB_URI not found in environment variables");
        }
    });
// Disable the cors middleware since we're handling it manually
// app.use(cors(...));

// Only enable debug endpoints in development
if (process.env.NODE_ENV === 'development') {
    app.get("/ping", (req, res) => {
        res.json({
            message: "pong",
            time: new Date().toISOString()
        });
    });

    app.get("/api/test", (req, res) => {
        res.json({
            message: "Server is running",
            time: new Date().toISOString(),
            origin: req.headers.origin || "no origin header"
        });
    });

    app.get("/api/debug-env", (req, res) => {
        res.json({
            environment: process.env.NODE_ENV,
            frontendUrl: process.env.FRONTEND_URL,
            origin: req.headers.origin
        });
    });
}

// Middleware
app.use(express.json({ limit: '50mb' })); // Increased limit for larger payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 24 * 60 * 60
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/gmail", gmailRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/user', userRoutes);
app.use("/api/gemini", geminiRoutes);

// Test endpoint to verify MongoDB connection
app.get("/api/test-db", async (req, res) => {
    try {
        // Check connection
        const state = mongoose.connection.readyState;
        let stateStr;
        switch (state) {
            case 0: stateStr = "disconnected"; break;
            case 1: stateStr = "connected"; break;
            case 2: stateStr = "connecting"; break;
            case 3: stateStr = "disconnecting"; break;
            default: stateStr = "unknown";
        }

        // Try to create a test document
        const testScore = new Score({
            email: "test@example.com",
            score: 85,
            date: new Date()
        });

        // Try to save it
        const savedScore = await testScore.save();

        res.json({
            dbState: stateStr,
            collections: Object.keys(mongoose.connection.collections),
            testSave: {
                success: true,
                savedDocument: savedScore
            }
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

// Add global error handler
app.use((err, req, res, next) => {
    // console.error("Global error handler:", err);

    // Add CORS headers consistently
    res.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL);
    res.header("Access-Control-Allow-Credentials", "true");

    if (err.response?.data?.error === "invalid_grant") {
        return res.status(401).json({
            message: "Authentication failed: invalid or expired authorization code",
            error: "invalid_grant"
        });
    }

    res.status(500).json({
        message: "An unexpected error occurred",
        error: err.message
    });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 Server accessible at: http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'not configured'}`);
});

app.get("/api/config-test", (req, res) => {
    res.json({
        frontendUrl: process.env.FRONTEND_URL,
        redirectUri: process.env.REDIRECT_URI,
        googleConfigured: !!process.env.GOOGLE_CLIENT_ID,
        environment: process.env.NODE_ENV,
        corsOrigin: req.headers.origin || "no origin"
    });
});