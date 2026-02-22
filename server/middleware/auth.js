import jwt from 'jsonwebtoken';
import Auth from '../models/auth.js';
import Admin from '../models/admin.js';
import Employee from '../models/employee.js';
import { decryptAES } from '../libs/crypto.js';

export const authenticate = async (req, res, next) => {
    try {
        // Get token from header or cookie
        const encryptedToken = req.headers.authorization?.split(' ')[1] || req.cookies.token;

        if (!encryptedToken) {
            return res.status(401).json({ 
                success: false,
                message: 'Access denied. No token provided.' 
            });
        }

        // Decrypt the token first
        const token = decryptAES(encryptedToken, process.env.ENCRYPTION_SECRET);
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Try to find user in Auth, Admin, or Employee collections
        let user = await Auth.findById(decoded.userId).select('-password');
        
        if (!user) {
            user = await Admin.findById(decoded.userId).select('-password');
        }
        
        if (!user) {
            user = await Employee.findById(decoded.userId).select('-password');
        }
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token. User not found.' 
            });
        }

        // Check if user is banned (only for Auth users)
        if (user.isBanned) {
            return res.status(403).json({ 
                success: false,
                message: 'Your account has been banned.' 
            });
        }

        // Check if user is active (for Admin and Employee)
        if (user.isActive === false) {
            return res.status(403).json({ 
                success: false,
                message: 'Your account has been deactivated.' 
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token.' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired.' 
            });
        }
        return res.status(500).json({ 
            success: false,
            message: 'Server error during authentication.',
            error: error.message 
        });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const encryptedToken = req.headers.authorization?.split(' ')[1] || req.cookies.token;

        if (encryptedToken) {
            const token = decryptAES(encryptedToken, process.env.ENCRYPTION_SECRET);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await Auth.findById(decoded.userId).select('-password');
            if (user && !user.isBanned) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};
