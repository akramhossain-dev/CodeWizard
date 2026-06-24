import { body, validationResult } from 'express-validator';

/**
 * Runs accumulated express-validator checks and returns 400 if any fail.
 * Use as the last middleware in a validation chain.
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

// ── Auth validators ────────────────────────────────────────────────────────

export const validateSignup = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters')
        .escape(),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('username')
        .trim()
        .notEmpty().withMessage('Username is required')
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3–30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Username can only contain letters, numbers, underscores, and hyphens')
        .toLowerCase(),
    body('gender')
        .notEmpty().withMessage('Gender is required')
        .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('dateOfBirth')
        .notEmpty().withMessage('Date of birth is required')
        .isISO8601().withMessage('Invalid date format'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters')
        .escape(),
    validate
];

export const validateSignin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
    validate
];

export const validateForgotPassword = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address')
        .normalizeEmail(),
    validate
];

export const validateResetPassword = [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('userId').notEmpty().withMessage('User ID is required').isMongoId().withMessage('Invalid user ID'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    validate
];

export const validateChangePassword = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    validate
];

// ── Submission validators ──────────────────────────────────────────────────

const VALID_LANGUAGES = ['javascript', 'python', 'java', 'cpp', 'c'];

export const validateSubmitCode = [
    body('problemId')
        .notEmpty().withMessage('Problem ID is required')
        .isMongoId().withMessage('Invalid problem ID'),
    body('language')
        .notEmpty().withMessage('Language is required')
        .isIn(VALID_LANGUAGES).withMessage(`Language must be one of: ${VALID_LANGUAGES.join(', ')}`),
    body('code')
        .notEmpty().withMessage('Code is required')
        .isLength({ max: 65536 }).withMessage('Code must not exceed 64 KB'),
    body('contestId')
        .optional()
        .isMongoId().withMessage('Invalid contest ID'),
    validate
];

export const validateRunCode = [
    body('problemId')
        .notEmpty().withMessage('Problem ID is required')
        .isMongoId().withMessage('Invalid problem ID'),
    body('language')
        .notEmpty().withMessage('Language is required')
        .isIn(VALID_LANGUAGES).withMessage(`Language must be one of: ${VALID_LANGUAGES.join(', ')}`),
    body('code')
        .notEmpty().withMessage('Code is required')
        .isLength({ max: 65536 }).withMessage('Code must not exceed 64 KB'),
    validate
];
