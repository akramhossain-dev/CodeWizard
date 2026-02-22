import express from 'express';
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

const router = express.Router();

// Public routes (one-time setup)
router.post('/signup', adminSignup);
router.post('/signin', adminSignin);

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
