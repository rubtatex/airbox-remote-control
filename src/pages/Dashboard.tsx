import { useEffect, useState, useRef } from 'react';
import { APIClient } from '../services/api';
import type { RelayState } from '../services/api';
import RelayCard from '../components/RelayCard';
import ProgramCard from '../components/ProgramCard';
import WiFiStatus from '../components/WiFiStatus';
import { useI18n } from '../i18n';
import '../styles/Dashboard.css';

interface DashboardProps {
  onError: (error: string | null) => void;
  onEmergencyStop?: () => void;
  isEmergencyStop: boolean;
}

type RelayKind = 'pump' | 'valve';
type ValveMode = 'no' | 'nc';

interface RelayConfig {
  name: string;
  type: RelayKind;
  valveMode: ValveMode;
  enabled: boolean;
}

interface ProgramStep {
  id: string;
  type: 'relay' | 'wait' | 'loop';
  relay?: number;
  action?: 'ON' | 'OFF';
  durationType?: 'fixed' | 'random';
  duration?: number;
  durationMin?: number;
  durationMax?: number;
  iterations?: number;
  loopSteps?: ProgramStep[];
}

interface Program {
  id: string;
  name: string;
  enabled: boolean;
  steps: ProgramStep[];
}

interface RunningProgram {
  programId: string;
  currentStepIndex: number;
  timeRemaining: number;
}

export default function Dashboard({ onError, isEmergencyStop }: DashboardProps) {
  const [relayState, setRelayState] = useState<RelayState | null>(null);
  const [relayConfigs, setRelayConfigs] = useState<Record<'in1' | 'in2' | 'in3' | 'in4', RelayConfig>>({
    in1: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
    in2: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
    in3: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
    in4: { name: '', type: 'pump', valveMode: 'nc', enabled: true },
  });
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [runningProgram, setRunningProgram] = useState<RunningProgram | null>(null);
  const timerRef = useRef<number | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const savedConfig = localStorage.getItem('relayConfigs');
    const legacyNames = localStorage.getItem('relayNames');

    if (savedConfig) {
      setRelayConfigs(JSON.parse(savedConfig));
    } else if (legacyNames) {
      const names = JSON.parse(legacyNames);
      const defaults: RelayConfig = { name: '', type: 'pump', valveMode: 'nc', enabled: true };
      const cfg = {
        in1: { ...defaults, name: names.in1 || t('dashboard.relays.in1') },
        in2: { ...defaults, name: names.in2 || t('dashboard.relays.in2') },
        in3: { ...defaults, name: names.in3 || t('dashboard.relays.in3') },
        in4: { ...defaults, name: names.in4 || t('dashboard.relays.in4') },
      } as const;
      setRelayConfigs(cfg);
      localStorage.setItem('relayConfigs', JSON.stringify(cfg));
    } else {
      const cfg = {
        in1: { name: t('dashboard.relays.in1'), type: 'pump', valveMode: 'nc', enabled: true },
        in2: { name: t('dashboard.relays.in2'), type: 'pump', valveMode: 'nc', enabled: true },
        in3: { name: t('dashboard.relays.in3'), type: 'pump', valveMode: 'nc', enabled: true },
        in4: { name: t('dashboard.relays.in4'), type: 'pump', valveMode: 'nc', enabled: true },
      } as const;
      setRelayConfigs(cfg);
      localStorage.setItem('relayConfigs', JSON.stringify(cfg));
    }

    // Load programs
    const savedPrograms = localStorage.getItem('programs_v2');
    if (savedPrograms) {
      try {
        const parsed = JSON.parse(savedPrograms) as Program[];
        setPrograms(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPrograms([]);
      }
    }

    fetchRelayState();
    const interval = setInterval(fetchRelayState, 2000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('relayConfigs');
    if (!saved) {
      const cfg = {
        in1: { name: t('dashboard.relays.in1'), type: 'pump', valveMode: 'nc', enabled: true },
        in2: { name: t('dashboard.relays.in2'), type: 'pump', valveMode: 'nc', enabled: true },
        in3: { name: t('dashboard.relays.in3'), type: 'pump', valveMode: 'nc', enabled: true },
        in4: { name: t('dashboard.relays.in4'), type: 'pump', valveMode: 'nc', enabled: true },
      } as const;
      setRelayConfigs(cfg);
      localStorage.setItem('relayConfigs', JSON.stringify(cfg));
    }
  }, [t]);

  // Stop running program on emergency stop and refresh relay state
  useEffect(() => {
    if (isEmergencyStop) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRunningProgram(null);
      // Immediately reflect OFF state in UI
      setRelayState((prev) => prev ? { in1: 0, in2: 0, in3: 0, in4: 0 } : prev);
      // Refresh state to reflect all relays OFF immediately
      fetchRelayState();
    }
  }, [isEmergencyStop]);

  const fetchRelayState = async () => {
    try {
      const state = await APIClient.getRelayState();
      setRelayState(state);
      onError(null);
      setLoading(false);
    } catch (err) {
      onError(t('app.connectionError'));
      setLoading(false);
    }
  };

  const handleToggleRelay = async (relayIndex: number) => {
    if (!relayState) return;

    const relays = ['in1', 'in2', 'in3', 'in4'] as const;
    const currentRelay = relays[relayIndex];
    if (!relayConfigs[currentRelay].enabled) return;
    const newState = relayState[currentRelay] ? 0 : 1;

    try {
      await APIClient.setRelay(relayIndex, newState);
      
      // Log action
      logAction(relayIndex, newState);
      
      // Update local state immediately
      setRelayState({
        ...relayState,
        [currentRelay]: newState,
      });
    } catch (err) {
      onError(t('app.relayControlError'));
    }
  };

  const logAction = (relayIndex: number, state: number) => {
    const logs = JSON.parse(localStorage.getItem('actionLogs') || '[]');
    logs.push({
      id: Date.now().toString(),
      relay: relayIndex,
      action: state ? 'ON' : 'OFF',
      timestamp: Date.now(),
    });
    // Keep only last 100 actions
    if (logs.length > 100) logs.shift();
    localStorage.setItem('actionLogs', JSON.stringify(logs));
  };

  const getActionDescription = (relay: number, action: 'ON' | 'OFF'): string => {
    const relayKeys = ['in1', 'in2', 'in3', 'in4'] as const;
    const config = relayConfigs[relayKeys[relay]];
    
    if (config.type === 'pump') {
      return action === 'ON' ? t('schedule.actions.activate') : t('schedule.actions.deactivate');
    } else {
      if (config.valveMode === 'nc') {
        return action === 'ON' ? t('schedule.actions.open') : t('schedule.actions.close');
      } else {
        return action === 'ON' ? t('schedule.actions.close') : t('schedule.actions.open');
      }
    }
  };

  const handleStartProgram = async (programId: string) => {
    if (runningProgram) return;
    
    const program = programs.find(p => p.id === programId);
    if (!program || program.steps.length === 0) return;

    setRunningProgram({
      programId,
      currentStepIndex: 0,
      timeRemaining: 0,
    });

    executeStep(program, 0);
  };

  const executeStep = async (program: Program, stepIndex: number) => {
    if (stepIndex >= program.steps.length) {
      // Program finished
      setRunningProgram(null);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const step = program.steps[stepIndex];

    if (step.type === 'relay') {
      // Execute relay action
      try {
        const state = step.action === 'ON' ? 1 : 0;
        await APIClient.setRelay(step.relay!, state);
        logAction(step.relay!, state);
        
        // Immediately move to next step
        executeStep(program, stepIndex + 1);
      } catch (err) {
        onError(t('app.relayControlError'));
        setRunningProgram(null);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } else if (step.type === 'wait') {
      // Calculate wait duration
      let duration: number;
      if (step.durationType === 'fixed') {
        duration = step.duration!;
      } else {
        const min = step.durationMin!;
        const max = step.durationMax!;
        duration = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      setRunningProgram({
        programId: program.id,
        currentStepIndex: stepIndex,
        timeRemaining: duration,
      });

      // Timer countdown
      if (timerRef.current) clearInterval(timerRef.current);
      
      let remaining = duration;
      timerRef.current = setInterval(() => {
        remaining--;
        
        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Move to next step
          executeStep(program, stepIndex + 1);
        } else {
          setRunningProgram(prev => prev ? { ...prev, timeRemaining: remaining } : null);
        }
      }, 1000);
    } else if (step.type === 'loop') {
      // Execute loop - repeat loopSteps iterations times
      const executeLoopRecursive = async (iteration: number) => {
        if (iteration > step.iterations!) {
          // All iterations complete, move to next step
          executeStep(program, stepIndex + 1);
          return;
        }

        // Execute all steps in the loop
        const executeLoopSteps = async (loopStepIndex: number) => {
          if (loopStepIndex >= step.loopSteps!.length) {
            // All steps in this iteration done, start next iteration
            executeLoopRecursive(iteration + 1);
            return;
          }

          const loopStep = step.loopSteps![loopStepIndex];

          if (loopStep.type === 'relay') {
            try {
              const state = loopStep.action === 'ON' ? 1 : 0;
              await APIClient.setRelay(loopStep.relay!, state);
              logAction(loopStep.relay!, state);
              executeLoopSteps(loopStepIndex + 1);
            } catch (err) {
              onError(t('app.relayControlError'));
              setRunningProgram(null);
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
            }
          } else if (loopStep.type === 'wait') {
            let duration: number;
            if (loopStep.durationType === 'fixed') {
              duration = loopStep.duration!;
            } else {
              const min = loopStep.durationMin!;
              const max = loopStep.durationMax!;
              duration = Math.floor(Math.random() * (max - min + 1)) + min;
            }

            setRunningProgram({
              programId: program.id,
              currentStepIndex: stepIndex,
              timeRemaining: duration,
            });

            if (timerRef.current) clearInterval(timerRef.current);
            
            let remaining = duration;
            timerRef.current = setInterval(() => {
              remaining--;
              
              if (remaining <= 0) {
                if (timerRef.current) {
                  clearInterval(timerRef.current);
                  timerRef.current = null;
                }
                executeLoopSteps(loopStepIndex + 1);
              } else {
                setRunningProgram(prev => prev ? { ...prev, timeRemaining: remaining } : null);
              }
            }, 1000);
          }
        };

        executeLoopSteps(0);
      };

      executeLoopRecursive(1);
    }
  };

  if (loading) {
    return <div className="dashboard loading">{t('common.loading')}</div>;
  }

  if (!relayState) {
    return <div className="dashboard error">{t('app.relayLoadError')}</div>;
  }

  const relays = [
    { key: 'in1' as const, index: 0, state: relayState.in1 },
    { key: 'in2' as const, index: 1, state: relayState.in2 },
    { key: 'in3' as const, index: 2, state: relayState.in3 },
    { key: 'in4' as const, index: 3, state: relayState.in4 },
  ].filter((relay) => relayConfigs[relay.key].enabled);

  const enabledPrograms = programs.filter(p => p.enabled);

  const getNextActionDescription = (program: Program, stepIndex: number): string => {
    if (stepIndex >= program.steps.length) return '';
    
    const step = program.steps[stepIndex];
    if (step.type === 'relay') {
      const relayKeys = ['in1', 'in2', 'in3', 'in4'] as const;
      const relayName = relayConfigs[relayKeys[step.relay!]].name;
      const action = getActionDescription(step.relay!, step.action!);
      return `${relayName}: ${action}`;
    }
    return t('programCard.waiting');
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('dashboard.title')}</h1>
        <WiFiStatus />
      </div>

      <div className="relays-grid">
        {relays.map((relay) => (
          <div key={relay.key} className="relay-item">
            <RelayCard
              name={relayConfigs[relay.key].name}
              state={relay.state}
              type={relayConfigs[relay.key].type}
              valveMode={relayConfigs[relay.key].valveMode}
              enabled={relayConfigs[relay.key].enabled}
              programRunning={!!runningProgram}
              onToggle={() => handleToggleRelay(relay.index)}
            />
          </div>
        ))}
      </div>

      {enabledPrograms.length > 0 && (
        <>
          <h2 className="section-title">{t('dashboard.programs')}</h2>
          <div className="programs-grid">
            {enabledPrograms.map((program) => {
              const isThisRunning = runningProgram?.programId === program.id;
              const isOtherRunning = runningProgram && !isThisRunning;
              
              return (
                <div key={program.id} className="program-item">
                  <ProgramCard
                    name={program.name}
                    isRunning={isThisRunning}
                    isDisabled={!!isOtherRunning}
                    timeRemaining={isThisRunning ? runningProgram.timeRemaining : undefined}
                    nextAction={
                      isThisRunning 
                        ? getNextActionDescription(program, runningProgram.currentStepIndex)
                        : undefined
                    }
                    onStart={() => handleStartProgram(program.id)}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
