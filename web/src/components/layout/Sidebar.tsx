import Link from 'next/link';
import { LayoutDashboard, Map, TrendingUp, Activity, FileText, Settings, UserCircle, Wind } from 'lucide-react';

const navigation = [
  { name: 'Live Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Global Map', href: '/map', icon: Map },
  { name: 'AQI Forecast', href: '/forecast', icon: TrendingUp },
  { name: 'Health Analytics', href: '/analytics', icon: Activity },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  return (
    <div className="flex h-full w-64 flex-col bg-black/40 backdrop-blur-xl border-r border-slate-800/60 transition-all duration-300 z-20">
      <div className="flex h-16 shrink-0 items-center px-6 gap-3 border-b border-slate-800/60">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Wind className="w-5 h-5 text-emerald-400" />
        </div>
        <span className="text-lg font-bold tracking-tight text-white font-outfit">AeroVision <span className="text-emerald-400">AI</span></span>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            // Highlight dashboard initially as active
            const isActive = item.href === '/';
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="mt-8 border-t border-slate-800/60 pt-6 space-y-2">
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">System</span>
          </div>
          <Link href="/settings" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
            <Settings className="w-5 h-5 shrink-0 text-slate-500 group-hover:text-slate-300" />
            Settings
          </Link>
          <Link href="/profile" className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all">
            <UserCircle className="w-5 h-5 shrink-0 text-slate-500 group-hover:text-slate-300" />
            Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
