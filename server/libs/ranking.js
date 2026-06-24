import Auth from '../models/auth.js';

export const DEFAULT_RATING = 0;

export const RATING_DELTA = {
    Easy:   5,
    Medium: 10,
    Hard:   20,
};

export const getRatingDelta = (difficulty) => RATING_DELTA[difficulty] || 0;

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

        try {
            console.log('🏆 Running scheduled rank recomputation...');
            await recomputeAllRanks();
            console.log('✅ Rank recomputation complete');
        } catch (err) {
            console.error('❌ Rank recomputation failed:', err.message);
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
