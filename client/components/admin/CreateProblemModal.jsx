import { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Code } from 'lucide-react';

export default function CreateProblemModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    tags: '',
    constraints: '',
    inputFormat: '',
    outputFormat: '',
    examples: '',
    testCases: '',
    codeTemplates: '',
    starterCode: '',
    hints: '',
    solution: '',
    timeLimit: 2000,
    memoryLimit: 256,
    isPremium: false,
    isPublished: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm({ title: '', description: '', difficulty: 'easy', tags: '' });
      setError('');
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!form.title || !form.description || !form.difficulty) {
        setError('All fields are required.');
        setLoading(false);
        return;
      }
      // Generate slug from title
      const slug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      
      if (!slug) {
        setError('Invalid title. Cannot generate slug.');
        setLoading(false);
        return;
      }
      
      // Parse fields
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const constraints = form.constraints ? form.constraints.split('\n').map(s => s.trim()).filter(Boolean) : [];
      let examples = [];
      try {
        examples = form.examples ? JSON.parse(form.examples) : [];
      } catch { examples = []; }
      let testCases = [];
      try {
        testCases = form.testCases ? JSON.parse(form.testCases) : [];
      } catch { testCases = []; }
      let codeTemplates = {};
      try {
        codeTemplates = form.codeTemplates ? JSON.parse(form.codeTemplates) : {};
      } catch { codeTemplates = {}; }
      let starterCode = {};
      try {
        starterCode = form.starterCode ? JSON.parse(form.starterCode) : {};
      } catch { starterCode = {}; }
      const hints = form.hints ? form.hints.split('\n').map(s => s.trim()).filter(Boolean) : [];
      let solution = {};
      try {
        solution = form.solution ? JSON.parse(form.solution) : {};
      } catch { solution = {}; }
      
      const problemData = {
        title: form.title,
        slug,
        description: form.description,
        difficulty: form.difficulty,
        tags,
        // category removed
        constraints,
        inputFormat: form.inputFormat || undefined,
        outputFormat: form.outputFormat || undefined,
        examples,
        testCases,
        codeTemplates,
        starterCode,
        hints,
        solution: Object.keys(solution).length > 0 ? solution : undefined,
        timeLimit: Number(form.timeLimit) || 2000,
        memoryLimit: Number(form.memoryLimit) || 256,
        isPremium: Boolean(form.isPremium),
        isPublished: Boolean(form.isPublished),
      };
      
      console.log('Problem data being sent:', problemData);
      await onSubmit(problemData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create problem.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1E1E1E] to-[#252525] rounded-2xl shadow-2xl border border-gray-800/50 w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg p-1 transition-all"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center">
            <Code className="w-6 h-6 text-[#4CAF50]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Create Problem</h2>
            <p className="text-sm text-gray-400">Add a new coding challenge</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Title</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none"
              placeholder="Enter problem title"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none min-h-[120px] resize-none"
              placeholder="Describe the problem..."
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none"
              required
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Tags (comma separated)</label>
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#252525] border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:border-[#4CAF50]/50 focus:ring-2 focus:ring-[#4CAF50]/20 transition-all outline-none"
              placeholder="e.g. array, dp, string"
            />
          </div>

          {/* Additional fields for all model data */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Constraints (one per line)</label>
            <textarea name="constraints" value={form.constraints} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[60px]" placeholder="e.g. 1 &lt;= n &lt;= 1000\n1 &lt;= a[i] &lt;= 10^9" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Input Format</label>
            <input name="inputFormat" value={form.inputFormat} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white" placeholder="Input format" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Output Format</label>
            <input name="outputFormat" value={form.outputFormat} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white" placeholder="Output format" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Examples (JSON array)</label>
            <textarea name="examples" value={form.examples} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[60px]" placeholder='[{"input":"1 2","output":"3","explanation":"Sum"}]' />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Test Cases (JSON array)</label>
            <textarea name="testCases" value={form.testCases} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[60px]" placeholder='[{"input":"1 2","expectedOutput":"3","isHidden":false}]' />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Code Templates (JSON object)</label>
            <textarea name="codeTemplates" value={form.codeTemplates} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]" placeholder='{"python":"def solve():\n  pass"}' />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Starter Code (JSON object)</label>
            <textarea name="starterCode" value={form.starterCode} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]" placeholder='{"python":"def solve():\n  pass"}' />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Hints (one per line)</label>
            <textarea name="hints" value={form.hints} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]" placeholder="Hint 1\nHint 2" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">Solution (JSON object)</label>
            <textarea name="solution" value={form.solution} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white min-h-[40px]" placeholder='{"description":"...","code":{"python":"..."}}' />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-gray-400 text-sm font-medium mb-2">Time Limit (ms)</label>
              <input name="timeLimit" type="number" value={form.timeLimit} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-400 text-sm font-medium mb-2">Memory Limit (MB)</label>
              <input name="memoryLimit" type="number" value={form.memoryLimit} onChange={handleChange} className="w-full px-4 py-2 bg-[#252525] border border-gray-800 rounded-xl text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isPremium" checked={form.isPremium} onChange={e => setForm(f => ({ ...f, isPremium: e.target.checked }))} />
            <label className="text-gray-400 text-sm">Premium Problem</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] text-white rounded-xl font-medium hover:shadow-lg hover:shadow-[#4CAF50]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Problem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
