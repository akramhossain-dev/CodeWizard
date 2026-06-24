import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            // Disable auto-indexing in production — it blocks the event loop on startup
            autoIndex: process.env.NODE_ENV !== 'production',

            // How long to wait for a server to be found before throwing
            serverSelectionTimeoutMS: 5000,

            // How long the driver waits to establish a socket connection
            connectTimeoutMS: 10000,

            // Connection pool: max concurrent DB operations
            maxPoolSize: 10,
            minPoolSize: 2,

            // Drop idle connections after 30 seconds
            socketTimeoutMS: 30000,
        });

        console.log('✅ MongoDB connected');

        // Handle connection events so we can log and react without crashing
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected — attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err.message);
        });

    } catch (error) {
        console.error('❌ MongoDB initial connection failed:', error.message);
        // Exit so the process manager (PM2 / Docker restart policy) can restart us
        process.exit(1);
    }
};

export default connectDB;