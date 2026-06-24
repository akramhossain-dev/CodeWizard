import express from 'express';
import rateLimit from 'express-rate-limit';
import {
    adminSignup,
    adminSignin,
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getDashboardStats,
    getAllUsers,
    toggleUserBan,
    resetEmployeePassword,
    getAdminProfile
} from '../controllers/admin.js';
import { authenticate } from '../middleware/auth.js';
import { checkAdmin } from '../middleware/cheakAdmin.js';
import { checkAdminOrEmployee } from '../middleware/checkAdminOrEmployee.js';

// ── M-4: Dedicated rate limiters for admin auth ────────────────────────────
// These are intentionally very strict since a compromised admin account is
// catastrophic. No Redis store needed — per-process is acceptable here.
const adminSignupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many signup attempts. Please try again in 15 minutes.' },
});

const adminSigninLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Too many signin attempts. Please try again in 15 minutes.' },
});

const router = express.Router();

// ── Public routes (one-time setup) — rate limited ─────────────────────────
router.post('/signup', adminSignupLimiter, adminSignup);
router.post('/signin', adminSigninLimiter, adminSignin);

// Protected routes - accessible by both admin and employee
router.use(authenticate);
router.use(checkAdminOrEmployee);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User Management (accessible by both admin and employee)
router.get('/users', getAllUsers);
router.patch('/users/:id/ban', toggleUserBan);

// Employee Management - ADMIN ONLY
router.post('/employees/create', checkAdmin, createEmployee);
router.get('/employees', checkAdmin, getAllEmployees);
router.get('/employees/:id', checkAdmin, getEmployeeById);
router.put('/employees/:id', checkAdmin, updateEmployee);
router.delete('/employees/:id', checkAdmin, deleteEmployee);
router.put('/employees/:id/reset-password', checkAdmin, resetEmployeePassword);

// Admin Profile
router.get('/profile', getAdminProfile);

export default router;
