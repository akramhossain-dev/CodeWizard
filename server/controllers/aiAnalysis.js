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

// ── Shared SSE stream helper ──────────────────────────────────────────────────
async function streamAiResponse(res, systemPrompt, userPrompt) {
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
}

// ── AI Code Review ────────────────────────────────────────────────────────────
export const getAiCodeReview = async (req, res) => {
    try {
        const { problemId, code = '', language = 'cpp' } = req.body;

        if (!problemId) return res.status(400).json({ success: false, message: 'problemId is required.' });
        if (!code.trim()) return res.status(400).json({ success: false, message: 'No code provided for review.' });
        if (keyPool.length === 0) return res.status(503).json({ success: false, message: 'AI service is not configured on this server.' });

        const problem = await Problem.findById(problemId)
            .select('title description difficulty tags constraints')
            .lean();

        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const constraintsText = (problem.constraints || []).join('\n');
        const tagsText = (problem.tags || []).join(', ');

        const systemPrompt = `You are an expert competitive programming code reviewer. Analyze the given ${language} solution and produce a structured review with exactly these 4 sections in order. Use markdown formatting. Be precise, constructive, and beginner-friendly.`;

        const userPrompt = `## Problem: ${problem.title}
Difficulty: ${problem.difficulty} | Tags: ${tagsText || 'none'}
${constraintsText ? `Constraints:\n${constraintsText}` : ''}

## User's ${language} Solution
\`\`\`${language}
${code.trim().slice(0, 3000)}
\`\`\`

---
Please analyze this code and provide a review with EXACTLY these 4 sections:

## ⏱️ Time Complexity
State the Big-O time complexity of this solution (e.g. O(n), O(n log n), O(n²)).
Explain WHY — what loops, recursion, or operations cause this complexity.
Is this optimal for the given constraints? Why or why not?

## 💾 Space Complexity
State the Big-O space complexity.
Explain what data structures or recursion stack contribute to it.

## 🚀 Better Approach
Is there a more efficient algorithm or approach possible?
If yes, describe it clearly (name + brief explanation).
If the current solution is already optimal, say so and briefly explain why.
Do NOT write actual code.

## ✨ Clean Code Suggestions
List 3-5 specific, actionable improvements for code style, readability, naming, or structure.
Use bullet points. Point to specific parts of their code if possible.`;

        await streamAiResponse(res, systemPrompt, userPrompt);

    } catch (error) {
        console.error('AI code review error:', error);
        if (!res.headersSent) {
            if (error?.status === 401) return res.status(503).json({ success: false, message: 'AI service authentication failed.' });
            return res.status(500).json({ success: false, message: 'Failed to generate code review.' });
        }
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please try again.' })}\n\n`);
        res.end();
    }
};

// ── AI Solution Explanation ───────────────────────────────────────────────────
export const getAiExplanation = async (req, res) => {
    try {
        const { problemId, code = '', language = 'cpp' } = req.body;

        if (!problemId) return res.status(400).json({ success: false, message: 'problemId is required.' });
        if (!code.trim()) return res.status(400).json({ success: false, message: 'No code provided for explanation.' });
        if (keyPool.length === 0) return res.status(503).json({ success: false, message: 'AI service is not configured on this server.' });

        const problem = await Problem.findById(problemId)
            .select('title description difficulty tags constraints inputFormat outputFormat examples')
            .lean();

        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const tagsText = (problem.tags || []).join(', ');
        const examplesText = (problem.examples || []).slice(0, 2)
            .map((ex, i) => `Example ${i + 1}:\n  Input: ${ex.input}\n  Output: ${ex.output}`)
            .join('\n');

        const systemPrompt = `You are a friendly computer science teacher explaining code to a complete beginner. Use simple everyday language, relatable analogies, and avoid jargon. When you must use a technical term, immediately explain it in plain English. Always explain the "why" behind each step. Use markdown formatting with clear sections.`;

        const userPrompt = `## Problem: ${problem.title}
Difficulty: ${problem.difficulty} | Topics: ${tagsText || 'none'}

### Problem Summary
${problem.description}
${examplesText ? `\n### Examples\n${examplesText}` : ''}

## Accepted Solution (${language})
\`\`\`${language}
${code.trim().slice(0, 3000)}
\`\`\`

---
The user just got "Accepted" on this problem. Explain their solution in a beginner-friendly way.

Structure your explanation like this:

## 🧠 The Core Idea
In 2-3 simple sentences, what is the fundamental insight or trick that makes this solution work?
Use an analogy or real-world comparison if possible.

## 📋 Step-by-Step Walkthrough
Walk through the algorithm step by step. For each step:
- Say WHAT the code is doing in plain English
- Explain WHY this step is needed
- If helpful, trace through Example 1 to make it concrete

Number each step clearly (1, 2, 3...).

## 🔑 Key Concepts Used
List the programming/algorithmic concepts this solution uses (e.g. "Two Pointers", "Hash Map", "Sorting").
For each concept, write 1-2 sentences explaining what it is in simple terms.

## 💡 Why This Works
In plain language, explain why this approach correctly solves the problem.
Connect the algorithm back to the problem's requirements.`;

        await streamAiResponse(res, systemPrompt, userPrompt);

    } catch (error) {
        console.error('AI explanation error:', error);
        if (!res.headersSent) {
            if (error?.status === 401) return res.status(503).json({ success: false, message: 'AI service authentication failed.' });
            return res.status(500).json({ success: false, message: 'Failed to generate explanation.' });
        }
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please try again.' })}\n\n`);
        res.end();
    }
};
