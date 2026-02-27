import express from 'express';
import { getAiDebug } from '../controllers/aiDebug.js';
import { authenticate } from '../middleware/auth.js';
import { aiDebugRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/ai/debug — authenticated + rate-limited
router.post('/debug', authenticate, aiDebugRateLimiter, getAiDebug);

export default router;
