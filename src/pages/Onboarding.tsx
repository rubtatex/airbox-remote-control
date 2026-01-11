import React, { useState } from 'react';
import { AlertCircle, Wifi } from 'lucide-react';
import { useI18n } from '../i18n';
import '../styles/Onboarding.css';

interface OnboardingProps {
  onComplete: (ip: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [ip, setIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t, list } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ip.trim()) {
      setError(t('onboarding.errors.ipRequired'));
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      setError(t('onboarding.errors.ipInvalid'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Test connection
      const response = await fetch(`http://${ip}/wifi/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(t('onboarding.errors.failedPing'));
      }

      onComplete(ip);
    } catch (err) {
      setError(t('onboarding.errors.connection'));
      setLoading(false);
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <div className="onboarding-content">
          <Wifi size={64} className="onboarding-icon" />
          <h1>{t('onboarding.title')}</h1>
          <p>{t('onboarding.subtitle')}</p>

          <form onSubmit={handleSubmit} className="onboarding-form">
            <div className="form-group">
              <label htmlFor="ip">{t('onboarding.ipLabel')}</label>
              <input
                id="ip"
                type="text"
                value={ip}
                onChange={(e) => {
                  setIp(e.target.value);
                  setError('');
                }}
                placeholder={t('onboarding.ipPlaceholder')}
                disabled={loading}
                className="ip-input"
              />
              <small className="help-text">
                {t('onboarding.ipHelp')}
              </small>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? t('onboarding.connecting') : t('onboarding.connect')}
            </button>
          </form>

          <div className="info-box">
            <h3>{t('onboarding.beforeStartTitle')}</h3>
            <ul>
              {list('onboarding.beforeStartList').map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
