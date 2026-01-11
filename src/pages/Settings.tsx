import React, { useEffect, useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { APIClient } from '../services/api';
import { useI18n } from '../i18n';
import '../styles/Settings.css';

type RelayKind = 'pump' | 'valve';
type ValveMode = 'no' | 'nc';

interface RelayConfig {
  name: string;
  type: RelayKind;
  valveMode: ValveMode;
  enabled: boolean;
}

interface SettingsProps {
  onReset: () => void;
  espIP: string | null;
}

export default function Settings({ onReset, espIP }: SettingsProps) {
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [relayConfigs, setRelayConfigs] = useState<Record<'in1' | 'in2' | 'in3' | 'in4', RelayConfig>>({
    in1: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
    in2: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
    in3: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
    in4: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
  });
  const [relayMessage, setRelayMessage] = useState<string | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const savedConfig = localStorage.getItem('relayConfigs');
    const legacyNames = localStorage.getItem('relayNames');

    if (savedConfig) {
      setRelayConfigs(JSON.parse(savedConfig));
    } else if (legacyNames) {
      const names = JSON.parse(legacyNames);
      const defaults: RelayConfig = { name: '', type: 'pump', valveMode: 'nc', enabled: true };
      setRelayConfigs({
        in1: { ...defaults, name: names.in1 || t('dashboard.relays.in1') },
        in2: { ...defaults, name: names.in2 || t('dashboard.relays.in2') },
        in3: { ...defaults, name: names.in3 || t('dashboard.relays.in3') },
        in4: { ...defaults, name: names.in4 || t('dashboard.relays.in4') },
      });
    } else {
      setRelayConfigs({
        in1: { name: t('dashboard.relays.in1'), type: 'pump', valveMode: 'nc', enabled: true },
        in2: { name: t('dashboard.relays.in2'), type: 'pump', valveMode: 'nc', enabled: true },
        in3: { name: t('dashboard.relays.in3'), type: 'pump', valveMode: 'nc', enabled: true },
        in4: { name: t('dashboard.relays.in4'), type: 'pump', valveMode: 'nc', enabled: true },
      });
    }
  }, [t]);

  const handleWiFiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wifiSSID.trim() || !wifiPassword.trim()) {
      setMessage({ type: 'error', text: t('settings.messages.fillAll') });
      return;
    }

    setLoading(true);
    try {
      await APIClient.configureWiFi(wifiSSID, wifiPassword);
      setMessage({ type: 'success', text: t('settings.messages.wifiConfigured') });
      setWifiSSID('');
      setWifiPassword('');
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setMessage({ type: 'error', text: t('settings.messages.wifiError') });
    } finally {
      setLoading(false);
    }
  };

  const handleResetWiFi = async () => {
    if (!confirm(t('settings.messages.wifiResetConfirm'))) {
      return;
    }

    setLoading(true);
    try {
      await APIClient.resetWiFi();
      setMessage({ type: 'success', text: t('settings.messages.wifiResetDone') });
      setTimeout(() => {
        onReset();
      }, 2000);
    } catch (err) {
      setMessage({ type: 'error', text: t('settings.messages.wifiError') });
      setLoading(false);
    }
  };

  const handleResetApp = () => {
    if (confirm(t('settings.messages.resetConfirm'))) {
      onReset();
    }
  };

  const handleSaveRelayConfigs = () => {
    localStorage.setItem('relayConfigs', JSON.stringify(relayConfigs));
    localStorage.setItem('relayNames', JSON.stringify(Object.fromEntries(Object.entries(relayConfigs).map(([k, v]) => [k, v.name]))));
    setRelayMessage(t('settings.messages.relayConfigsSaved'));
    setTimeout(() => setRelayMessage(null), 3000);
  };

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>{t('settings.title')}</h1>
      </div>

      <div className="settings-section">
        <h2>{t('settings.sections.info')}</h2>
        <div className="info-box">
          <div className="info-row">
            <span className="info-label">{t('settings.labels.ip')}</span>
            <span className="info-value">{espIP || t('settings.labels.ipMissing')}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h2>{t('settings.sections.wifi')}</h2>
        <form onSubmit={handleWiFiConfig} className="settings-form">
          <div className="form-group">
            <label htmlFor="ssid">{t('settings.labels.wifiSsid')}</label>
            <input
              id="ssid"
              type="text"
              value={wifiSSID}
              onChange={(e) => setWifiSSID(e.target.value)}
              placeholder={t('settings.labels.wifiSsid')}
              disabled={loading}
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('settings.labels.wifiPassword')}</label>
            <input
              id="password"
              type="password"
              value={wifiPassword}
              onChange={(e) => setWifiPassword(e.target.value)}
              placeholder={t('settings.labels.wifiPassword')}
              disabled={loading}
              className="input"
            />
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.type === 'error' && <AlertCircle size={20} />}
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? t('settings.buttons.configuring') : t('settings.buttons.configureWifi')}
          </button>
        </form>
      </div>

      <div className="settings-section">
        <h2>{t('settings.sections.relayTypes')}</h2>
        <div className="settings-form">
          {(['in1', 'in2', 'in3', 'in4'] as const).map((key, idx) => (
            <div className="relay-config" key={key}>
              <div className="form-group">
                <label htmlFor={`relay-${key}-name`}>
                  {t('settings.labels.relayName', { index: idx + 1 })}
                </label>
                <input
                  id={`relay-${key}-name`}
                  type="text"
                  value={relayConfigs[key].name}
                  onChange={(e) => {
                    setRelayConfigs({ ...relayConfigs, [key]: { ...relayConfigs[key], name: e.target.value } });
                    setRelayMessage(null);
                  }}
                  className="input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`relay-${key}-type`}>{t('settings.labels.relayType')}</label>
                  <select
                    id={`relay-${key}-type`}
                    value={relayConfigs[key].type}
                    onChange={(e) => {
                      const type = e.target.value as RelayKind;
                      setRelayConfigs({
                        ...relayConfigs,
                        [key]: {
                          ...relayConfigs[key],
                          type,
                        },
                      });
                      setRelayMessage(null);
                    }}
                  >
                    <option value="pump">{t('relayCard.types.pump')}</option>
                    <option value="valve">{t('relayCard.types.valve')}</option>
                  </select>
                </div>

                {relayConfigs[key].type === 'valve' && (
                  <div className="form-group">
                    <label htmlFor={`relay-${key}-mode`}>{t('settings.labels.valveMode')}</label>
                    <select
                      id={`relay-${key}-mode`}
                      value={relayConfigs[key].valveMode}
                      onChange={(e) => {
                        const valveMode = e.target.value as ValveMode;
                        setRelayConfigs({
                          ...relayConfigs,
                          [key]: { ...relayConfigs[key], valveMode },
                        });
                        setRelayMessage(null);
                      }}
                    >
                      <option value="no">{t('relayCard.valveMode.no')}</option>
                      <option value="nc">{t('relayCard.valveMode.nc')}</option>
                    </select>
                  </div>
                )}

                <div className="form-group checkbox-group">
                  <label htmlFor={`relay-${key}-enabled`} className="checkbox-label">
                    <input
                      id={`relay-${key}-enabled`}
                      type="checkbox"
                      checked={relayConfigs[key].enabled}
                      onChange={(e) => {
                        setRelayConfigs({
                          ...relayConfigs,
                          [key]: { ...relayConfigs[key], enabled: e.target.checked },
                        });
                        setRelayMessage(null);
                      }}
                    />
                    {t('settings.labels.relayEnabled')}
                  </label>
                </div>
              </div>
            </div>
          ))}

          {relayMessage && <div className="message success">{relayMessage}</div>}

          <button onClick={handleSaveRelayConfigs} className="btn-primary">
            {t('settings.buttons.saveRelayConfigs')}
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h2>{t('settings.sections.espActions')}</h2>
        <button
          onClick={handleResetWiFi}
          disabled={loading}
          className="btn-warning"
        >
          <RotateCcw size={20} />
          {t('settings.buttons.resetWifi')}
        </button>
        <p className="help-text">
          {t('settings.help.resetWifi')}
        </p>
      </div>

      <div className="settings-section">
        <h2>{t('settings.sections.localActions')}</h2>
        <button
          onClick={handleResetApp}
          className="btn-danger"
        >
          <RotateCcw size={20} />
          {t('settings.buttons.resetConfig')}
        </button>
        <p className="help-text">
          {t('settings.help.resetConfig')}
        </p>
      </div>
    </div>
  );
}
