"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Zap, User, CheckCircle, AlertCircle, Github } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleAuthEnabled } from "@/components/GoogleOAuthWrapper";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const googleEnabled = useGoogleAuthEnabled();
  const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const githubEnabled = !!GITHUB_CLIENT_ID;
  const oauthEnabled = googleEnabled || githubEnabled;

  // Google profile completion flow
  const [googleProfileMode, setGoogleProfileMode] = useState(false);
  const [googleCredential, setGoogleCredential] = useState("");
  const [googleUserData, setGoogleUserData] = useState(null);

  // GitHub profile completion flow
  const [githubProfileMode, setGithubProfileMode] = useState(false);
  const [githubUserData, setGithubUserData] = useState(null);

  // Combined: is any OAuth profile completion active?
  const oauthProfileMode = googleProfileMode || githubProfileMode;
  const oauthUserData = googleProfileMode ? googleUserData : githubUserData;

  useEffect(() => {
    if (searchParams.get("google") === "1") {
      const credential = sessionStorage.getItem("google_credential");
      const data = sessionStorage.getItem("google_data");
      if (credential && data) {
        const parsed = JSON.parse(data);
        setGoogleProfileMode(true);
        setGoogleCredential(credential);
        setGoogleUserData(parsed);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setUsername(parsed.suggestedUsername || "");
      }
    } else if (searchParams.get("github") === "1") {
      const data = sessionStorage.getItem("github_data");
      if (data) {
        const parsed = JSON.parse(data);
        setGithubProfileMode(true);
        setGithubUserData(parsed);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setUsername(parsed.suggestedUsername || "");
      }
    }
  }, [searchParams]);

  // Validate password strength
  const getPasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = passwordStrength <= 1 ? 'bg-red-500' : passwordStrength === 2 ? 'bg-yellow-500' : 'bg-green-500';

  // Registration handler
  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }
    if (!agreeTerms) {
      setError("Please agree to terms and conditions");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          username,
          gender,
          dateOfBirth,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess("Registration successful! Please check your email and click the verification link to activate your account.");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // No email verification handler needed

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${API_URL}/api/auth/google-signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.success && data.needsProfile) {
        // New user — show profile completion form
        setGoogleProfileMode(true);
        setGoogleCredential(credentialResponse.credential);
        setGoogleUserData(data.googleData);
        setName(data.googleData.name || "");
        setEmail(data.googleData.email || "");
        setUsername(data.googleData.suggestedUsername || "");
      } else if (data.success) {
        // Existing user — sign in directly
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Google sign-up failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up was unsuccessful. Please try again.");
  };

  // Complete Google profile
  const handleGoogleCompleteProfile = async (e) => {
    e.preventDefault();
    if (!username || !gender || !dateOfBirth) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/google-complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credential: googleCredential,
          username,
          gender,
          dateOfBirth,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Clean up session storage
        sessionStorage.removeItem("google_credential");
        sessionStorage.removeItem("google_data");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to complete profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Complete GitHub profile
  const handleGithubCompleteProfile = async (e) => {
    e.preventDefault();
    if (!username || !gender || !dateOfBirth) {
      setError("Please fill in all required fields");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/github-complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubId: githubUserData.githubId,
          email: githubUserData.email,
          name: githubUserData.name,
          picture: githubUserData.picture,
          username,
          gender,
          dateOfBirth,
        }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.removeItem("github_data");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.message || "Failed to complete profile");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubSignUp = () => {
    sessionStorage.setItem("github_flow", "register");
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`;
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      <Navbar />
      
      {/* Background Gradient */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-400/20 dark:bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-3">
              {oauthProfileMode ? "Complete Your Profile" : "Join CodeWizard"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {oauthProfileMode ? "Just a few more details to get started" : "Start your coding journey today"}
            </p>
          </div>

          {/* Register Card */}
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm shadow-2xl dark:shadow-slate-900/50 rounded-2xl px-6 sm:px-8 py-8 border border-gray-200 dark:border-slate-700">
            
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Success Alert */}
            {success && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 dark:text-green-300 text-sm font-medium">{success}</p>
              </div>
            )}

            {/* OAuth Profile Completion Form (Google or GitHub) */}
            {oauthProfileMode && !success && (
              <form className="space-y-4" onSubmit={googleProfileMode ? handleGoogleCompleteProfile : handleGithubCompleteProfile}>
                {/* OAuth Account Info */}
                <div className={`p-4 ${googleProfileMode ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700'} border rounded-lg mb-2`}>
                  <div className="flex items-center gap-3">
                    {oauthUserData?.picture && (
                      <img src={oauthUserData.picture} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{oauthUserData?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{oauthUserData?.email}</p>
                    </div>
                    <div className="ml-auto">
                      {googleProfileMode ? (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">Google</span>
                      ) : (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full flex items-center gap-1"><Github className="w-3 h-3" /> GitHub</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="choose a username"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Only lowercase letters, numbers, and underscores</p>
                </div>

                {/* Gender Input */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth Input */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                  />
                </div>

                {/* Complete Profile Button */}
                <button
                  type="submit"
                  disabled={loading || !username || !gender || !dateOfBirth}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Sign Up</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Registration Form */}
            {!success && !oauthProfileMode && (
              <form className="space-y-4" onSubmit={handleRegister}>
                {/* Name Input */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Username Input */}
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="johndoe"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Gender Input */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Date of Birth Input */}
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                              i < passwordStrength ? strengthColor : 'bg-gray-300 dark:bg-slate-600'
                            }`}
                          ></div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        {passwordStrength <= 1 ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-red-500" /> Weak password
                          </>
                        ) : passwordStrength === 2 ? (
                          <>
                            <Zap className="w-3 h-3 text-yellow-500" /> Fair password
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" /> Strong password
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500 pointer-events-none" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-white transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`mt-2 text-xs flex items-center gap-1 ${password === confirmPassword ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {password === confirmPassword ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Passwords match
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-start pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-1 rounded border-gray-300 dark:border-slate-600 text-blue-600 dark:bg-slate-900 cursor-pointer accent-blue-600"
                  />
                  <label htmlFor="terms" className="ml-2.5 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                    I agree to the{" "}
                    <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>

                {/* Register Button */}
                <button
                  type="submit"
                  disabled={loading || !agreeTerms || password !== confirmPassword}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
            {/* Success message after registration */}
            {success && (
              <div className="p-6 text-center">
                <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Registration Successful!</h2>
                <p className="text-gray-700 dark:text-gray-300 mb-4">Please check your email and click the verification link to activate your account.</p>
                <a href="/login" className="inline-block mt-2 text-blue-600 dark:text-blue-400 hover:underline font-medium">Back to Login</a>
              </div>
            )}

            {/* Login Link */}
            {!success && !oauthProfileMode && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <a href="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Sign in
                  </a>
                </p>

                {/* Social Sign Up */}
                {oauthEnabled && (
                  <div className="mt-5">
                    <div className="relative mb-5">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 bg-white dark:bg-slate-800/50 text-xs font-medium uppercase tracking-widest text-gray-400 dark:text-gray-500">
                          or sign up with
                        </span>
                      </div>
                    </div>

                    <div className={`grid gap-3 ${googleEnabled && githubEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                      {googleEnabled && (
                        <div
                          id="google-signup-btn"
                          className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-blue-50 to-transparent dark:from-blue-900/10 transition-opacity duration-200 pointer-events-none"></div>
                          <div className="flex items-center justify-center gap-2 py-2.5 px-3">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Google</span>
                          </div>
                          <div className="absolute inset-0 cursor-pointer">
                            <div className="opacity-0 absolute inset-0">
                              <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                theme="outline"
                                size="large"
                                width="999"
                                text="signup_with"
                                shape="rectangular"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {githubEnabled && (
                        <button
                          type="button"
                          onClick={handleGitHubSignUp}
                          disabled={loading}
                          className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-gray-400 dark:hover:border-slate-500 hover:shadow-md transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-gray-50 to-transparent dark:from-slate-800/50 transition-opacity duration-200 pointer-events-none"></div>
                          <div className="flex items-center justify-center gap-2 py-2.5 px-3">
                            <Github className="w-4 h-4 shrink-0 text-gray-800 dark:text-gray-200" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">GitHub</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
