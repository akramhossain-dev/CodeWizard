"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const [status, setStatus] = useState("pending"); // pending, success, error
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(5);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  // Ensure component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto redirect countdown
  useEffect(() => {
    if (!isClient || status !== "success") return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      window.location.href = "/login";
    }
  }, [countdown, status, isClient]);

  // Verify email on mount
  useEffect(() => {
    if (!isClient || !searchParams) return;

    const token = searchParams.get("token");
    const userId = searchParams.get("userId");

    if (!token || !userId) {
      setStatus("error");
      setMessage("Invalid verification link. Please check your email again.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, userId }),
        });
        const data = await res.json();
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed. Please try again.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Network error. Please check your connection and try again.");
      }
    };

    verify();
  }, [isClient, searchParams, API_URL]);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-800/50 rounded-2xl px-8 py-12 border border-gray-200 dark:border-slate-700 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <Navbar />

      {/* Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Pending State */}
          {status === "pending" && (
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-2xl dark:shadow-slate-900/50 rounded-2xl px-6 sm:px-8 py-12 border border-gray-200 dark:border-slate-700 text-center space-y-6">
              {/* Animated loader */}
              <div className="flex justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
                  <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Verifying Your Email
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Please wait while we verify your email address. This should only take a moment.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse"></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">Verifying...</p>
              </div>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-2xl dark:shadow-slate-900/50 rounded-2xl px-6 sm:px-8 py-12 border border-gray-200 dark:border-slate-700 text-center space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse"></div>
                  <CheckCircle className="w-20 h-20 text-green-500" style={{ animation: "bounce 1s infinite" }} />
                </div>
              </div>

              {/* Success Message */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Email Verified!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Features unlocked */}
              <div className="space-y-3 py-6 border-t border-b border-gray-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  You can now:
                </p>
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Sign in to your account</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Start solving problems</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Participate in contests</span>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Redirecting to login in <span className="font-bold text-blue-600 dark:text-blue-400">{countdown}</span> seconds...
              </div>
              {/* Action Button */}
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group w-full"
              >
                <span>Go to Login</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-2xl dark:shadow-slate-900/50 rounded-2xl px-6 sm:px-8 py-12 border border-gray-200 dark:border-slate-700 text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse"></div>
                  <AlertCircle className="w-20 h-20 text-red-500" />
                </div>
              </div>

              {/* Error Message */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Verification Failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Troubleshooting */}
              <div className="space-y-3 py-6 border-t border-b border-gray-200 dark:border-slate-700 text-left">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  What you can do:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1">•</span>
                    <span>Check the verification link in your email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1">•</span>
                    <span>Make sure the link hasn't expired</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1">•</span>
                    <span>Try registering again with a new email</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1">•</span>
                    <span>Contact support if the problem persists</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group w-full"
                >
                  <span>Try Again</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 w-full"
                >
                  <span>Go Home</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}

function VerifyEmailFallback() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800/50 rounded-2xl px-8 py-12 border border-gray-200 dark:border-slate-700 text-center">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading verification...</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
