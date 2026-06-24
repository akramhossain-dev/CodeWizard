import Auth from '../models/auth.js';
import Redis from 'ioredis';

export const DEFAULT_RATING = 0;

export const RATING_DELTA = {
    Easy:   5,
    Medium: 10,
    Hard:   20,
};

export const getRatingDelta = (difficulty) => RATING_DELTA[difficulty] || 0;

// ── Shared Redis client for distributed lock ───────────────────────────────
// Lazily connects so ranking.js can be imported even without Redis running.
let _rlRedis = null;
const getRankRedis = () => {
    if (!_rlRedis) {
        _rlRedis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: null,
            enableOfflineQueue: true,
            lazyConnect: true,
        });
        _rlRedis.on('error', (err) => {
            // Log but don't crash — rank recompute falls back gracefully
            console.error('[Ranking Redis] Connection error:', err.message);
        });
    }
    return _rlRedis;
};

// ── M-10: Distributed lock for rank recomputation ─────────────────────────
// Prevents concurrent rank recomputation across multiple worker processes.
// Uses Redis SET NX PX (atomic "set-if-not-exists with TTL").
const RANK_LOCK_KEY  = 'lock:rank:recompute';
const RANK_LOCK_TTL  = 90_000; // 90 seconds max for a full recompute

async function acquireRankLock() {
    try {
        const redis = getRankRedis();
        // Returns 'OK' if acquired, null if already locked by another process
        const result = await redis.set(RANK_LOCK_KEY, '1', 'NX', 'PX', RANK_LOCK_TTL);
        return result === 'OK';
    } catch {
        // If Redis is unavailable, fail open (allow recompute without lock)
        return true;
    }
}

async function releaseRankLock() {
    try {
        await getRankRedis().del(RANK_LOCK_KEY);
    } catch {
        // Ignore — TTL will expire the lock automatically
    }
}

// ── Rank recomputation debounce ────────────────────────────────────────────
// recomputeAllRanks() loads ALL users from MongoDB and bulk-updates them.
// Calling it on every accepted submission is an O(n) database storm.
//
// Instead we debounce: the first accepted submission after a quiet period
// schedules a recompute 2 minutes later. Any further acceptances within
// that window are coalesced — only ONE recompute runs per 2-minute window.
const RANK_RECOMPUTE_DEBOUNCE_MS = 2 * 60 * 1000; // 2 minutes
let _rankDebounceTimer = null;
let _pendingRankRecompute = false;

/**
 * Schedule a rank recomputation. Safe to call after every accepted submission —
 * only one recompute will run per 2-minute window regardless of call frequency.
 */
export const scheduleRankRecompute = () => {
    _pendingRankRecompute = true;
    if (_rankDebounceTimer) return; // already scheduled — do nothing

    _rankDebounceTimer = setTimeout(async () => {
        _rankDebounceTimer = null;
        if (!_pendingRankRecompute) return;
        _pendingRankRecompute = false;

        // M-10: Acquire distributed lock before recomputing
        const locked = await acquireRankLock();
        if (!locked) {
            console.log('🔒 Rank recompute skipped — another process is already running it');
            return;
        }

        try {
            console.log('🏆 Running scheduled rank recomputation...');
            await recomputeAllRanks();
            console.log('✅ Rank recomputation complete');
        } catch (err) {
            console.error('❌ Rank recomputation failed:', err.message);
        } finally {
            await releaseRankLock();
        }
    }, RANK_RECOMPUTE_DEBOUNCE_MS);
};

const isRankedUser = (user) => {
    const solved = user?.stats?.solved || 0;
    const rating = user?.rating ?? DEFAULT_RATING;
    return solved > 0 || rating > DEFAULT_RATING;
};

/**
 * Full rank recomputation — fetches all users and bulk-updates ranks.
 * Do NOT call this directly on each submission; use scheduleRankRecompute() instead.
 */
export const recomputeAllRanks = async () => {
    const users = await Auth.find({}, '_id rating stats.solved')
        .sort({ rating: -1, 'stats.solved': -1, _id: 1 })
        .lean();

    const bulkOps = [];
    let rankCounter = 0;

    for (const user of users) {
        const nextRank = isRankedUser(user) ? ++rankCounter : 0;
        bulkOps.push({
            updateOne: {
                filter: { _id: user._id },
                update: { $set: { rank: nextRank } },
            },
        });
    }

    if (bulkOps.length > 0) {
        await Auth.bulkWrite(bulkOps, { ordered: false });
    }
};
