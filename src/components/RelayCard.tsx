import { Power } from 'lucide-react';
import { useI18n } from '../i18n';
import '../styles/RelayCard.css';

interface RelayCardProps {
  name: string;
  state: number;
  type: 'pump' | 'valve';
  valveMode: 'no' | 'nc';
  enabled: boolean;
  programRunning?: boolean;
  onToggle: () => void;
}

export default function RelayCard({ name, state, type, valveMode, enabled, programRunning, onToggle }: RelayCardProps) {
  const { t } = useI18n();

  // Logique pour les valves: inverser en fonction du mode NO/NC
  const getValveStatus = () => {
    if (type !== 'valve') return null;
    
    // Valve NC (normalement fermée): state=1 → ouverte, state=0 → fermée
    // Valve NO (normalement ouverte): state=1 → fermée, state=0 → ouverte
    if (valveMode === 'nc') {
      return state ? t('relayCard.open') : t('relayCard.closed');
    } else {
      return state ? t('relayCard.closed') : t('relayCard.open');
    }
  };

  const getStatusText = () => {
    if (type === 'valve') {
      return getValveStatus();
    }
    return state ? t('relayCard.active') : t('relayCard.inactive');
  };

  // Logique de couleur:
  // - Pompe: state=1 → verte (on), state=0 → grise (off)
  // - Valve NC: state=1 (ouverte) → verte (on), state=0 (fermée) → grise (off)
  // - Valve NO: state=1 (fermée) → rouge (closed), state=0 (ouverte) → verte (on)
  const getCardClass = () => {
    if (type === 'pump') {
      return state ? 'on' : 'off';
    } else if (type === 'valve') {
      if (valveMode === 'nc') {
        // NC: state=1 (ouverte) = vert, state=0 (fermée) = gris
        return state ? 'on' : 'off';
      } else {
        // NO: state=1 (fermée) = rouge, state=0 (ouverte) = vert
        return state ? 'closed' : 'on';
      }
    }
    return state ? 'on' : 'off';
  };

  return (
    <button
      onClick={onToggle}
      disabled={!enabled || programRunning}
      className={`relay-card ${getCardClass()} ${(!enabled || programRunning) ? 'disabled' : ''}`}
    >
      <div className="relay-card-header">
        <h3 className="relay-card-name">{name}</h3>
        {!enabled && <span className="relay-chip muted">{t('relayCard.disabled')}</span>}
        {programRunning && <span className="relay-chip muted">{t('relayCard.programRunning')}</span>}
      </div>
      <div className="relay-meta">
        <span className="relay-chip">{t(`relayCard.types.${type}`)}</span>
        {type === 'valve' && (
          <span className="relay-chip subtle">{t(`relayCard.valveMode.${valveMode}`)}</span>
        )}
      </div>
      <Power size={32} className="relay-icon" />
      <span className="relay-status">
        {getStatusText()}
      </span>
    </button>
  );
}
