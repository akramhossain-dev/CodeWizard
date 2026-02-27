"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Code, Clock, Database, CheckCircle, XCircle, Lock, Tag,
  Play, Send, Loader, ArrowLeft, BookOpen, Lightbulb,
  AlertCircle, TrendingUp, Users, ChevronDown, ChevronUp,
  Terminal, RefreshCw, CircleDot, Trophy, Sparkles, ScanSearch, BookOpenCheck, Bug
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
  { value: "cpp",    label: "C++" },
  { value: "python", label: "Python" },
  { value: "java",   label: "Java" },
  { value: "c",      label: "C" },
  { value: "javascript", label: "JavaScript" },
];

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 font-medium">Loading problem...</span>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Problem Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error || "The requested problem does not exist."}</p>
          <button
            onClick={() => router.push("/dashboard/problems")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  const diff = DIFF[problem.difficulty?.toLowerCase()] || DIFF.medium;

  return (
    <>
    <div className="h-[calc(100dvh-5rem)] min-h-[calc(100vh-5rem)] flex flex-col">

      {/* ── TOP BAR ── */}
      <div className="shrink-0 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 w-full lg:w-auto">
          <button
            onClick={() => router.push("/dashboard/problems")}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors shrink-0"
            title="Back to problems"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-gray-900 dark:text-white truncate">
              {problem.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>#{problem.problemNumber || "—"}</span>
              <span>•</span>
              <span>{problem.totalSubmissions || 0} submissions</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isSolved && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg border border-green-500/30">
              <Trophy className="w-3.5 h-3.5" /> Solved
            </span>
          )}
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${diff.bg} ${diff.text} ${diff.border}`}>
            {diff.label}
          </span>
          {problem.isPremium && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-lg border border-amber-500/20">
              <Lock className="w-3 h-3" /> PRO
            </span>
          )}
        </div>
      </div>

      {/* ── MOBILE PANEL SWITCH ── */}
      <div className="lg:hidden shrink-0 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-[#0d0d0d] border-b border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setMobilePanel("problem")}
            className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
              mobilePanel === "problem"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Problem
          </button>
          <button
            onClick={() => setMobilePanel("editor")}
            className={`inline-flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${
              mobilePanel === "editor"
                ? "bg-blue-600 text-white"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            }`}
          >
            <Code className="w-4 h-4" />
            Editor
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT (Split View) ── */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">

        {/* ═══ LEFT PANEL (Problem Description) ═══ */}
        <div className={`${mobilePanel === "problem" ? "flex" : "hidden"} lg:flex w-full lg:w-1/2 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111]`}>

          {/* Tabs */}
          <div className="shrink-0 flex gap-1 px-4 pt-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d] overflow-x-auto scrollbar-none">
            {[
              { key: "description", label: "Description", icon: BookOpen },
              { key: "hints",       label: "Hints",       icon: Lightbulb },
              { key: "ai",          label: "AI Hint",     icon: Sparkles },
              { key: "review",      label: "Code Review", icon: ScanSearch },
              { key: "debug",       label: "Debug",       icon: Bug, badge: submitResult && ["Wrong Answer", "Runtime Error", "Time Limit Exceeded", "Compilation Error"].includes(submitResult?.verdict) },
              { key: "explain",     label: "Explain",     icon: BookOpenCheck, badge: isSolved },
            ].map(({ key, label, icon: Icon, badge }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 px-3 py-2.5 text-sm font-bold rounded-t-xl transition-all shrink-0 ${
                  activeTab === key
                    ? "bg-white dark:bg-[#111] text-blue-600 dark:text-blue-400 border-x border-t border-gray-200 dark:border-gray-800"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {badge && activeTab !== key && (
                  <span className="absolute top-1.5 right-1 w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "description" && (
              <div className="space-y-6">

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: TrendingUp, label: "Acceptance", value: `${problem.acceptanceRate?.toFixed(1) || 0}%`, color: "text-green-500", bg: "bg-green-500/10" },
                    { icon: Users,      label: "Solved",     value: problem.totalAccepted || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { icon: Clock,      label: "Time Limit", value: `${problem.timeLimit || 1000}ms`, color: "text-orange-500", bg: "bg-orange-500/10" },
                    { icon: Database,   label: "Memory",     value: `${problem.memoryLimit || 256}MB`, color: "text-violet-500", bg: "bg-violet-500/10" },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl">
                      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-gray-900 dark:text-white">{value}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                {problem.tags?.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Topics</div>
                    <div className="flex flex-wrap gap-2">
                      {problem.tags.map((tag) => (
                        <span key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-800">
                          <Tag className="w-3 h-3" />{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white mb-3">Description</h2>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
                    {problem.description}
                  </div>
                </div>

                {/* Constraints */}
                {problem.constraints?.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* I/O Format */}
                {(problem.inputFormat || problem.outputFormat) && (
                  <div className="space-y-3">
                    {problem.inputFormat && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Input Format</h3>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{problem.inputFormat}</div>
                      </div>
                    )}
                    {problem.outputFormat && (
                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Output Format</h3>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{problem.outputFormat}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Examples */}
                {problem.examples?.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3">Examples</h3>
                    <div className="space-y-3">
                      {problem.examples.map((ex, i) => (
                        <div key={ex._id || i} className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Example {i + 1}</div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white">Input:</span>
                              <pre className="mt-1 bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">{ex.input}</pre>
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white">Output:</span>
                              <pre className="mt-1 bg-white dark:bg-[#0d0d0d] border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-xs font-mono overflow-x-auto">{ex.output}</pre>
                            </div>
                            {ex.explanation && (
                              <div>
                                <span className="font-bold text-gray-900 dark:text-white">Explanation:</span>
                                <p className="mt-1 text-gray-600 dark:text-gray-400">{ex.explanation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "hints" && (
              <div>
                {problem.hints?.length > 0 ? (
                  <div className="space-y-3">
                    {problem.hints.map((hint, i) => (
                      <div key={i} className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-700 dark:text-gray-300">{hint}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Lightbulb className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No hints available for this problem.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "ai" && (
              <div className="-m-6 h-[calc(100%+3rem)]">
                <AiHintPanel
                  problemId={problem._id}
                  code={code}
                  language={language}
                />
              </div>
            )}

            {activeTab === "review" && (
              <div className="-m-6 h-[calc(100%+3rem)]">
                <AiCodeReviewPanel
                  problemId={problem._id}
                  code={code}
                  language={language}
                />
              </div>
            )}

            {activeTab === "debug" && (
              <div className="-m-6 h-[calc(100%+3rem)]">
                <AiDebugPanel
                  problemId={problem._id}
                  code={code}
                  language={language}
                  submitResult={submitResult}
                />
              </div>
            )}

            {activeTab === "explain" && (
              <div className="-m-6 h-[calc(100%+3rem)]">
                <AiExplanationPanel
                  problemId={problem._id}
                  code={code}
                  language={language}
                  isSolved={isSolved}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT PANEL (Code Editor) ═══ */}
        <div className={`${mobilePanel === "editor" ? "flex" : "hidden"} lg:flex w-full lg:w-1/2 flex-col bg-gray-50 dark:bg-[#0d0d0d]`}>

          {/* Header */}
          <div className="shrink-0 px-3 sm:px-4 py-3 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-gray-900 dark:text-white">Code Editor</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden p-3 sm:p-4">
            <CodeEditor
              value={code}
              language={language}
              placeholder="// Write your solution here..."
              onChange={(ev) => setCode(ev.target.value)}
              minHeight={220}
              className="w-full h-full border-2 border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#111] text-sm font-mono shadow-sm"
              style={{ fontFamily: "Consolas, Monaco, 'Courier New', monospace" }}
            />
          </div>

          {/* Run Result Panel */}
          {showRunResult && (
            <div className="shrink-0 mx-3 sm:mx-4 mb-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-[#111] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                  <Terminal className="w-4 h-4 text-blue-500" /> Test Output
                </div>
                <button onClick={() => setShowRunResult(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 max-h-40 overflow-y-auto">
                {running ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader className="w-4 h-4 animate-spin text-blue-500" /> Running against sample test cases...
                  </div>
                ) : runResult?.error ? (
                  <pre className="text-xs text-red-500 font-mono whitespace-pre-wrap">{runResult.error}</pre>
                ) : runResult?.testResults?.length > 0 ? (
                  <div className="space-y-2">
                    {runResult.testResults.map((tr, i) => (
                      <div key={i} className={`rounded-lg p-3 border text-xs font-mono ${
                        tr.passed
                          ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                          : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                      }`}>
                        <div className="flex items-center gap-2 mb-1 font-bold">
                          {tr.passed
                            ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                            : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                          <span className={tr.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                            Test {i + 1}: {tr.passed ? "Passed" : "Failed"}
                          </span>
                        </div>
                        {!tr.passed && (
                          <div className="space-y-1 text-gray-700 dark:text-gray-300">
                            <div><span className="text-gray-400">Expected: </span>{tr.expectedOutput}</div>
                            <div><span className="text-gray-400">Got: </span>{tr.actualOutput}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : runResult ? (
                  <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">{JSON.stringify(runResult, null, 2)}</pre>
                ) : null}
              </div>
            </div>
          )}

          {/* Submit Result Panel */}
          {submitResult && (
            <SubmitResultPanel result={submitResult} polling={polling} />
          )}

          {/* Action Buttons */}
          <div className="shrink-0 px-3 sm:px-4 py-3 sm:py-4 bg-white dark:bg-[#111] border-t border-gray-200 dark:border-gray-800 flex gap-2 sm:gap-3">
            <button
              onClick={handleRun}
              disabled={running || submitting || !code.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-900 dark:text-white rounded-xl font-bold transition-all border border-gray-200 dark:border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-green-500" />}
              Run
            </button>
            {isSolved ? (
              <div className="flex-[1.4] sm:flex-[2] flex items-center justify-center gap-2 px-3 sm:px-6 py-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-xl font-bold text-sm sm:text-base">
                <Trophy className="w-4 h-4" /> Already Solved
              </div>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !code.trim()}
                className="flex-[1.4] sm:flex-[2] flex items-center justify-center gap-2 px-3 sm:px-6 py-3 bg-linear-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold text-sm sm:text-base transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
              >
                {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? (polling ? "Judging..." : "Submitting...") : "Submit Solution"}
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
    <div className={`shrink-0 mx-4 mb-2 rounded-xl border overflow-hidden ${vs.bg} ${vs.border}`}>
      {/* Verdict Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {isJudging
            ? <Loader className={`w-5 h-5 animate-spin ${vs.text}`} />
            : <VIcon className={`w-5 h-5 ${vs.text}`} />}
          <div>
            <div className={`text-base font-black ${vs.text}`}>{result.verdict}</div>
            {!isJudging && result.passedTestCases !== undefined && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {result.passedTestCases}/{result.totalTestCases} test cases passed
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isJudging && result.runtime !== undefined && (
            <div className="text-right text-xs text-gray-500 dark:text-gray-400">
              <div>{result.runtime}ms</div>
              <div>{result.memory}MB</div>
            </div>
          )}
          {isJudging && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <RefreshCw className="w-3 h-3 animate-spin" /> polling...
            </div>
          )}
          {!isJudging && result.testResults?.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>
          )}
        </div>
      </div>

      {/* Error / Compilation output */}
      {!isJudging && result.errorMessage && (
        <div className="px-4 pb-3">
          <pre className="text-xs font-mono bg-black/5 dark:bg-white/5 rounded-lg p-3 whitespace-pre-wrap text-red-600 dark:text-red-400 max-h-28 overflow-y-auto">
            {result.errorMessage}
          </pre>
        </div>
      )}

      {/* Test Results Expanded */}
      {expanded && result.testResults?.length > 0 && (
        <div className="px-4 pb-4 space-y-2 max-h-52 overflow-y-auto border-t border-black/10 dark:border-white/10 pt-3">
          {result.testResults.map((tr, i) => (
            <div key={i} className={`rounded-lg p-3 border text-xs ${
              tr.passed
                ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
            }`}>
              <div className="flex items-center gap-2 font-bold mb-1">
                {tr.passed
                  ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                <span className={tr.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                  Test {i + 1}: {tr.passed ? "Passed" : "Failed"}
                </span>
                {tr.runtime !== undefined && (
                  <span className="ml-auto font-normal text-gray-400">{tr.runtime}ms</span>
                )}
              </div>
              {!tr.passed && (
                <div className="font-mono space-y-1 mt-1 text-gray-700 dark:text-gray-300">
                  {tr.input        && <div><span className="text-gray-400">Input: </span>{tr.input}</div>}
                  {tr.expectedOutput && <div><span className="text-gray-400">Expected: </span>{tr.expectedOutput}</div>}
                  {tr.actualOutput  && <div><span className="text-gray-400">Got: </span>{tr.actualOutput}</div>}
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
