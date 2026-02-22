import mongoose from 'mongoose';

const contestParticipationSchema = new mongoose.Schema({
    contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auth',
        required: true,
        index: true
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

contestParticipationSchema.index({ contestId: 1, userId: 1 }, { unique: true });

const ContestParticipation = mongoose.model('ContestParticipation', contestParticipationSchema);

export default ContestParticipation;
