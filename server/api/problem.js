import express from 'express';
import {
    getAllProblems,
    getProblemBySlug,
    createProblem,
    updateProblem,
    deleteProblem,
    toggleProblemStatus,
    getProblemStats,
    getRandomProblem,
    getProblemsByTag,
    getAllTags,
    getAllProblemsAdmin
} from '../controllers/problem.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { checkAdminOrEmployee } from '../middleware/checkAdminOrEmployee.js';

const router = express.Router();

// Public routes
router.get('/all', authenticate, getAllProblems);
router.get('/stats',authenticate, getProblemStats);
router.get('/random', authenticate, getRandomProblem);
router.get('/tags',authenticate, getAllTags);
router.get('/tag/:tag', authenticate, getProblemsByTag);
router.get('/:slug', authenticate, getProblemBySlug);

// Protected routes (Employee/Admin only)
router.post('/create', authenticate, checkAdminOrEmployee, createProblem);
router.put('/update/:id', authenticate, checkAdminOrEmployee, updateProblem);
router.patch('/status/:id', authenticate, checkAdminOrEmployee, toggleProblemStatus);
router.delete('/delete/:id', authenticate, checkAdminOrEmployee, deleteProblem);
router.get('/admin/all', authenticate, checkAdminOrEmployee, getAllProblemsAdmin);

export default router;
