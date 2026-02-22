import express from 'express';
import {
    getAllContests,
    getContestBySlug,
    getContestLeaderboard,
    getMyJoinedContests,
    joinContest,
    createContest,
    updateContest,
    toggleContestStatus,
    deleteContest,
    getAllContestsAdmin
} from '../controllers/contest.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { checkAdminOrEmployee } from '../middleware/checkAdminOrEmployee.js';

const router = express.Router();

// Public / optional-auth
router.get('/all', authenticate, getAllContests);
router.get('/:slug/leaderboard', authenticate, getContestLeaderboard);
router.get('/:slug', authenticate, getContestBySlug);

// User routes
router.get('/my/joined', authenticate, getMyJoinedContests);
router.post('/:id/join', authenticate, joinContest);

// Admin/Employee routes
router.get('/admin/all', authenticate, checkAdminOrEmployee, getAllContestsAdmin);
router.post('/create', authenticate, checkAdminOrEmployee, createContest);
router.put('/update/:id', authenticate, checkAdminOrEmployee, updateContest);
router.patch('/status/:id', authenticate, checkAdminOrEmployee, toggleContestStatus);
router.delete('/delete/:id', authenticate, checkAdminOrEmployee, deleteContest);

export default router;
