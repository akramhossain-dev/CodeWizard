"use client";
import { useState, useRef, useEffect } from "react";
import {
  Bug, Search, Brain, Wrench, AlertTriangle,
  Loader, AlertCircle, RotateCcw, Sparkles, ChevronRight,
  XCircle, Clock, Terminal
} from "lucide-react";

// Section definitions — maps to the 4 sections the AI returns
const SECTIONS = [
  {
    key: "bug",
    heading: "🔍 Bug Identified",
    label: "Bug Found",
    icon: Search,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    headerBg: "bg-red-500/5",
  },
  {
    key: "why",
    heading: "🧠 Why It Fails",
    label: "Why",
    icon: Brain,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    headerBg: "bg-orange-500/5",
  },
  {
    key: "fix",
    heading: "🛠️ How to Fix",
    label: "Fix",
    icon: Wrench,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    headerBg: "bg-blue-500/5",
  },
  {
    key: "edge",
    heading: "⚠️ Edge Cases",
    label: "Edge Cases",
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    headerBg: "bg-amber-500/5",
  },
];

// Verdict display configs
const VERDICT_CONFIG = {
  "Wrong Answer":        { icon: XCircle,    color: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  "Runtime Error":       { icon: AlertCircle, color: "text-red-400",   bg: "bg-red-400/10",    border: "border-red-400/30" },
  "Time Limit Exceeded": { icon: Clock,      color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  "Compilation Error":   { icon: Terminal,   color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
};

// ── Minimal markdown renderer ─────────────────────────────────────────────────
function SimpleMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.startsWith("### "))
          return <p key={i} className="font-bold text-gray-900 dark:text-white text-sm mt-3">{renderInline(line.slice(4))}</p>;
        if (line.startsWith("## "))
          return <p key={i} className="font-black text-gray-900 dark:text-white mt-3">{renderInline(line.slice(3))}</p>;
        // Code block lines
        if (line.startsWith("```"))
          return null;
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
        <code key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#252525] text-violet-600 dark:text-violet-400 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    return part;
  });
}

// ── Split streamed text into sections ────────────────────────────────────────
function parseStreamIntoSections(fullText) {
  const sectionHeadings = SECTIONS.map((s) => s.heading);
  const result = { bug: "", why: "", fix: "", edge: "" };
  const keys = ["bug", "why", "fix", "edge"];

  let currentIdx = -1;
  const lines = fullText.split("\n");

  for (const line of lines) {
    const matchIdx = sectionHeadings.findIndex((h) =>
      line.includes(h.replace(/^[^\s]+\s/, "")) || line.includes(h)
    );
    if (matchIdx !== -1) {
      currentIdx = matchIdx;
      continue;
    }
    if (currentIdx >= 0) {
      result[keys[currentIdx]] += line + "\n";
    }
  }

  return result;
}

export default function AiDebugPanel({ problemId, code, language, submitResult }) {
  const [debugData, setDebugData] = useState(null);
  const [rawText, setRawText]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");
  const [activeSection, setActiveSection] = useState("bug");
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Determine if we have a debuggable verdict
  const verdict = submitResult?.verdict || "";
  const isDebuggable = ["Wrong Answer", "Runtime Error", "Time Limit Exceeded", "Compilation Error"].includes(verdict);
  const verdictConfig = VERDICT_CONFIG[verdict] || null;

  // Re-parse sections whenever raw text updates
  useEffect(() => {
    if (rawText) {
      setDebugData(parseStreamIntoSections(rawText));
    }
  }, [rawText]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [debugData]);

  const fetchDebug = async () => {
    if (!code?.trim()) {
      setError("Please write some code before requesting debug analysis.");
      return;
    }
    if (!isDebuggable) {
      setError("Debug analysis is only available for Wrong Answer, Runtime Error, TLE, or Compilation Error.");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setDone(false);
    setError("");
    setRawText("");
    setDebugData(null);
    setActiveSection("bug");

    try {
      const token = localStorage.getItem("token");

      // Build failed test case info from submitResult
      let failedTestCase = null;
      if (submitResult?.testResults?.length > 0) {
        const failed = submitResult.testResults.find((t) => t.verdict !== "Accepted" && t.verdict !== "Passed");
        if (failed) {
          failedTestCase = {
            input: failed.input,
            expectedOutput: failed.expectedOutput,
            actualOutput: failed.actualOutput || failed.output,
          };
        }
      }

      const res = await fetch(`${API_URL}/api/ai/debug`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          problemId,
          code,
          language,
          verdict,
          errorMessage: submitResult?.errorMessage || "",
          failedTestCase,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setError(data.message || "Failed to generate debug analysis.");
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") {
            setDone(true);
            setLoading(false);
            return;
          }
          try {
            const { text, error: streamErr } = JSON.parse(payload);
            if (streamErr) { setError(streamErr); setLoading(false); return; }
            if (text) setRawText((prev) => prev + text);
          } catch { /* ignore malformed */ }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setRawText("");
    setDebugData(null);
    setDone(false);
    setError("");
    setLoading(false);
    setActiveSection("bug");
  };

  const currentSectionData = debugData?.[activeSection] ?? "";
  const activeMeta = SECTIONS.find((s) => s.key === activeSection);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <Bug className="w-4 h-4 text-red-500" />
            </div>
            <span className="font-black text-gray-900 dark:text-white">AI Debug Assistant</span>
          </div>
          {(debugData || error) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          AI will find bugs, explain why your code fails, and guide you to fix it.
        </p>
      </div>

      {/* ── No submission yet ── */}
      {!submitResult && !loading && !error && !debugData && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
            <Bug className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white mb-1">Submit Your Code First</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Submit your solution and if it gets{" "}
            <span className="text-red-500 font-semibold">Wrong Answer</span>,{" "}
            <span className="text-red-400 font-semibold">Runtime Error</span>, or{" "}
            <span className="text-orange-500 font-semibold">TLE</span>,{" "}
            the AI debugger will help you find and fix the bugs.
          </p>
        </div>
      )}

      {/* ── Accepted — no debug needed ── */}
      {submitResult && verdict === "Accepted" && !loading && !debugData && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white mb-1">Your Code is Accepted! 🎉</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            No bugs to debug — your solution is correct. Check out the{" "}
            <span className="text-blue-500 font-semibold">Code Review</span> tab for optimization tips.
          </p>
        </div>
      )}

      {/* ── Pending/Running ── */}
      {submitResult && (verdict === "Pending" || verdict === "Running") && !loading && !debugData && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <Loader className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white mb-1">Judging in Progress...</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Wait for the verdict before using the debug assistant.
          </p>
        </div>
      )}

      {/* ── Ready to debug — show verdict + debug button ── */}
      {isDebuggable && !loading && !debugData && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          {/* Verdict badge */}
          {verdictConfig && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${verdictConfig.bg} ${verdictConfig.border} mb-5`}>
              <verdictConfig.icon className={`w-5 h-5 ${verdictConfig.color}`} />
              <span className={`font-bold text-sm ${verdictConfig.color}`}>{verdict}</span>
              {submitResult?.passedTestCases !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                  ({submitResult.passedTestCases}/{submitResult.totalTestCases} passed)
                </span>
              )}
            </div>
          )}

          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <Bug className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white mb-1">Let AI Find the Bug</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
            AI will analyze your code, find the{" "}
            <span className="text-red-500 font-semibold">exact bug</span>, explain{" "}
            <span className="text-orange-500 font-semibold">why it fails</span>, and show you{" "}
            <span className="text-blue-500 font-semibold">how to fix it</span>.
          </p>
          <button
            onClick={fetchDebug}
            disabled={!code?.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Bug className="w-4 h-4" />
            Debug My Code
            <ChevronRight className="w-4 h-4" />
          </button>
          {!code?.trim() && (
            <p className="mt-3 text-xs text-gray-400">Write some code in the editor first.</p>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && !debugData && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bug className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Debugging your code...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Analyzing logic, edge cases, and errors</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="m-5">
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{error}</p>
              {isDebuggable && (
                <button
                  onClick={() => { setError(""); fetchDebug(); }}
                  className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
                >
                  Try again →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Debug content */}
      {debugData && (
        <>
          {/* Verdict banner */}
          {verdictConfig && (
            <div className={`shrink-0 mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg border ${verdictConfig.bg} ${verdictConfig.border}`}>
              <verdictConfig.icon className={`w-4 h-4 ${verdictConfig.color}`} />
              <span className={`text-xs font-bold ${verdictConfig.color}`}>{verdict}</span>
              {submitResult?.passedTestCases !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  — {submitResult.passedTestCases}/{submitResult.totalTestCases} test cases passed
                </span>
              )}
            </div>
          )}

          {/* Section tabs */}
          <div className="shrink-0 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d]">
            <div className="grid grid-cols-4 gap-1.5">
              {SECTIONS.map(({ key, label, icon: Icon, color, bg, border }) => {
                const isActive = activeSection === key;
                const hasContent = !!debugData[key]?.trim();
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`flex flex-col items-center gap-1 px-1 py-2 rounded-xl border text-center transition-all duration-200
                      ${isActive
                        ? `${bg} ${border} ${color}`
                        : "border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                  >
                    <div className="relative">
                      <Icon className="w-3.5 h-3.5" />
                      {hasContent && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
            {loading && (
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg w-fit text-xs text-red-500 font-semibold">
                <Loader className="w-3 h-3 animate-spin" />
                Debugging...
              </div>
            )}

            {done && (
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit text-xs text-green-500 font-semibold">
                <Sparkles className="w-3 h-3" />
                Debug analysis complete
              </div>
            )}

            {activeMeta && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${activeMeta.bg} ${activeMeta.border} border mb-3`}>
                <activeMeta.icon className={`w-4 h-4 ${activeMeta.color}`} />
                <span className={`text-sm font-bold ${activeMeta.color}`}>{activeMeta.heading}</span>
                {loading && <Loader className={`w-3 h-3 animate-spin ml-auto ${activeMeta.color}`} />}
              </div>
            )}

            {currentSectionData.trim() ? (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <SimpleMarkdown text={currentSectionData} />
                {loading && (
                  <span className="inline-block w-2 h-4 bg-red-500 rounded-sm ml-0.5 animate-pulse" />
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-600 italic">
                {loading ? "Waiting for this section..." : "No content for this section yet."}
              </div>
            )}

            {done && (
              <button
                onClick={fetchDebug}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-red-400 dark:hover:border-red-600 hover:text-red-600 dark:hover:text-red-400 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Re-debug (code may have changed)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
