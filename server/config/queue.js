import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null,
    password: process.env.REDIS_PASSWORD || undefined
});

// Create submission queue
export const submissionQueue = new Queue('code-submissions', {
    connection,
    defaultJobOptions: {
        attempts: 3, // Retry up to 3 times
        backoff: {
            type: 'exponential',
            delay: 2000
        },
        removeOnComplete: {
            age: 3600, // Keep completed jobs for 1 hour
            count: 1000 // Keep last 1000 completed jobs
        },
        removeOnFail: {
            age: 24 * 3600 // Keep failed jobs for 24 hours
        }
    }
});

// QueueEvents for waitUntilFinished support
export const queueEvents = new QueueEvents('code-submissions', {
    connection: new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        maxRetriesPerRequest: null,
        password: process.env.REDIS_PASSWORD || undefined
    })
});

// Health check
export const checkRedisConnection = async () => {
    try {
        await connection.ping();
        console.log('✅ Redis connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Redis connection failed:', error.message);
        return false;
    }
};

export default submissionQueue;
