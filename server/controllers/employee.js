import Employee from '../models/employee.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encryptAES } from '../libs/crypto.js';

// Helper function to generate encrypted JWT token
const generateToken = (userId) => {
    const jwtToken = jwt.sign(
        { userId, timestamp: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return encryptAES(jwtToken, process.env.ENCRYPTION_SECRET);
};

// 1. EMPLOYEE SIGNIN
export const employeeSignin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find employee
        const employee = await Employee.findOne({ employeeEmail: email });

        if (!employee) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!employee.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, employee.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(employee._id);

        // Remove password from response
        const employeeResponse = employee.toObject();
        delete employeeResponse.password;

        res.status(200).json({
            success: true,
            message: 'Employee signed in successfully',
            token,
            employee: employeeResponse
        });

    } catch (error) {
        console.error('Employee signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error signing in',
            error: error.message
        });
    }
};

// 2. GET EMPLOYEE PROFILE
export const getEmployeeProfile = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user._id).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            employee
        });

    } catch (error) {
        console.error('Get employee profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};

// 3. UPDATE EMPLOYEE PROFILE
export const updateEmployeeProfile = async (req, res) => {
    try {
        const { employeeName } = req.body;

        const updates = {};
        if (employeeName) updates.employeeName = employeeName;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const employee = await Employee.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            employee
        });

    } catch (error) {
        console.error('Update employee profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// 4. CHANGE EMPLOYEE PASSWORD
export const changeEmployeePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Get employee with password
        const employee = await Employee.findById(req.user._id);

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, employee.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        employee.password = hashedPassword;
        await employee.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change employee password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// 5. GET EMPLOYEE STATS (for their own stats)
export const getEmployeeStats = async (req, res) => {
    try {
        const employee = await Employee.findById(req.user._id).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Get statistics based on role
        const stats = {
            role: employee.role,
            permissions: employee.permissions,
            joinedAt: employee.joinedAt,
            isActive: employee.isActive
        };

        res.status(200).json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get employee stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics',
            error: error.message
        });
    }
};
