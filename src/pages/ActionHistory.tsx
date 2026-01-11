import React from 'react';
import { useI18n } from '../i18n';
import '../styles/ActionHistory.css';

export default function ActionHistory() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const { t, locale } = useI18n();

  React.useEffect(() => {
    const savedLogs = localStorage.getItem('actionLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs).reverse());
    }
  }, []);

  const relayNames: { [key: number]: string } = (() => {
    const saved = localStorage.getItem('relayConfigs');
    if (saved) {
      const cfg = JSON.parse(saved);
      return {
        0: cfg.in1?.name || t('dashboard.relays.in1'),
        1: cfg.in2?.name || t('dashboard.relays.in2'),
        2: cfg.in3?.name || t('dashboard.relays.in3'),
        3: cfg.in4?.name || t('dashboard.relays.in4'),
      };
    }
    return {
      0: t('dashboard.relays.in1'),
      1: t('dashboard.relays.in2'),
      2: t('dashboard.relays.in3'),
      3: t('dashboard.relays.in4'),
    };
  })();

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(locale);
  };

  const getActionLabel = (action: string) => {
    return action === 'ON' ? t('schedule.actions.on') : t('schedule.actions.off');
  };

  const clearHistory = () => {
    if (confirm(t('actionHistory.confirmClear'))) {
      localStorage.setItem('actionLogs', '[]');
      setLogs([]);
    }
  };

  return (
    <div className="action-history">
      <div className="history-header">
        <h1>{t('actionHistory.title')}</h1>
        {logs.length > 0 && (
          <button onClick={clearHistory} className="btn-danger">
            {t('actionHistory.clear')}
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>{t('actionHistory.empty')}</p>
        </div>
      ) : (
        <div className="history-list">
          {logs.map((log) => (
            <div key={log.id} className={`history-item action-${log.action.toLowerCase()}`}>
              <div className="history-info">
                <strong>{relayNames[log.relay] || `${t('schedule.relayLabel')} ${log.relay + 1}`}</strong>
                <span className={`action-badge action-${log.action.toLowerCase()}`}>
                  {getActionLabel(log.action)}
                </span>
              </div>
              <div className="history-time">
                {formatTime(log.timestamp)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
