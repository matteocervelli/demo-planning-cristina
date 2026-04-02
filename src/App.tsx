import { useEffect, useMemo, useState } from 'react';
import { addDays } from 'date-fns';
import { PlannerModal } from './components/PlannerModal';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { CalendarView } from './components/CalendarView';
import { TasksView } from './components/TasksView';
import { SettingsView } from './components/SettingsView';
import { MetricsView } from './components/MetricsView';
import { GuideView } from './components/GuideView';
import { EmergenciesView } from './components/EmergenciesView';
import { EMPTY_DATA } from './planner/defaults';
import type { ActiveTab, ModalState, PlannerData, Task, TimeBlock, WeeklyPlan } from './planner/types';
import {
  canPlaceBlock,
  createEmptyTask,
  createId,
  ensureWeekPlan,
  getTaskById,
  getTasksByIds,
  getTimeOptions,
  getVisibleDay,
  getWeekDays,
  getWeekKey,
  normalizeData,
  setDailyMit,
  sortTasks,
  toggleId,
} from './planner/utils';

const APP_NAME = 'Planner Locale';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  const [plannerData, setPlannerData] = useState<PlannerData>(EMPTY_DATA);
  const [taskSortMode, setTaskSortMode] = useState<'manuale' | 'priorita'>('manuale');
  const [modal, setModal] = useState<ModalState | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(getVisibleDay(new Date(), getWeekDays(new Date(), EMPTY_DATA.settings)));

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        const parsed = await response.json();
        const normalized = normalizeData(parsed);
        setPlannerData(normalized);
        setSelectedDay(getVisibleDay(currentDate, getWeekDays(currentDate, normalized.settings)));
      } catch (error) {
        console.error('Errore caricamento dati', error);
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(plannerData),
        });
      } catch (error) {
        console.error('Errore salvataggio dati', error);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [plannerData]);

  const weekDays = useMemo(() => getWeekDays(currentDate, plannerData.settings), [currentDate, plannerData.settings]);
  const weekKey = useMemo(() => getWeekKey(currentDate), [currentDate]);
  const weekPlan = useMemo(() => ensureWeekPlan(plannerData.weeklyPlans, weekKey), [plannerData.weeklyPlans, weekKey]);
  const timeOptions = useMemo(() => getTimeOptions(plannerData.settings), [plannerData.settings]);
  const sortedTasks = useMemo(() => sortTasks(plannerData.tasks, taskSortMode), [plannerData.tasks, taskSortMode]);

  useEffect(() => {
    const visible = weekDays.map((day) => day.toISOString().slice(0, 10));
    if (!visible.includes(selectedDay)) {
      setSelectedDay(getVisibleDay(currentDate, weekDays));
    }
  }, [currentDate, weekDays, selectedDay]);

  const updateData = <K extends keyof PlannerData>(key: K, value: PlannerData[K]) => {
    setPlannerData((prev) => ({ ...prev, [key]: value }));
  };

  const updateWeekPlan = (updater: (plan: WeeklyPlan) => WeeklyPlan) => {
    updateData('weeklyPlans', {
      ...plannerData.weeklyPlans,
      [weekKey]: updater(weekPlan),
    });
  };

  const addTask = () => {
    updateData('tasks', [...plannerData.tasks, createEmptyTask(plannerData.settings, plannerData.tasks.length)]);
    setActiveTab('tasks');
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    updateData('tasks', plannerData.tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)));
  };

  const toggleTaskDone = (id: string) => {
    const task = getTaskById(plannerData.tasks, id);
    if (!task) return;
    updateTask(id, { completed: !task.completed });
  };

  const removeTask = (id: string) => {
    updateData(
      'tasks',
      plannerData.tasks.filter((task) => task.id !== id).map((task, index) => ({ ...task, manualOrder: index })),
    );
    updateData('blocks', plannerData.blocks.filter((block) => block.taskId !== id));
    updateData(
      'weeklyPlans',
      Object.fromEntries(
        Object.entries(plannerData.weeklyPlans).map(([key, plan]) => [
          key,
          {
            bigRockIds: (plan as WeeklyPlan).bigRockIds.filter((taskId) => taskId !== id),
            mitPoolIds: (plan as WeeklyPlan).mitPoolIds.filter((taskId) => taskId !== id),
            dailyMitAssignments: Object.fromEntries(
              Object.entries((plan as WeeklyPlan).dailyMitAssignments).map(([day, ids]) => [day, ids.filter((taskId) => taskId !== id)]),
            ),
          },
        ]),
      ) as Record<string, WeeklyPlan>,
    );
  };

  const moveTask = (id: string, delta: number) => {
    const ordered = [...plannerData.tasks].sort((a, b) => a.manualOrder - b.manualOrder);
    const index = ordered.findIndex((task) => task.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
    updateData('tasks', ordered.map((task, order) => ({ ...task, manualOrder: order })));
  };

  const toggleBigRock = (taskId: string) => {
    updateWeekPlan((plan) => ({
      ...plan,
      bigRockIds: toggleId(plan.bigRockIds, taskId),
    }));
  };

  const toggleMitPool = (taskId: string) => {
    updateWeekPlan((plan) => {
      const nextMitPoolIds = toggleId(plan.mitPoolIds, taskId);
      const nextAssignments = Object.fromEntries(
        Object.entries(plan.dailyMitAssignments).map(([day, ids]) => [day, nextMitPoolIds.includes(taskId) ? ids : ids.filter((id) => id !== taskId)]),
      );
      return {
        ...plan,
        mitPoolIds: nextMitPoolIds,
        dailyMitAssignments: nextAssignments,
      };
    });
  };

  const toggleMitForDay = (day: string, taskId: string) => {
    if (!weekPlan.mitPoolIds.includes(taskId)) return;
    updateWeekPlan((plan) => ({
      ...plan,
      dailyMitAssignments: setDailyMit(plan.dailyMitAssignments, day, taskId),
    }));
  };

  const openModal = (
    day: string,
    startTime: string,
    taskId?: string,
    title = '',
    category = plannerData.settings.categories[0] ?? 'Altro',
    domain = plannerData.settings.domains[0] ?? 'Altro',
    duration = plannerData.settings.defaultDurations[0] ?? 30,
  ) => {
    setModal({ day, taskId, title, startTime, category, domain, duration });
  };

  const confirmModal = () => {
    if (!modal) return;
    const sourceTask = modal.taskId ? getTaskById(plannerData.tasks, modal.taskId) : undefined;
    const fallbackTask = sourceTask
      ? sourceTask
      : {
          id: createId('task'),
          title: modal.title || 'Nuova attivita',
          priority: 'Media' as const,
          category: modal.category,
          domain: modal.domain,
          estimatedMinutes: modal.duration,
          manualOrder: plannerData.tasks.length,
          completed: false,
        };

    const existingTask = sourceTask ?? getTaskById(plannerData.tasks, fallbackTask.id);
    const taskId = existingTask?.id ?? fallbackTask.id;
    const title = modal.title || existingTask?.title || fallbackTask.title;

    const newBlock: TimeBlock = {
      id: createId('block'),
      taskId,
      title,
      day: modal.day,
      startTime: modal.startTime,
      duration: modal.duration,
      category: modal.category,
      domain: modal.domain,
    };

    if (!canPlaceBlock(newBlock, plannerData.blocks, plannerData.settings)) {
      window.alert('Il blocco si sovrappone, cade in ferie o fuori turno.');
      return;
    }

    if (!existingTask) {
      updateData('tasks', [...plannerData.tasks, fallbackTask]);
    }
    updateData('blocks', [...plannerData.blocks, newBlock]);
    setModal(null);
  };

  const moveBlock = (id: string, day: string, startTime: string) => {
    const block = plannerData.blocks.find((item) => item.id === id);
    if (!block) return;
    const candidate = { ...block, day, startTime };
    if (!canPlaceBlock(candidate, plannerData.blocks, plannerData.settings, id)) {
      window.alert('Spostamento non valido per turno, ferie, buffer o sovrapposizione.');
      return;
    }
    updateData('blocks', plannerData.blocks.map((item) => (item.id === id ? candidate : item)));
  };

  const resizeBlock = (id: string, delta: number) => {
    const block = plannerData.blocks.find((item) => item.id === id);
    if (!block) return;
    const candidate = { ...block, duration: Math.max(15, block.duration + delta) };
    if (!canPlaceBlock(candidate, plannerData.blocks, plannerData.settings, id)) return;
    updateData('blocks', plannerData.blocks.map((item) => (item.id === id ? candidate : item)));
  };

  const handleTaskDrop = (day: string, startTime: string) => {
    if (draggedBlockId) {
      moveBlock(draggedBlockId, day, startTime);
      setDraggedBlockId(null);
      return;
    }
    if (draggedTask) {
      openModal(day, startTime, draggedTask.id, draggedTask.title, draggedTask.category, draggedTask.domain, draggedTask.estimatedMinutes);
      setDraggedTask(null);
    }
  };

  const handleExport = async () => {
    const response = await fetch('/api/data');
    const data = await response.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'planner-locale-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const content = await file.text();
      const normalized = normalizeData(JSON.parse(content));
      setPlannerData(normalized);
      setSelectedDay(getVisibleDay(currentDate, getWeekDays(currentDate, normalized.settings)));
    };
    input.click();
  };

  const handleShutdown = async () => {
    try {
      await fetch('/api/shutdown', { method: 'POST' });
      window.alert('Planner fermato. Per riavviarlo su Windows usa start-planner.bat.');
    } catch (error) {
      console.error(error);
    }
  };

  const bigRocks = getTasksByIds(plannerData.tasks, weekPlan.bigRockIds);
  const mitPoolTasks = getTasksByIds(plannerData.tasks, weekPlan.mitPoolIds);
  const dailyMITs = getTasksByIds(plannerData.tasks, weekPlan.dailyMitAssignments[selectedDay] ?? []);
  const nextActions = sortedTasks.filter((task) => !weekPlan.bigRockIds.includes(task.id) && !mitPoolTasks.some((mit) => mit.id === task.id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PlannerModal
        isOpen={modal !== null}
        modal={modal}
        settings={plannerData.settings}
        onClose={() => setModal(null)}
        onChange={(patch) => setModal((prev) => (prev ? { ...prev, ...patch } : null))}
        onConfirm={confirmModal}
        timeOptions={timeOptions}
      />

      <TopBar
        appName={APP_NAME}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        weekLabel={{ start: weekDays[0] ?? currentDate, end: weekDays[weekDays.length - 1] ?? currentDate }}
        onWeekChange={(delta) => setCurrentDate(addDays(currentDate, delta))}
        onExport={handleExport}
        onImport={handleImport}
        onShutdown={handleShutdown}
      />

      <main className="mx-auto grid max-w-[1800px] grid-cols-12 gap-6 p-6">
        <Sidebar
          saturation={plannerData.saturation}
          setSaturation={(value) => updateData('saturation', value)}
          nextActions={nextActions}
          bigRocks={bigRocks}
          dailyMITs={dailyMITs}
          addTask={addTask}
          removeTask={removeTask}
          updateTask={updateTask}
          moveTask={moveTask}
          toggleTaskDone={toggleTaskDone}
          taskSortMode={taskSortMode}
          setTaskSortMode={setTaskSortMode}
          settings={plannerData.settings}
          weekDays={weekDays}
          blocks={plannerData.blocks}
          dragTask={setDraggedTask}
          weekKey={weekKey}
          selectedDay={selectedDay}
        />

        {activeTab === 'calendar' && (
          <CalendarView
            weekDays={weekDays}
            selectedDay={selectedDay}
            specialties={plannerData.specialties}
            setSpecialties={(value) => updateData('specialties', value)}
            blocks={plannerData.blocks}
            tasks={plannerData.tasks}
            settings={plannerData.settings}
            onSelectDay={setSelectedDay}
            onOpenModal={openModal}
            onRemoveBlock={(id) => updateData('blocks', plannerData.blocks.filter((block) => block.id !== id))}
            onResizeBlock={resizeBlock}
            onTaskDrop={handleTaskDrop}
            onBlockDrag={setDraggedBlockId}
            onToggleTaskDone={toggleTaskDone}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={plannerData.tasks}
            settings={plannerData.settings}
            sortMode={taskSortMode}
            setSortMode={setTaskSortMode}
            addTask={addTask}
            updateTask={updateTask}
            removeTask={removeTask}
            moveTask={moveTask}
            toggleTaskDone={toggleTaskDone}
            toggleBigRock={toggleBigRock}
            toggleMitPool={toggleMitPool}
            toggleMitForDay={toggleMitForDay}
            weekPlan={weekPlan}
            weekDays={weekDays}
            selectedDay={selectedDay}
            blocks={plannerData.blocks}
            weekKey={weekKey}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView settings={plannerData.settings} setSettings={(value) => updateData('settings', value)} />
        )}

        {activeTab === 'metrics' && <MetricsView blocks={plannerData.blocks} settings={plannerData.settings} />}
        {activeTab === 'guide' && <GuideView appName={APP_NAME} />}
        {activeTab === 'emergencies' && (
          <EmergenciesView
            weekDays={weekDays}
            emergencyLogs={plannerData.emergencyLogs}
            setEmergencyLogs={(value) => updateData('emergencyLogs', value)}
          />
        )}
      </main>
    </div>
  );
}
