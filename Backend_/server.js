require("dotenv").config(); // MUST be first — loads .env before any route module reads process.env

const express = require("express");
const mongoose = require("mongoose");
const ServerMeta = require("./models/ServerMeta");
const authRoutes = require("./routes/auth");
const marketRoutes = require("./routes/market");
const watchlistRoutes = require("./routes/watchlist");
const portfolioRoutes = require("./routes/portfolio");
const alertRoutes = require("./routes/alerts");
const searchHistoryRoutes = require("./routes/searchHistory");
const settingsRoutes = require("./routes/settings");
const transactionRoutes = require("./routes/transactions");
const adminRoutes = require("./routes/admin");
const avatarRoutes = require("./routes/avatar");
const profileRoutes = require("./routes/profile");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cookieParser = require("cookie-parser");


// Crash on startup if JWT_SECRET is not set or is the default weak value
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("❌ FATAL: JWT_SECRET is missing or too short. Set a strong random secret in .env");
    process.exit(1);
}

const app = express();

// ========================================
// SECURITY MIDDLEWARE
// ========================================
app.use(helmet()); // Sets secure HTTP headers (X-Frame-Options, CSP, HSTS, etc.)
app.use(mongoSanitize()); // Strips $ and . from user input to prevent NoSQL injection
app.use(cookieParser());

// ========================================
// BODY PARSING
// ========================================
app.use(express.json({ limit: "10kb" })); // Limit body size to prevent payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ========================================
// CORS CONFIGURATION
// ========================================
const defaultOrigins = ["http://localhost:3000", "http://localhost:3001"];
const envOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));

const corsOptions = {
    origin: (origin, callback) => {
        // Allow server-to-server / curl requests without Origin header
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ========================================
// SERVE STATIC FILES (Profile Pictures)
// ========================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========================================
// ROUTES
// ========================================
app.use("/api/auth", authRoutes);
app.use("/api/market", marketRoutes);       // Finnhub + Alpha Vantage proxy
app.use("/api/watchlist", watchlistRoutes); // User personal watchlist
app.use("/api/portfolio", portfolioRoutes); // Portfolio holdings
app.use("/api/alerts", alertRoutes);        // Price/change alerts
app.use("/api/search-history", searchHistoryRoutes); // Search history
app.use("/api/settings", settingsRoutes);   // User app settings
app.use("/api/transactions", transactionRoutes); // Buy/Sell transaction ledger
app.use("/api/admin", adminRoutes);         // Admin functionality
app.use("/api/avatar", avatarRoutes);       // Avatar dropdown API
app.use("/api/profile", profileRoutes);     // Profile management and uploads

app.get("/", (req, res) => {
    res.json({ message: "TradeTrack API is running", status: "ok" });
});

// ========================================
// 404 HANDLER
// ========================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ========================================
// GLOBAL ERROR HANDLER
// ========================================
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message);

    if (err.message && err.message.includes("CORS")) {
        return res.status(403).json({ success: false, message: "CORS policy violation" });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
});

// ========================================
// DATABASE CONNECTION
// ========================================
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/stock-market-analysis")
    .then(async () => {
        console.log("✅ Database connected to stock-market-analysis");

        try {
            const now = new Date();
            await ServerMeta.findOneAndUpdate(
                { key: "server_start" },
                { $set: { value: now, updatedAt: now } },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.error("⚠️ Failed to persist server_start metadata:", error.message);
        }

        // Seed master admin account if it doesn't exist
        try {
            const User = require("./models/User");
            const adminEmail = "tradetrackadmin@gmail.com";
            const existingAdmin = await User.findOne({ email: adminEmail });

            if (!existingAdmin) {
                console.log("⚠️ Master admin not found. Creating default admin account...");
                const newAdmin = new User({
                    username: "masteradmin",
                    email: adminEmail,
                    password: "Tradetrack@2026",
                    firstName: "System",
                    lastName: "Admin",
                    role: "admin",
                    accountStatus: "active",
                    registrationSource: "email",
                    emailVerified: true
                });
                await newAdmin.save();
                console.log("✅ Master admin account successfully created!");
            } else {
                // Ensure role is admin
                if (existingAdmin.role !== "admin") {
                    existingAdmin.role = "admin";
                    await existingAdmin.save();
                    console.log("✅ Existing master account role restored to 'admin'.");
                }
            }
        } catch (error) {
            console.error("❌ Failed to seed master admin account:", error.message);
        }
    })
    .catch((err) => {
        console.log("❌ Database connection error:", err.message);
        process.exit(1); // Exit if DB fails — don't run with no DB
    });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 TradeTrack backend running on port ${PORT}`);
});
