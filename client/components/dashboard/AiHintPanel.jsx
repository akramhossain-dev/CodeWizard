"use client";
import { useState, useRef, useEffect } from "react";
import {
  Sparkles, ChevronRight, RotateCcw, AlertCircle,
  Lightbulb, Zap, Brain, Map, Loader
} from "lucide-react";

const LEVELS = [
  {
    level: 1,
    label: "Nudge",
    desc: "General direction",
    icon: Lightbulb,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    activeBg: "bg-green-500",
  },
  {
    level: 2,
    label: "Approach",
    desc: "Algorithm / strategy",
    icon: Zap,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    activeBg: "bg-blue-500",
  },
  {
    level: 3,
    label: "Structure",
    desc: "Step-by-step outline",
    icon: Brain,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
    activeBg: "bg-violet-500",
  },
  {
    level: 4,
    label: "Blueprint",
    desc: "Near-complete pseudocode",
    icon: Map,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    activeBg: "bg-amber-500",
  },
];

// Minimal Markdown renderer (bold, inline code, headers, lists)
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;

        // H3 ###
        if (line.startsWith("### ")) {
          return (
            <p key={i} className="font-bold text-gray-900 dark:text-white text-sm mt-3">
              {renderInline(line.slice(4))}
            </p>
          );
        }
        // H2 ##
        if (line.startsWith("## ")) {
          return (
            <p key={i} className="font-black text-gray-900 dark:text-white mt-3">
              {renderInline(line.slice(3))}
            </p>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-bold text-gray-500 dark:text-gray-400">
                {line.match(/^\d+/)[0]}.
              </span>
              <span>{renderInline(line.replace(/^\d+\.\s/, ""))}</span>
            </div>
          );
        }
        // Bullet list
        if (/^[-*]\s/.test(line)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 text-gray-400 mt-0.5">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text) {
  // Split by **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#252525] text-violet-600 dark:text-violet-400 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AiHintPanel({ problemId, code, language }) {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [hints, setHints] = useState({}); // { level: { text, done } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Auto-scroll as text streams in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [hints]);

  const fetchHint = async (level) => {
    if (hints[level]?.done) {
      setSelectedLevel(level);
      return;
    }

    // Abort any in-flight stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError("");
    setSelectedLevel(level);
    setHints((prev) => ({ ...prev, [level]: { text: "", done: false } }));

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/hint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ problemId, code, language, hintLevel: level }),
        signal: abortRef.current.signal,
      });

      // Non-streaming error
      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setError(data.message || "Failed to generate hint.");
        setHints((prev) => {
          const next = { ...prev };
          delete next[level];
          return next;
        });
        setLoading(false);
        return;
      }

      // SSE stream reader
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
            setHints((prev) => ({
              ...prev,
              [level]: { ...prev[level], done: true },
            }));
            setLoading(false);
            return;
          }
          try {
            const { text, error: streamErr } = JSON.parse(payload);
            if (streamErr) {
              setError(streamErr);
              setLoading(false);
              return;
            }
            if (text) {
              setHints((prev) => ({
                ...prev,
                [level]: {
                  text: (prev[level]?.text || "") + text,
                  done: false,
                },
              }));
            }
          } catch {
            // ignore malformed chunk
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setError("Connection error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setHints({});
    setSelectedLevel(1);
    setError("");
    setLoading(false);
  };

  const currentHint = hints[selectedLevel];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-500" />
            </div>
            <span className="font-black text-gray-900 dark:text-white">AI Hint Generator</span>
          </div>
          {(Object.keys(hints).length > 0 || error) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-all"
              title="Reset all hints"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Unlock hints progressively. Each level reveals more.
        </p>
      </div>

      {/* Level Selector */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d]">
        <div className="grid grid-cols-4 gap-2">
          {LEVELS.map(({ level, label, desc, icon: Icon, color, bg, border, activeBg }) => {
            const isActive = selectedLevel === level;
            const isDone = hints[level]?.done;
            const isCurrentlyLoading = loading && selectedLevel === level;
            const isDisabled = loading && selectedLevel !== level;

            return (
              <button
                key={level}
                onClick={() => fetchHint(level)}
                disabled={isDisabled}
                title={desc}
                className={`relative flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-center transition-all duration-200
                  ${isActive
                    ? `${bg} ${border} ${color}`
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }
                  ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}
                `}
              >
                {/* Done badge */}
                {isDone && (
                  <span className={`absolute -top-1 -right-1 w-4 h-4 ${activeBg} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-[9px] font-black">✓</span>
                  </span>
                )}
                {!isCurrentlyLoading && <Icon className="w-3.5 h-3.5" />}
                {isCurrentlyLoading && <Loader className="w-3.5 h-3.5 animate-spin" />}
                <div>
                  <div className="text-xs font-bold leading-none">{label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5 leading-none hidden sm:block">{desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hint Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
        {!currentHint && !loading && !error && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-violet-400" />
            </div>
            <h3 className="font-black text-gray-900 dark:text-white mb-1">Stuck on this problem?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Start with <span className="font-semibold text-green-500">Level 1</span> for a gentle nudge,
              then unlock deeper hints one at a time.
            </p>
            <button
              onClick={() => fetchHint(1)}
              className="mt-5 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg"
            >
              <Sparkles className="w-4 h-4" />
              Get First Hint
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => { setError(""); fetchHint(selectedLevel); }}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Try again →
              </button>
            </div>
          </div>
        )}

        {currentHint && (
          <div className="space-y-4">
            {/* Level badge */}
            {(() => {
              const lvl = LEVELS[selectedLevel - 1];
              const Icon = lvl.icon;
              return (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold ${lvl.bg} ${lvl.color} ${lvl.border} border`}>
                  <Icon className="w-3.5 h-3.5" />
                  Level {selectedLevel}: {lvl.label}
                  {!currentHint.done && <Loader className="w-3 h-3 animate-spin ml-1" />}
                </div>
              );
            })()}

            {/* Hint text */}
            <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <SimpleMarkdown text={currentHint.text} />
              {/* Streaming cursor */}
              {!currentHint.done && currentHint.text && (
                <span className="inline-block w-2 h-4 bg-violet-500 rounded-sm ml-0.5 animate-pulse" />
              )}
            </div>

            {/* Next level prompt */}
            {currentHint.done && selectedLevel < 4 && (
              <button
                onClick={() => fetchHint(selectedLevel + 1)}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-all group"
              >
                <Sparkles className="w-4 h-4 text-violet-500" />
                Still stuck? Get Level {selectedLevel + 1} hint ({LEVELS[selectedLevel].label})
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {currentHint.done && selectedLevel === 4 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-sm text-amber-700 dark:text-amber-400 font-medium">
                <Map className="w-4 h-4 shrink-0" />
                You&apos;ve unlocked all hint levels. Give it your best shot!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
