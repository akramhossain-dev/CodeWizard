import pino from 'pino';

// ── Structured logger (L-2) ────────────────────────────────────────────────
// - Production: outputs JSON (machine-readable for CloudWatch / Loki / Datadog)
// - Development: outputs pretty-printed coloured text via pino-pretty
const isProduction = process.env.NODE_ENV === 'production';

const logger = pino(
    {
        level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
        // Redact sensitive fields from logs automatically
        redact: {
            paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'body.password',
                'body.token',
                'body.newPassword',
                'body.currentPassword',
            ],
            censor: '[REDACTED]',
        },
        // Add base metadata to every log line
        base: {
            pid: process.pid,
            service: 'codewizard-api',
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    },
    isProduction
        ? undefined // stdout JSON in production
        : pino.transport({
              target: 'pino-pretty',
              options: {
                  colorize: true,
                  translateTime: 'SYS:HH:MM:ss',
                  ignore: 'pid,hostname',
              },
          })
);

export default logger;
