import Submission from '../models/Submission.js';
import Problem from '../models/problem.js';
import Contest from '../models/contest.js';
import ContestParticipation from '../models/ContestParticipation.js';
import submissionQueue, { queueEvents } from '../config/queue.js';
import { isJudgeExecutionAvailable } from '../services/codeExecutor.js';

const buildJudgeTestCases = (problem) => {
    if (Array.isArray(problem?.testCases) && problem.testCases.length > 0) {
        return problem.testCases;
    }

    if (Array.isArray(problem?.examples) && problem.examples.length > 0) {
        return problem.examples.map((ex) => ({
            input: ex.input,
            expectedOutput: ex.output,
            isHidden: false
        }));
    }

    return [];
};

// 1. SUBMIT CODE
export const submitCode = async (req, res) => {
    try {
        const { problemId, code, language, contestId } = req.body;

        if (!isJudgeExecutionAvailable()) {
            return res.status(503).json({
                success: false,
                message: 'Judge is temporarily unavailable'
            });
        }

        // Validate inputs
        if (!problemId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Problem ID, code, and language are required'
            });
        }

        // Validate language
        const validLanguages = ['javascript', 'python', 'java', 'cpp', 'c'];
        if (!validLanguages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid language. Supported: javascript, python, java, cpp, c'
            });
        }

        // Check if problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        if (problem.isActive === false || !problem.isPublished) {
            return res.status(400).json({
                success: false,
                message: 'Problem is not available'
            });
        }

        let linkedContestId = undefined;
        if (contestId) {
            const contest = await Contest.findById(contestId).lean();
            if (!contest || !contest.isPublished || !contest.isActive) {
                return res.status(400).json({
                    success: false,
                    message: 'Contest not found or unavailable'
                });
            }

            const now = new Date();
            if (now < contest.startTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Contest has not started yet'
                });
            }
            if (now > contest.endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Contest has already ended'
                });
            }

            const isContestProblem = (contest.problems || []).some(
                (item) => String(item.problemId) === String(problemId)
            );
            if (!isContestProblem) {
                return res.status(400).json({
                    success: false,
                    message: 'This problem is not part of the contest'
                });
            }

            const joined = await ContestParticipation.findOne({
                contestId,
                userId: req.user._id
            }).select('_id').lean();

            if (!joined) {
                return res.status(403).json({
                    success: false,
                    message: 'Join the contest before submitting'
                });
            }

            linkedContestId = contest._id;
        }

        const judgeTestCases = buildJudgeTestCases(problem);
        if (judgeTestCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Problem has no configured test cases'
            });
        }

        // Create submission
        const submission = new Submission({
            userId: req.user._id,
            problemId,
            contestId: linkedContestId,
            code,
            language,
            verdict: 'Pending',
            totalTestCases: judgeTestCases.length,
            judgeStartTime: new Date()
        });

        await submission.save();

        // Add job to queue
        const job = await submissionQueue.add('judge-submission', {
            submissionId: submission._id.toString(),
            problemId: problem._id.toString(),
            code,
            language,
            testCases: judgeTestCases,
            timeLimit: problem.timeLimit || 2000,
            memoryLimit: problem.memoryLimit > 0 ? problem.memoryLimit : 256
        }, {
            jobId: submission._id.toString()
        });

        // Update submission with job ID
        submission.jobId = job.id;
        await submission.save();

        res.status(201).json({
            success: true,
            message: 'Code submitted successfully',
            submissionId: submission._id,
            jobId: job.id,
            verdict: 'Pending'
        });

    } catch (error) {
        console.error('Submit code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error submitting code',
            error: error.message
        });
    }
};

// 2. GET SUBMISSION STATUS
export const getSubmissionStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findById(id)
            .populate('problemId', 'title slug difficulty')
            .populate('userId', 'name username')
            .lean();

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Check if user has access to this submission
        if (submission.userId._id.toString() !== req.user._id.toString() && !req.admin && !req.employee) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.status(200).json({
            success: true,
            submission
        });

    } catch (error) {
        console.error('Get submission error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};

// 3. GET USER SUBMISSIONS
export const getUserSubmissions = async (req, res) => {
    try {
        const { 
            problemId, 
            verdict, 
            language,
            page = 1, 
            limit = 20 
        } = req.query;

        const filter = { userId: req.user._id };

        if (problemId) filter.problemId = problemId;
        if (verdict) filter.verdict = verdict;
        if (language) filter.language = language;

        const skip = (page - 1) * limit;

        const submissions = await Submission.find(filter)
            .populate('problemId', 'title slug difficulty')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-code -testResults')
            .lean();

        const total = await Submission.countDocuments(filter);

        res.status(200).json({
            success: true,
            submissions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get user submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

// 4. GET SUBMISSION BY ID WITH CODE
export const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findById(id)
            .populate('problemId', 'title slug difficulty testCases')
            .populate('userId', 'name username profilePicture')
            .lean();

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Check access
        if (submission.userId._id.toString() !== req.user._id.toString() && !req.admin && !req.employee) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Hide hidden test cases for regular users
        if (!req.admin && !req.employee) {
            submission.testResults = submission.testResults?.filter((result, index) => {
                const testCase = submission.problemId.testCases[index];
                return testCase && !testCase.isHidden;
            });
        }

        res.status(200).json({
            success: true,
            submission
        });

    } catch (error) {
        console.error('Get submission by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submission',
            error: error.message
        });
    }
};

// 5. GET PROBLEM SUBMISSIONS (for leaderboard/stats)
export const getProblemSubmissions = async (req, res) => {
    try {
        const { problemId } = req.params;
        const { page = 1, limit = 20, verdict = 'Accepted' } = req.query;

        const skip = (page - 1) * limit;

        const submissions = await Submission.find({
            problemId,
            verdict
        })
        .populate('userId', 'name username profilePicture')
        .sort({ runtime: 1, memory: 1, submittedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-code -testResults')
        .lean();

        const total = await Submission.countDocuments({ problemId, verdict });

        res.status(200).json({
            success: true,
            submissions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get problem submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

// 6. GET SUBMISSION STATISTICS
export const getSubmissionStats = async (req, res) => {
    try {
        const { problemId } = req.query;

        const filter = problemId ? { problemId } : {};

        const stats = await Submission.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$verdict',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(stat => {
            statsMap[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            stats: {
                total: stats.reduce((sum, s) => sum + s.count, 0),
                accepted: statsMap['Accepted'] || 0,
                wrongAnswer: statsMap['Wrong Answer'] || 0,
                tle: statsMap['Time Limit Exceeded'] || 0,
                mle: statsMap['Memory Limit Exceeded'] || 0,
                runtimeError: statsMap['Runtime Error'] || 0,
                compilationError: statsMap['Compilation Error'] || 0,
                pending: statsMap['Pending'] || 0,
                running: statsMap['Running'] || 0
            }
        });

    } catch (error) {
        console.error('Get submission stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// 7. RUN CODE (without saving - for testing)
export const runCode = async (req, res) => {
    try {
        const { problemId, code, language, testCaseIndex } = req.body;

        if (!isJudgeExecutionAvailable()) {
            return res.status(503).json({
                success: false,
                message: 'Judge is temporarily unavailable'
            });
        }

        if (!problemId || !code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Problem ID, code, and language are required'
            });
        }

        const problem = await Problem.findById(problemId);
        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Get only public test cases or specific test case
        const allJudgeCases = buildJudgeTestCases(problem);
        if (allJudgeCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Problem has no configured test cases'
            });
        }

        let testCases;
        if (testCaseIndex !== undefined) {
            const selected = allJudgeCases[testCaseIndex];
            if (!selected) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid test case index'
                });
            }
            testCases = [selected];
        } else {
            testCases = allJudgeCases.filter(tc => !tc.isHidden).slice(0, 3);
            if (testCases.length === 0) {
                testCases = allJudgeCases.slice(0, 3);
            }
        }

        // Add to queue with high priority
        const job = await submissionQueue.add('run-code', {
            code,
            language,
            testCases,
            timeLimit: problem.timeLimit || 2000,
            memoryLimit: problem.memoryLimit > 0 ? problem.memoryLimit : 256
        }, {
            priority: 1 // Higher priority than submissions
        });

        // Wait for result (with timeout)
        const result = await job.waitUntilFinished(queueEvents, 30000);

        res.status(200).json({
            success: true,
            result
        });

    } catch (error) {
        console.error('Run code error:', error);
        res.status(500).json({
            success: false,
            message: 'Error running code',
            error: error.message
        });
    }
};


// Admin and Employee routes

// 1. GET ALL SUBMISSIONS (Admin/Employee) 
export const getAllSubmissionsAdmin = async (req, res) => {
    try {
        const {
            userId,
            problemId,
            verdict,
            language,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};
        if (userId) filter.userId = userId;
        if (problemId) filter.problemId = problemId;
        if (verdict) filter.verdict = verdict;
        if (language) filter.language = language;

        const skip = (page - 1) * limit;

        const submissions = await Submission.find(filter)
            .populate('problemId', 'title slug difficulty')
            .populate('userId', 'name username profilePicture')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-code -testResults')
            .lean();

        const total = await Submission.countDocuments(filter);

        res.status(200).json({
            success: true,
            submissions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all submissions (admin) error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

// 2. Get statistics for all submissions (Admin/Employee)
export const getAllSubmissionStats = async (req, res) => {
    try {
        const stats = await Submission.aggregate([
            {
                $group: {
                    _id: '$verdict',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statsMap = {};
        stats.forEach(stat => {
            statsMap[stat._id] = stat.count;
        });

        res.status(200).json({
            success: true,
            stats: {
                total: stats.reduce((sum, s) => sum + s.count, 0),
                accepted: statsMap['Accepted'] || 0,
                wrongAnswer: statsMap['Wrong Answer'] || 0,
                tle: statsMap['Time Limit Exceeded'] || 0,
                mle: statsMap['Memory Limit Exceeded'] || 0,
                runtimeError: statsMap['Runtime Error'] || 0,
                compilationError: statsMap['Compilation Error '] || 0,
                pending: statsMap['Pending'] || 0,
                running: statsMap['Running'] || 0
            }
        });

    } catch (error) {
        console.error('Get all submission stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
