import Employee from '../models/employee.js';

export const checkEmployee = async (req, res, next) => {
    try {
        // Use employeeEmail if available, fallback to email
        const email = req.user.employeeEmail || req.user.email;
        const employee = await Employee.findOne({ 
            employeeEmail: email,
            isActive: true 
        });

        if (!employee) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Employee privileges required.'
            });
        }

        // Attach employee data to request
        req.employee = employee;
        next();

    } catch (error) {
        console.error('Check employee error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying employee status',
            error: error.message
        });
    }
};
