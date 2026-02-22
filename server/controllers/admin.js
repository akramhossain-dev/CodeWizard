import Admin from '../models/admin.js';
import Employee from '../models/employee.js';
import Auth from '../models/auth.js';
import Problem from '../models/problem.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { encryptAES } from '../libs/crypto.js';
import crypto from 'crypto';

// Helper function to generate encrypted JWT token
const generateToken = (userId) => {
    const jwtToken = jwt.sign(
        { userId, timestamp: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return encryptAES(jwtToken, process.env.ENCRYPTION_SECRET);
};

// 1. ADMIN SIGNUP (First admin - one time setup)
export const adminSignup = async (req, res) => {
    try {
        const { name, email, password, username, secretKey } = req.body;

        // Validate secret key for first admin
        if (secretKey !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).json({
                success: false,
                message: 'Invalid secret key'
            });
        }

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({
            $or: [{ email }, { username }]
        });

        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Admin with this email or username already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin
        const admin = new Admin({
            name,
            email,
            password: hashedPassword,
            username,
            superAdmin: true
        });

        await admin.save();

        // Generate token
        const token = generateToken(admin._id);

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                username: admin.username,
                superAdmin: admin.superAdmin
            }
        });

    } catch (error) {
        console.error('Admin signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating admin account',
            error: error.message
        });
    }
};

// 2. ADMIN SIGNIN
export const adminSignin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find admin
        const admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!admin.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, admin.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(admin._id);

        // Remove password from response
        const adminResponse = admin.toObject();
        delete adminResponse.password;

        res.status(200).json({
            success: true,
            message: 'Admin signed in successfully',
            token,
            admin: adminResponse
        });

    } catch (error) {
        console.error('Admin signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error signing in',
            error: error.message
        });
    }
};

// 3. CREATE EMPLOYEE
export const createEmployee = async (req, res) => {
    try {
        const {
            employeeName,
            employeeEmail,
            password,
            role,
            permissions
        } = req.body;

        // Validate required fields
        if (!employeeName || !employeeEmail || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if employee already exists
        const existingEmployee = await Employee.findOne({ employeeEmail });

        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'Employee with this email already exists'
            });
        }

        // Generate employee ID and number
        const employeeId = `EMP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const lastEmployee = await Employee.findOne().sort({ employeeNumber: -1 });
        const employeeNumber = lastEmployee 
            ? String(parseInt(lastEmployee.employeeNumber) + 1).padStart(4, '0')
            : '0001';

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create employee
        const employee = new Employee({
            employeeId,
            employeeNumber,
            employeeName,
            employeeEmail,
            password: hashedPassword,
            role,
            permissions: permissions || {
                manageProblems: role === 'problem_manager',
                manageTestcases: role === 'problem_manager',
                manageUsers: role === 'moderator',
                manageDiscussions: role === 'moderator',
                viewSubmissions: true,
                deleteSubmissions: role === 'moderator'
            }
        });

        await employee.save();

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            employee: {
                id: employee._id,
                employeeId: employee.employeeId,
                employeeNumber: employee.employeeNumber,
                employeeName: employee.employeeName,
                employeeEmail: employee.employeeEmail,
                role: employee.role,
                permissions: employee.permissions
            }
        });

    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating employee',
            error: error.message
        });
    }
};

// 4. GET ALL EMPLOYEES
export const getAllEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 20, role, isActive } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

        const skip = (page - 1) * limit;

        const employees = await Employee.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Employee.countDocuments(filter);

        res.status(200).json({
            success: true,
            employees,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employees',
            error: error.message
        });
    }
};

// 5. GET EMPLOYEE BY ID
export const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findById(id).select('-password');

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
        console.error('Get employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching employee',
            error: error.message
        });
    }
};

// 6. UPDATE EMPLOYEE
export const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { employeeName, role, permissions, isActive } = req.body;

        const updates = {};
        if (employeeName) updates.employeeName = employeeName;
        if (role) updates.role = role;
        if (permissions) updates.permissions = permissions;
        if (typeof isActive !== 'undefined') updates.isActive = isActive;

        const employee = await Employee.findByIdAndUpdate(
            id,
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
            message: 'Employee updated successfully',
            employee
        });

    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message
        });
    }
};

// 7. DELETE EMPLOYEE
export const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByIdAndDelete(id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee deleted successfully'
        });

    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting employee',
            error: error.message
        });
    }
};

// 8. GET DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
    try {
        // Get counts
        const [totalUsers, totalProblems, totalEmployees, problemStats] = await Promise.all([
            Auth.countDocuments(),
            Problem.countDocuments({ isActive: true, isPublished: true }),
            Employee.countDocuments({ isActive: true }),
            Problem.aggregate([
                {
                    $match: { isActive: true, isPublished: true }
                },
                {
                    $group: {
                        _id: null,
                        totalSubmissions: { $sum: '$totalSubmissions' },
                        totalAccepted: { $sum: '$totalAccepted' },
                        easy: {
                            $sum: { $cond: [{ $eq: ['$difficulty', 'Easy'] }, 1, 0] }
                        },
                        medium: {
                            $sum: { $cond: [{ $eq: ['$difficulty', 'Medium'] }, 1, 0] }
                        },
                        hard: {
                            $sum: { $cond: [{ $eq: ['$difficulty', 'Hard'] }, 1, 0] }
                        }
                    }
                }
            ])
        ]);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalProblems,
                totalEmployees,
                problemsByDifficulty: problemStats[0] || {
                    easy: 0,
                    medium: 0,
                    hard: 0
                },
                submissions: {
                    total: problemStats[0]?.totalSubmissions || 0,
                    accepted: problemStats[0]?.totalAccepted || 0
                }
            }
        });

    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
};

// 9. GET ALL USERS (Admin view)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search, isBanned, isVerified } = req.query;

        const filter = {};
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        if (typeof isBanned !== 'undefined') filter.isBanned = isBanned === 'true';
        if (typeof isVerified !== 'undefined') filter.isVerified = isVerified === 'true';

        const skip = (page - 1) * limit;

        const users = await Auth.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Auth.countDocuments(filter);

        res.status(200).json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// 10. BAN/UNBAN USER
export const toggleUserBan = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBanned, reason } = req.body;

        const user = await Auth.findByIdAndUpdate(
            id,
            { isBanned },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
            user
        });

    } catch (error) {
        console.error('Toggle user ban error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

// 11. RESET EMPLOYEE PASSWORD
export const resetEmployeePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const employee = await Employee.findByIdAndUpdate(
            id,
            { password: hashedPassword },
            { new: true }
        ).select('-password');

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee password reset successfully'
        });

    } catch (error) {
        console.error('Reset employee password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

// 12. GET Admin PROFILE

export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user._id).select('-password');

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            admin
        });

    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching profile',
            error: error.message
        });
    }
};
