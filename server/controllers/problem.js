import Problem from '../models/problem.js';
import Submission from '../models/Submission.js';
import { encryptAES } from '../libs/crypto.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// 1. GET ALL PROBLEMS 
export const getAllProblems = async (req, res) => {
    try {
        const { 
            difficulty, 
            tags, 
            search, 
            page = 1, 
            limit = 20,
            sortBy = 'problemNumber',
            order = 'asc'
        } = req.query;

        // Build filter query
        const filter = { 
            isPublished: true 
        };

        if (difficulty) {
            const normalizedDifficulty = String(difficulty).trim();
            filter.difficulty = {
                $regex: new RegExp(`^${escapeRegex(normalizedDifficulty)}$`, 'i')
            };
        }

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tags = { $in: tagArray };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Exclude already-solved problems for logged-in users
        if (req.user?._id) {
            const solvedProblemIds = await Submission.distinct('problemId', {
                userId: req.user._id,
                verdict: 'Accepted'
            });
            if (solvedProblemIds.length > 0) {
                filter._id = { $nin: solvedProblemIds };
            }
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;

        // Pagination
        const skip = (page - 1) * limit;

        // Get problems with pagination
        const problems = await Problem.find(filter)
            .select('-testCases -solution -starterCode -codeTemplates')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const normalizedProblems = problems.map((problem) => ({
            ...problem,
            acceptanceRate: Number((problem.acceptanceRate || 0).toFixed(2)),
            solved: false
        }));

        // Get total count
        const total = await Problem.countDocuments(filter);

        res.status(200).json({
            success: true,
            problems: normalizedProblems,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all problems error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problems',
            error: error.message
        });
    }
};

// 2. GET PROBLEM BY SLUG (Public - without hidden test cases)
export const getProblemBySlug = async (req, res) => {
    try {
        const { slug } = req.params;

        const problem = await Problem.findOne({ 
            slug, 
            isPublished: true 
        })
        .select('-solution')
        .lean();

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        // Filter out hidden test cases for non-authenticated users
        if (!req.user) {
            problem.testCases = problem.testCases.filter(tc => !tc.isHidden);
        }

        res.status(200).json({
            success: true,
            problem
        });

    } catch (error) {
        console.error('Get problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problem',
            error: error.message
        });
    }
};

// 3. CREATE PROBLEM (Admin/Employee only)
export const createProblem = async (req, res) => {
    try {
        const {
            title,
            slug: inputSlug,
            description,
            difficulty,
            tags,
            constraints,
            inputFormat,
            outputFormat,
            examples,
            testCases,
            codeTemplates,
            starterCode,
            hints,
            solution,
            timeLimit,
            memoryLimit,
            isPremium
        } = req.body;

        // Validate required fields
        if (!title || !description || !difficulty) {
            return res.status(400).json({
                success: false,
                message: 'Title, description, and difficulty are required'
            });
        }

        // Check if problem with same title exists
        const existingProblem = await Problem.findOne({ title });
        if (existingProblem) {
            return res.status(400).json({
                success: false,
                message: 'Problem with this title already exists'
            });
        }

        // Get next problem number
        const lastProblem = await Problem.findOne().sort({ problemNumber: -1 });
        const problemNumber = lastProblem ? lastProblem.problemNumber + 1 : 1;

        // Generate slug if not provided
        let slug = inputSlug;
        if (!slug && title) {
            slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        }
        if (!slug) {
            return res.status(400).json({
                success: false,
                message: 'Slug is required and could not be generated from title.'
            });
        }

        // Create new problem
        const newProblem = new Problem({
            title,
            slug,
            description,
            difficulty,
            tags: tags || [],
            constraints: constraints || [],
            inputFormat,
            outputFormat,
            examples: examples || [],
            testCases: testCases || [],
            codeTemplates: codeTemplates || {},
            starterCode: starterCode || {},
            hints: hints || [],
            solution,
            timeLimit: timeLimit || 2000,
            memoryLimit: memoryLimit || 256,
            isPremium: isPremium || false,
            problemNumber,
            createdBy: req.user._id
        });

        await newProblem.save();

        res.status(201).json({
            success: true,
            message: 'Problem created successfully',
            problem: newProblem
        });

    } catch (error) {
        console.error('Create problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating problem',
            error: error.message
        });
    }
};

// 4. UPDATE PROBLEM (Admin/Employee only)
export const updateProblem = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Don't allow updating these fields directly
        delete updates.problemNumber;
        delete updates.totalSubmissions;
        delete updates.totalAccepted;
        delete updates.acceptanceRate;
        delete updates.createdBy;

        const problem = await Problem.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Problem updated successfully',
            problem
        });

    } catch (error) {
        console.error('Update problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating problem',
            error: error.message
        });
    }
};

// 5. DELETE PROBLEM (Admin only)
export const deleteProblem = async (req, res) => {
    try {
        const { id } = req.params;

        const problem = await Problem.findByIdAndDelete(id);

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Problem deleted successfully'
        });

    } catch (error) {
        console.error('Delete problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting problem',
            error: error.message
        });
    }
};

// 6. TOGGLE PROBLEM STATUS (Admin/Employee only)
export const toggleProblemStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isPublished } = req.body;

        const updates = {};
        if (typeof isPublished !== 'undefined') updates.isPublished = isPublished;

        const problem = await Problem.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true }
        );

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'Problem not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Problem status updated',
            problem
        });

    } catch (error) {
        console.error('Toggle problem status error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating problem status',
            error: error.message
        });
    }
};

// 7. GET PROBLEM STATISTICS
export const getProblemStats = async (req, res) => {
    try {
        const stats = await Problem.aggregate([
            {
                $match: { isPublished: true }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    easy: {
                        $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] }
                    },
                    medium: {
                        $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] }
                    },
                    hard: {
                        $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] }
                    },
                    totalSubmissions: { $sum: '$totalSubmissions' },
                    totalAccepted: { $sum: '$totalAccepted' }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: stats[0] || {
                total: 0,
                easy: 0,
                medium: 0,
                hard: 0,
                totalSubmissions: 0,
                totalAccepted: 0
            }
        });

    } catch (error) {
        console.error('Get problem stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};

// 8. GET RANDOM PROBLEM
export const getRandomProblem = async (req, res) => {
    try {
        const { difficulty } = req.query;

        const filter = { 
            isPublished: true 
        };

        if (difficulty) {
            filter.difficulty = difficulty;
        }

        const count = await Problem.countDocuments(filter);
        const random = Math.floor(Math.random() * count);

        const problem = await Problem.findOne(filter)
            .skip(random)
            .select('-testCases -solution -starterCode -codeTemplates')
            .lean();

        if (!problem) {
            return res.status(404).json({
                success: false,
                message: 'No problems available'
            });
        }

        res.status(200).json({
            success: true,
            problem
        });

    } catch (error) {
        console.error('Get random problem error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching random problem',
            error: error.message
        });
    }
};

// 9. GET PROBLEMS BY TAG
export const getProblemsByTag = async (req, res) => {
    try {
        const { tag } = req.params;
        const { page = 1, limit = 20, difficulty, search } = req.query;

        const skip = (page - 1) * limit;
        const filter = {
            tags: tag,
            isPublished: true
        };

        if (difficulty) {
            const normalizedDifficulty = String(difficulty).trim();
            filter.difficulty = {
                $regex: new RegExp(`^${escapeRegex(normalizedDifficulty)}$`, 'i')
            };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const problems = await Problem.find(filter)
        .select('-testCases -solution -starterCode -codeTemplates')
        .sort({ problemNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

        let solvedIds = new Set();
        if (req.user?._id) {
            const solvedProblemIds = await Submission.distinct('problemId', {
                userId: req.user._id,
                verdict: 'Accepted'
            });
            solvedIds = new Set(solvedProblemIds.map((id) => id.toString()));
        }

        const normalizedProblems = problems.map((problem) => ({
            ...problem,
            acceptanceRate: Number((problem.acceptanceRate || 0).toFixed(2)),
            solved: solvedIds.has(problem._id.toString())
        }));

        const total = await Problem.countDocuments(filter);

        res.status(200).json({
            success: true,
            problems: normalizedProblems,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get problems by tag error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problems',
            error: error.message
        });
    }
};

// 10. GET ALL TAGS
export const getAllTags = async (req, res) => {
    try {
        const tags = await Problem.distinct('tags', {
            isPublished: true
        });

        res.status(200).json({
            success: true,
            tags: tags.sort()
        });

    } catch (error) {
        console.error('Get all tags error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tags',
            error: error.message
        });
    }
};

// 11. getAllProblemsAdmin (Admin/Employee only - includes unpublished and inactive)
export const getAllProblemsAdmin = async (req, res) => {
    try {
        const { 
            difficulty, 
            tags, 
            search, 
            page = 1, 
            limit = 20,
            sortBy = 'problemNumber',
            order = 'asc'
        } = req.query;

        // Build filter query
        const filter = {};

        if (difficulty) {
            filter.difficulty = difficulty;
        }

        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            filter.tags = { $in: tagArray };
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;

        // Pagination
        const skip = (page - 1) * limit;

        // Get problems with pagination (includes all)
        const problems = await Problem.find(filter)
            .select('-testCases -solution -starterCode -codeTemplates')
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get total count
        const total = await Problem.countDocuments(filter);

        res.status(200).json({
            success: true,
            problems,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get all problems admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching problems',
            error: error.message
        });
    }
};
