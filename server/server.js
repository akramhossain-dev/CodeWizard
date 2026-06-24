// import necessary modules

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import cookieParser from 'cookie-parser';
import connectDB from './libs/db.js';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import logger from './libs/logger.js';
import { guardCredentials } from './libs/credentialGuard.js';

// Import routes
import authRoutes from './api/auth.js';
import problemRoutes from './api/problem.js';
import adminRoutes from './api/admin.js';
import employeeRoutes from './api/employee.js';
import submissionRoutes from './api/submission.js';
import publicRoutes from './api/public.js';
import contestRoutes from './api/contest.js';
import aiHintRoutes from './api/aiHint.js';
import aiAnalysisRoutes from './api/aiAnalysis.js';
import aiDebugRoutes from './api/aiDebug.js';
import aiChatRoutes from './api/aiChat.js';
import aiTokenRoutes from './api/aiToken.js';

dotenv.config();
guardCredentials(); // Block startup if credentials are missing or weak (L-3/L-6)

const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// ── Shared Redis client (for global rate limiter) ──────────────────────────
const rateLimitRedis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    lazyConnect: true,
});

// ── Global rate limiter (Redis-backed, survives restarts & multi-process) ──
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,      // 15 minutes
    max: 200,                        // 200 req per window per IP
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
    store: new RedisStore({
        sendCommand: (...args) => rateLimitRedis.call(...args),
    }),
});

// Connect to the database
connectDB();

// ── M-2: Strict CORS origin validation ───────────────────────────────────
const allowedOrigin = process.env.CLIENT_URL;
if (!allowedOrigin || allowedOrigin.includes('localhost')) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  WARNING: CLIENT_URL is localhost or missing in production. CORS may reject all browser requests.');
    }
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow server-to-server requests (no origin header)
        if (!origin) return callback(null, true);
        if (origin === allowedOrigin) return callback(null, true);
        callback(new Error(`CORS: Origin '${origin}' is not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // Cache preflight for 24h
};

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // Handle preflight for all routes
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ── Apply global rate limiter ─────────────────────────────────────────────
app.use(globalLimiter);

// ── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/contests', contestRoutes);
app.use('/api/ai', aiHintRoutes);
app.use('/api/ai', aiAnalysisRoutes);
app.use('/api/ai', aiDebugRoutes);
app.use('/api/ai', aiChatRoutes);
app.use('/api/ai', aiTokenRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

// ── Global Error Handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(isDev && { stack: err.stack }),
    });
});

// Start the server
app.listen(PORT, () => {
    logger.info({ port: PORT, env: process.env.NODE_ENV }, '🚀 Server started');
});

export default app;
