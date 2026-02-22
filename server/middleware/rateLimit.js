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

export default createRateLimiter;
