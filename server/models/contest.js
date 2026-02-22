import mongoose from 'mongoose';

const slugify = (value = '') =>
    String(value)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

const contestSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    rules: [{
        type: String,
        trim: true
    }],
    problems: [{
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
            required: true
        },
        points: {
            type: Number,
            default: 100,
            min: 1
        },
        order: {
            type: Number,
            default: 0
        }
    }],
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
}, { timestamps: true });

contestSchema.index({ slug: 1 });
contestSchema.index({ startTime: 1, endTime: 1 });
contestSchema.index({ isPublished: 1, isActive: 1 });

contestSchema.pre('validate', function() {
    if (this.title && !this.slug) {
        this.slug = slugify(this.title);
    }

    if (this.slug) {
        this.slug = slugify(this.slug);
    }

    if (this.startTime && this.endTime && this.startTime >= this.endTime) {
        this.invalidate('endTime', 'End time must be after start time');
    }
});

contestSchema.methods.getStatus = function(now = new Date()) {
    if (now < this.startTime) return 'upcoming';
    if (now >= this.startTime && now <= this.endTime) return 'running';
    return 'past';
};

const Contest = mongoose.model('Contest', contestSchema);

export default Contest;
