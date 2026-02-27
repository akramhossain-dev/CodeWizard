import express from 'express';
import { getTokenBalance, claimDailyTokens } from '../controllers/aiToken.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/ai/tokens — get balance (auto-claims daily if available)
router.get('/tokens', authenticate, getTokenBalance);

// POST /api/ai/tokens/claim-daily — manually claim daily tokens
router.post('/tokens/claim-daily', authenticate, claimDailyTokens);

export default router;
