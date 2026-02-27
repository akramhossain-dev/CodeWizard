"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle, X, Send, Loader, Bot, User,
  Sparkles, RotateCcw, Minimize2, ChevronDown, Coins, Gift, AlertTriangle
} from "lucide-react";

// ── Minimal markdown renderer ─────────────────────────────────────────────────
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("### "))
          return <p key={i} className="font-bold text-gray-900 dark:text-white text-sm mt-2">{renderInline(line.slice(4))}</p>;
        if (line.startsWith("## "))
          return <p key={i} className="font-black text-gray-900 dark:text-white mt-2">{renderInline(line.slice(3))}</p>;
        if (line.startsWith("```")) return null;
        if (/^\d+\.\s/.test(line))
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-bold text-gray-500 dark:text-gray-400">{line.match(/^\d+/)[0]}.</span>
              <span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        if (/^[-*]\s/.test(line))
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 text-gray-400 mt-0.5">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="px-1 py-0.5 bg-gray-200 dark:bg-[#333] text-violet-600 dark:text-violet-400 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

// ── Quick suggestion chips ────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  "Explain this concept simply",
  "How can I optimize my approach?",
  "What common mistakes should I avoid?"
];

export default function AiChatBot({ problem, code, language, submitResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [tokenCost, setTokenCost] = useState(2);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [nextClaimIn, setNextClaimIn] = useState(0);
  const abortRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const getAuthHeaders = (json = false) => {
    const h = {};
    if (json) h["Content-Type"] = "application/json";
    const t = localStorage.getItem("token");
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  };

  // Format remaining time
  const formatTimeLeft = (ms) => {
    if (ms <= 0) return "";
    const h = Math.floor(ms / 3600000);
    const m = Math.ceil((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Countdown timer for next daily claim
  useEffect(() => {
    if (nextClaimIn <= 0 || canClaimDaily) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setNextClaimIn(prev => {
        const next = prev - 60000;
        if (next <= 0) {
          clearInterval(timerRef.current);
          setCanClaimDaily(true);
          return 0;
        }
        return next;
      });
    }, 60000);
    return () => clearInterval(timerRef.current);
  }, [nextClaimIn, canClaimDaily]);

  // Fetch token balance when chat opens
  const fetchTokens = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai/tokens`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setTokenBalance(data.tokens.balance);
        setTokenCost(data.tokens.cost || 2);
        setCanClaimDaily(data.tokens.canClaimDaily);
        setNextClaimIn(data.tokens.nextClaimIn || 0);
        setTokenError("");
      }
    } catch { /* ignore */ }
  }, [API_URL]);

  useEffect(() => {
    if (isOpen && tokenBalance === null) fetchTokens();
  }, [isOpen, tokenBalance, fetchTokens]);

  // Claim daily tokens
  const handleClaimDaily = async () => {
    setClaimingDaily(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/tokens/claim-daily`, {
        method: "POST",
        headers: getAuthHeaders(true),
      });
      const data = await res.json();
      if (data.success) {
        setTokenBalance(data.tokens.balance);
        setCanClaimDaily(false);
        setNextClaimIn(24 * 60 * 60 * 1000);
        setTokenError("");
      } else if (data.tokens?.nextClaimIn) {
        setNextClaimIn(data.tokens.nextClaimIn);
        setCanClaimDaily(false);
      }
    } catch { /* ignore */ }
    setClaimingDaily(false);
  };

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  // Detect if scrolled up
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setShowScrollBtn(!isNearBottom);
  };

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Build context from current problem page state
  const buildContext = () => {
    const ctx = {};
    if (problem) {
      ctx.problemTitle = problem.title || '';
      ctx.problemDescription = problem.description || '';
      ctx.difficulty = problem.difficulty || '';
      ctx.tags = problem.tags || [];
      ctx.constraints = problem.constraints || [];
      ctx.inputFormat = problem.inputFormat || '';
      ctx.outputFormat = problem.outputFormat || '';
      ctx.examples = (problem.examples || []).slice(0, 2).map(ex => ({
        input: ex.input,
        output: ex.output,
      }));
    }
    if (language) ctx.language = language;
    if (submitResult) {
      ctx.verdict = submitResult.verdict || '';
      ctx.errorMessage = submitResult.errorMessage || '';
      ctx.passedTestCases = submitResult.passedTestCases;
      ctx.totalTestCases = submitResult.totalTestCases;
    }
    // NOTE: We intentionally do NOT send raw code — the AI is a teacher
    return ctx;
  };

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    // Check token balance locally first
    if (tokenBalance !== null && tokenBalance < tokenCost) {
      setTokenError(`Not enough tokens! You need ${tokenCost} but have ${tokenBalance}.`);
      return;
    }

    setInput("");
    setTokenError("");
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    // Add placeholder for assistant response
    const assistantIdx = newMessages.length;
    setMessages([...newMessages, { role: "assistant", content: "", streaming: true }]);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: buildContext(),
        }),
        signal: abortRef.current.signal,
      });

      // Non-streaming error (includes token errors)
      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        if (data.tokenError) {
          // Token error — remove the placeholder messages, show token error
          setMessages(prev => prev.slice(0, -2));
          setTokenBalance(data.tokens?.balance ?? 0);
          setCanClaimDaily(data.tokens?.canClaimDaily ?? false);
          setNextClaimIn(data.tokens?.nextClaimIn ?? 0);
          setTokenError(data.message || "Not enough tokens!");
          setLoading(false);
          return;
        }
        setMessages(prev => {
          const copy = [...prev];
          copy[assistantIdx] = { role: "assistant", content: data.message || "Sorry, something went wrong.", error: true };
          return copy;
        });
        setLoading(false);
        return;
      }

      // SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setMessages(prev => {
              const copy = [...prev];
              copy[assistantIdx] = { role: "assistant", content: fullText, streaming: false };
              return copy;
            });
            setLoading(false);
            return;
          }
          try {
            const parsed = JSON.parse(payload);
            // Token balance update from stream start
            if (parsed.tokenBalance !== undefined) {
              setTokenBalance(parsed.tokenBalance);
              continue;
            }
            const { text: chunk, error: streamErr } = parsed;
            if (streamErr) {
              setMessages(prev => {
                const copy = [...prev];
                copy[assistantIdx] = { role: "assistant", content: streamErr, error: true };
                return copy;
              });
              setLoading(false);
              return;
            }
            if (chunk) {
              fullText += chunk;
              setMessages(prev => {
                const copy = [...prev];
                copy[assistantIdx] = { role: "assistant", content: fullText, streaming: true };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const copy = [...prev];
          copy[assistantIdx] = { role: "assistant", content: "Connection error. Please try again.", error: true };
          return copy;
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setLoading(false);
  };

  return (
    <>
      {/* ── FAB Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-gradient-to-br from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
          title="Ask AI"
        >
          <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-blue-500/30 animate-ping opacity-75 pointer-events-none" />
        </button>
      )}

      {/* ── Chat Window ── */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-6rem)] bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

          {/* Header */}
          <div className="shrink-0 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-none">CodeWizard AI</h3>
                <p className="text-[10px] text-white/70 mt-0.5">
                  {problem ? `Helping with: ${problem.title?.slice(0, 25)}${problem.title?.length > 25 ? '...' : ''}` : 'Your coding tutor'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Token balance badge */}
              {tokenBalance !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
                  tokenBalance <= 5
                    ? 'bg-red-500/30 text-red-100'
                    : tokenBalance <= 15
                      ? 'bg-amber-500/30 text-amber-100'
                      : 'bg-white/15 text-white/90'
                }`}>
                  <Coins className="w-3 h-3" />
                  {tokenBalance}
                </div>
              )}
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                  title="Clear chat"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth"
          >
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                  <Sparkles className="w-7 h-7 text-blue-500" />
                </div>
                <h4 className="font-black text-gray-900 dark:text-white text-sm mb-1">
                  Hi! I&apos;m your AI tutor 👋
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px] mb-5">
                  Ask me anything about algorithms, data structures, or this problem.
                  I&apos;ll guide you without giving away the answer!
                </p>

                {/* Quick prompts */}
                <div className="w-full space-y-1.5">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Try asking:</p>
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#1a1a1a] hover:bg-blue-50 dark:hover:bg-blue-500/10 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-500/30 rounded-xl transition-all"
                    >
                      💬 {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                  msg.role === "user"
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "bg-violet-500/10 border border-violet-500/20"
                }`}>
                  {msg.role === "user"
                    ? <User className="w-3.5 h-3.5 text-blue-500" />
                    : <Bot className="w-3.5 h-3.5 text-violet-500" />
                  }
                </div>

                {/* Message bubble */}
                <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : msg.error
                      ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-bl-md"
                      : "bg-gray-100 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-bl-md"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <>
                      <SimpleMarkdown text={msg.content} />
                      {msg.streaming && (
                        <span className="inline-block w-1.5 h-4 bg-violet-500 rounded-sm ml-0.5 animate-pulse" />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-2.5">
                <div className="shrink-0 w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-violet-500" />
                </div>
                <div className="px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {showScrollBtn && (
            <div className="absolute bottom-[72px] left-1/2 -translate-x-1/2">
              <button
                onClick={scrollToBottom}
                className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold rounded-full shadow-lg flex items-center gap-1 hover:scale-105 transition-transform"
              >
                <ChevronDown className="w-3 h-3" />
                New messages
              </button>
            </div>
          )}

          {/* Token error / claim banner */}
          {tokenError && (
            <div className="shrink-0 mx-3 mt-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{tokenError}</p>
                  {!canClaimDaily && nextClaimIn > 0 && (
                    <p className="text-[10px] text-red-400 dark:text-red-500 mt-0.5">Renews in {formatTimeLeft(nextClaimIn)}</p>
                  )}
                </div>
                {canClaimDaily && (
                  <button
                    onClick={handleClaimDaily}
                    disabled={claimingDaily}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {claimingDaily ? <Loader className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                    Claim Free
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Daily claim banner (when balance is low but not zero) */}
          {!tokenError && canClaimDaily && tokenBalance !== null && tokenBalance <= 10 && (
            <div className="shrink-0 mx-3 mt-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl">
                <Gift className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400 font-semibold flex-1">Daily tokens available!</p>
                <button
                  onClick={handleClaimDaily}
                  disabled={claimingDaily}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {claimingDaily ? <Loader className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                  +50 Tokens
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="shrink-0 px-3 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d]">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={tokenBalance !== null && tokenBalance < tokenCost ? "Not enough tokens..." : "Ask me anything..."}
                rows={1}
                disabled={loading || (tokenBalance !== null && tokenBalance < tokenCost)}
                className="flex-1 px-3 py-2.5 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 max-h-24 overflow-y-auto"
                style={{ minHeight: "40px" }}
                onInput={(e) => {
                  e.target.style.height = "40px";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || (tokenBalance !== null && tokenBalance < tokenCost)}
                className="shrink-0 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-all disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1.5">
              {tokenBalance !== null
                ? `${tokenCost} tokens/msg • ${tokenBalance} left${!canClaimDaily && nextClaimIn > 0 ? ` • Renews ${formatTimeLeft(nextClaimIn)}` : ''}`
                : "AI tutor \u2022 Won\u0027t give solution code"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
