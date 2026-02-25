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
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google-signin', googleSignin);
router.post('/google-complete-profile', googleCompleteProfile);
router.post('/github-signin', githubSignin);
router.post('/github-complete-profile', githubCompleteProfile);
router.get('/user/:username', getUserByUsername);

// Protected routes (require authentication)
router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.put('/profile-picture', authenticate, upload.single('profilePicture'), updateProfilePicture);
router.put('/change-password', authenticate, changePassword);

export default router;