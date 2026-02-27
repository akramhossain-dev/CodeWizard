"use client";
import { useState, useRef, useEffect } from "react";
import {
  BookOpenCheck, Brain, List, Key, HelpCircle,
  Loader, AlertCircle, RotateCcw, Sparkles, Trophy, ChevronRight
} from "lucide-react";

// The 4 explanation sections
const SECTIONS = [
  {
    key: "idea",
    heading: "🧠 The Core Idea",
    label: "Core Idea",
    icon: Brain,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/30",
  },
  {
    key: "walkthrough",
    heading: "📋 Step-by-Step Walkthrough",
    label: "Walkthrough",
    icon: List,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  {
    key: "concepts",
    heading: "🔑 Key Concepts Used",
    label: "Key Concepts",
    icon: Key,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    key: "why",
    heading: "💡 Why This Works",
    label: "Why It Works",
    icon: HelpCircle,
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
  },
];

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
        if (/^\d+\.\s/.test(line))
          return (
            <div key={i} className="flex gap-2">
              <span className="shrink-0 font-bold text-gray-500 dark:text-gray-400 w-5 text-right">{line.match(/^\d+/)[0]}.</span>
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
  const result = { idea: "", walkthrough: "", concepts: "", why: "" };
  const keys = ["idea", "walkthrough", "concepts", "why"];

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

export default function AiExplanationPanel({ problemId, code, language, isSolved }) {
  const [explainData, setExplainData] = useState(null);
  const [rawText, setRawText]         = useState("");
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState("");
  const [activeSection, setActiveSection] = useState("idea");
  const abortRef  = useRef(null);
  const scrollRef = useRef(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    if (rawText) setExplainData(parseStreamIntoSections(rawText));
  }, [rawText]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [explainData]);

  const fetchExplanation = async () => {
    if (!code?.trim()) {
      setError("No code found. Make sure your solution is in the editor.");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setDone(false);
    setError("");
    setRawText("");
    setExplainData(null);
    setActiveSection("idea");

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/explain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ problemId, code, language }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || res.headers.get("content-type")?.includes("application/json")) {
        const data = await res.json();
        setError(data.message || "Failed to generate explanation.");
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
    setExplainData(null);
    setDone(false);
    setError("");
    setLoading(false);
    setActiveSection("idea");
  };

  const currentSectionData = explainData?.[activeSection] ?? "";
  const activeMeta = SECTIONS.find((s) => s.key === activeSection);

  // ── Not solved yet — show locked state ───────────────────────────────────
  if (!isSolved) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4 text-green-500" />
            </div>
            <span className="font-black text-gray-900 dark:text-white">AI Solution Explanation</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Get a beginner-friendly explanation of your accepted solution.
          </p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white mb-2">Solve the Problem First!</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
            Submit your solution and get an <span className="text-green-500 font-semibold">Accepted</span> verdict to unlock a beginner-friendly AI explanation.
          </p>
          <div className="mt-5 flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-500 dark:text-gray-400 font-medium">
            <BookOpenCheck className="w-4 h-4 text-green-400" />
            Available after Accepted verdict
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4 text-green-500" />
            </div>
            <span className="font-black text-gray-900 dark:text-white">AI Solution Explanation</span>
            {/* Solved badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-md border border-green-500/30">
              <Trophy className="w-2.5 h-2.5" /> Solved
            </span>
          </div>
          {(explainData || error) && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded-lg transition-all"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Understand your solution in plain English — step by step.
        </p>
      </div>

      {/* Empty state */}
      {!explainData && !loading && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
            <BookOpenCheck className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="font-black text-gray-900 dark:text-white mb-1">
            🎉 Congratulations on Solving It!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-6">
            Now let AI explain your solution in{" "}
            <span className="text-green-500 font-semibold">simple, beginner-friendly language</span>{" "}
            so you truly understand what you wrote.
          </p>
          <button
            onClick={fetchExplanation}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg"
          >
            <BookOpenCheck className="w-4 h-4" />
            Explain My Solution
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !explainData && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
          <div className="relative w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-green-500/20 border-t-green-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">Generating explanation...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This may take 15-30 seconds</p>
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
              <button
                onClick={() => { setError(""); fetchExplanation(); }}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Try again →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explanation content */}
      {explainData && (
        <>
          {/* Section tabs */}
          <div className="shrink-0 px-3 py-2.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d]">
            <div className="grid grid-cols-4 gap-1.5">
              {SECTIONS.map(({ key, label, icon: Icon, color, bg, border }) => {
                const isActive = activeSection === key;
                const hasContent = !!explainData[key]?.trim();
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
                    <span className="text-[10px] font-bold leading-none text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
            {/* Loading / done badge */}
            {loading && (
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit text-xs text-green-500 font-semibold">
                <Loader className="w-3 h-3 animate-spin" /> Generating...
              </div>
            )}
            {done && (
              <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg w-fit text-xs text-green-500 font-semibold">
                <Sparkles className="w-3 h-3" /> Explanation complete
              </div>
            )}

            {/* Section heading */}
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
                  <span className="inline-block w-2 h-4 bg-green-500 rounded-sm ml-0.5 animate-pulse" />
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-400 dark:text-gray-600 italic">
                {loading ? "Waiting for this section..." : "No content for this section yet."}
              </div>
            )}

            {/* Navigate through sections when done */}
            {done && activeSection !== "why" && (
              <button
                onClick={() => {
                  const idx = SECTIONS.findIndex((s) => s.key === activeSection);
                  if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].key);
                }}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-sm font-semibold text-gray-500 dark:text-gray-400 hover:border-green-400 dark:hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 transition-all group"
              >
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                Next: {SECTIONS[SECTIONS.findIndex((s) => s.key === activeSection) + 1]?.label}
              </button>
            )}

            {done && activeSection === "why" && (
              <div className="mt-5 flex items-center gap-3 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-sm text-green-700 dark:text-green-400 font-medium">
                <Trophy className="w-4 h-4 shrink-0" />
                You&apos;ve read the full explanation. You&apos;re growing as a developer!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
