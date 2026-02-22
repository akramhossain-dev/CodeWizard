import Admin from '../models/admin.js';

export const checkAdmin = async (req, res, next) => {
    try {
        // Check if user is an admin
        const admin = await Admin.findOne({ 
            email: req.user.email,
            isActive: true 
        });

        if (!admin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Attach admin data to request
        req.admin = admin;
        next();

    } catch (error) {
        console.error('Check admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying admin status',
            error: error.message
        });
    }
};
