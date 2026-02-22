import mongoose from 'mongoose';

const passwordResetSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Token expires and auto-deletes after 1 hour
    }
});

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

export default PasswordReset;
