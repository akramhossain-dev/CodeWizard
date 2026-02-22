import { useState } from "react";
import {
  X,
  User,
  MapPin,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Briefcase,
  GraduationCap,
  Save,
  AlertCircle,
} from "lucide-react";

const tabs = [
  { id: "basic", label: "Basic Info", icon: User },
  { id: "social", label: "Social", icon: Globe },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
];

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all";
const lockedInputCls = `${inputCls} opacity-60 cursor-not-allowed`;

export default function EditProfileModal({ open, onClose, user, onSave }) {
  const buildForm = (u) => ({
    name: u?.name || "",
    email: u?.email || "",
    username: u?.username || "",
    bio: u?.bio || "",
    gender: u?.gender || "",
    dateOfBirth: u?.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
    location: u?.location || "",
    website: u?.socialLinks?.website || "",
    github: u?.socialLinks?.github || "",
    linkedin: u?.socialLinks?.linkedin || "",
    twitter: u?.socialLinks?.twitter || "",
    company: u?.work?.company || "",
    position: u?.work?.position || "",
    workStartDate: u?.work?.startDate ? u.work.startDate.slice(0, 10) : "",
    workEndDate: u?.work?.endDate ? u.work.endDate.slice(0, 10) : "",
    workPresent: u?.work?.present || false,
    institution: u?.education?.institution || "",
    degree: u?.education?.degree || "",
    fieldOfStudy: u?.education?.fieldOfStudy || "",
    eduStartDate: u?.education?.startDate ? u.education.startDate.slice(0, 10) : "",
    eduEndDate: u?.education?.endDate ? u.education.endDate.slice(0, 10) : "",
    eduPresent: u?.education?.present || false,
    skills: Array.isArray(u?.skills) ? u.skills.join(", ") : "",
    interests: Array.isArray(u?.interests) ? u.interests.join(", ") : "",
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(() => buildForm(user));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "workPresent" && checked ? { workEndDate: "" } : {}),
      ...(name === "eduPresent" && checked ? { eduEndDate: "" } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">Edit Profile</h2>
              <p className="text-xs text-blue-100">Update your personal information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d] flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-[#111]"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto p-6">

            {/* ── BASIC INFO ── */}
            {activeTab === "basic" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Full Name" required>
                    <input type="text" name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Your full name" required />
                  </Field>
                  <Field label="Username" required>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">@</span>
                      <input type="text" name="username" value={form.username} className={`${lockedInputCls} pl-8`} disabled />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Locked
                      </div>
                    </div>
                  </Field>
                  <Field label="Email">
                    <div className="relative">
                      <input type="email" name="email" value={form.email} className={lockedInputCls} disabled />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Locked
                      </div>
                    </div>
                  </Field>
                  <Field label="Location">
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" name="location" value={form.location} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="City, Country" />
                    </div>
                  </Field>
                  <Field label="Gender">
                    <select name="gender" value={form.gender} className={lockedInputCls} disabled>
                      <option value="">Not specified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </Field>
                  <Field label="Date of Birth">
                    <div className="relative">
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={form.dateOfBirth}
                        className={lockedInputCls}
                        disabled
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-gray-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Locked
                      </div>
                    </div>
                  </Field>
                </div>
                <Field label="Bio">
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    className={`${inputCls} resize-none`}
                    rows={3}
                    placeholder="Tell others about yourself..."
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {form.bio.length}/500 chars
                  </div>
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Skills (comma separated)">
                    <input
                      type="text"
                      name="skills"
                      value={form.skills}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="JavaScript, C++, React"
                    />
                  </Field>
                  <Field label="Interests (comma separated)">
                    <input
                      type="text"
                      name="interests"
                      value={form.interests}
                      onChange={handleChange}
                      className={inputCls}
                      placeholder="Algorithms, AI, Backend"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── SOCIAL ── */}
            {activeTab === "social" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl px-4 py-3">
                  Add your social profiles so others can connect with you.
                </p>
                <Field label="Website">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                    <input type="url" name="website" value={form.website} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="https://yourwebsite.com" />
                  </div>
                </Field>
                <Field label="GitHub">
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <input type="url" name="github" value={form.github} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="https://github.com/username" />
                  </div>
                </Field>
                <Field label="LinkedIn">
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                    <input type="url" name="linkedin" value={form.linkedin} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="https://linkedin.com/in/username" />
                  </div>
                </Field>
                <Field label="Twitter / X">
                  <div className="relative">
                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                    <input type="url" name="twitter" value={form.twitter} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="https://twitter.com/username" />
                  </div>
                </Field>
              </div>
            )}

            {/* ── WORK ── */}
            {activeTab === "work" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 rounded-xl px-4 py-3">
                  Share your professional experience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Company">
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                      <input type="text" name="company" value={form.company} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="Company name" />
                    </div>
                  </Field>
                  <Field label="Position">
                    <input type="text" name="position" value={form.position} onChange={handleChange} className={inputCls} placeholder="Your role / title" />
                  </Field>
                  <Field label="Start Date">
                    <input type="date" name="workStartDate" value={form.workStartDate} onChange={handleChange} className={inputCls} />
                  </Field>
                  <Field label="End Date">
                    <input
                      type="date"
                      name="workEndDate"
                      value={form.workEndDate}
                      onChange={handleChange}
                      className={`${inputCls} ${form.workPresent ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={form.workPresent}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${form.workPresent ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-700 group-hover:border-green-400"}`}>
                    {form.workPresent && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <input type="checkbox" name="workPresent" checked={form.workPresent} onChange={handleChange} className="hidden" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Currently working here</span>
                  {form.workPresent && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">Present</span>}
                </label>
              </div>
            )}

            {/* ── EDUCATION ── */}
            {activeTab === "education" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl px-4 py-3">
                  Share your educational background.
                </p>
                <Field label="Institution">
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    <input type="text" name="institution" value={form.institution} onChange={handleChange} className={`${inputCls} pl-9`} placeholder="School or university name" />
                  </div>
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Degree">
                    <input type="text" name="degree" value={form.degree} onChange={handleChange} className={inputCls} placeholder="e.g. BSc, MSc, PhD" />
                  </Field>
                  <Field label="Field of Study">
                    <input type="text" name="fieldOfStudy" value={form.fieldOfStudy} onChange={handleChange} className={inputCls} placeholder="e.g. Computer Science" />
                  </Field>
                  <Field label="Start Date">
                    <input type="date" name="eduStartDate" value={form.eduStartDate} onChange={handleChange} className={inputCls} />
                  </Field>
                  <Field label="End Date">
                    <input
                      type="date"
                      name="eduEndDate"
                      value={form.eduEndDate}
                      onChange={handleChange}
                      className={`${inputCls} ${form.eduPresent ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={form.eduPresent}
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${form.eduPresent ? "bg-green-500 border-green-500" : "border-gray-300 dark:border-gray-700 group-hover:border-green-400"}`}>
                    {form.eduPresent && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <input type="checkbox" name="eduPresent" checked={form.eduPresent} onChange={handleChange} className="hidden" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Currently studying here</span>
                  {form.eduPresent && <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">Present</span>}
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0d0d0d] flex-shrink-0">
            {/* Tab navigation */}
            <div className="flex gap-1">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-2 h-2 rounded-full transition-all ${activeTab === tab.id ? "bg-blue-500 w-6" : "bg-gray-300 dark:bg-gray-700"}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="group flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
