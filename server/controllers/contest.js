import Contest from '../models/contest.js';
import ContestParticipation from '../models/ContestParticipation.js';
import Submission from '../models/Submission.js';
import Problem from '../models/problem.js';

const toDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

const normalizeRules = (rules) => (
    Array.isArray(rules)
        ? rules.map((rule) => String(rule).trim()).filter(Boolean)
        : []
);

const parseBoolean = (value, fallback = false) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    return fallback;
};

const normalizeContest = (contest, userJoined = false) => {
    const now = new Date();
    let status = 'past';
    if (now < contest.startTime) status = 'upcoming';
    else if (now <= contest.endTime) status = 'running';

    return {
        _id: contest._id,
        title: contest.title,
        slug: contest.slug,
        description: contest.description,
        rules: contest.rules || [],
        startTime: contest.startTime,
        endTime: contest.endTime,
        status,
        isPublished: contest.isPublished,
        isActive: contest.isActive,
        problems: (contest.problems || []).map((p) => ({
            problemId: p.problemId?._id || p.problemId,
            slug: p.problemId?.slug,
            title: p.problemId?.title,
            difficulty: p.problemId?.difficulty,
            points: p.points || 100,
            order: p.order || 0
        })),
        joined: userJoined
    };
};

const buildListFilter = ({ status, search }, adminView = false) => {
    const filter = adminView ? {} : { isPublished: true, isActive: true };
    const now = new Date();

    if (status === 'upcoming') {
        filter.startTime = { $gt: now };
    } else if (status === 'running') {
        filter.startTime = { $lte: now };
        filter.endTime = { $gte: now };
    } else if (status === 'past') {
        filter.endTime = { $lt: now };
    }

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    return filter;
};

const getContestLeaderboardRows = async (contest) => {
    const problemItems = contest.problems || [];
    const contestProblemIds = problemItems.map((item) => item.problemId?._id || item.problemId);
    const pointsByProblemId = new Map(
        problemItems.map((item) => [
            String(item.problemId?._id || item.problemId),
            item.points || 100
        ])
    );

    const participations = await ContestParticipation.find({ contestId: contest._id })
        .populate('userId', 'name username profilePicture')
        .lean();

    if (participations.length === 0) return [];

    const participantIds = participations.map((p) => p.userId?._id).filter(Boolean);

    const acceptedSubs = await Submission.find({
        contestId: contest._id,
        userId: { $in: participantIds },
        problemId: { $in: contestProblemIds },
        verdict: 'Accepted',
        submittedAt: { $gte: contest.startTime, $lte: contest.endTime }
    })
        .select('userId problemId runtime submittedAt')
        .sort({ submittedAt: 1 })
        .lean();

    const board = new Map();

    for (const participation of participations) {
        const user = participation.userId;
        if (!user?._id) continue;
        const key = String(user._id);
        board.set(key, {
            userId: user._id,
            name: user.name,
            username: user.username,
            profilePicture: user.profilePicture || '',
            solved: 0,
            score: 0,
            totalRuntime: 0,
            lastAcceptedAt: null,
            solvedProblemIds: new Set()
        });
    }

    for (const sub of acceptedSubs) {
        const userKey = String(sub.userId);
        const row = board.get(userKey);
        if (!row) continue;
        const problemKey = String(sub.problemId);
        if (row.solvedProblemIds.has(problemKey)) continue;

        row.solvedProblemIds.add(problemKey);
        row.solved += 1;
        row.score += pointsByProblemId.get(problemKey) || 0;
        row.totalRuntime += sub.runtime || 0;
        row.lastAcceptedAt = sub.submittedAt;
    }

    return Array.from(board.values())
        .map((row) => ({
            userId: row.userId,
            name: row.name,
            username: row.username,
            profilePicture: row.profilePicture,
            solved: row.solved,
            score: row.score,
            totalRuntime: row.totalRuntime,
            lastAcceptedAt: row.lastAcceptedAt
        }))
        .sort((a, b) =>
            b.score - a.score ||
            b.solved - a.solved ||
            a.totalRuntime - b.totalRuntime ||
            new Date(a.lastAcceptedAt || 0) - new Date(b.lastAcceptedAt || 0)
        )
        .map((row, index) => ({
            rank: index + 1,
            ...row
        }));
};

// Public (optional auth): contest list
export const getAllContests = async (req, res) => {
    try {
        const {
            status = 'all',
            search = '',
            page = 1,
            limit = 20
        } = req.query;

        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const skip = (safePage - 1) * safeLimit;
        const filter = buildListFilter({ status, search }, false);

        const contests = await Contest.find(filter)
            .select('title slug description startTime endTime isPublished isActive problems')
            .populate('problems.problemId', 'title slug difficulty')
            .sort({ startTime: 1 })
            .skip(skip)
            .limit(safeLimit)
            .lean();

        let joinedSet = new Set();
        if (req.user?._id && contests.length > 0) {
            const joinedRows = await ContestParticipation.find({
                userId: req.user._id,
                contestId: { $in: contests.map((c) => c._id) }
            }).select('contestId').lean();
            joinedSet = new Set(joinedRows.map((r) => String(r.contestId)));
        }

        const normalized = contests.map((contest) =>
            normalizeContest(contest, joinedSet.has(String(contest._id)))
        );
        const total = await Contest.countDocuments(filter);

        res.status(200).json({
            success: true,
            contests: normalized,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                pages: Math.ceil(total / safeLimit)
            }
        });
    } catch (error) {
        console.error('Get all contests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contests',
            error: error.message
        });
    }
};

// Public (optional auth): contest detail
export const getContestBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const contest = await Contest.findOne({
            slug,
            isPublished: true,
            isActive: true
        })
            .populate('problems.problemId', 'title slug difficulty acceptanceRate totalSubmissions')
            .lean();

        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Contest not found'
            });
        }

        let joined = false;
        if (req.user?._id) {
            const participant = await ContestParticipation.findOne({
                contestId: contest._id,
                userId: req.user._id
            }).select('_id').lean();
            joined = !!participant;
        }

        const normalized = normalizeContest(contest, joined);
        const participants = await ContestParticipation.countDocuments({ contestId: contest._id });
        const leaderboard = await getContestLeaderboardRows(contest);

        res.status(200).json({
            success: true,
            contest: {
                ...normalized,
                participants,
                leaderboardTop: leaderboard.slice(0, 10)
            }
        });
    } catch (error) {
        console.error('Get contest by slug error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contest',
            error: error.message
        });
    }
};

// Auth: join contest
export const joinContest = async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findById(id).lean();

        if (!contest || !contest.isPublished || !contest.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Contest not found'
            });
        }

        const now = new Date();
        if (now > contest.endTime) {
            return res.status(400).json({
                success: false,
                message: 'Contest already ended'
            });
        }

        const existing = await ContestParticipation.findOne({
            contestId: id,
            userId: req.user._id
        }).lean();

        if (existing) {
            return res.status(200).json({
                success: true,
                message: 'Already joined contest'
            });
        }

        await ContestParticipation.create({
            contestId: id,
            userId: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Joined contest successfully'
        });
    } catch (error) {
        console.error('Join contest error:', error);
        res.status(500).json({
            success: false,
            message: 'Error joining contest',
            error: error.message
        });
    }
};

// Auth: my joined contests
export const getMyJoinedContests = async (req, res) => {
    try {
        const rows = await ContestParticipation.find({ userId: req.user._id })
            .sort({ joinedAt: -1 })
            .populate({
                path: 'contestId',
                select: 'title slug description startTime endTime isPublished isActive problems'
            })
            .lean();

        const contests = rows
            .map((row) => row.contestId)
            .filter((contest) => contest && contest.isPublished && contest.isActive)
            .map((contest) => normalizeContest(contest, true));

        res.status(200).json({
            success: true,
            contests
        });
    } catch (error) {
        console.error('Get my contests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching joined contests',
            error: error.message
        });
    }
};

// Public: leaderboard by contest slug
export const getContestLeaderboard = async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = 100 } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);

        const contest = await Contest.findOne({
            slug,
            isPublished: true,
            isActive: true
        }).populate('problems.problemId', '_id').lean();

        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Contest not found'
            });
        }

        const leaderboard = await getContestLeaderboardRows(contest);

        res.status(200).json({
            success: true,
            leaderboard: leaderboard.slice(0, safeLimit)
        });
    } catch (error) {
        console.error('Get contest leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leaderboard',
            error: error.message
        });
    }
};

// Admin/Employee: create contest
export const createContest = async (req, res) => {
    try {
        const {
            title,
            slug: providedSlug,
            description = '',
            rules = [],
            problems = [],
            startTime,
            endTime,
            isPublished = false,
            isActive = true
        } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Title, startTime and endTime are required'
            });
        }

        const parsedStart = toDate(startTime);
        const parsedEnd = toDate(endTime);
        if (!parsedStart || !parsedEnd || parsedStart >= parsedEnd) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contest time range'
            });
        }

        const contestProblems = [];
        if (!Array.isArray(problems) || problems.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one problem is required'
            });
        }

        const seenProblemIds = new Set();
        for (let i = 0; i < problems.length; i++) {
            const item = problems[i];
            const problemId = item.problemId || item._id || item;
            const problemKey = String(problemId);
            if (seenProblemIds.has(problemKey)) {
                return res.status(400).json({
                    success: false,
                    message: 'Duplicate problems are not allowed in a contest'
                });
            }
            seenProblemIds.add(problemKey);
            const exists = await Problem.findOne({
                _id: problemId,
                isPublished: true,
                isActive: true
            }).select('_id').lean();

            if (!exists) {
                return res.status(400).json({
                    success: false,
                    message: `Problem not found or unavailable at index ${i + 1}`
                });
            }

            contestProblems.push({
                problemId,
                points: Math.max(parseInt(item.points, 10) || 100, 1),
                order: parseInt(item.order, 10) || i
            });
        }

        const slug = slugify(providedSlug || title);
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: 'Title or slug must contain letters or numbers'
            });
        }

        const contest = await Contest.create({
            title,
            slug,
            description,
            rules: normalizeRules(rules),
            problems: contestProblems,
            startTime: parsedStart,
            endTime: parsedEnd,
            isPublished: parseBoolean(isPublished, false),
            isActive: parseBoolean(isActive, true),
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            message: 'Contest created successfully',
            contest
        });
    } catch (error) {
        console.error('Create contest error:', error);
        if (error?.code === 11000 && error?.keyPattern?.slug) {
            return res.status(409).json({
                success: false,
                message: 'Contest slug already exists. Use a different title or slug.'
            });
        }
        if (error?.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating contest',
            error: error.message
        });
    }
};

// Admin/Employee: update contest
export const updateContest = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        delete updates._id;
        delete updates.createdBy;
        delete updates.createdAt;
        delete updates.updatedAt;

        if (updates.startTime || updates.endTime) {
            const current = await Contest.findById(id).lean();
            if (!current) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }
            const start = toDate(updates.startTime || current.startTime);
            const end = toDate(updates.endTime || current.endTime);
            if (!start || !end || start >= end) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid contest time range'
                });
            }
            updates.startTime = start;
            updates.endTime = end;
        }

        if (Array.isArray(updates.problems)) {
            const normalizedProblems = [];
            const seenProblemIds = new Set();
            for (let i = 0; i < updates.problems.length; i++) {
                const item = updates.problems[i];
                const problemId = item.problemId || item._id || item;
                const problemKey = String(problemId);
                if (seenProblemIds.has(problemKey)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Duplicate problems are not allowed in a contest'
                    });
                }
                seenProblemIds.add(problemKey);
                const exists = await Problem.findById(problemId).select('_id').lean();
                if (!exists) {
                    return res.status(400).json({
                        success: false,
                        message: `Problem not found at index ${i + 1}`
                    });
                }
                normalizedProblems.push({
                    problemId,
                    points: Math.max(parseInt(item.points, 10) || 100, 1),
                    order: parseInt(item.order, 10) || i
                });
            }
            updates.problems = normalizedProblems;
        }

        if (updates.rules !== undefined) {
            updates.rules = normalizeRules(updates.rules);
        }

        if (updates.slug !== undefined) {
            updates.slug = slugify(updates.slug);
            if (!updates.slug) {
                return res.status(400).json({
                    success: false,
                    message: 'Slug must contain letters or numbers'
                });
            }
        } else if (updates.title) {
            updates.slug = slugify(updates.title);
            if (!updates.slug) {
                return res.status(400).json({
                    success: false,
                    message: 'Title must contain letters or numbers'
                });
            }
        }

        if (updates.isPublished !== undefined) {
            updates.isPublished = parseBoolean(updates.isPublished, false);
        }
        if (updates.isActive !== undefined) {
            updates.isActive = parseBoolean(updates.isActive, true);
        }

        const contest = await Contest.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Contest not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contest updated successfully',
            contest
        });
    } catch (error) {
        console.error('Update contest error:', error);
        if (error?.code === 11000 && error?.keyPattern?.slug) {
            return res.status(409).json({
                success: false,
                message: 'Contest slug already exists. Use a different title or slug.'
            });
        }
        if (error?.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating contest',
            error: error.message
        });
    }
};

// Admin/Employee: toggle status
export const toggleContestStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished, isActive } = req.body;

        const updates = {};
        if (typeof isPublished === 'boolean') updates.isPublished = isPublished;
        if (typeof isActive === 'boolean') updates.isActive = isActive;

        const contest = await Contest.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        );

        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Contest not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contest status updated',
            contest
        });
    } catch (error) {
        console.error('Toggle contest status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contest status',
            error: error.message
        });
    }
};

// Admin/Employee: delete contest
export const deleteContest = async (req, res) => {
    try {
        const { id } = req.params;
        const contest = await Contest.findByIdAndDelete(id);

        if (!contest) {
            return res.status(404).json({
                success: false,
                message: 'Contest not found'
            });
        }

        await ContestParticipation.deleteMany({ contestId: id });
        await Submission.updateMany({ contestId: id }, { $unset: { contestId: '' } });

        res.status(200).json({
            success: true,
            message: 'Contest deleted successfully'
        });
    } catch (error) {
        console.error('Delete contest error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contest',
            error: error.message
        });
    }
};

// Admin/Employee: admin list
export const getAllContestsAdmin = async (req, res) => {
    try {
        const {
            status = 'all',
            search = '',
            page = 1,
            limit = 20
        } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const skip = (safePage - 1) * safeLimit;
        const filter = buildListFilter({ status, search }, true);

        const contests = await Contest.find(filter)
            .populate('problems.problemId', 'title slug difficulty')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .lean();

        const ids = contests.map((c) => c._id);
        const participantStats = await ContestParticipation.aggregate([
            { $match: { contestId: { $in: ids } } },
            { $group: { _id: '$contestId', count: { $sum: 1 } } }
        ]);
        const participantsMap = new Map(
            participantStats.map((item) => [String(item._id), item.count])
        );

        const normalized = contests.map((contest) => ({
            ...normalizeContest(contest, false),
            participants: participantsMap.get(String(contest._id)) || 0
        }));
        const total = await Contest.countDocuments(filter);

        res.status(200).json({
            success: true,
            contests: normalized,
            pagination: {
                total,
                page: safePage,
                limit: safeLimit,
                pages: Math.ceil(total / safeLimit)
            }
        });
    } catch (error) {
        console.error('Get admin contests error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contests',
            error: error.message
        });
    }
};
