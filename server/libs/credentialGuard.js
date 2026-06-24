/**
 * Credential security guard — L-3
 *
 * Blocks server startup if:
 *   1. Any required environment variable is missing
 *   2. Any cryptographic secret is still a placeholder value
 *   3. CLIENT_URL is localhost in production (L-6)
 *
 * Run automatically on startup via import in server.js / submissionWorker.js
 */

const REQUIRED_VARS = [
    'MONGODB_URI',
    'JWT_SECRET',
    'ENCRYPTION_SECRET',
    'ADMIN_SECRET_KEY',
    'CRYPTO_PEPPER',
    'SECRET_KEY',
    'CLIENT_URL',
    'REDIS_HOST',
];

// Known-weak placeholder patterns — block startup if any secret contains these
const WEAK_PATTERNS = [
    'your_',
    'change_this',
    'placeholder',
    'secret_here',
    'strong_random',
];

// Known-leaked credential fragments — warn if still using original leaked values
const KNOWN_LEAKED_FRAGMENTS = {
    MONGODB_URI:    'juMJIrxZn2Zmvhg7',       // original Atlas password
    GITHUB_CLIENT_SECRET: '2af716b3c495f4',   // original GitHub secret
    CLOUDINARY_API_SECRET: 'eGQTnCDDKJFz',    // original Cloudinary secret
    OPENROUTER_API_KEYS: 'sk-or-v1-a6a4b5',  // original OpenRouter key
    EMAIL_PASSWORD: 'fzxv wwsh jnjk gpqm',    // original Gmail app password
};

export const guardCredentials = () => {
    const errors = [];
    const warnings = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. Check required vars are present
    for (const key of REQUIRED_VARS) {
        if (!process.env[key]) {
            errors.push(`Missing required env var: ${key}`);
        }
    }

    // 2. Check for placeholder secrets
    const secretKeys = ['JWT_SECRET', 'ENCRYPTION_SECRET', 'ADMIN_SECRET_KEY', 'CRYPTO_PEPPER', 'SECRET_KEY'];
    for (const key of secretKeys) {
        const val = process.env[key] || '';
        if (WEAK_PATTERNS.some(p => val.toLowerCase().includes(p))) {
            errors.push(`${key} still contains placeholder value — generate a real secret before deploying`);
        }
    }

    // 3. Check secret entropy (cryptographic secrets should be >= 64 chars)
    const minLength = { JWT_SECRET: 64, ENCRYPTION_SECRET: 64, CRYPTO_PEPPER: 64, SECRET_KEY: 64, ADMIN_SECRET_KEY: 32 };
    for (const [key, minLen] of Object.entries(minLength)) {
        const val = process.env[key] || '';
        if (val && val.length < minLen) {
            errors.push(`${key} is too short (${val.length} chars, minimum ${minLen}). Use crypto.randomBytes(${Math.ceil(minLen / 2)}).toString('hex')`);
        }
    }

    // 4. Warn about known-leaked credentials (these were exposed in plain text)
    for (const [key, fragment] of Object.entries(KNOWN_LEAKED_FRAGMENTS)) {
        const val = process.env[key] || '';
        if (val.includes(fragment)) {
            warnings.push(`⚠️  ${key} still contains the ORIGINAL LEAKED VALUE — rotate this credential immediately`);
        }
    }

    // 5. Block localhost CLIENT_URL in production (L-6)
    const clientUrl = process.env.CLIENT_URL || '';
    if (isProduction && (clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1') || !clientUrl.startsWith('https://'))) {
        errors.push(`CLIENT_URL must be an HTTPS production URL in production mode (current: "${clientUrl}")`);
    }

    // 6. Block unsafe local execution in production
    if (isProduction && process.env.ALLOW_UNSAFE_LOCAL_EXECUTION === 'true') {
        errors.push('ALLOW_UNSAFE_LOCAL_EXECUTION must be "false" in production — this enables remote code execution!');
    }

    // Output results
    if (warnings.length > 0) {
        for (const w of warnings) console.warn('[security-guard]', w);
    }

    if (errors.length > 0) {
        console.error('\n🚨 STARTUP BLOCKED — Security guard found critical issues:\n');
        for (const e of errors) console.error('  ❌', e);
        console.error('\nFix the above issues before starting the server in production.\n');
        if (isProduction) {
            process.exit(1); // Hard block in production
        } else {
            console.warn('[security-guard] Running in development — startup allowed despite issues above.\n');
        }
    } else {
        console.log('✅ [security-guard] All credential checks passed');
    }
};

export default guardCredentials;
