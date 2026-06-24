import express from 'express';
import { 
    signup, 
    signin, 
    verifyEmail, 
    getUserByUsername, 
    getCurrentUser,
    updateProfile, 
    updateProfilePicture,
    changePassword,
    resendVerification,
    forgotPassword,
    resetPassword,
    googleSignin,
    googleCompleteProfile,
    githubSignin,
    githubCompleteProfile
} from '../controllers/auth.js';
import { authenticate } from '../middleware/auth.js';
import { uploadProfilePicture, handleMulterError } from '../middleware/upload.js';
import {
    validateSignup,
    validateSignin,
    validateForgotPassword,
    validateResetPassword,
    validateChangePassword,
} from '../middleware/validate.js';

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.post('/signup',              validateSignup,         signup);
router.post('/signin',              validateSignin,         signin);
router.post('/verify-email',                                verifyEmail);
router.post('/resend-verification',                         resendVerification);
router.post('/forgot-password',     validateForgotPassword, forgotPassword);
router.post('/reset-password',      validateResetPassword,  resetPassword);
router.post('/google-signin',                               googleSignin);
router.post('/google-complete-profile',                     googleCompleteProfile);
router.post('/github-signin',                               githubSignin);
router.post('/github-complete-profile',                     githubCompleteProfile);
router.get('/user/:username',                               getUserByUsername);

// ── Protected routes ───────────────────────────────────────────────────────
router.get('/me',              authenticate,                                               getCurrentUser);
router.put('/profile',         authenticate,                                               updateProfile);
router.put('/profile-picture', authenticate, uploadProfilePicture.single('profilePicture'), handleMulterError, updateProfilePicture);
router.put('/change-password', authenticate, validateChangePassword,                        changePassword);

export default router;