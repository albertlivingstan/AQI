"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Wind, AlertTriangle, Droplets } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-outfit">Live Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time environmental intelligence and forecasting.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            System Live
          </span>
        </div>
      </div>

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Overall AQI</CardTitle>
            <Activity className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-outfit text-white">42</div>
            <p className="text-xs text-emerald-400 mt-1">Good • -3% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">PM2.5 Level</CardTitle>
            <Wind className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-outfit text-white">12.5</div>
            <p className="text-xs text-amber-400 mt-1">Moderate • +1.2 µg/m³</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">AI Forecast (24h)</CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-outfit text-white">48</div>
            <p className="text-xs text-blue-400 mt-1">Stable trend predicted</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold font-outfit text-white">0</div>
            <p className="text-xs text-slate-500 mt-1">No critical warnings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-sm min-h-[400px]">
            <CardHeader>
              <CardTitle className="text-lg font-outfit">AQI Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px] text-slate-500 border border-dashed border-slate-800/50 rounded-lg mx-6 mb-6">
              [Recharts Area Chart will mount here]
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-800/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-outfit">AI Health Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                 <Wind className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                 <div>
                   <p className="text-sm font-medium text-emerald-100">Perfect for Outdoor Activities</p>
                   <p className="text-xs text-emerald-400/80 mt-1">Air quality is excellent. No restrictions for sensitive groups.</p>
                 </div>
               </div>
               
               <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                 <Droplets className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                 <div>
                   <p className="text-sm font-medium text-slate-200">Hydration Reminder</p>
                   <p className="text-xs text-slate-400 mt-1">Humidity is low (32%). Maintain water intake if exercising outdoors.</p>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Temporary inline icon for the dashboard
function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
