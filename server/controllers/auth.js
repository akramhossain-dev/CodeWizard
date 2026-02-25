import Auth from "../models/auth.js";
import EmailVerification from "../models/EmailVerification.js";
import PasswordReset from "../models/PasswordReset.js";
import { encryptAES, decryptAES } from "../libs/crypto.js";
import dotenv from "dotenv";
import cloudinary from "../libs/cloudinary.js";
import fs from "fs/promises";
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

// Helper function to generate encrypted JWT token
const generateToken = (userId) => {
    const jwtToken = jwt.sign(
        { userId, timestamp: Date.now() },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    // Encrypt the JWT token
    return encryptAES(jwtToken, process.env.ENCRYPTION_SECRET);
};

// Helper function to upload to Cloudinary
async function uploadToCloudinary(filePath, folder) {
    const result = await cloudinary.uploader.upload(filePath, { 
        folder,
        transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto:good" },
            { fetch_format: "auto" }
        ]
    });
    return result.secure_url;
}

// Configure nodemailer (optional for development)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// Send verification email
async function sendVerificationEmail(email, token, userId) {
    // Skip email sending if transporter not configured (development mode)
    if (!transporter) {
        console.log('📧 Email not configured. Verification link:');
        console.log(`${process.env.CLIENT_URL}/verify-email?token=${token}&userId=${userId}`);
        return;
    }

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}&userId=${userId}`;
    
    const currentYear = new Date().getFullYear();
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification - Problem Solving Platform',
html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 30px auto; background-color: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background-color: #2c3e50; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Welcome to CodeWizard</h1>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #ecf0f1;">Verify Your Email Address</p>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
                <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Hello,</p>
                
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                    Thank you for signing up for CodeWizard! To complete your registration and activate your account, please verify your email address by clicking the button below.
                </p>

                <!-- Verification Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; padding: 12px 40px; background-color: #27ae60; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 15px;">Verify Email Address</a>
                </div>

                <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    Or copy and paste this link in your browser:
                </p>
                
                <!-- Link -->
                <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; margin: 0 0 25px 0; word-break: break-all; font-size: 13px; color: #333; font-family: monospace;">
                    ${verificationUrl}
                </div>

                <!-- Expiration -->
                <p style="color: #d32f2f; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    <strong>Note:</strong> This verification link will expire in 1 hour. Please verify your email as soon as possible.
                </p>

                <!-- Safety -->
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                    If you did not create this account, please ignore this email. No action is required from you.
                </p>

                <!-- Additional Info -->
                <div style="background-color: #f0f8ff; border-left: 4px solid #3498db; padding: 15px; margin: 25px 0 0 0; border-radius: 4px;">
                    <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0;">
                        <strong>Security Tip:</strong> Always verify emails from official CodeWizard addresses. We will never ask for your password via email.
                    </p>
                </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 13px; margin: 0 0 8px 0;">
                    <strong style="color: #666;">CodeWizard Team</strong>
                </p>
                <p style="color: #999; font-size: 13px; margin: 0 0 12px 0;">
                    © ${currentYear} CodeWizard. All rights reserved.
                </p>
                <p style="color: #999; font-size: 12px; margin: 0;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
`
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Email sending failed:', error.message);
        console.log('📧 Verification link:', verificationUrl);
    }
}

// 1. SIGNUP
export const signup = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            username,
            gender,
            dateOfBirth,
            location,
            bio
        } = req.body;

        // Validate required fields
        if (!name || !email || !password || !username || !gender || !dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if user already exists
        const existingUser = await Auth.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Username already taken'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create new user
        const newUser = new Auth({
            name,
            email,
            password: hashedPassword,
            username,
            gender,
            dateOfBirth,
            location: location || '',
            bio: bio || ''
        });

        await newUser.save();

        // Generate verification token
        const verificationToken = encryptAES(newUser._id.toString(), process.env.ENCRYPTION_SECRET);

        // Save verification token
        const emailVerification = new EmailVerification({
            userId: newUser._id,
            email: newUser.email,
            token: verificationToken
        });

        await emailVerification.save();

        // Send verification email
        try {
            await sendVerificationEmail(newUser.email, verificationToken, newUser._id);
        } catch (error) {
            console.error('Failed to send verification email:', error.message);
            // Continue even if email fails
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please check your email to verify your account.',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                username: newUser.username
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating account',
            error: error.message
        });
    }
};

// 2. VERIFY EMAIL
export const verifyEmail = async (req, res) => {
    try {
        const { token, userId } = req.body;

        if (!token || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Token and userId are required'
            });
        }

        // Find verification record
        const verification = await EmailVerification.findOne({ userId, token });

        if (!verification) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        // Decrypt and verify token
        const decryptedUserId = decryptAES(token, process.env.ENCRYPTION_SECRET);

        if (decryptedUserId !== userId) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification token'
            });
        }

        // Update user verification status
        const user = await Auth.findByIdAndUpdate(
            userId,
            { isVerified: true },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete verification record
        await EmailVerification.deleteOne({ _id: verification._id });

        // Generate token
        const authToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Email verified successfully!',
            token: authToken,
            user
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying email',
            error: error.message
        });
    }
};

// 3. SIGNIN
export const signin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await Auth.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is banned
        if (user.isBanned) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned'
            });
        }

        // Check if user signed up with Google only (no password set)
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account uses Google sign-in. Please sign in with Google.'
            });
        }

        // Check if user signed up with GitHub only (no password set)
        if (user.authProvider === 'github' && !user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account uses GitHub sign-in. Please sign in with GitHub.'
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email first',
                needsVerification: true
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
            success: true,
            message: 'Signed in successfully',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error signing in',
            error: error.message
        });
    }
};

// 4. GET USER BY USERNAME
export const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await Auth.findOne({ username }).select('-password -email -dateOfBirth');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// 5. GET CURRENT USER
export const getCurrentUser = async (req, res) => {
    try {
        const user = await Auth.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data',
            error: error.message
        });
    }
};

// 6. UPDATE PROFILE PICTURE
export const updateProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image'
            });
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(req.file.path, 'profile-pictures');

        // Update user profile picture
        const user = await Auth.findByIdAndUpdate(
            req.user._id,
            { profilePicture: imageUrl },
            { new: true }
        ).select('-password');

        // Delete local file
        await fs.unlink(req.file.path);

        res.status(200).json({
            success: true,
            message: 'Profile picture updated successfully',
            profilePicture: imageUrl,
            user
        });

    } catch (error) {
        // Clean up file if upload failed
        if (req.file) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        console.error('Update profile picture error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile picture',
            error: error.message
        });
    }
};

// 7. UPDATE PROFILE
export const updateProfile = async (req, res) => {
    try {
        const allowedUpdates = [
            'name', 'location', 'bio', 'socialLinks', 'work', 'education', 'skills', 'interests'
        ];

        const updates = {};
        
        for (const key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                updates[key] = req.body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const user = await Auth.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message
        });
    }
};

// 8. CHANGE PASSWORD
export const changePassword = async (req, res) => {
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

        // Get user with password
        const user = await Auth.findById(req.user._id);

        // If user signed up via Google and has no password, allow setting one
        if (user.authProvider === 'google' && !user.password) {
            if (!newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a new password'
                });
            }
            const hashedPassword = await bcrypt.hash(newPassword, 12);
            user.password = hashedPassword;
            user.authProvider = 'local'; // Now they have both local + google
            await user.save();

            return res.status(200).json({
                success: true,
                message: 'Password set successfully'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error changing password',
            error: error.message
        });
    }
};

// 9. RESEND VERIFICATION EMAIL
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await Auth.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Delete old verification tokens
        await EmailVerification.deleteMany({ userId: user._id });

        // Generate new verification token
        const verificationToken = encryptAES(user._id.toString(), process.env.ENCRYPTION_SECRET);

        // Save verification token
        const emailVerification = new EmailVerification({
            userId: user._id,
            email: user.email,
            token: verificationToken
        });

        await emailVerification.save();

        // Send verification email
        try {
            await sendVerificationEmail(user.email, verificationToken, user._id);
        } catch (error) {
            console.error('Failed to send verification email:', error.message);
            // Continue even if email fails
        }

        res.status(200).json({
            success: true,
            message: 'Verification email sent successfully'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending verification email',
            error: error.message
        });
    }
};

// 10. FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await Auth.findOne({ email });

        if (!user) {
            // Don't reveal if user exists
            return res.status(200).json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const encryptedToken = encryptAES(resetToken, process.env.ENCRYPTION_SECRET);

        // Delete any existing password reset tokens for this user
        await PasswordReset.deleteMany({ userId: user._id });

        // Save encrypted token to temporary collection (auto-deletes after 1 hour)
        await PasswordReset.create({
            userId: user._id,
            email: user.email,
            token: encryptedToken
        });

        const currentYear = new Date().getFullYear();

        // Send reset email
        const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&userId=${user._id}`;
        
        if (transporter) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Password Reset - CodeWizard',
html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 30px auto; background-color: white; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background-color: #2c3e50; color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 600;">Password Reset Request</h1>
            </div>

            <!-- Content -->
            <div style="padding: 30px 20px;">
                <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">Hello,</p>
                
                <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                    You have requested to reset your password. Please click the button below to proceed with the password reset process.
                </p>

                <!-- Reset Button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 40px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: 600; font-size: 15px;">Reset Password</a>
                </div>

                <p style="color: #777; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    Or copy and paste this link in your browser:
                </p>
                
                <!-- Link -->
                <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 4px; padding: 12px; margin: 0 0 25px 0; word-break: break-all; font-size: 13px; color: #333; font-family: monospace;">
                    ${resetUrl}
                </div>

                <!-- Expiration -->
                <p style="color: #d32f2f; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                    <strong>Note:</strong> This link will expire in 1 hour.
                </p>

                <!-- Safety -->
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
                    If you did not request a password reset, please ignore this email. Your account will remain secure.
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f5f5f5; border-top: 1px solid #ddd; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 13px; margin: 0;">
                    © ${currentYear} CodeWizard. All rights reserved.
                </p>
                <p style="color: #999; font-size: 13px; margin: 8px 0 0 0;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        </div>
    </body>
    </html>
`
            };

            try {
                await transporter.sendMail(mailOptions);
            } catch (error) {
                console.error('Email sending failed:', error.message);
                console.log('🔑 Password reset link:', resetUrl);
            }
        } else {
            console.log('🔑 Password reset link:', resetUrl);
        }

        res.status(200).json({
            success: true,
            message: 'If an account exists with this email, a password reset link has been sent'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing password reset request',
            error: error.message
        });
    }
};

// 11. RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { token, userId, newPassword } = req.body;

        if (!token || !userId || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token, userId, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const user = await Auth.findById(userId);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user'
            });
        }

        // Find password reset token from temporary collection
        const passwordReset = await PasswordReset.findOne({ userId: user._id });

        if (!passwordReset) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Verify token by decrypting
        let decryptedToken;
        try {
            decryptedToken = decryptAES(passwordReset.token, process.env.ENCRYPTION_SECRET);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        if (decryptedToken !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid reset token'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        await user.save();

        // Delete the password reset token after successful reset
        await PasswordReset.deleteOne({ _id: passwordReset._id });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resetting password',
            error: error.message
        });
    }
};

// 12. GOOGLE SIGN IN (ID Token verification)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleSignin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: 'Google credential is required'
            });
        }

        // Verify the Google ID token
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token'
            });
        }

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;

        if (!email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Google email is not verified'
            });
        }

        // --- Account linking & no-duplicate logic ---

        // 1. Check if a user with this googleId already exists (returning Google user)
        let user = await Auth.findOne({ googleId });

        if (user) {
            // Existing Google-linked user — just sign them in
            if (user.isBanned) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been banned'
                });
            }

            user.lastLogin = new Date();
            await user.save();

            const token = generateToken(user._id);
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json({
                success: true,
                message: 'Signed in with Google successfully',
                token,
                user: userResponse
            });
        }

        // 2. Check if a user with this email exists (account linking)
        user = await Auth.findOne({ email });

        if (user) {
            // Link Google account to existing local user
            if (user.isBanned) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been banned'
                });
            }

            user.googleId = googleId;
            if (!user.isVerified) {
                user.isVerified = true; // Google email is verified
            }
            if (!user.profilePicture && picture) {
                user.profilePicture = picture;
            }
            user.lastLogin = new Date();
            await user.save();

            // Clean up any pending email verifications
            await EmailVerification.deleteMany({ userId: user._id });

            const token = generateToken(user._id);
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json({
                success: true,
                message: 'Google account linked and signed in successfully',
                token,
                user: userResponse
            });
        }

        // 3. No existing user — ask frontend to collect profile info
        // Generate a suggested username from the email prefix
        let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        if (baseUsername.length < 3) {
            baseUsername = baseUsername + 'user';
        }
        let suggestedUsername = baseUsername;
        let counter = 1;
        while (await Auth.findOne({ username: suggestedUsername })) {
            suggestedUsername = `${baseUsername}${counter}`;
            counter++;
        }

        return res.status(200).json({
            success: true,
            needsProfile: true,
            message: 'Please complete your profile to finish signing up',
            googleData: {
                name: name || email.split('@')[0],
                email,
                picture: picture || '',
                suggestedUsername,
            }
        });

    } catch (error) {
        console.error('Google signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error signing in with Google',
            error: error.message
        });
    }
};

// 13. GOOGLE COMPLETE PROFILE (for new Google users)
export const googleCompleteProfile = async (req, res) => {
    try {
        const { credential, username, gender, dateOfBirth } = req.body;

        if (!credential || !username || !gender || !dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Verify the Google ID token again for security
        let ticket;
        try {
            ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired Google token. Please try again.'
            });
        }

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;

        if (!email_verified) {
            return res.status(400).json({
                success: false,
                message: 'Google email is not verified'
            });
        }

        // Check again for duplicates (race condition protection)
        const existingGoogleUser = await Auth.findOne({ googleId });
        if (existingGoogleUser) {
            // Already created — just sign them in
            const token = generateToken(existingGoogleUser._id);
            const userResponse = existingGoogleUser.toObject();
            delete userResponse.password;
            return res.status(200).json({
                success: true,
                message: 'Signed in with Google successfully',
                token,
                user: userResponse
            });
        }

        const existingEmailUser = await Auth.findOne({ email });
        if (existingEmailUser) {
            // Link and sign in
            existingEmailUser.googleId = googleId;
            if (!existingEmailUser.isVerified) existingEmailUser.isVerified = true;
            if (!existingEmailUser.profilePicture && picture) existingEmailUser.profilePicture = picture;
            existingEmailUser.lastLogin = new Date();
            await existingEmailUser.save();
            await EmailVerification.deleteMany({ userId: existingEmailUser._id });

            const token = generateToken(existingEmailUser._id);
            const userResponse = existingEmailUser.toObject();
            delete userResponse.password;
            return res.status(200).json({
                success: true,
                message: 'Google account linked and signed in successfully',
                token,
                user: userResponse
            });
        }

        // Validate and sanitize username
        const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
        if (sanitizedUsername.length < 3) {
            return res.status(400).json({
                success: false,
                message: 'Username must be at least 3 characters'
            });
        }

        // Check if username is taken
        const usernameTaken = await Auth.findOne({ username: sanitizedUsername });
        if (usernameTaken) {
            return res.status(400).json({
                success: false,
                message: 'Username is already taken. Please choose another.'
            });
        }

        // Validate gender
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({
                success: false,
                message: 'Please select a valid gender'
            });
        }

        // Create the new user with proper profile data
        const newUser = new Auth({
            name: name || email.split('@')[0],
            email,
            username: sanitizedUsername,
            googleId,
            authProvider: 'google',
            isVerified: true,
            gender,
            dateOfBirth: new Date(dateOfBirth),
            profilePicture: picture || '',
            lastLogin: new Date(),
        });

        await newUser.save();

        const token = generateToken(newUser._id);
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: 'Account created with Google successfully',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('Google complete profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing profile',
            error: error.message
        });
    }
};

// ============================================================
// GITHUB OAUTH
// ============================================================

// Helper: Exchange GitHub code for access token, then fetch user profile + email
async function getGitHubUserFromCode(code) {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: JSON.stringify({
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error || !tokenData.access_token) {
        throw new Error(tokenData.error_description || 'Failed to exchange GitHub code');
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user profile
    const userRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!userRes.ok) throw new Error('Failed to fetch GitHub user profile');
    const profile = await userRes.json();

    // 3. Fetch primary verified email (email may be private)
    let email = profile.email;
    if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
        });
        if (emailsRes.ok) {
            const emails = await emailsRes.json();
            const primary = emails.find((e) => e.primary && e.verified);
            if (primary) email = primary.email;
        }
    }

    return {
        githubId: String(profile.id),
        email,
        name: profile.name || profile.login,
        login: profile.login,
        avatar: profile.avatar_url || '',
    };
}

// 14. GITHUB SIGN IN
export const githubSignin = async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'GitHub authorization code is required'
            });
        }

        let ghUser;
        try {
            ghUser = await getGitHubUserFromCode(code);
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired GitHub code. Please try again.'
            });
        }

        const { githubId, email, name, login, avatar } = ghUser;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Could not retrieve a verified email from your GitHub account. Please make sure you have a public or verified primary email on GitHub.'
            });
        }

        // --- Account linking & no-duplicate logic ---

        // 1. Check if a user with this githubId already exists
        let user = await Auth.findOne({ githubId });

        if (user) {
            if (user.isBanned) {
                return res.status(403).json({ success: false, message: 'Your account has been banned' });
            }

            user.lastLogin = new Date();
            await user.save();

            const token = generateToken(user._id);
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json({
                success: true,
                message: 'Signed in with GitHub successfully',
                token,
                user: userResponse
            });
        }

        // 2. Check if a user with this email exists (account linking)
        user = await Auth.findOne({ email: email.toLowerCase() });

        if (user) {
            if (user.isBanned) {
                return res.status(403).json({ success: false, message: 'Your account has been banned' });
            }

            user.githubId = githubId;
            if (!user.isVerified) user.isVerified = true;
            if (!user.profilePicture && avatar) user.profilePicture = avatar;
            user.lastLogin = new Date();
            await user.save();

            await EmailVerification.deleteMany({ userId: user._id });

            const token = generateToken(user._id);
            const userResponse = user.toObject();
            delete userResponse.password;

            return res.status(200).json({
                success: true,
                message: 'GitHub account linked and signed in successfully',
                token,
                user: userResponse
            });
        }

        // 3. New user — ask frontend to collect profile info
        let baseUsername = login.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (baseUsername.length < 3) baseUsername = baseUsername + 'user';
        let suggestedUsername = baseUsername;
        let counter = 1;
        while (await Auth.findOne({ username: suggestedUsername })) {
            suggestedUsername = `${baseUsername}${counter}`;
            counter++;
        }

        return res.status(200).json({
            success: true,
            needsProfile: true,
            message: 'Please complete your profile to finish signing up',
            githubData: {
                name: name || login,
                email,
                picture: avatar,
                suggestedUsername,
                githubId,
            }
        });

    } catch (error) {
        console.error('GitHub signin error:', error);
        res.status(500).json({
            success: false,
            message: 'Error signing in with GitHub',
            error: error.message
        });
    }
};

// 15. GITHUB COMPLETE PROFILE (for new GitHub users)
export const githubCompleteProfile = async (req, res) => {
    try {
        const { githubId, email, name, picture, username, gender, dateOfBirth } = req.body;

        if (!githubId || !email || !username || !gender || !dateOfBirth) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Race condition protection
        const existingGithubUser = await Auth.findOne({ githubId });
        if (existingGithubUser) {
            const token = generateToken(existingGithubUser._id);
            const userResponse = existingGithubUser.toObject();
            delete userResponse.password;
            return res.status(200).json({
                success: true,
                message: 'Signed in with GitHub successfully',
                token,
                user: userResponse
            });
        }

        const existingEmailUser = await Auth.findOne({ email: email.toLowerCase() });
        if (existingEmailUser) {
            existingEmailUser.githubId = githubId;
            if (!existingEmailUser.isVerified) existingEmailUser.isVerified = true;
            if (!existingEmailUser.profilePicture && picture) existingEmailUser.profilePicture = picture;
            existingEmailUser.lastLogin = new Date();
            await existingEmailUser.save();
            await EmailVerification.deleteMany({ userId: existingEmailUser._id });

            const token = generateToken(existingEmailUser._id);
            const userResponse = existingEmailUser.toObject();
            delete userResponse.password;
            return res.status(200).json({
                success: true,
                message: 'GitHub account linked and signed in successfully',
                token,
                user: userResponse
            });
        }

        // Validate username
        const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
        if (sanitizedUsername.length < 3) {
            return res.status(400).json({ success: false, message: 'Username must be at least 3 characters' });
        }

        const usernameTaken = await Auth.findOne({ username: sanitizedUsername });
        if (usernameTaken) {
            return res.status(400).json({ success: false, message: 'Username is already taken. Please choose another.' });
        }

        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ success: false, message: 'Please select a valid gender' });
        }

        const newUser = new Auth({
            name: name || email.split('@')[0],
            email: email.toLowerCase(),
            username: sanitizedUsername,
            githubId,
            authProvider: 'github',
            isVerified: true,
            gender,
            dateOfBirth: new Date(dateOfBirth),
            profilePicture: picture || '',
            lastLogin: new Date(),
        });

        await newUser.save();

        const token = generateToken(newUser._id);
        const userResponse = newUser.toObject();
        delete userResponse.password;

        return res.status(201).json({
            success: true,
            message: 'Account created with GitHub successfully',
            token,
            user: userResponse
        });

    } catch (error) {
        console.error('GitHub complete profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error completing profile',
            error: error.message
        });
    }
};
