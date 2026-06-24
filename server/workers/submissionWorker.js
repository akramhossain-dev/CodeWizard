import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

import { Worker } from 'bullmq';
import Redis from 'ioredis';
import Submission from '../models/Submission.js';
import { executeCode } from '../services/codeExecutor.js';
import connectDB from '../libs/db.js';
import { getRatingDelta, scheduleRankRecompute } from '../libs/ranking.js';

// ── H-9 fix: connect with retry, never bare top-level await ───────────────
const MAX_DB_RETRIES = 5;
const DB_RETRY_DELAY_MS = 5000;

async function connectWithRetry() {
    for (let attempt = 1; attempt <= MAX_DB_RETRIES; attempt++) {
        try {
            await connectDB();
            return; // success
        } catch (err) {
            console.error(`[Worker] DB connect attempt ${attempt}/${MAX_DB_RETRIES} failed:`, err.message);
            if (attempt === MAX_DB_RETRIES) {
                console.error('[Worker] Could not connect to MongoDB. Exiting.');
                process.exit(1);
            }
            await new Promise(r => setTimeout(r, DB_RETRY_DELAY_MS));
        }
    }
}


// ── Bootstrap the worker inside an async IIFE ─────────────────────────────
(async () => {
    // Establish DB connection with retry before anything else
    await connectWithRetry();

    // Redis connection
    const connection = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
        password: process.env.REDIS_PASSWORD || undefined
    });

    // Create worker
    const submissionWorker = new Worker('code-submissions', async (job) => {
        const { submissionId, code, language, testCases, timeLimit, memoryLimit } = job.data;
        
        console.log(`🔄 Processing submission: ${submissionId}`);


    try {
        // Update submission status to Running
        if (submissionId) {
            await Submission.findByIdAndUpdate(submissionId, {
                verdict: 'Running',
                judgeStartTime: new Date()
            });
        }

        // Execute code with all test cases
        const result = await executeCode({
            code,
            language,
            testCases,
            timeLimit,
            memoryLimit
        });

        // Update submission with results
        if (submissionId) {
            const submission = await Submission.findById(submissionId);
            
            if (submission) {
                submission.updateVerdict(result.verdict, {
                    runtime: result.runtime,
                    memory: result.memory,
                    testResults: result.testResults,
                    passedTestCases: result.passedTestCases,
                    totalTestCases: result.totalTestCases,
                    errorMessage: result.errorMessage,
                    compilationOutput: result.compilationOutput
                });

                await submission.save();

                // Load models
                const Problem = (await import('../models/problem.js')).default;
                const Auth    = (await import('../models/auth.js')).default;

                const problem = await Problem.findById(submission.problemId);

                // Check if this user has previously accepted this problem
                const previousAccepted = await Submission.findOne({
                    _id:       { $ne: submission._id },
                    userId:    submission.userId,
                    problemId: submission.problemId,
                    verdict:   'Accepted'
                }).lean();

                // Check if this user has previously attempted this problem
                const previousAttempt = await Submission.findOne({
                    _id:       { $ne: submission._id },
                    userId:    submission.userId,
                    problemId: submission.problemId
                }).lean();

                // ── Update problem statistics ──────────────────────────────
                const problemInc = { totalSubmissions: 1 };
                if (result.verdict === 'Accepted') problemInc.totalAccepted = 1;
                // Count unique attemptors (only first-ever submission for this user on this problem)
                if (!previousAttempt) problemInc.totalAttempted = 1;
                await Problem.findByIdAndUpdate(submission.problemId, { $inc: problemInc });

                // ── Update problem acceptance rate ─────────────────────────
                if (problem) {
                    const updatedProblem = await Problem.findById(submission.problemId).lean();
                    if (updatedProblem.totalSubmissions > 0) {
                        await Problem.findByIdAndUpdate(submission.problemId, {
                            $set: {
                                acceptanceRate: (updatedProblem.totalAccepted / updatedProblem.totalSubmissions) * 100
                            }
                        });
                    }
                }

                // ── Update user stats ──────────────────────────────────────
                const userInc = {
                    // Count every judged submission as an attempt
                    'stats.attempted': 1
                };

                // solved / difficulty counts: only increment if NOT previously accepted
                if (result.verdict === 'Accepted' && !previousAccepted) {
                    userInc['stats.solved'] = 1;
                    if (problem) {
                        const diffField = `stats.${problem.difficulty.toLowerCase()}Solved`;
                        userInc[diffField] = 1;
                    }
                }

                if (Object.keys(userInc).length > 0) {
                    await Auth.findByIdAndUpdate(submission.userId, { $inc: userInc });
                }

                // ── Update user rating (simple ELO-style delta) ────────────
                if (result.verdict === 'Accepted' && !previousAccepted && problem) {
                    const ratingDelta = getRatingDelta(problem.difficulty);
                    await Auth.findByIdAndUpdate(submission.userId, {
                        $inc: { rating: ratingDelta }
                    });
                    // Non-blocking: coalesces all accepted submissions into one
                    // DB recompute per 2-minute window (avoids O(n) storm per submission)
                    scheduleRankRecompute();
                }

                console.log(`✅ Submission ${submissionId} judged: ${result.verdict}`);
            }
        }

        return result;

    } catch (error) {
        console.error(`❌ Error processing submission ${submissionId}:`, error);

        // Update submission with error
        if (submissionId) {
            await Submission.findByIdAndUpdate(submissionId, {
                verdict: 'Internal Error',
                errorMessage: error.message,
                judgeEndTime: new Date()
            });
        }

        throw error;
    }
}, {
    connection,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
    limiter: {
        max: 10, // Max 10 jobs
        duration: 1000 // per second
    }
});

// Event handlers
    submissionWorker.on('completed', (job) => {
        console.log(`✅ Job ${job.id} completed`);
    });

    submissionWorker.on('failed', (job, err) => {
        console.error(`❌ Job ${job?.id} failed:`, err.message);
    });

    submissionWorker.on('error', (err) => {
        console.error('Worker error:', err);
    });

    console.log('✅ Submission worker started and listening for jobs');
})().catch(err => {
    console.error('[Worker] Fatal startup error:', err);
    process.exit(1);
});

