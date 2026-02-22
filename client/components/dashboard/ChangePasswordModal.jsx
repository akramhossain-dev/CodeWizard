import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, X, ShieldCheck, AlertCircle, CheckCircle, KeyRound, Check } from "lucide-react";

// ── Password strength checker ──────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "", bars: 0 };
  const checks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const map = [
    null,
    { label: "Very Weak", color: "bg-red-500", text: "text-red-500", bars: 1 },
    { label: "Weak",      color: "bg-orange-500", text: "text-orange-500", bars: 2 },
    { label: "Fair",      color: "bg-yellow-500", text: "text-yellow-500", bars: 3 },
    { label: "Strong",    color: "bg-blue-500", text: "text-blue-500", bars: 4 },
    { label: "Very Strong", color: "bg-green-500", text: "text-green-500", bars: 5 },
  ];
  return { score, checks, ...(map[score] || map[1]) };
}

// ── Single password input ──────────────────────────────────────────────────
function PasswordInput({ label, name, value, onChange, show, onToggle, icon: Icon, placeholder, minLength, autoComplete }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-2 border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const strength = getStrength(form.newPassword);
  const passwordsMatch = form.confirmPassword && form.newPassword === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.newPassword !== form.confirmPassword;

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setError("");
      setSuccess("");
      setShow({ current: false, new: false, confirm: false });
    }
  }, [open]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const toggle = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError("New password must be different from current password.");
      return;
    }

    setSaving(true);
    const result = await onSave({ currentPassword: form.currentPassword, newPassword: form.newPassword });
    setSaving(false);

    if (result?.success) {
      setSuccess("Password changed successfully!");
      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1800);
    } else {
      setError(result?.message || "Failed to change password. Please try again.");
    }
  };

  if (!open) return null;

  const requirements = [
    { label: "At least 8 characters", met: form.newPassword.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(form.newPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(form.newPassword) },
    { label: "Number", met: /[0-9]/.test(form.newPassword) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(form.newPassword) },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Change Password</h2>
              <p className="text-xs text-blue-100">Keep your account secure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* ── Current Password ── */}
          <PasswordInput
            label="Current Password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            show={show.current}
            onToggle={() => toggle("current")}
            icon={Lock}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />

          {/* ── New Password ── */}
          <div className="space-y-2">
            <PasswordInput
              label="New Password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              show={show.new}
              onToggle={() => toggle("new")}
              icon={KeyRound}
              placeholder="Enter your new password"
              minLength={6}
              autoComplete="new-password"
            />

            {/* Strength Meter */}
            {form.newPassword && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-gray-400">Password strength</span>
                  <span className={strength.text}>{strength.label}</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        bar <= strength.bars ? strength.color : "bg-gray-200 dark:bg-gray-800"
                      }`}
                    />
                  ))}
                </div>

                {/* Requirements */}
                <div className="grid grid-cols-2 gap-1 pt-1">
                  {requirements.map((req) => (
                    <div
                      key={req.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        req.met ? "text-green-500" : "text-gray-400 dark:text-gray-600"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        req.met ? "bg-green-500/15 border border-green-500/30" : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      }`}>
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      {req.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Confirm Password ── */}
          <div>
            <PasswordInput
              label="Confirm New Password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              show={show.confirm}
              onToggle={() => toggle("confirm")}
              icon={ShieldCheck}
              placeholder="Re-enter your new password"
              minLength={6}
              autoComplete="new-password"
            />
            {/* Match indicator */}
            {form.confirmPassword && (
              <div className={`flex items-center gap-1.5 mt-2 text-xs font-semibold ${
                passwordsMatch ? "text-green-500" : "text-red-400"
              }`}>
                {passwordsMatch
                  ? <><CheckCircle className="w-3.5 h-3.5" /> Passwords match</>
                  : <><AlertCircle className="w-3.5 h-3.5" /> Passwords don't match</>
                }
              </div>
            )}
          </div>

          {/* ── Error / Success ── */}
          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {success}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !!passwordsMismatch || !form.currentPassword || !form.newPassword || !form.confirmPassword}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Done!
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}