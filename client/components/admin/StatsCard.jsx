import { Users, FileCode, Send, UserCheck, TrendingUp, TrendingDown } from 'lucide-react';

const iconMap = {
  users: Users,
  problems: FileCode,
  submissions: Send,
  employees: UserCheck,
};

const colorMap = {
  green: {
    bg: 'from-[#4CAF50]/10 to-[#2E7D32]/5',
    border: 'border-[#4CAF50]/20',
    icon: 'text-[#4CAF50]',
    iconBg: 'bg-[#4CAF50]/10',
    iconBorder: 'border-[#4CAF50]/30',
    glow: 'bg-[#4CAF50]/5',
    changePositive: 'text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20',
    changeNegative: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  blue: {
    bg: 'from-[#1E88E5]/10 to-[#1565C0]/5',
    border: 'border-[#1E88E5]/20',
    icon: 'text-[#1E88E5]',
    iconBg: 'bg-[#1E88E5]/10',
    iconBorder: 'border-[#1E88E5]/30',
    glow: 'bg-[#1E88E5]/5',
    changePositive: 'text-[#1E88E5] bg-[#1E88E5]/10 border-[#1E88E5]/20',
    changeNegative: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  amber: {
    bg: 'from-[#FFC107]/10 to-[#FFA000]/5',
    border: 'border-[#FFC107]/20',
    icon: 'text-[#FFC107]',
    iconBg: 'bg-[#FFC107]/10',
    iconBorder: 'border-[#FFC107]/30',
    glow: 'bg-[#FFC107]/5',
    changePositive: 'text-[#FFC107] bg-[#FFC107]/10 border-[#FFC107]/20',
    changeNegative: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
};

export default function StatsCard({ title, value, icon, change, color = 'green' }) {
  const Icon = iconMap[icon] || Users;
  const colors = colorMap[color] || colorMap.green;
  const isPositive = change >= 0;

  return (
    <div className="group relative overflow-hidden">
      {/* Glow effect */}
      <div className={`absolute -top-24 -right-24 w-48 h-48 ${colors.glow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
      
      <div className={`relative bg-gradient-to-br ${colors.bg} backdrop-blur-sm border ${colors.border} rounded-xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20`}>
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          
          {/* Change Badge */}
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${
              isPositive ? colors.changePositive : colors.changeNegative
            }`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-1">
          <div className="text-3xl font-bold text-white tracking-tight">
            {value.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 font-medium">{title}</div>
        </div>

        {/* Bottom decoration line */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.bg} opacity-50`}></div>
      </div>
    </div>
  );
}