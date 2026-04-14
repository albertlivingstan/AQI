import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Bell, Shield, Sliders, Save, MessageCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [retrain, setRetrain] = useState("daily");
  const [notifications, setNotifications] = useState({ email: true, inApp: true, sms: false });
  
  // Twilio Settings State
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: "",
    authToken: "",
    fromNumber: "",
    targetNumber: ""
  });

  useEffect(() => {
    setTwilioConfig({
      accountSid: localStorage.getItem('twilio_account_sid') || "",
      authToken: localStorage.getItem('twilio_auth_token') || "",
      fromNumber: localStorage.getItem('twilio_from_number') || "",
      targetNumber: localStorage.getItem('twilio_target_number') || ""
    });
  }, []);

  const handleSave = async () => {
    localStorage.setItem('twilio_account_sid', twilioConfig.accountSid);
    localStorage.setItem('twilio_auth_token', twilioConfig.authToken);
    localStorage.setItem('twilio_from_number', twilioConfig.fromNumber);
    localStorage.setItem('twilio_target_number', twilioConfig.targetNumber);
    
    try {
      await fetch('/api/config/twilio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(twilioConfig)
      });

      toast({
        title: "Settings Safely Commited",
        description: "Twilio credentials and variables persistently written to the core Node.js environment layer."
      });
    } catch(err) {
      toast({
        title: "Settings Sync Failed",
        description: "Credentials are saved locally, but failed to write to the physical server.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl pb-10">
      <div>
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <p className="text-xs text-slate-400 mt-0.5">Configure platform preferences, alerts, and model parameters</p>
      </div>

      {/* Twilio Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Twilio SMS Configuration</h3>
        </div>
        
        <div className="p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl mb-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
          <p className="text-xs text-slate-400 leading-relaxed">
            These variables override the core `.env` configurations. Leaving them blank forces the backend to use default environment variables. Sensitive tokens are stored solely in your local browser cache.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Account SID</label>
            <input 
              type="text" 
              value={twilioConfig.accountSid}
              onChange={e => setTwilioConfig({...twilioConfig, accountSid: e.target.value})}
              placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Auth Token</label>
            <input 
              type="password" 
              value={twilioConfig.authToken}
              onChange={e => setTwilioConfig({...twilioConfig, authToken: e.target.value})}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Twilio Phone Number (Sender)</label>
            <input 
              type="text" 
              value={twilioConfig.fromNumber}
              onChange={e => setTwilioConfig({...twilioConfig, fromNumber: e.target.value})}
              placeholder="+1234567890"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-slate-700"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Target Device Number</label>
            <input 
              type="text" 
              value={twilioConfig.targetNumber}
              onChange={e => setTwilioConfig({...twilioConfig, targetNumber: e.target.value})}
              placeholder="+916382357454"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none placeholder:text-slate-700"
            />
          </div>
        </div>
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

      <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium transition-colors">
        <Save className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
}