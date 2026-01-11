import { useEffect, useState } from 'react';
import { AlertCircle, AlertOctagon, Settings, Home, History, Calendar } from 'lucide-react';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import ActionHistory from './pages/ActionHistory';
import SettingsPage from './pages/Settings';
import { APIClient } from './services/api';
import { useI18n } from './i18n';
import LanguageSwitcher from './components/LanguageSwitcher';
import './App.css';

type Page = 'home' | 'settings' | 'history' | 'schedule';

interface AppState {
  espIP: string | null;
  isConfigured: boolean;
}

function App() {
  const { t } = useI18n();
  const [appState, setAppState] = useState<AppState>({
    espIP: localStorage.getItem('espIP'),
    isConfigured: !!localStorage.getItem('espIP'),
  });
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [error, setError] = useState<string | null>(null);
  const [isEmergencyStop, setIsEmergencyStop] = useState(false);

  useEffect(() => {
    if (appState.isConfigured && appState.espIP) {
      APIClient.setBaseURL(appState.espIP);
    }
  }, [appState.espIP, appState.isConfigured]);

  const handleOnboarding = (ip: string) => {
    localStorage.setItem('espIP', ip);
    APIClient.setBaseURL(ip);
    setAppState({
      espIP: ip,
      isConfigured: true,
    });
  };

  const handleReset = () => {
    localStorage.removeItem('espIP');
    localStorage.removeItem('relayNames');
    setAppState({
      espIP: null,
      isConfigured: false,
    });
    setCurrentPage('home');
  };

  const handleEmergencyStop = async () => {
    setIsEmergencyStop(true);
    
    try {
      // Set all relays to 0 (per-relay for reliability)
      await Promise.all([
        APIClient.setRelay(0, 0),
        APIClient.setRelay(1, 0),
        APIClient.setRelay(2, 0),
        APIClient.setRelay(3, 0),
      ]);
    } catch (err) {
      setError(t('app.emergencyStopError'));
    }
    
    // Reset flag after a short delay
    setTimeout(() => setIsEmergencyStop(false), 100);
  };

  if (!appState.isConfigured) {
    return (
      <div className="app">
        <div className="app-toolbar">
          <LanguageSwitcher />
        </div>
        <Onboarding onComplete={handleOnboarding} />
      </div>
    );
  }

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="app-toolbar">
        <button 
          className="emergency-stop-btn"
          onClick={handleEmergencyStop}
          title={t('app.emergencyStop')}
        >
          <AlertOctagon size={20} />
          {t('app.emergencyStop')}
        </button>
        <LanguageSwitcher />
      </div>

      <main className="main-content">
        {currentPage === 'home' && <Dashboard onError={setError} onEmergencyStop={handleEmergencyStop} isEmergencyStop={isEmergencyStop} />}
        {currentPage === 'schedule' && <Schedule />}
        {currentPage === 'history' && <ActionHistory />}
        {currentPage === 'settings' && <SettingsPage onReset={handleReset} espIP={appState.espIP} />}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-button ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => setCurrentPage('home')}
          title={t('nav.home')}
        >
          <Home size={24} />
          <span>{t('nav.home')}</span>
        </button>
        <button
          className={`nav-button ${currentPage === 'schedule' ? 'active' : ''}`}
          onClick={() => setCurrentPage('schedule')}
          title={t('nav.schedule')}
        >
          <Calendar size={24} />
          <span>{t('nav.schedule')}</span>
        </button>
        <button
          className={`nav-button ${currentPage === 'history' ? 'active' : ''}`}
          onClick={() => setCurrentPage('history')}
          title={t('nav.history')}
        >
          <History size={24} />
          <span>{t('nav.history')}</span>
        </button>
        <button
          className={`nav-button ${currentPage === 'settings' ? 'active' : ''}`}
          onClick={() => setCurrentPage('settings')}
          title={t('nav.settings')}
        >
          <Settings size={24} />
          <span>{t('nav.settings')}</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
