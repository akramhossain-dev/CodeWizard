import Admin from '../models/admin.js';
import Employee from '../models/employee.js';

export const checkAdminOrEmployee = async (req, res, next) => {
    try {
        // Check if user is an admin
        const admin = await Admin.findById(req.user._id);
        
        if (admin && admin.isActive) {
            req.userRole = 'admin';
            req.admin = admin;
            return next();
        }

        // Check if user is an employee
        const employee = await Employee.findById(req.user._id);

        if (employee && employee.isActive) {
            req.userRole = 'employee';
            req.employee = employee;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin or Employee privileges required.'
        });

    } catch (error) {
        console.error('Check admin or employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying privileges',
            error: error.message
        });
    }
};
