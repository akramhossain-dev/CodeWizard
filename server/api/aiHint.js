import express from 'express';
import { getAiHint } from '../controllers/aiHint.js';
import { authenticate } from '../middleware/auth.js';
import { aiHintRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/ai/hint — authenticated + rate-limited
router.post('/hint', authenticate, aiHintRateLimiter, getAiHint);

export default router;
