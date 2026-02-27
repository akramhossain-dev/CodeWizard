import { OpenRouter } from '@openrouter/sdk';

// ── OpenRouter config ────────────────────────────────────────────────────────
const COOLDOWN_MS = 10 * 60 * 1000;

const MODEL_FALLBACKS = [
    process.env.OPENROUTER_MODEL,
].filter(Boolean);

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

// ── AI Chat ───────────────────────────────────────────────────────────────────
export const getAiChat = async (req, res) => {
    try {
        const { messages = [], context = {} } = req.body;

        if (!messages.length) return res.status(400).json({ success: false, message: 'No messages provided.' });
        if (keyPool.length === 0) return res.status(503).json({ success: false, message: 'AI service is not configured on this server.' });

        // Build rich context from the problem page
        const {
            problemTitle = '',
            problemDescription = '',
            difficulty = '',
            tags = [],
            constraints = [],
            inputFormat = '',
            outputFormat = '',
            examples = [],
            language = '',
            verdict = '',
            errorMessage = '',
            passedTestCases,
            totalTestCases,
        } = context;

        // Build context block (no raw code — AI is a teacher, not a coder)
        let contextBlock = '';
        if (problemTitle) {
            contextBlock += `\n## Current Problem Context\n`;
            contextBlock += `**Problem:** ${problemTitle}\n`;
            if (difficulty) contextBlock += `**Difficulty:** ${difficulty}\n`;
            if (tags.length) contextBlock += `**Topics:** ${tags.join(', ')}\n`;
            if (problemDescription) contextBlock += `**Description:** ${problemDescription.slice(0, 1500)}\n`;
            if (inputFormat) contextBlock += `**Input Format:** ${inputFormat}\n`;
            if (outputFormat) contextBlock += `**Output Format:** ${outputFormat}\n`;
            if (constraints.length) contextBlock += `**Constraints:** ${constraints.join(', ')}\n`;
            if (examples.length > 0) {
                contextBlock += `**Examples:**\n`;
                examples.slice(0, 2).forEach((ex, i) => {
                    contextBlock += `  Example ${i + 1}: Input: ${ex.input} → Output: ${ex.output}\n`;
                });
            }
            if (language) contextBlock += `**User's Language:** ${language}\n`;
            if (verdict) {
                contextBlock += `**Last Verdict:** ${verdict}`;
                if (passedTestCases !== undefined && totalTestCases !== undefined) {
                    contextBlock += ` (${passedTestCases}/${totalTestCases} test cases passed)`;
                }
                contextBlock += `\n`;
            }
            if (errorMessage) contextBlock += `**Error Message:** ${errorMessage.slice(0, 500)}\n`;
        }

        const systemPrompt = `You are CodeWizard AI — a friendly, expert competitive programming tutor. You help students learn algorithms, data structures, and problem-solving through conversation.

RULES:
1. NEVER write complete solution code. You are a TEACHER, not a code generator.
2. If asked about code, explain concepts, patterns, and approaches — NOT raw code.
3. You may show tiny pseudocode snippets (2-3 lines max) or small syntax examples when explaining a concept.
4. Be concise, clear, and encouraging. Use markdown formatting.
5. If the user asks "why my solution is wrong", analyze based on the verdict and problem context — point out likely logical errors, edge cases, or complexity issues WITHOUT writing the fix.
6. Relate your answers to the current problem context when relevant.
7. Use analogies and real-world examples to explain complex concepts.
8. When explaining algorithms, focus on the INTUITION and WHY it works, not just the steps.
${contextBlock}`;

        // Build messages array — keep last 20 messages for context window
        const trimmedMessages = messages.slice(-20).map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content,
        }));

        // SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Send token balance at stream start
        if (req.tokenBalance !== undefined) {
            res.write(`data: ${JSON.stringify({ tokenBalance: req.tokenBalance, tokenCost: req.tokenCost })}

`);
        }

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
                            ...trimmedMessages,
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

    } catch (error) {
        console.error('AI chat error:', error);
        if (!res.headersSent) {
            if (error?.status === 401) return res.status(503).json({ success: false, message: 'AI service authentication failed.' });
            return res.status(500).json({ success: false, message: 'Failed to generate response.' });
        }
        res.write(`data: ${JSON.stringify({ error: 'Stream interrupted. Please try again.' })}\n\n`);
        res.end();
    }
};
