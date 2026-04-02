import { useState } from 'react';
import { ArrowDown, ArrowUp, CheckSquare, ChevronDown, ChevronUp, Square, Trash2 } from 'lucide-react';
import type { PlannerSettings, Task, TaskSortMode, TimeBlock, WeeklyPlan } from '../planner/types';
import { getTaskStatus, getTaskStatusClass, sortTasks } from '../planner/utils';

interface TasksViewProps {
  tasks: Task[];
  settings: PlannerSettings;
  sortMode: TaskSortMode;
  setSortMode: (value: TaskSortMode) => void;
  addTask: () => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (id: string, delta: number) => void;
  toggleTaskDone: (id: string) => void;
  toggleBigRock: (id: string) => void;
  toggleMitPool: (id: string) => void;
  toggleMitForDay: (day: string, id: string) => void;
  weekPlan: WeeklyPlan;
  weekDays: Date[];
  selectedDay: string;
  blocks: TimeBlock[];
  weekKey: string;
}

export function TasksView(props: TasksViewProps) {
  const {
    tasks,
    settings,
    sortMode,
    setSortMode,
    addTask,
    updateTask,
    removeTask,
    moveTask,
    toggleTaskDone,
    toggleBigRock,
    toggleMitPool,
    toggleMitForDay,
    weekPlan,
    weekDays,
    selectedDay,
    blocks,
    weekKey,
  } = props;
  const sortedTasks = sortTasks(tasks, sortMode);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpanded = (taskId: string) => {
    setExpandedIds((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]));
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-9">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Lista completa attivita</h2>
          <p className="text-sm text-slate-500">Da qui selezioni Big Rocks della settimana e MIT del pool settimanale o del giorno.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as TaskSortMode)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <option value="manuale">Ordine manuale</option>
            <option value="priorita">Ordina per priorita</option>
          </select>
          <button onClick={addTask} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Nuova attivita
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Giorno MIT selezionato: <strong>{selectedDay}</strong>. Giorni settimana: {weekDays.map((day) => day.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })).join(' · ')}
      </div>

      <div className="space-y-3">
        {sortedTasks.map((task) => {
          const status = getTaskStatus(task, blocks, weekKey);
          const inBigRocks = weekPlan.bigRockIds.includes(task.id);
          const inMitPool = weekPlan.mitPoolIds.includes(task.id);
          const inSelectedDay = (weekPlan.dailyMitAssignments[selectedDay] ?? []).includes(task.id);
          const isExpanded = expandedIds.includes(task.id);

          return (
            <div key={task.id} className={getTaskStatusClass(status)}>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <button onClick={() => toggleTaskDone(task.id)} className="rounded-md p-0.5">
                    {task.completed ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  </button>
                  <input
                    value={task.title}
                    onChange={(event) => updateTask(task.id, { title: event.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <button onClick={() => toggleBigRock(task.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${inBigRocks ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                    {inBigRocks ? 'Rimuovi da Big Rocks' : 'Aggiungi a Big Rocks'}
                  </button>
                  <button onClick={() => toggleMitPool(task.id)} className={`rounded-full px-3 py-1 text-xs font-semibold ${inMitPool ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    {inMitPool ? 'Rimuovi da MIT pool' : 'Aggiungi a MIT pool'}
                  </button>
                  <button
                    onClick={() => toggleMitForDay(selectedDay, task.id)}
                    disabled={!inMitPool}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${inSelectedDay ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {inSelectedDay ? 'Rimuovi dal giorno' : 'Assegna al giorno'}
                  </button>
                  <button onClick={() => moveTask(task.id, -1)} className="rounded-lg p-2 hover:bg-white">
                    <ArrowUp className="h-4 w-4 text-slate-500" />
                  </button>
                  <button onClick={() => moveTask(task.id, 1)} className="rounded-lg p-2 hover:bg-white">
                    <ArrowDown className="h-4 w-4 text-slate-500" />
                  </button>
                  <button onClick={() => removeTask(task.id)} className="rounded-lg p-2 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleExpanded(task.id)} className="rounded-lg p-2 hover:bg-white">
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="grid grid-cols-[120px,1fr,1fr,110px] gap-3 px-4 pb-4">
                  <select value={task.priority} onChange={(event) => updateTask(task.id, { priority: event.target.value as Task['priority'] })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Bassa">Bassa</option>
                  </select>
                  <select value={task.category} onChange={(event) => updateTask(task.id, { category: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    {settings.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <select value={task.domain} onChange={(event) => updateTask(task.id, { domain: event.target.value })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    {settings.domains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                  <input type="number" min={15} step={15} value={task.estimatedMinutes} onChange={(event) => updateTask(task.id, { estimatedMinutes: Number(event.target.value) })} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                  <div className="col-span-full text-xs text-slate-500">
                    Stato: {status === 'done' ? 'fatta' : status === 'planned' ? 'pianificata' : 'non pianificata'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
