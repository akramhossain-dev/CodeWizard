// import necessary modules

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import connectDB from './libs/db.js';
import mongoose from 'mongoose';

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


const app = express();
const PORT = process.env.PORT || 5000;
app.set('trust proxy', 1);

// Connect to the database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rate Limiting
// const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100, // limit each IP to 100 requests per windowMs
//     message: 'Too many requests from this IP, please try again later.'
// });
// app.use(limiter);

// API Routes
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
