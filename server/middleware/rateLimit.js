const buckets = new Map();

const cleanup = (now) => {
    if (buckets.size < 5000) return;
    for (const [key, entry] of buckets.entries()) {
        if (entry.resetAt <= now) {
            buckets.delete(key);
        }
    }
};

const createRateLimiter = ({ windowMs, max, keyPrefix, message }) => {
    return (req, res, next) => {
        const now = Date.now();
        cleanup(now);

        const identity = req.user?._id?.toString() || req.ip || 'anonymous';
        const key = `${keyPrefix}:${identity}`;
        const entry = buckets.get(key);

        if (!entry || entry.resetAt <= now) {
            buckets.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }

        if (entry.count >= max) {
            const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
            res.setHeader('Retry-After', String(retryAfter));
            return res.status(429).json({
                success: false,
                message
            });
        }

        entry.count += 1;
        return next();
    };
};

export const submitRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    keyPrefix: 'submit',
    message: 'Too many submissions. Please try again in a minute.'
});

export const runRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    keyPrefix: 'run',
    message: 'Too many run attempts. Please try again in a minute.'
});

export const aiHintRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    keyPrefix: 'ai-hint',
    message: 'AI hint limit reached. You can request up to 10 hints every 10 minutes.'
});

export const aiCodeReviewRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    keyPrefix: 'ai-review',
    message: 'Code review limit reached. You can request up to 5 reviews every 10 minutes.'
});

export const aiExplainRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    keyPrefix: 'ai-explain',
    message: 'Explanation limit reached. You can request up to 5 explanations every 10 minutes.'
});

export const aiDebugRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10,
    keyPrefix: 'ai-debug',
    message: 'Debug limit reached. You can request up to 10 debug analyses every 10 minutes.'
});

export const aiChatRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 30,
    keyPrefix: 'ai-chat',
    message: 'Chat limit reached. You can send up to 30 messages every 10 minutes.'
});

export default createRateLimiter;
