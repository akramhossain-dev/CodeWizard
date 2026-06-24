import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import Redis from 'ioredis';

// ── Dedicated Redis client for per-route rate limiters ─────────────────────
// Uses lazyConnect so the server still starts even if Redis is momentarily down.
const rlRedis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
});

rlRedis.on('error', (err) => {
    // Log but do not crash — express-rate-limit falls back gracefully
    console.error('[RateLimit Redis] Connection error:', err.message);
});

/**
 * Factory — creates a Redis-backed rate limiter with per-user keying
 * (falls back to IP when user is not authenticated).
 */
const createRateLimiter = ({ windowMs, max, keyPrefix, message }) =>
    rateLimit({
        windowMs,
        max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, message },
        // Key by authenticated user ID, otherwise by IP
        keyGenerator: (req) =>
            `${keyPrefix}:${req.user?._id?.toString() || req.ip || 'anonymous'}`,
        store: new RedisStore({
            sendCommand: (...args) => rlRedis.call(...args),
            prefix: `rl:${keyPrefix}:`,
        }),
        // If Redis is unavailable, fail open (don't block all traffic)
        skip: () => false,
        handler: (req, res, next, options) => {
            const retryAfter = Math.ceil(options.windowMs / 1000);
            res.setHeader('Retry-After', String(retryAfter));
            res.status(429).json({ success: false, message: options.message.message });
        },
    });

// ── Per-route limiters ─────────────────────────────────────────────────────

export const submitRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,            // 1 minute
    max: 20,
    keyPrefix: 'submit',
    message: 'Too many submissions. Please try again in a minute.',
});

export const runRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,            // 1 minute
    max: 30,
    keyPrefix: 'run',
    message: 'Too many run attempts. Please try again in a minute.',
});

export const aiHintRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,       // 10 minutes
    max: 10,
    keyPrefix: 'ai-hint',
    message: 'AI hint limit reached. You can request up to 10 hints every 10 minutes.',
});

export const aiCodeReviewRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    keyPrefix: 'ai-review',
    message: 'Code review limit reached. You can request up to 5 reviews every 10 minutes.',
});

export const aiExplainRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 5,
    keyPrefix: 'ai-explain',
    message: 'Explanation limit reached. You can request up to 5 explanations every 10 minutes.',
});

export const aiDebugRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 10,
    keyPrefix: 'ai-debug',
    message: 'Debug limit reached. You can request up to 10 debug analyses every 10 minutes.',
});

export const aiChatRateLimiter = createRateLimiter({
    windowMs: 10 * 60 * 1000,
    max: 30,
    keyPrefix: 'ai-chat',
    message: 'Chat limit reached. You can send up to 30 messages every 10 minutes.',
});

export default createRateLimiter;
