import express from 'express';
import { getAiChat } from '../controllers/aiChat.js';
import { authenticate } from '../middleware/auth.js';
import { requireChatTokens } from '../controllers/aiToken.js';

const router = express.Router();

// POST /api/ai/chat — authenticated + token check
router.post('/chat', authenticate, requireChatTokens, getAiChat);

export default router;
