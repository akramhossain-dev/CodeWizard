import express from 'express';
import { getAiCodeReview, getAiExplanation } from '../controllers/aiAnalysis.js';
import { authenticate } from '../middleware/auth.js';
import { aiCodeReviewRateLimiter, aiExplainRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// POST /api/ai/review — authenticated + rate-limited
router.post('/review', authenticate, aiCodeReviewRateLimiter, getAiCodeReview);

// POST /api/ai/explain — authenticated + rate-limited
router.post('/explain', authenticate, aiExplainRateLimiter, getAiExplanation);

export default router;
