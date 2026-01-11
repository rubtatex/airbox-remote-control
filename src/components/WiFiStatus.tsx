import { useEffect, useState } from 'react';
import { Wifi, AlertCircle } from 'lucide-react';
import { APIClient } from '../services/api';
import type { WiFiStatus } from '../services/api';
import { useI18n } from '../i18n';
import '../styles/WiFiStatus.css';

export default function WiFiStatusComponent() {
  const [status, setStatus] = useState<WiFiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    fetchWiFiStatus();
    const interval = setInterval(fetchWiFiStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchWiFiStatus = async () => {
    try {
      const data = await APIClient.getWiFiStatus();
      setStatus(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return <div className="wifi-status loading">{t('wifiStatus.loading')}</div>;
  }

  const getSignalLevel = (rssi: number) => {
    if (rssi >= -50) return 4;
    if (rssi >= -60) return 3;
    if (rssi >= -70) return 2;
    if (rssi >= -80) return 1;
    return 0;
  };

  return (
    <div className={`wifi-status ${status.connected ? 'connected' : 'disconnected'}`}>
      <div className="wifi-content">
        {status.connected ? (
          <>
            <Wifi size={20} className="wifi-icon" />
            <div className="wifi-info">
              <div className="wifi-ssid">{status.ssid}</div>
              <div className="wifi-signal">
                <div className="wifi-bars" aria-label={`${getSignalLevel(status.rssi)} / 4`}>
                  {[0, 1, 2, 3].map((idx) => (
                    <span
                      key={idx}
                      className={`wifi-bar ${idx < getSignalLevel(status.rssi) ? 'active' : ''}`}
                      style={{ height: 6 + idx * 4 }}
                    />
                  ))}
                </div>
                <span className="wifi-rssi">{status.rssi} dBm</span>
              </div>
            </div>
            <div className="wifi-ip">{status.ip}</div>
          </>
        ) : (
          <>
            <AlertCircle size={20} className="wifi-icon" />
            <div className="wifi-info">
              <div className="wifi-ssid">{t('wifiStatus.apMode')}</div>
              <div className="wifi-signal">192.168.4.1</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
