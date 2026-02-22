import { useRef, useState, useCallback } from "react";
import { Upload, X, Image, CheckCircle, AlertCircle, Camera } from "lucide-react";

export default function ProfileImageUpload({ currentImage, onUpload, open, onClose }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError("");
    setSuccess("");
  };

  const handleFileChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select an image."); return; }
    setUploading(true);
    setError("");
    setSuccess("");
    const result = await onUpload(file);
    if (result?.success) {
      setSuccess("Profile picture updated successfully!");
      setFile(null);
      setTimeout(() => { setSuccess(""); onClose(); }, 1500);
    } else {
      setError(result?.message || "Failed to upload. Try again.");
    }
    setUploading(false);
  };

  const handleClose = () => {
    setPreview(null);
    setFile(null);
    setError("");
    setSuccess("");
    onClose();
  };

  if (!open) return null;

  const displaySrc = preview || currentImage;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-violet-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Update Profile Picture</h2>
              <p className="text-xs text-blue-100">JPG, PNG, or GIF · Max 5MB</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {/* Current Preview */}
          <div className="flex justify-center">
            <div className="relative group">
              {displaySrc ? (
                <img
                  src={displaySrc}
                  alt="Preview"
                  className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-xl">
                  <Image className="w-10 h-10 text-white/70" />
                </div>
              )}
              {/* Overlay on hover */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white mb-1" />
                <span className="text-white text-xs font-bold">Change</span>
              </button>
              {/* New badge */}
              {file && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-black rounded-full shadow">
                  NEW
                </div>
              )}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
              dragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 scale-[1.02]"
                : file
                ? "border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-500/10"
                : "border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file.size / 1024).toFixed(0)} KB · Click to change
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  dragging ? "bg-blue-500/20" : "bg-gray-100 dark:bg-[#1a1a1a]"
                }`}>
                  <Upload className={`w-6 h-6 transition-colors ${
                    dragging ? "text-blue-500" : "text-gray-400"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {dragging ? "Drop it here!" : "Drop image or click to browse"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                    JPG, PNG, GIF up to 5MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] rounded-xl border border-gray-200 dark:border-gray-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}