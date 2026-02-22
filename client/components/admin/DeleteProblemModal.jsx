import { useState, useEffect } from 'react';
import { X, AlertCircle, Trash2 } from 'lucide-react';

export default function DeleteProblemModal({ open, onClose, problem, onDeleted }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    setError('');
  }, [open]);
  
  if (!open || !problem) return null;
  
  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await onDeleted();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete problem');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-red-900/30 w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Delete Problem</h2>
            <p className="text-sm text-gray-400">This action cannot be undone</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
          <p className="text-gray-300 text-sm">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-white">{problem.title}</span>?
            All associated submissions and data will be permanently removed.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete Problem'}
          </button>
        </div>
      </div>
    </div>
  );
}
