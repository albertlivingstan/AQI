import { useState } from "react";
import { Settings as SettingsIcon, Bell, Shield, Sliders, Save, Sun } from "lucide-react";

export default function Settings() {
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [retrain, setRetrain] = useState("daily");
  const [notifications, setNotifications] = useState({ email: true, inApp: true, sms: false });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure platform preferences, alerts, and model parameters</p>
      </div>

      {/* Forecast Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Sliders className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Forecast Configuration</h3>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-2">Default Forecast Horizon</label>
            <div className="flex gap-2">
              {["1h", "6h", "24h", "7d", "30d"].map(h => (
                <button key={h} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${h === "24h" ? "bg-amber-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}>
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-2">Model Retraining Schedule</label>
            <select
              value={retrain}
              onChange={e => setRetrain(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 font-medium mb-2">
              AQI Alert Threshold: <span className="text-amber-400">{alertThreshold}</span>
            </label>
            <input
              type="range"
              min={0}
              max={200}
              value={alertThreshold}
              onChange={e => setAlertThreshold(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Good (0)</span><span>Moderate (100)</span><span>Hazardous (200)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Notification Preferences</h3>
        </div>
        <div className="space-y-4">
          {[
            { key: "email", label: "Email Alerts", desc: "Receive alerts via email for critical events" },
            { key: "inApp", label: "In-App Notifications", desc: "Show real-time alerts in the platform" },
            { key: "sms", label: "SMS Alerts", desc: "Text message alerts for emergencies" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-10 h-5 rounded-full transition-colors ${notifications[key] ? "bg-amber-500" : "bg-slate-700"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications[key] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Security</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm text-white">Two-Factor Authentication</p>
              <p className="text-xs text-slate-400">Secure your account with 2FA</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">Enabled</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm text-white">API Rate Limiting</p>
              <p className="text-xs text-slate-400">1000 req/min per key</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 border border-blue-500/20 text-blue-400">Configured</span>
          </div>
        </div>
      </div>

      <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium transition-colors">
        <Save className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
}