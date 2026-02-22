import React from 'react';
import { 
  User, 
  Code, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Zap,
  Database,
  Calendar
} from 'lucide-react';

export default function SubmissionsTable({ submissions }) {
  const getVerdictStyle = (verdict) => {
    const styles = {
      'Accepted': {
        bg: 'bg-[#4CAF50]/10',
        text: 'text-[#4CAF50]',
        border: 'border-[#4CAF50]/20',
        icon: CheckCircle
      },
      'Wrong Answer': {
        bg: 'bg-red-500/10',
        text: 'text-red-500',
        border: 'border-red-500/20',
        icon: XCircle
      },
      'Time Limit Exceeded': {
        bg: 'bg-[#FFC107]/10',
        text: 'text-[#FFC107]',
        border: 'border-[#FFC107]/20',
        icon: Clock
      },
      'Runtime Error': {
        bg: 'bg-purple-500/10',
        text: 'text-purple-500',
        border: 'border-purple-500/20',
        icon: AlertCircle
      },
      'Compilation Error': {
        bg: 'bg-orange-500/10',
        text: 'text-orange-500',
        border: 'border-orange-500/20',
        icon: AlertCircle
      },
      'Memory Limit Exceeded': {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500',
        border: 'border-blue-500/20',
        icon: Database
      }
    };
    return styles[verdict] || {
      bg: 'bg-gray-500/10',
      text: 'text-gray-500',
      border: 'border-gray-500/20',
      icon: AlertCircle
    };
  };

  const getLanguageColor = (language) => {
    const colors = {
      javascript: 'bg-[#F7DF1E]/10 text-[#F7DF1E] border-[#F7DF1E]/20',
      python: 'bg-[#3776AB]/10 text-[#3776AB] border-[#3776AB]/20',
      java: 'bg-[#007396]/10 text-[#5382A1] border-[#007396]/20',
      cpp: 'bg-[#00599C]/10 text-[#00599C] border-[#00599C]/20',
      c: 'bg-[#A8B9CC]/10 text-[#A8B9CC] border-[#A8B9CC]/20',
      go: 'bg-[#00ADD8]/10 text-[#00ADD8] border-[#00ADD8]/20',
      rust: 'bg-[#CE412B]/10 text-[#CE412B] border-[#CE412B]/20',
      typescript: 'bg-[#3178C6]/10 text-[#3178C6] border-[#3178C6]/20',
    };
    return colors[language?.toLowerCase()] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No submissions to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Problem
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Language
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Verdict
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Runtime
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Memory
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Submitted
            </th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s, index) => {
            const verdictStyle = getVerdictStyle(s.verdict);
            const VerdictIcon = verdictStyle.icon;
            
            return (
              <tr 
                key={s._id} 
                className={`border-b border-gray-800 transition-all hover:bg-[#252525]/50 ${
                  index % 2 === 0 ? 'bg-[#1E1E1E]/30' : 'bg-transparent'
                }`}
              >
                {/* User Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {s.userId?.profilePicture ? (
                      <img 
                        src={s.userId.profilePicture} 
                        alt={s.userId.name || 'User'} 
                        className="w-9 h-9 rounded-full border-2 border-gray-800 object-cover"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-800">
                        {(s.userId?.name || s.userId?.username || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-white text-sm">
                        {s.userId?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        @{s.userId?.username || 'unknown'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Problem Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#4CAF50]/10 border border-[#4CAF50]/20 flex items-center justify-center flex-shrink-0">
                      <Code className="w-4 h-4 text-[#4CAF50]" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {s.problemId?.title || 'Unknown Problem'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {s.problemId?.slug || 'unknown-slug'}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Language Column */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize ${getLanguageColor(s.language)}`}>
                    <div className="w-2 h-2 rounded-full bg-current"></div>
                    {s.language}
                  </span>
                </td>

                {/* Verdict Column */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${verdictStyle.bg} ${verdictStyle.text} ${verdictStyle.border}`}>
                    <VerdictIcon className="w-3.5 h-3.5" />
                    {s.verdict}
                  </span>
                </td>

                {/* Runtime Column */}
                <td className="px-6 py-4">
                  {s.runtime ? (
                    <div className="flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-[#FFC107]" />
                      <span className="text-sm text-gray-300 font-mono">
                        {s.runtime}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">-</span>
                  )}
                </td>

                {/* Memory Column */}
                <td className="px-6 py-4">
                  {s.memory ? (
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[#1E88E5]" />
                      <span className="text-sm text-gray-300 font-mono">
                        {s.memory}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-600">-</span>
                  )}
                </td>

                {/* Submitted At Column */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    <div>
                      <div className="text-sm text-gray-300">
                        {formatDate(s.submittedAt)}
                      </div>
                      <div className="text-xs text-gray-600">
                        {new Date(s.submittedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}