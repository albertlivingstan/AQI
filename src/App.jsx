import { useState } from "react";
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Analytics from './pages/Analytics';
import DataSources from './pages/DataSources';
import AdminPanel from './pages/AdminPanel';
import Settings from './pages/Settings';
import GeoMap from './pages/GeoMap';
import PageNotFound from './lib/PageNotFound';
import SplashScreen from './components/SplashScreen';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="geomap" element={<GeoMap />} />
        <Route path="forecast" element={<Forecast />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="data-sources" element={<DataSources />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          {!splashFinished && <SplashScreen onComplete={() => setSplashFinished(true)} />}
          {splashFinished && <AuthenticatedApp />}
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App