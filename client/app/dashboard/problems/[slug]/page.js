"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Code, Clock, Database, CheckCircle, XCircle, Lock, Tag,
  Play, Send, Loader, ArrowLeft, BookOpen, Lightbulb,
  AlertCircle, TrendingUp, Users, ChevronDown, ChevronUp,
  Terminal, RefreshCw, CircleDot, Trophy, Sparkles, ScanSearch, BookOpenCheck, Bug,
  Zap, Copy, Check, GripVertical
} from "lucide-react";
import AiHintPanel from "@/components/dashboard/AiHintPanel";
import AiCodeReviewPanel from "@/components/dashboard/AiCodeReviewPanel";
import AiExplanationPanel from "@/components/dashboard/AiExplanationPanel";
import AiDebugPanel from "@/components/dashboard/AiDebugPanel";
import AiChatBot from "@/components/dashboard/AiChatBot";

const VERDICT_STYLE = {
  "Accepted":            { text: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/30",  icon: CheckCircle },
  "Wrong Answer":        { text: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/30",    icon: XCircle },
  "Time Limit Exceeded": { text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: Clock },
  "Runtime Error":       { text: "text-red-400",    bg: "bg-red-400/10",    border: "border-red-400/30",    icon: AlertCircle },
  "Compilation Error":   { text: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertCircle },
  "Pending":             { text: "text-blue-500",   bg: "bg-blue-500/10",   border: "border-blue-500/30",   icon: CircleDot },
  "Running":             { text: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/30", icon: Loader },
  "Internal Error":      { text: "text-gray-500",   bg: "bg-gray-500/10",   border: "border-gray-500/30",   icon: AlertCircle },
};

const CodeEditor = dynamic(() => import("@uiw/react-textarea-code-editor"), { ssr: false });

// ── Difficulty config ────────────────────────────────────────────────────────
const DIFF = {
  easy:   { label: "Easy",   text: "text-green-500",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  medium: { label: "Medium", text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  hard:   { label: "Hard",   text: "text-red-500",    bg: "bg-red-500/10",    border: "border-red-500/20" },
};

const LANGUAGES = [
  { value: "cpp",        label: "C++",        dot: "bg-blue-500" },
  { value: "python",     label: "Python",     dot: "bg-yellow-500" },
  { value: "java",       label: "Java",       dot: "bg-orange-500" },
  { value: "c",          label: "C",          dot: "bg-sky-500" },
  { value: "javascript", label: "JavaScript", dot: "bg-amber-500" },
];

// ── Example Block component ──────────────────────────────────────────────────
function ExampleBlock({ example, index }) {
  const [copiedInput, setCopiedInput] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const handleCopy = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

  return (
    <div className="rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-gray-50/50 dark:bg-white/2 overflow-hidden">
      <div className="px-3.5 py-2 border-b border-gray-200/40 dark:border-gray-800/40 bg-gray-50/80 dark:bg-white/3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Example {index + 1}</span>
      </div>
      <div className="p-3.5 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Input</span>
            <button
              onClick={() => handleCopy(example.input, setCopiedInput)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
            >
              {copiedInput ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copiedInput ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="bg-white dark:bg-[#0d0d0d] border border-gray-200/60 dark:border-gray-800/60 rounded-lg p-2.5 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">{example.input}</pre>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Output</span>
            <button
              onClick={() => handleCopy(example.output, setCopiedOutput)}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
            >
              {copiedOutput ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              {copiedOutput ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="bg-white dark:bg-[#0d0d0d] border border-gray-200/60 dark:border-gray-800/60 rounded-lg p-2.5 text-xs font-mono text-gray-700 dark:text-gray-300 overflow-x-auto">{example.output}</pre>
        </div>
        {example.explanation && (
          <div>
            <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Explanation</span>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{example.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProblemDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [problem,       setProblem]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState("");
  const [code,          setCode]          = useState("");
  const [language,      setLanguage]      = useState("cpp");
  const [submitting,    setSubmitting]    = useState(false);
  const [submitResult,  setSubmitResult]  = useState(null);
  const [polling,       setPolling]       = useState(false);
  const [running,       setRunning]       = useState(false);
  const [runResult,     setRunResult]     = useState(null);
  const [showRunResult, setShowRunResult] = useState(false);
  const [activeTab,     setActiveTab]     = useState("description");
  const [mobilePanel,   setMobilePanel]   = useState("problem");
  const [isSolved,      setIsSolved]      = useState(false);
  const pollRef = useRef(null);
  const contestId = searchParams.get("contestId");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const getAuthHeaders = (json = false) => {
    const headers = {};
    if (json) headers["Content-Type"] = "application/json";
    const token = localStorage.getItem("token");
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`${API_URL}/api/problems/${slug}`, {
      headers: getAuthHeaders(),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProblem(data.problem);
          setError("");
          // Check if the user has already solved this problem
          if (data.problem?._id) {
            fetch(`${API_URL}/api/submissions/my-submissions?problemId=${data.problem._id}&verdict=Accepted&limit=1`, {
              headers: getAuthHeaders(),
            })
              .then((r) => r.json())
              .then((sub) => {
                if (sub.success && sub.submissions?.length > 0) setIsSolved(true);
              })
              .catch(() => {});
          }
        } else {
          setError(data.message || "Problem not found");
        }
        setLoading(false);
      })
      .catch(() => { setError("Failed to load problem"); setLoading(false); });
  }, [slug, API_URL]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const startPolling = (submissionId) => {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`${API_URL}/api/submissions/status/${submissionId}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
          if (data.success) {
          const s = data.submission;
          setSubmitResult({
            verdict:         s.verdict,
            runtime:         s.runtime,
            memory:          s.memory,
            passedTestCases: s.passedTestCases,
            totalTestCases:  s.totalTestCases,
            errorMessage:    s.errorMessage || s.compilationOutput,
            testResults:     s.testResults || [],
          });
          const isDone = s.verdict !== "Pending" && s.verdict !== "Running";
          if (isDone || attempts >= 20) {
            clearInterval(pollRef.current);
            setPolling(false);
            setSubmitting(false);
            if (s.verdict === "Accepted") setIsSolved(true);
          }
        }
      } catch {
        if (attempts >= 20) { clearInterval(pollRef.current); setPolling(false); setSubmitting(false); }
      }
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    clearInterval(pollRef.current);
    setSubmitting(true);
    setSubmitResult({ verdict: "Pending" });
    setRunResult(null);
    setShowRunResult(false);
    try {
      const res = await fetch(`${API_URL}/api/submissions/submit`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({
          problemId: problem._id,
          code,
          language,
          ...(contestId ? { contestId } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitResult({ verdict: "Running" });
        startPolling(data.submissionId);
      } else {
        setSubmitResult({ verdict: "Internal Error", errorMessage: data.message });
        setSubmitting(false);
      }
    } catch {
      setSubmitResult({ verdict: "Internal Error", errorMessage: "Submission failed. Try again." });
      setSubmitting(false);
    }
  };

  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setRunResult(null);
    setShowRunResult(true);
    try {
      const res = await fetch(`${API_URL}/api/submissions/run`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify({ problemId: problem._id, code, language }),
      });
      const data = await res.json();
      if (data.success) setRunResult(data.result);
      else setRunResult({ error: data.message || "Run failed" });
    } catch {
      setRunResult({ error: "Run failed. Try again." });
    }
    setRunning(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-semibold tracking-wide">Loading problem…</span>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-1.5">Problem Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{error || "The requested problem does not exist."}</p>
          <button
            onClick={() => router.push("/dashboard/problems")}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const diff = DIFF[problem.difficulty?.toLowerCase()] || DIFF.medium;

  return (
    <>
    <div className="h-[calc(100dvh-5rem)] min-h-[calc(100vh-5rem)] flex flex-col bg-[#fafafa] dark:bg-[#0a0a0a]">

      {/* ── COMPACT TOP BAR ── */}
      <div className="shrink-0 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/dashboard/problems")}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0 group"
              title="Back to problems"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors" />
            </button>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-gray-400 shrink-0">#{problem.problemNumber || "—"}</span>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {problem.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSolved && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[11px] font-bold rounded-md border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" /> Solved
              </span>
            )}
            <span className={`px-2 py-1 rounded-md text-[11px] font-bold border ${diff.bg} ${diff.text} ${diff.border}`}>
              {diff.label}
            </span>
            {problem.isPremium && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/10 text-amber-500 text-[11px] font-bold rounded-md border border-amber-500/20">
                <Lock className="w-2.5 h-2.5" /> PRO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE PANEL SWITCH ── */}
      <div className="lg:hidden shrink-0 px-3 py-2 bg-white/60 dark:bg-[#111]/60 backdrop-blur-lg border-b border-gray-200/40 dark:border-gray-800/40">
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-gray-100 dark:bg-[#1a1a1a]">
          {[
            { key: "problem", label: "Problem", icon: BookOpen },
            { key: "editor", label: "Editor", icon: Code },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMobilePanel(key)}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                mobilePanel === key
                  ? "bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT (Split View) ── */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">

        {/* ═══ LEFT PANEL ═══ */}
        <div className={`${mobilePanel === "problem" ? "flex" : "hidden"} lg:flex w-full lg:w-[48%] xl:w-[45%] flex-col bg-white dark:bg-[#111] border-r border-gray-200/60 dark:border-gray-800/60`}>

          {/* Tabs — Scrollable pills */}
          <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-800/50 overflow-x-auto scrollbar-none">
            {[
              { key: "description", label: "Description", icon: BookOpen },
              { key: "hints",       label: "Hints",       icon: Lightbulb },
              { key: "ai",          label: "AI Hint",     icon: Sparkles },
              { key: "review",      label: "Review",      icon: ScanSearch },
              { key: "debug",       label: "Debug",       icon: Bug, badge: submitResult && ["Wrong Answer", "Runtime Error", "Time Limit Exceeded", "Compilation Error"].includes(submitResult?.verdict) },
              { key: "explain",     label: "Explain",     icon: BookOpenCheck, badge: isSolved },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                  activeTab === key
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
                {badge && activeTab !== key && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-[#111]" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "description" && (
              <div className="p-5 space-y-5">

                {/* Stats Row */}
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{problem.acceptanceRate?.toFixed(1) || 0}%</span>
                    <span>acceptance</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{problem.totalAccepted || 0}</span>
                    <span>solved</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>{problem.timeLimit || 1000}ms</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Database className="w-3.5 h-3.5 text-violet-500" />
                    <span>{problem.memoryLimit || 256}MB</span>
                  </div>
                </div>

                {/* Tags */}
                {problem.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {problem.tags.map((tag) => (
                      <span key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[11px] font-medium rounded-md border border-gray-200/60 dark:border-gray-800/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-[13px]">
                    {problem.description}
                  </div>
                </div>

                {/* Constraints */}
                {problem.constraints?.length > 0 && (
                  <div className="p-3.5 bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/40 dark:border-amber-500/10 rounded-xl">
                    <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">Constraints</h3>
                    <ul className="space-y-1">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <code className="font-mono text-amber-800 dark:text-amber-300">{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* I/O Format */}
                {(problem.inputFormat || problem.outputFormat) && (
                  <div className="space-y-3">
                    {problem.inputFormat && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Input Format</h3>
                        <div className="text-[13px] text-gray-700 dark:text-gray-300">{problem.inputFormat}</div>
                      </div>
                    )}
                    {problem.outputFormat && (
                      <div>
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Output Format</h3>
                        <div className="text-[13px] text-gray-700 dark:text-gray-300">{problem.outputFormat}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Examples */}
                {problem.examples?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Examples</h3>
                    {problem.examples.map((ex, i) => (
                      <ExampleBlock key={ex._id || i} example={ex} index={i} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "hints" && (
              <div className="p-5">
                {problem.hints?.length > 0 ? (
                  <div className="space-y-2.5">
                    {problem.hints.map((hint, i) => (
                      <div key={i} className="flex gap-3 p-3.5 bg-amber-50/60 dark:bg-amber-500/5 border border-amber-200/40 dark:border-amber-500/10 rounded-xl">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-[13px] text-gray-700 dark:text-gray-300">{hint}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-gray-800/60 flex items-center justify-center mx-auto mb-3">
                      <Lightbulb className="w-6 h-6 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-400">No hints available</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai" && (
              <div className="h-full">
                <AiHintPanel problemId={problem._id} code={code} language={language} />
              </div>
            )}

            {activeTab === "review" && (
              <div className="h-full">
                <AiCodeReviewPanel problemId={problem._id} code={code} language={language} />
              </div>
            )}

            {activeTab === "debug" && (
              <div className="h-full">
                <AiDebugPanel problemId={problem._id} code={code} language={language} submitResult={submitResult} />
              </div>
            )}

            {activeTab === "explain" && (
              <div className="h-full">
                <AiExplanationPanel problemId={problem._id} code={code} language={language} isSolved={isSolved} />
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL (Code Editor) ═══ */}
        <div className={`${mobilePanel === "editor" ? "flex" : "hidden"} lg:flex w-full lg:w-[52%] xl:w-[55%] flex-col bg-[#fafafa] dark:bg-[#0a0a0a]`}>

          {/* Editor Header */}
          <div className="shrink-0 px-3 sm:px-4 py-2 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center">
                <Code className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Solution</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${LANGUAGES.find(l => l.value === language)?.dot || 'bg-gray-400'}`} />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
              >
                {LANGUAGES.map(({ value, label }) => (
                  <option key={value} value={value} className="bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200">{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden p-2 sm:p-3">
            <CodeEditor
              value={code}
              language={language}
              placeholder="// Write your solution here..."
              onChange={(ev) => setCode(ev.target.value)}
              minHeight={220}
              className="w-full h-full border border-gray-200/60 dark:border-gray-800/60 rounded-xl bg-white dark:bg-[#111] text-sm font-mono"
              style={{ fontFamily: "'JetBrains Mono', Consolas, Monaco, 'Courier New', monospace", fontSize: "13px" }}
            />
          </div>

          {/* Run Result Panel */}
          {showRunResult && (
            <div className="shrink-0 mx-2 sm:mx-3 mb-2 border border-gray-200/60 dark:border-gray-800/60 rounded-xl bg-white dark:bg-[#111] overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-white/2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" /> Test Output
                </div>
                <button onClick={() => setShowRunResult(false)} className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="p-3 max-h-36 overflow-y-auto">
                {running ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader className="w-3.5 h-3.5 animate-spin text-blue-500" /> Running tests...
                  </div>
                ) : runResult?.error ? (
                  <pre className="text-xs text-red-500 font-mono whitespace-pre-wrap">{runResult.error}</pre>
                ) : runResult?.testResults?.length > 0 ? (
                  <div className="space-y-1.5">
                    {runResult.testResults.map((tr, i) => (
                      <div key={i} className={`rounded-lg p-2.5 border text-xs font-mono ${
                        tr.passed
                          ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/40 dark:border-emerald-500/10"
                          : "bg-red-50/50 dark:bg-red-500/5 border-red-200/40 dark:border-red-500/10"
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold">
                          {tr.passed
                            ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                            : <XCircle className="w-3 h-3 text-red-500" />}
                          <span className={tr.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                            Test {i + 1}
                          </span>
                        </div>
                        {!tr.passed && (
                          <div className="space-y-0.5 mt-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                            <div><span className="text-gray-400">Expected: </span><span className="text-gray-700 dark:text-gray-300">{tr.expectedOutput}</span></div>
                            <div><span className="text-gray-400">Got: </span><span className="text-red-500">{tr.actualOutput}</span></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : runResult ? (
                  <pre className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{JSON.stringify(runResult, null, 2)}</pre>
                ) : null}
              </div>
            </div>
          )}

          {/* Submit Result Panel */}
          {submitResult && (
            <SubmitResultPanel result={submitResult} polling={polling} />
          )}

          {/* Action Buttons */}
          <div className="shrink-0 px-2 sm:px-3 py-2.5 bg-white/80 dark:bg-[#111]/80 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800/60 flex gap-2">
            <button
              onClick={handleRun}
              disabled={running || submitting || !code.trim()}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-xs transition-all border border-gray-200/60 dark:border-gray-800/60 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {running ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-500" />}
              Run
            </button>
            {isSolved ? (
              <div className="flex-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg font-bold text-xs">
                <Trophy className="w-3.5 h-3.5" /> Already Solved
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !code.trim()}
                className="flex-2 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none active:scale-[0.98]"
              >
                {submitting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {submitting ? (polling ? "Judging..." : "Submitting...") : "Submit"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

    <AiChatBot
      problem={problem}
      code={code}
      language={language}
      submitResult={submitResult}
    />
    </>
  );
}

// ── Verdict Result Panel ──────────────────────────────────────────────────────
function SubmitResultPanel({ result, polling }) {
  const [expanded, setExpanded] = useState(false);
  const vs = VERDICT_STYLE[result.verdict] || VERDICT_STYLE["Internal Error"];
  const VIcon = vs.icon;
  const isJudging = result.verdict === "Pending" || result.verdict === "Running";

  return (
    <div className={`shrink-0 mx-2 sm:mx-3 mb-2 rounded-xl border overflow-hidden shadow-sm ${vs.bg} ${vs.border}`}>
      {/* Verdict Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          {isJudging
            ? <Loader className={`w-4 h-4 animate-spin ${vs.text}`} />
            : <VIcon className={`w-4 h-4 ${vs.text}`} />}
          <div>
            <div className={`text-sm font-black ${vs.text}`}>{result.verdict}</div>
            {!isJudging && result.passedTestCases !== undefined && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                {result.passedTestCases}/{result.totalTestCases} passed
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {!isJudging && result.runtime !== undefined && (
            <div className="text-right text-[11px] text-gray-500 dark:text-gray-400 font-mono">
              <div>{result.runtime}ms</div>
              <div>{result.memory}MB</div>
            </div>
          )}
          {isJudging && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400">
              <RefreshCw className="w-3 h-3 animate-spin" /> judging...
            </div>
          )}
          {!isJudging && result.testResults?.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
            </button>
          )}
        </div>
      </div>

      {/* Error / Compilation output */}
      {!isJudging && result.errorMessage && (
        <div className="px-3 pb-2.5">
          <pre className="text-[11px] font-mono bg-black/5 dark:bg-white/5 rounded-lg p-2.5 whitespace-pre-wrap text-red-600 dark:text-red-400 max-h-24 overflow-y-auto">
            {result.errorMessage}
          </pre>
        </div>
      )}

      {/* Test Results Expanded */}
      {expanded && result.testResults?.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5 max-h-48 overflow-y-auto border-t border-black/10 dark:border-white/10 pt-2.5">
          {result.testResults.map((tr, i) => (
            <div key={i} className={`rounded-lg p-2.5 border text-xs ${
              tr.passed
                ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200/40 dark:border-emerald-500/10"
                : "bg-red-50/50 dark:bg-red-500/5 border-red-200/40 dark:border-red-500/10"
            }`}>
              <div className="flex items-center gap-1.5 font-bold">
                {tr.passed
                  ? <CheckCircle className="w-3 h-3 text-emerald-500" />
                  : <XCircle className="w-3 h-3 text-red-500" />}
                <span className={tr.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                  Test {i + 1}
                </span>
                {tr.runtime !== undefined && (
                  <span className="ml-auto font-normal text-[11px] text-gray-400 font-mono">{tr.runtime}ms</span>
                )}
              </div>
              {!tr.passed && (
                <div className="font-mono space-y-0.5 mt-1.5 text-[11px] text-gray-600 dark:text-gray-400">
                  {tr.input        && <div><span className="text-gray-400">Input: </span><span className="text-gray-700 dark:text-gray-300">{tr.input}</span></div>}
                  {tr.expectedOutput && <div><span className="text-gray-400">Expected: </span><span className="text-gray-700 dark:text-gray-300">{tr.expectedOutput}</span></div>}
                  {tr.actualOutput  && <div><span className="text-gray-400">Got: </span><span className="text-red-500">{tr.actualOutput}</span></div>}
                  {tr.errorMessage  && <div className="text-red-500">{tr.errorMessage}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
