import { Play, Clock } from 'lucide-react';
import { useI18n } from '../i18n';
import '../styles/ProgramCard.css';

interface ProgramCardProps {
  name: string;
  isRunning: boolean;
  isDisabled: boolean;
  timeRemaining?: number;
  nextAction?: string;
  onStart: () => void;
}

export default function ProgramCard({
  name,
  isRunning,
  isDisabled,
  timeRemaining,
  nextAction,
  onStart,
}: ProgramCardProps) {
  const { t } = useI18n();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <button
      onClick={onStart}
      disabled={isDisabled}
      className={`program-card ${isRunning ? 'running' : ''} ${isDisabled ? 'disabled' : ''}`}
    >
      <div className="program-card-header">
        <h3 className="program-card-name">{name}</h3>
      </div>
      
      {isRunning ? (
        <div className="program-running">
          <div className="program-info">
            <Clock size={20} className="program-icon pulse" />
            <span className="time-remaining">{formatTime(timeRemaining || 0)}</span>
          </div>
          <span className="next-action">{nextAction}</span>
        </div>
      ) : (
        <div className="program-idle">
          <Play size={32} className="program-icon" />
          <span className="program-status">{t('programCard.start')}</span>
        </div>
      )}
    </button>
  );
}
