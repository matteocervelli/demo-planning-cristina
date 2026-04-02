import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, CheckSquare, GripVertical, ListTodo, Plus, Square, Target, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import type { PlannerSettings, Task, TaskSortMode, TimeBlock } from '../planner/types';
import {
  getCapacityMinutes,
  getDailySaturation,
  getTaskStatus,
  getTaskStatusClass,
  sortTasks,
  toIsoDate,
} from '../planner/utils';

interface SidebarTaskListProps {
  title: string;
  icon: ReactNode;
  tasks: Task[];
  blocks: TimeBlock[];
  weekKey: string;
  onToggleDone: (id: string) => void;
  onDragTask: (task: Task) => void;
}

function SidebarTaskList({ title, icon, tasks, blocks, weekKey, onToggleDone, onDragTask }: SidebarTaskListProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-bold">
        {icon} {title}
      </h3>
      <div className="space-y-2">
        {tasks.length === 0 && <p className="rounded-2xl bg-slate-50 px-3 py-4 text-xs text-slate-400">Nessun elemento assegnato.</p>}
        {tasks.map((task) => {
          const status = getTaskStatus(task, blocks, weekKey);
          return (
            <div
              key={task.id}
              draggable
              onDragStart={() => onDragTask(task)}
              className={cn('rounded-2xl border p-3 transition-all', getTaskStatusClass(status))}
            >
              <div className="flex items-start gap-2">
                <button onClick={() => onToggleDone(task.id)} className="mt-0.5 rounded-md p-0.5">
                  {task.completed ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 opacity-60" />
                    <span className={cn('text-sm font-semibold', task.completed && 'line-through opacity-70')}>{task.title || 'Attivita senza titolo'}</span>
                  </div>
                  <div className="mt-1 text-[11px] opacity-75">
                    {status === 'done' ? 'Fatta' : status === 'planned' ? 'Pianificata' : 'Non pianificata'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

interface SidebarProps {
  saturation: number;
  setSaturation: (value: number) => void;
  nextActions: Task[];
  bigRocks: Task[];
  dailyMITs: Task[];
  addTask: () => void;
  removeTask: (id: string) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  moveTask: (id: string, delta: number) => void;
  toggleTaskDone: (id: string) => void;
  taskSortMode: TaskSortMode;
  setTaskSortMode: (mode: TaskSortMode) => void;
  settings: PlannerSettings;
  weekDays: Date[];
  blocks: TimeBlock[];
  dragTask: (task: Task) => void;
  weekKey: string;
  selectedDay: string;
}

export function Sidebar(props: SidebarProps) {
  const {
    saturation,
    setSaturation,
    nextActions,
    bigRocks,
    dailyMITs,
    addTask,
    removeTask,
    updateTask,
    moveTask,
    toggleTaskDone,
    taskSortMode,
    setTaskSortMode,
    settings,
    weekDays,
    blocks,
    dragTask,
    weekKey,
    selectedDay,
  } = props;

  const capacityMinutes = getCapacityMinutes(settings);
  const sortedTasks = sortTasks(nextActions, taskSortMode).slice(0, 6);

  return (
    <aside className="col-span-12 space-y-6 xl:col-span-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold">Saturazione</h3>
          <span className={cn('rounded-full px-2 py-1 text-xs font-bold', saturation > 85 ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600')}>
            {saturation}%
          </span>
        </div>
        <input
          type="range"
          min="40"
          max="100"
          step="5"
          value={saturation}
          onChange={(event) => setSaturation(Number(event.target.value))}
          className="w-full accent-blue-600"
        />
        <p className="mt-3 text-xs text-slate-500">
          Capacita turno: <strong>{capacityMinutes} min</strong>. Il blu indica la pianificazione nel giorno, il verde il completamento manuale.
        </p>
        <div className="mt-4 space-y-2">
          {weekDays.map((day) => {
            const daily = getDailySaturation(toIsoDate(day), blocks, settings, saturation);
            const isSelected = toIsoDate(day) === selectedDay;
            return (
              <div key={day.toISOString()} className={cn('rounded-2xl px-3 py-2', isSelected ? 'bg-blue-50' : 'bg-slate-50')}>
                <div className="mb-1 flex justify-between text-[11px] font-medium text-slate-600">
                  <span>{day.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</span>
                  <span>{Math.round(daily.usedPercent)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className={cn('h-full', daily.usedPercent > daily.targetPercent ? 'bg-rose-500' : 'bg-blue-500')} style={{ width: `${Math.min(100, daily.usedPercent)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SidebarTaskList
        title="Big Rocks Settimanali"
        icon={<Target className="h-4 w-4 text-rose-500" />}
        tasks={bigRocks}
        blocks={blocks}
        weekKey={weekKey}
        onToggleDone={toggleTaskDone}
        onDragTask={dragTask}
      />

      <SidebarTaskList
        title={`MIT del Giorno (${selectedDay})`}
        icon={<Zap className="h-4 w-4 text-amber-500" />}
        tasks={dailyMITs}
        blocks={blocks}
        weekKey={weekKey}
        onToggleDone={toggleTaskDone}
        onDragTask={dragTask}
      />

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ListTodo className="h-4 w-4 text-blue-500" /> Catalogo Attivita
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={taskSortMode}
              onChange={(event) => setTaskSortMode(event.target.value as TaskSortMode)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
            >
              <option value="manuale">Manuale</option>
              <option value="priorita">Priorita</option>
            </select>
            <button onClick={addTask} className="rounded-lg p-1 hover:bg-slate-100">
              <Plus className="h-4 w-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {sortedTasks.map((task) => {
            const status = getTaskStatus(task, blocks, weekKey);
            return (
              <div
                key={task.id}
                draggable
                onDragStart={() => dragTask(task)}
                className={cn('rounded-2xl border p-3', getTaskStatusClass(status))}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <button onClick={() => toggleTaskDone(task.id)} className="mt-0.5 rounded-md p-0.5">
                      {task.completed ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                    <input
                      value={task.title}
                      onChange={(event) => updateTask(task.id, { title: event.target.value })}
                      className="w-full bg-transparent text-sm font-medium"
                      placeholder="Nuova attivita"
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => moveTask(task.id, -1)} className="rounded-lg p-1 hover:bg-white">
                    <ArrowUp className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => moveTask(task.id, 1)} className="rounded-lg p-1 hover:bg-white">
                    <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button onClick={() => removeTask(task.id)} className="rounded-lg px-2 py-1 text-[11px] text-rose-500 hover:bg-rose-50">
                    Rimuovi
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
