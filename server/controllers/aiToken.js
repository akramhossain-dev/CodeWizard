import AiToken from '../models/AiToken.js';

// ── Config ───────────────────────────────────────────────────────────────────
const CHAT_TOKEN_COST = 2;      // 2 tokens per chat message
const DAILY_FREE_TOKENS = 50;   // 50 free tokens per day
const SIGNUP_BONUS = 100;       // 100 tokens on first use

// ── Helper: get or create token record ───────────────────────────────────────
async function getOrCreateTokenRecord(userId) {
    let record = await AiToken.findOne({ userId });
    if (!record) {
        record = new AiToken({
            userId,
            balance: SIGNUP_BONUS,
            totalEarned: SIGNUP_BONUS,
            grantHistory: [{
                type: 'signup',
                amount: SIGNUP_BONUS,
                description: 'Welcome bonus tokens',
            }],
        });
        await record.save();
    }
    return record;
}

// ── GET /api/ai/tokens — get token balance ───────────────────────────────────
export const getTokenBalance = async (req, res) => {
    try {
        const record = await getOrCreateTokenRecord(req.user._id);

        // Auto-claim daily if available
        if (record.canClaimDaily()) {
            record.claimDailyTokens(DAILY_FREE_TOKENS);
            await record.save();
        }

        res.json({
            success: true,
            tokens: {
                balance: record.balance,
                totalEarned: record.totalEarned,
                totalUsed: record.totalUsed,
                canClaimDaily: record.canClaimDaily(),
                nextClaimIn: record.nextClaimIn(),
                cost: CHAT_TOKEN_COST,
                dailyAmount: DAILY_FREE_TOKENS,
            },
        });
    } catch (error) {
        console.error('Get token balance error:', error);
        res.status(500).json({ success: false, message: 'Failed to get token balance.' });
    }
};

// ── POST /api/ai/tokens/claim-daily — claim daily free tokens ────────────────
export const claimDailyTokens = async (req, res) => {
    try {
        const record = await getOrCreateTokenRecord(req.user._id);

        if (!record.canClaimDaily()) {
            const remainMs = record.nextClaimIn();
            const hrs = Math.floor(remainMs / 3600000);
            const mins = Math.ceil((remainMs % 3600000) / 60000);
            return res.status(400).json({
                success: false,
                message: `Daily tokens refresh in ${hrs}h ${mins}m`,
                tokens: { balance: record.balance, canClaimDaily: false, nextClaimIn: remainMs },
            });
        }

        record.claimDailyTokens(DAILY_FREE_TOKENS);
        await record.save();

        res.json({
            success: true,
            message: `Claimed ${DAILY_FREE_TOKENS} daily tokens!`,
            tokens: {
                balance: record.balance,
                totalEarned: record.totalEarned,
                totalUsed: record.totalUsed,
                canClaimDaily: false,
            },
        });
    } catch (error) {
        console.error('Claim daily tokens error:', error);
        res.status(500).json({ success: false, message: 'Failed to claim daily tokens.' });
    }
};

// ── Middleware: check & deduct tokens before chat ────────────────────────────
export const requireChatTokens = async (req, res, next) => {
    try {
        const record = await getOrCreateTokenRecord(req.user._id);

        // Auto-claim daily if available
        if (record.canClaimDaily()) {
            record.claimDailyTokens(DAILY_FREE_TOKENS);
        }

        if (record.balance < CHAT_TOKEN_COST) {
            return res.status(403).json({
                success: false,
                message: `Insufficient tokens. You need ${CHAT_TOKEN_COST} tokens but have ${record.balance}. Claim your daily free tokens!`,
                tokenError: true,
                tokens: { balance: record.balance, cost: CHAT_TOKEN_COST, canClaimDaily: record.canClaimDaily(), nextClaimIn: record.nextClaimIn() },
            });
        }

        // Deduct tokens
        record.useTokens(CHAT_TOKEN_COST, 'Chat message');
        await record.save();

        // Attach balance to req so the chat controller can include it in the stream
        req.tokenBalance = record.balance;
        req.tokenCost = CHAT_TOKEN_COST;

        next();
    } catch (error) {
        console.error('Token check error:', error);
        res.status(500).json({ success: false, message: 'Token validation failed.' });
    }
};
