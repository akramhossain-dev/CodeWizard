import { OpenRouter } from '@openrouter/sdk';
import Problem from '../models/problem.js';

// ── OpenRouter config ────────────────────────────────────────────────────────
const COOLDOWN_MS = 10 * 60 * 1000;

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
            if (result && typeof result[Symbol.asyncIterator] === 'function') {
                for await (const chunk of result) {
                    if (chunk?.done) break;
                    const delta = chunk?.choices?.[0]?.delta?.content;
                    if (delta) res.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
                }
            } else {
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

// ── AI Debug Assistant ────────────────────────────────────────────────────────
export const getAiDebug = async (req, res) => {
    try {
        const { problemId, code = '', language = 'cpp', verdict = '', errorMessage = '', failedTestCase = null } = req.body;

        if (!problemId) return res.status(400).json({ success: false, message: 'problemId is required.' });
        if (!code.trim()) return res.status(400).json({ success: false, message: 'No code provided for debugging.' });
        if (!verdict) return res.status(400).json({ success: false, message: 'Submission verdict is required.' });
        if (keyPool.length === 0) return res.status(503).json({ success: false, message: 'AI service is not configured on this server.' });

        const problem = await Problem.findById(problemId)
            .select('title description difficulty tags constraints inputFormat outputFormat examples')
            .lean();

        if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const constraintsText = (problem.constraints || []).join('\n');
        const tagsText = (problem.tags || []).join(', ');
        const examplesText = (problem.examples || []).slice(0, 3)
            .map((ex, i) => `Example ${i + 1}:\n  Input: ${ex.input}\n  Output: ${ex.output}${ex.explanation ? `\n  Explanation: ${ex.explanation}` : ''}`)
            .join('\n');

        // Build failed test case context if available
        let failedTestSection = '';
        if (failedTestCase) {
            failedTestSection = `\n### Failed Test Case`;
            if (failedTestCase.input) failedTestSection += `\nInput:\n${failedTestCase.input}`;
            if (failedTestCase.expectedOutput) failedTestSection += `\nExpected Output:\n${failedTestCase.expectedOutput}`;
            if (failedTestCase.actualOutput) failedTestSection += `\nActual Output:\n${failedTestCase.actualOutput}`;
        }

        // Build error message context
        let errorSection = '';
        if (errorMessage) {
            errorSection = `\n### Error/Output Message\n\`\`\`\n${errorMessage.slice(0, 1500)}\n\`\`\``;
        }

        const systemPrompt = `You are an expert competitive programming debugger. The user submitted code that got "${verdict}". Your job is to find exactly what's wrong and help them fix it — WITHOUT writing the full solution for them.

Be precise, surgical, and beginner-friendly. Use markdown formatting with clear sections. Point to SPECIFIC lines or blocks in their code. Always explain the "why" behind each bug.

IMPORTANT: Do NOT give them the complete corrected code. Instead, show them WHERE the bug is, WHY it happens, and give them a clear direction to fix it.`;

        const userPrompt = `## Problem: ${problem.title}
Difficulty: ${problem.difficulty} | Tags: ${tagsText || 'none'}

### Description
${problem.description}
${problem.inputFormat ? `\n### Input Format\n${problem.inputFormat}` : ''}
${problem.outputFormat ? `\n### Output Format\n${problem.outputFormat}` : ''}
${constraintsText ? `\n### Constraints\n${constraintsText}` : ''}
${examplesText ? `\n### Examples\n${examplesText}` : ''}

## Verdict: ${verdict}
${errorSection}
${failedTestSection}

## User's ${language} Code
\`\`\`${language}
${code.trim().slice(0, 3000)}
\`\`\`

---
The code got **${verdict}**. Please analyze and respond with EXACTLY these 4 sections:

## 🔍 Bug Identified
Pinpoint exactly what is wrong. Identify the specific line(s) or logic block causing the issue.
Quote the problematic code snippet. Be precise — "on line X, the condition \`...\` is wrong because..."

## 🧠 Why It Fails
Explain in plain language WHY this causes ${verdict}.
${verdict === 'Wrong Answer' ? 'Which inputs/edge cases does this logic handle incorrectly? Give a specific example that would fail.' : ''}
${verdict === 'Runtime Error' ? 'What causes the crash? (array out of bounds, null/undefined access, division by zero, infinite recursion, integer overflow, etc.)' : ''}
${verdict === 'Time Limit Exceeded' ? 'What makes this too slow? What is the actual time complexity vs what is needed?' : ''}
${verdict === 'Compilation Error' ? 'What is the syntax error? Is there a missing semicolon, wrong type, undeclared variable, etc.?' : ''}

## 🛠️ How to Fix
Give clear, specific directions on how to fix the bug. Describe the fix step by step.
You can show small pseudocode snippets or partial code fixes, but do NOT rewrite the entire solution.
Mention specific changes: "change the loop condition from X to Y", "add a check for Z before line N", etc.

## ⚠️ Edge Cases to Watch
List 2-4 specific edge cases that this type of problem commonly has.
For each, explain WHY it's tricky and what the code should handle.
Highlight any that the current code misses.`;

        await streamAiResponse(res, systemPrompt, userPrompt);

    } catch (error) {
        console.error('AI debug error:', error);
        if (!res.headersSent) {
            if (error?.status === 401) return res.status(503).json({ success: false, message: 'AI service authentication failed.' });
            return res.status(500).json({ success: false, message: 'Failed to generate debug analysis.' });
        }
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please try again.' })}\n\n`);
        res.end();
    }
};
