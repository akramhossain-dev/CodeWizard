import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
    testCaseIndex: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    error: { type: String },
    executionTime: { type: Number }, // milliseconds
    memoryUsed: { type: Number } // KB
});

const submissionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Auth', 
        required: true,
        index: true
    },
    
    problemId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Problem', 
        required: true,
        index: true
    },

    contestId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contest',
        index: true
    },
    
    // Code and language
    code: { 
        type: String, 
        required: true 
    },
    
    language: { 
        type: String, 
        enum: ['javascript', 'python', 'java', 'cpp', 'c'], 
        required: true 
    },
    
    // Verdict status
    verdict: { 
        type: String, 
        enum: [
            'Pending',           // In queue
            'Running',           // Being judged
            'Accepted',          // All test cases passed
            'Wrong Answer',      // Output doesn't match
            'Time Limit Exceeded', // TLE
            'Memory Limit Exceeded', // MLE
            'Runtime Error',     // Crash/Exception
            'Compilation Error', // CE
            'Internal Error'     // System error
        ],
        default: 'Pending',
        index: true
    },
    
    // Performance metrics
    runtime: { 
        type: Number, 
        default: 0 
    }, // milliseconds
    
    memory: { 
        type: Number, 
        default: 0 
    }, // KB
    
    // Test case results
    testResults: [testResultSchema],
    
    totalTestCases: { type: Number, default: 0 },
    passedTestCases: { type: Number, default: 0 },
    
    // Error information
    errorMessage: { type: String },
    errorLine: { type: Number },
    compilationOutput: { type: String },
    
    // Judge metadata
    judgeStartTime: { type: Date },
    judgeEndTime: { type: Date },
    judgeServer: { type: String },
    
    // Queue job ID for tracking
    jobId: { type: String },
    
    submittedAt: { 
        type: Date, 
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
submissionSchema.index({ userId: 1, submittedAt: -1 });
submissionSchema.index({ problemId: 1, verdict: 1 });
submissionSchema.index({ userId: 1, problemId: 1, submittedAt: -1 });
submissionSchema.index({ contestId: 1, userId: 1, verdict: 1 });

// Methods
submissionSchema.methods.updateVerdict = function(verdict, data = {}) {
    this.verdict = verdict;
    if (data.runtime !== undefined) this.runtime = data.runtime;
    if (data.memory !== undefined) this.memory = data.memory;
    if (data.errorMessage !== undefined) this.errorMessage = data.errorMessage;
    if (data.testResults !== undefined) this.testResults = data.testResults;
    if (data.passedTestCases !== undefined) this.passedTestCases = data.passedTestCases;
    if (data.totalTestCases !== undefined) this.totalTestCases = data.totalTestCases;
    if (data.compilationOutput !== undefined) this.compilationOutput = data.compilationOutput;
    this.judgeEndTime = new Date();
};

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
