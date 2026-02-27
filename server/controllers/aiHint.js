import { OpenRouter } from '@openrouter/sdk';
import Problem from '../models/problem.js';

// ── OpenRouter config ────────────────────────────────────────────────────────
const COOLDOWN_MS = 10 * 60 * 1000;

// Free model fallback chain — tried in order when a model returns 429
const MODEL_FALLBACKS = [
    process.env.OPENROUTER_MODEL,
].filter(Boolean);

// Per-model rate-limit cooldown tracker
const modelCooldowns = {};

function isModelCoolingDown(model) {
    const ts = modelCooldowns[model];
    if (!ts) return false;
    if (Date.now() - ts >= COOLDOWN_MS) { delete modelCooldowns[model]; return false; }
    return true;
}

function markModelExhausted(model) {
    modelCooldowns[model] = Date.now();
    console.warn(`[AI] Model "${model}" rate-limited — trying next fallback.`);
}

function buildKeyPool() {
    const raw = process.env.OPENROUTER_API_KEYS || process.env.OPENROUTER_API_KEY || '';
    const keys = raw.split(',').map(k => k.trim()).filter(Boolean);
    return keys.map(key => ({
        key,
        client: new OpenRouter({
            apiKey: key,
            defaultHeaders: {
                'HTTP-Referer': process.env.CLIENT_URL || 'https://codewizard.app',
                'X-OpenRouter-Title': 'CodeWizard',
            },
        }),
        exhaustedAt: null,
    }));
}

const keyPool = buildKeyPool();
let currentIndex = 0;

function getNextClient() {
    const now = Date.now();
    const total = keyPool.length;
    for (let i = 0; i < total; i++) {
        const idx = (currentIndex + i) % total;
        const entry = keyPool[idx];
        if (entry.exhaustedAt && now - entry.exhaustedAt < COOLDOWN_MS) continue;
        if (entry.exhaustedAt && now - entry.exhaustedAt >= COOLDOWN_MS) entry.exhaustedAt = null;
        currentIndex = (idx + 1) % total;
        return entry;
    }
    return null;
}

function markKeyExhausted(entry) {
    if (keyPool.length <= 1) return;
    entry.exhaustedAt = Date.now();
    console.warn(`[AI] Key ending ...${entry.key.slice(-6)} marked exhausted.`);
}

const HINT_LEVEL_PROMPTS = {
    1: `Give a very gentle nudge. Point toward the general algorithmic category or data structure needed (e.g. "think about sorting", "a hash map could help here"). Do NOT reveal any approach, algorithm name, or code. 1-2 sentences max.`,
    2: `Give a strategic hint. Name the algorithm or approach (e.g. "two-pointer", "dynamic programming on a 1D array") and briefly explain why it applies. Still no pseudocode or code. 2-3 sentences.`,
    3: `Give a structural hint. Outline the high-level approach: what state to track, how to iterate, what the key insight is. You may use informal pseudocode or a brief numbered list. No actual code.`,
    4: `Give a near-complete hint. Provide clear step-by-step pseudocode or a detailed numbered algorithm that the user can directly translate to code. Still no actual solution code.`,
};

export const getAiHint = async (req, res) => {
    try {
        const { problemId, code = '', language = 'cpp', hintLevel = 1 } = req.body;

        if (!problemId) return res.status(400).json({ success: false, message: 'problemId is required.' });

        const level = Math.min(Math.max(parseInt(hintLevel, 10) || 1, 1), 4);

        const problem = await Problem.findById(problemId)
            .select('title description difficulty tags constraints inputFormat outputFormat examples hints')
            .lean();

        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });
        if (keyPool.length === 0) return res.status(503).json({ success: false, message: 'AI service is not configured on this server.' });

        const examplesText = (problem.examples || []).slice(0, 2)
            .map((ex, i) => `Example ${i + 1}:\n  Input: ${ex.input}\n  Output: ${ex.output}${ex.explanation ? `\n  Explanation: ${ex.explanation}` : ''}`)
            .join('\n');
        const constraintsText = (problem.constraints || []).join('\n');
        const tagsText = (problem.tags || []).join(', ');
        const codeSection = code.trim()
            ? `\n\nThe user's current ${language} code:\n\`\`\`${language}\n${code.trim().slice(0, 2000)}\n\`\`\``
            : '';

        const systemPrompt = `You are an expert competitive programming mentor. Help a student solve a coding problem through progressive hints — NOT by solving it for them. NEVER give actual solution code. Be concise, clear, and encouraging. Use markdown formatting.`;

        const userPrompt = `## Problem: ${problem.title}
Difficulty: ${problem.difficulty} | Tags: ${tagsText || 'none'}

### Description
${problem.description}
${problem.inputFormat ? `\n### Input Format\n${problem.inputFormat}` : ''}
${problem.outputFormat ? `\n### Output Format\n${problem.outputFormat}` : ''}
${constraintsText ? `\n### Constraints\n${constraintsText}` : ''}
${examplesText ? `\n### Examples\n${examplesText}` : ''}
${codeSection}

---
The student is asking for **Hint Level ${level}/4**.
${HINT_LEVEL_PROMPTS[level]}`;

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const entry = getNextClient();
        if (!entry) {
            res.write(`data: ${JSON.stringify({ error: 'AI service unavailable — no API keys configured.' })}\n\n`);
            res.end();
            return;
        }

        // Try each model in the fallback chain until one succeeds
        for (const model of MODEL_FALLBACKS) {
            if (isModelCoolingDown(model)) continue;
            try {
                const result = await entry.client.chat.send({
                    chatGenerationParams: {
                        model,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: userPrompt },
                        ],
                        stream: true,
                    },
                });
                // result is either an EventStream (async iterable) or a plain ChatResponse
                if (result && typeof result[Symbol.asyncIterator] === 'function') {
                    for await (const chunk of result) {
                        if (chunk?.done) break;
                        const delta = chunk?.choices?.[0]?.delta?.content;
                        if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
                    }
                } else {
                    // Non-streaming fallback — whole response at once
                    const text = result?.choices?.[0]?.message?.content || '';
                    if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
                res.write('data: [DONE]\n\n');
                res.end();
                return;
            } catch (err) {
                console.error(`[AI] ${model} error — statusCode:${err?.statusCode} name:${err?.name} msg:${err?.message}`);
                const isRateLimit = err?.statusCode === 429 || err?.statusCode === 503;
                const isNotFound = err?.statusCode === 404 || (err?.message || '').includes('No endpoints found');
                if (isRateLimit || isNotFound) { markModelExhausted(model); continue; }
                throw err;
            }
        }

        res.write(`data: ${JSON.stringify({ error: 'All AI models are currently rate-limited. Please try again in a minute.' })}\n\n`);
        res.end();

    } catch (error) {
        console.error('AI hint error:', error);
        if (!res.headersSent) {
            if (error?.status === 401) return res.status(503).json({ success: false, message: 'AI service authentication failed.' });
            return res.status(500).json({ success: false, message: 'Failed to generate hint.' });
        }
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please try again.' })}\n\n`);
        res.end();
    }
};
