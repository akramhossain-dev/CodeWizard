import mongoose from 'mongoose';

const testCaseSchema = new mongoose.Schema({
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    explanation: { type: String }
});

const exampleSchema = new mongoose.Schema({
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String }
});

const problemSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true, 
        unique: true,
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
        required: true 
    },
    
    difficulty: { 
        type: String, 
        enum: ['Easy', 'Medium', 'Hard'], 
        required: true 
    },
    
    tags: [{ 
        type: String,
        trim: true
    }],
    
    
    // Problem constraints
    constraints: [{ type: String }],
    
    // Input format
    inputFormat: { type: String },
    
    // Output format
    outputFormat: { type: String },
    
    // Examples (public)
    examples: [exampleSchema],
    
    // Test cases (public + hidden)
    testCases: [testCaseSchema],
    
    // Code templates for different languages
    codeTemplates: {
        javascript: { type: String, default: '' },
        python: { type: String, default: '' },
        java: { type: String, default: '' },
        cpp: { type: String, default: '' },
        c: { type: String, default: '' }
    },
    
    // Default code for each language
    starterCode: {
        javascript: { type: String, default: '' },
        python: { type: String, default: '' },
        java: { type: String, default: '' },
        cpp: { type: String, default: '' },
        c: { type: String, default: '' }
    },
    
    // Statistics
    acceptanceRate: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    totalAccepted: { type: Number, default: 0 },
    totalAttempted: { type: Number, default: 0 },
    
    // Hints (ordered array)
    hints: [{ type: String }],
    
    // Solution (optional, for premium users or after solving)
    solution: {
        description: { type: String },
        code: {
            javascript: { type: String },
            python: { type: String },
            java: { type: String },
            cpp: { type: String },
            c: { type: String }
        },
        complexity: {
            time: { type: String },
            space: { type: String }
        }
    },
    
    // Time and memory limits
    timeLimit: { type: Number, default: 2000 }, // milliseconds
    memoryLimit: { type: Number, default: 256 }, // MB
    
    // Creator/Author
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Employee'
    },
    
    // Status
    isPremium: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    
    // Problem number/order
    problemNumber: { type: Number, unique: true, sparse: true },
    
    // Editorial/Discussion
    hasEditorial: { type: Boolean, default: false },
    editorialLink: { type: String },
    
}, { 
    timestamps: true 
});

// Indexes for better query performance
problemSchema.index({ slug: 1 });
problemSchema.index({ difficulty: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ problemNumber: 1 });

// Virtual for getting only public test cases
problemSchema.virtual('publicTestCases').get(function() {
    return this.testCases.filter(tc => !tc.isHidden);
});

// Method to get problem with only public test cases
problemSchema.methods.toPublicJSON = function() {
    const obj = this.toObject();
    obj.testCases = this.testCases.filter(tc => !tc.isHidden);
    return obj;
};

// Generate slug from title before saving
problemSchema.pre('save', function(next) {
    if (this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    if (typeof next === 'function') {
        next();
    }
});

// Update acceptance rate
problemSchema.methods.updateAcceptanceRate = function() {
    if (this.totalSubmissions > 0) {
        this.acceptanceRate = (this.totalAccepted / this.totalSubmissions) * 100;
    }
};

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
