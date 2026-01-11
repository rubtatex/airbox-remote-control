import { useEffect, useState } from 'react';
import { Plus, Trash2, Upload, Download, Edit2, Clock, Power, Repeat, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useI18n } from '../i18n';
import '../styles/Schedule.css';

interface ProgramStep {
  id: string;
  type: 'relay' | 'wait' | 'loop';
  // Pour relay
  relay?: number;
  action?: 'ON' | 'OFF';
  // Pour wait
  durationType?: 'fixed' | 'random';
  duration?: number;
  durationMin?: number;
  durationMax?: number;
  // Pour loop
  iterations?: number;
  loopSteps?: ProgramStep[];
}

interface Program {
  id: string;
  name: string;
  enabled: boolean;
  steps: ProgramStep[];
}

// Component for draggable step items
function SortableStepItem({
  step,
  index,
  relayNames,
  getActionDescription,
  formatDuration,
  onDelete,
  loopStepsIds,
  onEditLoop,
  t,
}: {
  step: ProgramStep;
  index: number;
  relayNames: { [key: number]: string };
  getActionDescription: (relay: number, action: 'ON' | 'OFF') => string;
  formatDuration: (seconds: number) => string;
  onDelete: () => void;
  loopStepsIds: Set<string>;
  onEditLoop?: (step: ProgramStep) => void;
  t: (key: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isInLoop = loopStepsIds.has(step.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`step-item ${isDragging ? 'dragging' : ''} ${isInLoop ? 'in-loop' : ''}`}
    >
      <div className="step-handle" {...attributes} {...listeners}>
        <GripVertical size={16} />
      </div>
      <div className="step-number">{index + 1}</div>
      <div className="step-content">
        {step.type === 'relay' ? (
          <>
            <Power size={16} />
            <strong>{relayNames[step.relay!]}</strong>
            <span className={`action action-${step.action!.toLowerCase()}`}>
              {getActionDescription(step.relay!, step.action!)}
            </span>
          </>
        ) : step.type === 'wait' ? (
          <>
            <Clock size={16} />
            <strong>{t('schedule.wait')}</strong>
            {step.durationType === 'fixed' ? (
              <span className="duration">{formatDuration(step.duration!)}</span>
            ) : (
              <span className="duration">
                {formatDuration(step.durationMin!)} - {formatDuration(step.durationMax!)}
              </span>
            )}
          </>
        ) : (
          <>
            <Repeat size={16} />
            <strong>{t('schedule.stepTypeLoop')}</strong>
            <span className="duration">{step.iterations}x</span>
          </>
        )}
      </div>
      {step.type === 'loop' ? (
        <div className="step-actions">
          <button onClick={() => onEditLoop?.(step)} className="btn-edit btn-small" title="Edit loop">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="btn-delete-small">
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <button onClick={onDelete} className="btn-delete-small">
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

// Component for draggable steps inside loops
function SortableLoopStepItem({
  step,
  index,
  relayNames,
  getActionDescription,
  formatDuration,
  onDelete,
  onExtract,
  t,
}: {
  step: ProgramStep;
  index: number;
  relayNames: { [key: number]: string };
  getActionDescription: (relay: number, action: 'ON' | 'OFF') => string;
  formatDuration: (seconds: number) => string;
  onDelete: () => void;
  onExtract: () => void;
  t: (key: string) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`loop-step-row ${isDragging ? 'dragging' : ''}`}
    >
      <div className="step-handle-small" {...attributes} {...listeners}>
        <GripVertical size={14} />
      </div>
      <span className="step-number">{index + 1}</span>
      <span className="step-description">
        {step.type === 'relay'
          ? `${relayNames[step.relay || 0]} - ${getActionDescription(step.relay || 0, step.action || 'ON')}`
          : step.type === 'wait'
          ? `${t('schedule.wait')}: ${formatDuration(step.duration || 0)}`
          : `Loop: ${step.iterations}x`}
      </span>
      <div className="step-actions-small">
        <button
          onClick={onExtract}
          className="btn-extract-small"
          title="Extract step from loop"
        >
          ↗
        </button>
        <button
          onClick={onDelete}
          className="btn-delete-small"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// Component for the DnD step list
function StepsList({
  steps,
  relayNames,
  getActionDescription,
  formatDuration,
  onReorderSteps,
  onDeleteStep,
  onEnterLoopMode,
  onEditLoop,
  onAddRelay,
  onAddWait,
  t,
}: {
  steps: ProgramStep[];
  relayNames: { [key: number]: string };
  getActionDescription: (relay: number, action: 'ON' | 'OFF') => string;
  formatDuration: (seconds: number) => string;
  onReorderSteps: (event: DragEndEvent) => void;
  onDeleteStep: (id: string) => void;
  onEnterLoopMode: () => void;
  onEditLoop: (step: ProgramStep) => void;
  onAddRelay: () => void;
  onAddWait: () => void;
  t: (key: string) => string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const getLoopStepIds = (loopStep: ProgramStep): Set<string> => {
    if (loopStep.type === 'loop' && loopStep.loopSteps) {
      const ids = new Set<string>();
      loopStep.loopSteps.forEach((s) => {
        ids.add(s.id);
      });
      return ids;
    }
    return new Set();
  };

  return (
    <div className="steps-list">
      <div className="steps-header">
        <h3>{t('schedule.programSteps')}</h3>
        <div className="steps-actions">
          <button onClick={onAddRelay} className="btn-secondary btn-small">
            <Plus size={14} /> {t('schedule.stepTypeRelay')}
          </button>
          <button onClick={onAddWait} className="btn-secondary btn-small">
            <Plus size={14} /> {t('schedule.stepTypeWait')}
          </button>
          {steps.length > 0 && (
            <button onClick={onEnterLoopMode} className="btn-secondary btn-small">
              <Repeat size={14} /> {t('schedule.createLoop')}
            </button>
          )}
        </div>
      </div>
      {steps.length === 0 ? (
        <p className="empty-steps">{t('schedule.noSteps')}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onReorderSteps}
        >
          <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {steps.map((step, index) => (
              <SortableStepItem
                key={step.id}
                step={step}
                index={index}
                relayNames={relayNames}
                getActionDescription={getActionDescription}
                formatDuration={formatDuration}
                onDelete={() => onDeleteStep(step.id)}
                loopStepsIds={step.type === 'loop' ? getLoopStepIds(step) : new Set()}
                onEditLoop={onEditLoop}
                t={t}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

export default function Schedule() {
  const STORAGE_KEY = 'programs_v2';
  const { t } = useI18n();

  const [programs, setPrograms] = useState<Program[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as Program[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  });

  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showProgramForm, setShowProgramForm] = useState(false);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [selectedForLoop, setSelectedForLoop] = useState<Set<string>>(new Set());
  const [loopIterations, setLoopIterations] = useState(2);
  const [editingLoop, setEditingLoop] = useState<ProgramStep | null>(null);
  const [editingLoopIterations, setEditingLoopIterations] = useState(1);
  const [showRelayModal, setShowRelayModal] = useState(false);
  const [showWaitModal, setShowWaitModal] = useState(false);
  const [showCreateLoopModal, setShowCreateLoopModal] = useState(false);
  const [relayFormData, setRelayFormData] = useState({ relay: 0, action: 'ON' as 'ON' | 'OFF' });
  const [waitFormData, setWaitFormData] = useState({ durationType: 'fixed' as 'fixed' | 'random', duration: 10, durationMin: 5, durationMax: 15 });
  const [githubUrl, setGithubUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sensors for both main steps and loop steps drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const relayConfigs: { [key: number]: { name: string; type: 'pump' | 'valve'; valveMode: 'no' | 'nc' } } = (() => {
    const saved = localStorage.getItem('relayConfigs');
    if (saved) {
      const cfg = JSON.parse(saved);
      return {
        0: {
          name: cfg.in1?.name || t('dashboard.relays.in1'),
          type: cfg.in1?.type || 'pump',
          valveMode: cfg.in1?.valveMode || 'nc',
        },
        1: {
          name: cfg.in2?.name || t('dashboard.relays.in2'),
          type: cfg.in2?.type || 'pump',
          valveMode: cfg.in2?.valveMode || 'nc',
        },
        2: {
          name: cfg.in3?.name || t('dashboard.relays.in3'),
          type: cfg.in3?.type || 'pump',
          valveMode: cfg.in3?.valveMode || 'nc',
        },
        3: {
          name: cfg.in4?.name || t('dashboard.relays.in4'),
          type: cfg.in4?.type || 'pump',
          valveMode: cfg.in4?.valveMode || 'nc',
        },
      };
    }
    return {
      0: { name: t('dashboard.relays.in1'), type: 'pump' as const, valveMode: 'nc' as const },
      1: { name: t('dashboard.relays.in2'), type: 'pump' as const, valveMode: 'nc' as const },
      2: { name: t('dashboard.relays.in3'), type: 'pump' as const, valveMode: 'nc' as const },
      3: { name: t('dashboard.relays.in4'), type: 'pump' as const, valveMode: 'nc' as const },
    };
  })();

  const relayNames: { [key: number]: string } = {
    0: relayConfigs[0].name,
    1: relayConfigs[1].name,
    2: relayConfigs[2].name,
    3: relayConfigs[3].name,
  };

  // Convertit l'action ON/OFF en description fonctionnelle selon le type de relay
  const getActionDescription = (relay: number, action: 'ON' | 'OFF'): string => {
    const config = relayConfigs[relay];
    if (config.type === 'pump') {
      return action === 'ON' ? t('schedule.actions.activate') : t('schedule.actions.deactivate');
    } else {
      // Pour une valve
      if (config.valveMode === 'nc') {
        // NC: ON = ouverte, OFF = fermée
        return action === 'ON' ? t('schedule.actions.open') : t('schedule.actions.close');
      } else {
        // NO: ON = fermée, OFF = ouverte
        return action === 'ON' ? t('schedule.actions.close') : t('schedule.actions.open');
      }
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
  }, [programs]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleCreateProgram = () => {
    setShowImportOptions(true);
  };

  const handleCreateManually = () => {
    const newProgram: Program = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      name: `${t('schedule.title')} ${programs.length + 1}`,
      enabled: true,
      steps: [],
    };
    setPrograms((prev) => [...prev, newProgram]);
    setEditingProgram(newProgram);
    setShowProgramForm(true);
    setShowImportOptions(false);
  };

  const handleDeleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    if (editingProgram?.id === id) {
      setEditingProgram(null);
      setShowProgramForm(false);
    }
  };

  const handleToggleProgram = (id: string) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setShowProgramForm(true);
  };

  const handleSaveProgramName = (newName: string) => {
    if (editingProgram) {
      setPrograms((prev) =>
        prev.map((p) => (p.id === editingProgram.id ? { ...p, name: newName } : p))
      );
      setEditingProgram({ ...editingProgram, name: newName });
    }
  };

  const handleAddRelay = () => {
    setRelayFormData({ relay: 0, action: 'ON' });
    setShowRelayModal(true);
  };

  const handleSaveRelay = () => {
    if (!editingProgram) return;

    const newStep: ProgramStep = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      type: 'relay',
      relay: relayFormData.relay,
      action: relayFormData.action,
    };

    const updatedProgram = {
      ...editingProgram,
      steps: [...editingProgram.steps, newStep],
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
    );
    setEditingProgram(updatedProgram);
    setShowRelayModal(false);
    setError(null);
  };

  const handleAddWait = () => {
    setWaitFormData({ durationType: 'fixed', duration: 10, durationMin: 5, durationMax: 15 });
    setShowWaitModal(true);
  };

  const handleSaveWait = () => {
    if (!editingProgram) return;

    const newStep: ProgramStep = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      type: 'wait',
      durationType: waitFormData.durationType,
      ...(waitFormData.durationType === 'fixed' 
        ? { duration: waitFormData.duration }
        : { durationMin: waitFormData.durationMin, durationMax: waitFormData.durationMax }
      ),
    };

    const updatedProgram = {
      ...editingProgram,
      steps: [...editingProgram.steps, newStep],
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
    );
    setEditingProgram(updatedProgram);
    setShowWaitModal(false);
    setError(null);
  };

  const handleEnterLoopMode = () => {
    setShowCreateLoopModal(true);
  };

  const handleSaveCreateLoop = () => {
    handleCreateLoop();
    setShowCreateLoopModal(false);
    setSelectedForLoop(new Set());
    setLoopIterations(2);
  };

  const handleReorderSteps = (event: DragEndEvent) => {
    if (!editingProgram) return;
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = editingProgram.steps.findIndex((s) => s.id === active.id);
    const newIndex = editingProgram.steps.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newSteps = arrayMove(editingProgram.steps, oldIndex, newIndex);
    const updatedProgram = {
      ...editingProgram,
      steps: newSteps,
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
    );
    setEditingProgram(updatedProgram);
  };

  const handleCreateLoop = () => {
    if (!editingProgram || selectedForLoop.size === 0) return;

    // Get selected steps in order
    const selectedSteps = editingProgram.steps.filter((s) => selectedForLoop.has(s.id));

    // Create loop step
    const loopStep: ProgramStep = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      type: 'loop',
      iterations: loopIterations,
      loopSteps: selectedSteps.map(s => ({ ...s, id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}` })),
    };

    // Remove selected steps from program and add loop
    const newSteps = editingProgram.steps.filter((s) => !selectedForLoop.has(s.id));
    const firstSelectedIndex = editingProgram.steps.findIndex((s) => selectedForLoop.has(s.id));
    newSteps.splice(Math.max(0, firstSelectedIndex), 0, loopStep);

    const updatedProgram = {
      ...editingProgram,
      steps: newSteps,
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
    );
    setEditingProgram(updatedProgram);
    setSelectedForLoop(new Set());
  };

  const handleEditLoop = (loopStep: ProgramStep) => {
    setEditingLoop(loopStep);
    setEditingLoopIterations(loopStep.iterations || 1);
  };

  const handleDeleteStepFromLoop = (stepId: string) => {
    if (!editingLoop) return;
    
    const updatedLoopSteps = (editingLoop.loopSteps || []).filter((s) => s.id !== stepId);
    const updatedLoop = { ...editingLoop, loopSteps: updatedLoopSteps };
    setEditingLoop(updatedLoop);
  };

  const handleSaveLoopChanges = () => {
    if (!editingProgram || !editingLoop) return;

    const updatedProgram = {
      ...editingProgram,
      steps: editingProgram.steps.map((s) =>
        s.id === editingLoop.id ? { ...editingLoop, iterations: editingLoopIterations } : s
      ),
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
    );
    setEditingProgram(updatedProgram);
    setEditingLoop(null);
    setEditingLoopIterations(1);
  };

  const handleAddRelayToLoop = () => {
    if (!editingLoop) return;

    const newStep: ProgramStep = {
      id: `step-${Date.now()}`,
      type: 'relay',
      relay: 0,
      action: 'ON',
    };

    const updatedLoopSteps = [...(editingLoop.loopSteps || []), newStep];
    const updatedLoop = { ...editingLoop, loopSteps: updatedLoopSteps };
    setEditingLoop(updatedLoop);
  };

  const handleAddWaitToLoop = () => {
    if (!editingLoop) return;

    const newStep: ProgramStep = {
      id: `step-${Date.now()}`,
      type: 'wait',
      durationType: 'fixed',
      duration: 10,
    };

    const updatedLoopSteps = [...(editingLoop.loopSteps || []), newStep];
    const updatedLoop = { ...editingLoop, loopSteps: updatedLoopSteps };
    setEditingLoop(updatedLoop);
  };

  const handleAddLoopToLoop = () => {
    if (!editingLoop) return;

    const newStep: ProgramStep = {
      id: `step-${Date.now()}`,
      type: 'loop',
      iterations: 2,
      loopSteps: [],
    };

    const updatedLoopSteps = [...(editingLoop.loopSteps || []), newStep];
    const updatedLoop = { ...editingLoop, loopSteps: updatedLoopSteps };
    setEditingLoop(updatedLoop);
  };

  const handleExtractStepFromLoop = (stepId: string) => {
    if (!editingLoop || !editingProgram) return;

    // Trouver l'étape à extraire
    const stepToExtract = (editingLoop.loopSteps || []).find((s) => s.id === stepId);
    if (!stepToExtract) return;

    // Retirer l'étape de la boucle
    const updatedLoopSteps = (editingLoop.loopSteps || []).filter((s) => s.id !== stepId);
    const updatedLoop = { ...editingLoop, loopSteps: updatedLoopSteps };
    setEditingLoop(updatedLoop);
  };

  const handleReorderLoopSteps = (event: DragEndEvent) => {
    if (!editingLoop) return;

    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = (editingLoop.loopSteps || []).findIndex((s) => s.id === active.id);
      const newIndex = (editingLoop.loopSteps || []).findIndex((s) => s.id === over.id);
      const updatedLoopSteps = arrayMove(editingLoop.loopSteps || [], oldIndex, newIndex);
      const updatedLoop = { ...editingLoop, loopSteps: updatedLoopSteps };
      setEditingLoop(updatedLoop);
    }
  };

  const handleDeleteStep = (stepId: string) => {
    if (!editingProgram) return;

    const updatedProgram = {
      ...editingProgram,
      steps: editingProgram.steps.filter((s) => s.id !== stepId),
    };

    setPrograms((prev) =>
      prev.map((p) => (p.id === editingProgram.id ? updatedProgram : p))
    );
    setEditingProgram(updatedProgram);
  };

  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        if (!parsed.steps || !Array.isArray(parsed.steps)) {
          setError(t('schedule.errorInvalidJson'));
          return;
        }

        const newProgram = parseProgram(parsed, programs.length);
        setPrograms((prev) => [...prev, newProgram]);
        setEditingProgram(newProgram);
        setShowProgramForm(true);
        setShowImportOptions(false);
        setError(null);
      } catch (err) {
        setError(t('schedule.errorInvalidJson'));
      }
    };
    reader.readAsText(file);
  };

  const handleImportFromGithub = async () => {
    try {
      const response = await fetch(githubUrl);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const parsed = await response.json();
      
      if (!parsed.steps || !Array.isArray(parsed.steps)) {
        setError(t('schedule.errorInvalidJson'));
        return;
      }

      const newProgram = parseProgram(parsed, programs.length);
      setPrograms((prev) => [...prev, newProgram]);
      setEditingProgram(newProgram);
      setShowProgramForm(true);
      setShowImportOptions(false);
      setGithubUrl('');
      setError(null);
    } catch (err) {
      setError(t('schedule.errorGithubLoad'));
    }
  };

  const parseProgram = (item: any, index: number): Program => {
    const id = typeof item.id === 'string' ? item.id : crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`;
    const name = typeof item.name === 'string' ? item.name : `${t('schedule.title')} ${index + 1}`;
    
    const steps: ProgramStep[] = item.steps.map((step: any, stepIdx: number) => {
      const stepId = typeof step.id === 'string' ? step.id : `${Date.now()}-${index}-${stepIdx}`;
      const type = step.type === 'wait' ? 'wait' : 'relay';
      
      const programStep: ProgramStep = { id: stepId, type };
      
      if (type === 'relay') {
        const relay = Number(step.relay);
        if (!Number.isFinite(relay) || relay < 0 || relay > 3) throw new Error('invalid relay');
        programStep.relay = relay;
        programStep.action = step.action === 'OFF' ? 'OFF' : 'ON';
      } else {
        const durationType = step.durationType === 'random' ? 'random' : 'fixed';
        programStep.durationType = durationType;
        if (durationType === 'fixed') {
          const duration = Number(step.duration);
          if (!Number.isFinite(duration) || duration < 0) throw new Error('invalid duration');
          programStep.duration = Math.max(0, Math.floor(duration));
        } else {
          const durationMin = Number(step.durationMin);
          const durationMax = Number(step.durationMax);
          if (!Number.isFinite(durationMin) || !Number.isFinite(durationMax)) throw new Error('invalid duration');
          programStep.durationMin = Math.max(0, Math.floor(durationMin));
          programStep.durationMax = Math.max(0, Math.floor(durationMax));
        }
      }
      
      return programStep;
    });

    return {
      id,
      name,
      enabled: item.enabled === false ? false : true,
      steps,
    };
  };

  const handleDownloadJson = (program: Program) => {
    const json = JSON.stringify(program, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${program.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="schedule">
      <div className="schedule-header">
        <h1>{t('schedule.title')}</h1>
        <button onClick={handleCreateProgram} className="btn-primary">
          <Plus size={20} /> {t('schedule.add')}
        </button>
      </div>

      {showImportOptions && (
        <div className="import-options-modal">
          <div className="import-options-content">
            <h2>{t('schedule.importTitle')}</h2>
            
            <div className="import-option">
              <h3>{t('schedule.importFromFile')}</h3>
              <label className="file-upload-btn">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFromFile}
                  style={{ display: 'none' }}
                />
                <Upload size={18} />
                {t('schedule.selectFile')}
              </label>
            </div>

            <div className="import-option">
              <h3>{t('schedule.importFromGithub')}</h3>
              <input
                type="text"
                placeholder={t('schedule.githubPlaceholder')}
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
              <button onClick={handleImportFromGithub} className="btn-secondary">
                <Download size={16} /> {t('schedule.loadFromGithub')}
              </button>
            </div>

            <div className="import-option">
              <h3>{t('schedule.createManually')}</h3>
              <button onClick={handleCreateManually} className="btn-primary">
                <Plus size={18} /> {t('schedule.createManually')}
              </button>
            </div>

            {error && <div className="import-error">{error}</div>}

            <button onClick={() => { setShowImportOptions(false); setError(null); }} className="btn-secondary">
              {t('schedule.cancel')}
            </button>
          </div>
        </div>
      )}

      {showProgramForm && editingProgram && (
        <div className="schedule-form program-editor">
          <div className="program-editor-header">
            <div className="form-group">
              <label>{t('schedule.programName')}</label>
              <input
                type="text"
                value={editingProgram.name}
                onChange={(e) => handleSaveProgramName(e.target.value)}
              />
            </div>
            <button onClick={() => handleDownloadJson(editingProgram)} className="btn-secondary">
              <Download size={16} /> {t('schedule.downloadJson')}
            </button>
          </div>

          <StepsList
            steps={editingProgram.steps}
            relayNames={relayNames}
            getActionDescription={getActionDescription}
            formatDuration={formatDuration}
            onReorderSteps={handleReorderSteps}
            onDeleteStep={handleDeleteStep}
            onEnterLoopMode={handleEnterLoopMode}
            onEditLoop={handleEditLoop}
            onAddRelay={handleAddRelay}
            onAddWait={handleAddWait}
            t={t}
          />

          <div className="form-actions">
            <button onClick={() => { setShowProgramForm(false); setEditingProgram(null); }} className="btn-primary">
              {t('schedule.close')}
            </button>
          </div>
        </div>
      )}

      {editingLoop && (
        <div className="modal-overlay" onClick={() => setEditingLoop(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('schedule.editLoop')}</h3>
              <button onClick={() => setEditingLoop(null)} className="btn-close">✕</button>
            </div>

            <div className="form-group">
              <label>{t('schedule.iterations')}</label>
              <input
                type="number"
                min="1"
                max="100"
                value={editingLoopIterations}
                onChange={(e) => setEditingLoopIterations(Number(e.target.value))}
                className="loop-iterations-input"
              />
            </div>

            <div className="loop-steps-section">
              <div className="loop-steps-header">
                <h4>{t('schedule.programSteps')}</h4>
                <div className="loop-steps-actions">
                  <button onClick={handleAddRelayToLoop} className="btn-small">
                    + {t('schedule.stepTypeRelay')}
                  </button>
                  <button onClick={handleAddWaitToLoop} className="btn-small">
                    + {t('schedule.stepTypeWait')}
                  </button>
                  <button onClick={handleAddLoopToLoop} className="btn-small">
                    + {t('schedule.stepTypeLoop')}
                  </button>
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleReorderLoopSteps}
              >
                <SortableContext
                  items={(editingLoop.loopSteps || []).map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="loop-steps-list">
                    {(editingLoop.loopSteps || []).map((step, index) => (
                      <SortableLoopStepItem
                        key={step.id}
                        step={step}
                        index={index}
                        relayNames={relayNames}
                        getActionDescription={getActionDescription}
                        formatDuration={formatDuration}
                        onDelete={() => handleDeleteStepFromLoop(step.id)}
                        onExtract={() => handleExtractStepFromLoop(step.id)}
                        t={t}
                      />
                    ))}
                    {(editingLoop.loopSteps || []).length === 0 && (
                      <div className="empty-steps">
                        <p>{t('schedule.noSteps')}</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleSaveLoopChanges}
                className="btn-primary"
              >
                {t('schedule.save')}
              </button>
              <button
                onClick={() => setEditingLoop(null)}
                className="btn-secondary"
              >
                {t('schedule.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRelayModal && (
        <div className="modal-overlay" onClick={() => setShowRelayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('schedule.stepTypeRelay')}</h3>
              <button onClick={() => setShowRelayModal(false)} className="btn-close">✕</button>
            </div>

            <div className="form-group">
              <label>{t('schedule.relayLabel')}</label>
              <select
                value={relayFormData.relay}
                onChange={(e) => setRelayFormData({ ...relayFormData, relay: parseInt(e.target.value) })}
              >
                {Object.entries(relayNames).map(([idx, name]) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('schedule.actionLabel')}</label>
              <select
                value={relayFormData.action}
                onChange={(e) => setRelayFormData({ ...relayFormData, action: e.target.value as 'ON' | 'OFF' })}
              >
                <option value="ON">{getActionDescription(relayFormData.relay, 'ON')}</option>
                <option value="OFF">{getActionDescription(relayFormData.relay, 'OFF')}</option>
              </select>
            </div>

            <div className="modal-actions">
              <button onClick={handleSaveRelay} className="btn-primary">
                {t('schedule.save')}
              </button>
              <button onClick={() => setShowRelayModal(false)} className="btn-secondary">
                {t('schedule.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWaitModal && (
        <div className="modal-overlay" onClick={() => setShowWaitModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('schedule.stepTypeWait')}</h3>
              <button onClick={() => setShowWaitModal(false)} className="btn-close">✕</button>
            </div>

            <div className="form-group">
              <label>{t('schedule.durationType')}</label>
              <select
                value={waitFormData.durationType}
                onChange={(e) => setWaitFormData({ ...waitFormData, durationType: e.target.value as 'fixed' | 'random' })}
              >
                <option value="fixed">{t('schedule.durationFixed')}</option>
                <option value="random">{t('schedule.durationRandom')}</option>
              </select>
            </div>

            {waitFormData.durationType === 'fixed' ? (
              <div className="form-group">
                <label>{t('schedule.durationSeconds')}</label>
                <input
                  type="number"
                  min={0}
                  value={waitFormData.duration}
                  onChange={(e) => setWaitFormData({ ...waitFormData, duration: Number(e.target.value) })}
                />
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label>{t('schedule.durationMin')}</label>
                  <input
                    type="number"
                    min={0}
                    value={waitFormData.durationMin}
                    onChange={(e) => setWaitFormData({ ...waitFormData, durationMin: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>{t('schedule.durationMax')}</label>
                  <input
                    type="number"
                    min={0}
                    value={waitFormData.durationMax}
                    onChange={(e) => setWaitFormData({ ...waitFormData, durationMax: Number(e.target.value) })}
                  />
                </div>
              </>
            )}

            <div className="modal-actions">
              <button onClick={handleSaveWait} className="btn-primary">
                {t('schedule.save')}
              </button>
              <button onClick={() => setShowWaitModal(false)} className="btn-secondary">
                {t('schedule.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateLoopModal && editingProgram && (
        <div className="modal-overlay" onClick={() => setShowCreateLoopModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('schedule.createLoop')}</h3>
              <button onClick={() => setShowCreateLoopModal(false)} className="btn-close">✕</button>
            </div>

            <div className="form-group">
              <label>{t('schedule.iterations')}</label>
              <input
                type="number"
                min="1"
                max="100"
                value={loopIterations}
                onChange={(e) => setLoopIterations(Number(e.target.value))}
                className="loop-iterations-input"
              />
            </div>

            <div className="loop-steps-section">
              <h4>{t('schedule.programSteps')}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                {t('schedule.loopModeSummary')}: {selectedForLoop.size} {t('schedule.stepCount')}
              </p>
              <div className="loop-steps-list">
                {editingProgram.steps.map((step, index) => (
                  <div key={step.id} className="loop-step-row">
                    <input
                      type="checkbox"
                      checked={selectedForLoop.has(step.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedForLoop);
                        if (e.target.checked) {
                          newSelected.add(step.id);
                        } else {
                          newSelected.delete(step.id);
                        }
                        setSelectedForLoop(newSelected);
                      }}
                      className="step-checkbox"
                    />
                    <span className="step-number">{index + 1}</span>
                    <span className="step-description">
                      {step.type === 'relay'
                        ? `${relayNames[step.relay || 0]} - ${getActionDescription(step.relay || 0, step.action || 'ON')}`
                        : step.type === 'wait'
                        ? `${t('schedule.wait')}: ${formatDuration(step.duration || 0)}`
                        : `Loop: ${step.iterations}x`}
                    </span>
                  </div>
                ))}
                {editingProgram.steps.length === 0 && (
                  <div className="empty-steps">
                    <p>{t('schedule.noSteps')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleSaveCreateLoop}
                disabled={selectedForLoop.size === 0}
                className="btn-primary"
              >
                {t('schedule.createLoopButton')}
              </button>
              <button onClick={() => setShowCreateLoopModal(false)} className="btn-secondary">
                {t('schedule.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {programs.length === 0 ? (
        <div className="empty-state">
          <p>{t('schedule.empty')}</p>
        </div>
      ) : (
        <div className="schedules-list">
          {programs.map((program) => (
            <div key={program.id} className={`schedule-item ${!program.enabled ? 'disabled' : ''}`}>
              <div className="schedule-info">
                <div className="schedule-details">
                  <strong>{program.name}</strong>
                  <span className="step-count">{program.steps.length} {t('schedule.stepCount')}</span>
                </div>
              </div>
              <div className="schedule-actions">
                <button onClick={() => handleEditProgram(program)} className="btn-edit">
                  <Edit2 size={16} />
                </button>
                <input
                  type="checkbox"
                  checked={program.enabled}
                  onChange={() => handleToggleProgram(program.id)}
                  className="schedule-toggle"
                />
                <button
                  onClick={() => handleDeleteProgram(program.id)}
                  className="btn-delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
