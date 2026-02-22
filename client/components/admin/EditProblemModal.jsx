import { useState, useEffect } from 'react';
import { X, AlertCircle, Pencil } from 'lucide-react';

export default function EditProblemModal({ open, onClose, problem, onUpdated }) {
  const [form, setForm] = useState(problem || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (problem) {
      setForm({
        ...problem,
        tags: Array.isArray(problem.tags) ? problem.tags.join(', ') : '',
        constraints: Array.isArray(problem.constraints) ? problem.constraints.join('\n') : '',
        examples: problem.examples ? JSON.stringify(problem.examples, null, 2) : '',
        testCases: problem.testCases ? JSON.stringify(problem.testCases, null, 2) : '',
        codeTemplates: problem.codeTemplates ? JSON.stringify(problem.codeTemplates, null, 2) : '',
        starterCode: problem.starterCode ? JSON.stringify(problem.starterCode, null, 2) : '',
        hints: Array.isArray(problem.hints) ? problem.hints.join('\n') : '',
        solution: problem.solution ? JSON.stringify(problem.solution, null, 2) : '',
        isPublished: typeof problem.isPublished === 'boolean' ? problem.isPublished : false,
      });
    }
    setError('');
  }, [problem, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse fields
      const tags = typeof form.tags === 'string' 
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) 
        : form.tags;
      
      const constraints = form.constraints 
        ? form.constraints.split('\n').map(s => s.trim()).filter(Boolean) 
        : [];

      let examples = [];
      try {
        examples = form.examples ? JSON.parse(form.examples) : [];
      } catch {
        examples = [];
      }

      let testCases = [];
      try {
        testCases = form.testCases ? JSON.parse(form.testCases) : [];
      } catch {
        testCases = [];
      }

      let codeTemplates = {};
      try {
        codeTemplates = form.codeTemplates ? JSON.parse(form.codeTemplates) : {};
      } catch {
        codeTemplates = {};
      }

      let starterCode = {};
      try {
        starterCode = form.starterCode ? JSON.parse(form.starterCode) : {};
      } catch {
        starterCode = {};
      }

      const hints = form.hints 
        ? form.hints.split('\n').map(s => s.trim()).filter(Boolean) 
        : [];

      let solution = {};
      try {
        solution = form.solution ? JSON.parse(form.solution) : {};
      } catch {
        solution = {};
      }

      const updateData = {
        ...form,
        tags,
        constraints,
        examples,
        testCases,
        codeTemplates,
        starterCode,
        hints,
        solution,
        timeLimit: Number(form.timeLimit) || 2000,
        memoryLimit: Number(form.memoryLimit) || 256,
        isPremium: Boolean(form.isPremium),
        isPublished: Boolean(form.isPublished),
      };

      await onUpdated(updateData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update problem');
    } finally {
      setLoading(false);
    }
  };

  if (!open || !problem) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1E88E5]/10 rounded-lg">
              <Pencil className="w-5 h-5 text-[#1E88E5]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Problem</h2>
              <p className="text-gray-400 text-sm mt-1">Update problem details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Title</label>
            <input
              name="title"
              value={form.title || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none"
              placeholder="Problem title"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={form.description || ''}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none min-h-[100px]"
              placeholder="Problem description"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty || 'easy'}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>


          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Tags (comma separated)</label>
            <input
              name="tags"
              value={form.tags || ''}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#1E88E5]/50 focus:ring-2 focus:ring-[#1E88E5]/20 transition-all outline-none"
              placeholder="e.g. array, dp, string"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Constraints (one per line)</label>
            <textarea
              name="constraints"
              value={form.constraints || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[60px]"
              placeholder="e.g. 1 <= n <= 1000&#10;1 <= a[i] <= 10^9"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Input Format</label>
            <input
              name="inputFormat"
              value={form.inputFormat || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white"
              placeholder="Input format"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Output Format</label>
            <input
              name="outputFormat"
              value={form.outputFormat || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white"
              placeholder="Output format"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Examples (JSON)</label>
            <textarea
              name="examples"
              value={form.examples || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[60px]"
              placeholder='[{"input":"1 2","output":"3","explanation":"Sum"}]'
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Test Cases (JSON)</label>
            <textarea
              name="testCases"
              value={form.testCases || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[60px]"
              placeholder='[{"input":"1 2","expectedOutput":"3","isHidden":false}]'
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Code Templates (JSON)</label>
            <textarea
              name="codeTemplates"
              value={form.codeTemplates || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]"
              placeholder='{"python":"def solve():\n    pass"}'
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Starter Code (JSON)</label>
            <textarea
              name="starterCode"
              value={form.starterCode || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]"
              placeholder='{"python":"def solve():\n    pass"}'
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Hints (one per line)</label>
            <textarea
              name="hints"
              value={form.hints || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]"
              placeholder="Hint 1&#10;Hint 2"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Solution (JSON)</label>
            <textarea
              name="solution"
              value={form.solution || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]"
              placeholder='{"description":"...","code":{"python":"..."}}'
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-400 text-sm font-medium mb-2">Time Limit (ms)</label>
              <input
                name="timeLimit"
                type="number"
                value={form.timeLimit || 2000}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-400 text-sm font-medium mb-2">Memory Limit (MB)</label>
              <input
                name="memoryLimit"
                type="number"
                value={form.memoryLimit || 256}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPremium"
              checked={!!form.isPremium}
              onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))}
              className="w-4 h-4"
            />
            <label className="text-gray-400 text-sm">Premium Problem</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              checked={!!form.isPublished}
              onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))}
              className="w-4 h-4"
            />
            <label className="text-gray-400 text-sm">Published</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl font-medium hover:bg-gray-600 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#1E88E5] to-[#1565C0] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#1E88E5]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}