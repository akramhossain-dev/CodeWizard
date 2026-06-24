import express from 'express';
import {
    submitCode,
    getSubmissionStatus,
    getUserSubmissions,
    getSubmissionById,
    getProblemSubmissions,
    getSubmissionStats,
    runCode,
    getAllSubmissionsAdmin,
    getAllSubmissionStats
} from '../controllers/submission.js';
import { authenticate } from '../middleware/auth.js';
import { submitRateLimiter, runRateLimiter } from '../middleware/rateLimit.js';
import { checkAdminOrEmployee } from '../middleware/checkAdminOrEmployee.js';
import { validateSubmitCode, validateRunCode } from '../middleware/validate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Submit code — validated + rate limited
router.post('/submit', submitRateLimiter, validateSubmitCode, submitCode);

// Run code (test without submitting) — validated + rate limited
router.post('/run', runRateLimiter, validateRunCode, runCode);

// Get submission status
router.get('/status/:id', getSubmissionStatus);

// Get user's submissions
router.get('/my-submissions', getUserSubmissions);

// Get submission by ID with full details
router.get('/:id', getSubmissionById);

// Get problem submissions (leaderboard)
router.get('/problem/:problemId', getProblemSubmissions);

// Get statistics
router.get('/stats', getSubmissionStats);

// Admin/Employee routes
router.get('/admin/all',   checkAdminOrEmployee, getAllSubmissionsAdmin);
router.get('/admin/stats', checkAdminOrEmployee, getAllSubmissionStats);

export default router;
