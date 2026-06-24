/**
 * Centralized 500-error responder.
 * - In production: sends only the user-facing message (no internals leaked)
 * - In development: also includes error.message for faster debugging
 *
 * @param {import('express').Response} res
 * @param {Error} error
 * @param {string} message  User-facing error description
 * @param {number} [status=500]
 */
export const serverError = (res, error, message = 'Internal server error', status = 500) => {
    console.error(`[${new Date().toISOString()}] ${message}:`, error);
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(status).json({
        success: false,
        message,
        ...(isDev && { error: error?.message }),
    });
};
