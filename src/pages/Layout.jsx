import { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, TrendingUp, BarChart3, Database,
  Settings, ShieldCheck, Sun, Bell, Menu, X, ChevronRight, Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/geomap", icon: Globe, label: "Geo Intelligence" },
  { to: "/forecast", icon: TrendingUp, label: "Forecast" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/data-sources", icon: Database, label: "Data Sources" },
  { to: "/admin", icon: ShieldCheck, label: "Admin Panel" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(n => n.to === location.pathname)?.label || "Dashboard";

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 bg-slate-900 border-r border-slate-800 ${sidebarOpen ? "w-60" : "w-16"}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Sun className="w-4 h-4 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight">SolarAQI</p>
              <p className="text-xs text-slate-400">Forecast Platform</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-sm transition-colors"
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
            {sidebarOpen && <span>Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10">
            <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Sun className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">SolarAQI</p>
                  <p className="text-xs text-slate-400">Forecast Platform</p>
                </div>
              </div>
              <button onClick={() => setMobileSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? "bg-amber-500/15 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-400 hover:text-white"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-200">{currentPage}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            <button className="relative text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          <Outlet />
        </main>

        {/* Mobile bottom nav bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-800 safe-area-inset-bottom">
          <div className="flex">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                    isActive ? "text-amber-400" : "text-slate-500"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-center leading-tight" style={{ fontSize: 9 }}>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}