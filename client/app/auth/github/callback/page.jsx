"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GitHubCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  useEffect(() => {
    const code = searchParams.get("code");
    const flow = sessionStorage.getItem("github_flow") || "login"; // "login" or "register"

    if (!code) {
      setError("No authorization code received from GitHub.");
      return;
    }

    const handleGitHubCallback = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/github-signin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();

        if (data.success && data.needsProfile) {
          // New user — redirect to register to complete profile
          sessionStorage.setItem("github_data", JSON.stringify(data.githubData));
          sessionStorage.removeItem("github_flow");
          router.replace("/register?github=1");
        } else if (data.success) {
          // Existing user — sign in directly
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.removeItem("github_flow");
          router.replace("/dashboard");
        } else {
          setError(data.message || "GitHub sign-in failed");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      }
    };

    handleGitHubCallback();
  }, [searchParams, router, API_URL]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
      {error ? (
        <div className="text-center max-w-md px-6">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <span className="text-red-600 text-xl font-bold">!</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Failed</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Login
          </a>
        </div>
      ) : (
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Signing in with GitHub...</p>
        </div>
      )}
    </div>
  );
}
