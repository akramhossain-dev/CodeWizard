import express from 'express';
import {
    employeeSignin,
    getEmployeeProfile,
    updateEmployeeProfile,
    changeEmployeePassword,
    getEmployeeStats
} from '../controllers/employee.js';
import { authenticate } from '../middleware/auth.js';
import { checkEmployee } from '../middleware/checkEmployee.js';

const router = express.Router();

// Public route
router.post('/signin', employeeSignin);

// Protected routes (require employee authentication)
router.use(authenticate);
router.use(checkEmployee);

router.get('/profile', getEmployeeProfile);
router.put('/profile', updateEmployeeProfile);
router.put('/change-password', changeEmployeePassword);
router.get('/stats', getEmployeeStats);

export default router;
