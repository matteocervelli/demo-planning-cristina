import { addDays, addMinutes, format, isSameWeek, isWeekend, parse, startOfWeek } from 'date-fns';
import { DEFAULT_CATEGORIES, DEFAULT_DOMAINS, DEFAULT_SETTINGS, EMPTY_DATA, EMPTY_WEEKLY_PLAN } from './defaults';
import type {
  PlannerData,
  PlannerSettings,
  ProtectedSlot,
  Task,
  TaskPriority,
  TaskSortMode,
  TaskStatus,
  TimeBlock,
  WeeklyPlan,
  WorkDomain,
  WorkRange,
} from './types';

type LegacyPlannerData = Partial<PlannerData> & {
  nextActions?: Array<string | Partial<Task>>;
  bigRocks?: string[];
  dailyMITs?: string[];
};

export function createId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function fromIsoDate(day: string): Date {
  return parse(day, 'yyyy-MM-dd', new Date());
}

export function getWeekKey(date: Date | string): string {
  const value = typeof date === 'string' ? fromIsoDate(date) : date;
  return toIsoDate(startOfWeek(value, { weekStartsOn: 1 }));
}

export function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function getRangeMinutes(range: WorkRange): number {
  return Math.max(0, timeToMinutes(range.end) - timeToMinutes(range.start));
}

export function getCapacityMinutes(settings: PlannerSettings): number {
  return settings.workRanges.reduce((total, range) => total + getRangeMinutes(range), 0);
}

export function getWeekDays(currentDate: Date, settings: PlannerSettings): Date[] {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const length = settings.showWeekends ? 7 : 5;
  return Array.from({ length }).map((_, index) => addDays(start, index));
}

export function getTimeOptions(settings: PlannerSettings): string[] {
  const values = new Set<string>();
  settings.workRanges.forEach((range) => {
    let current = timeToMinutes(range.start);
    const end = timeToMinutes(range.end);
    while (current < end) {
      values.add(minutesToTime(current));
      current += 15;
    }
  });
  return Array.from(values).sort();
}

export function isProtectedTime(time: string, settings: PlannerSettings): ProtectedSlot | undefined {
  const minute = timeToMinutes(time);
  return settings.protectedSlots.find((slot) => {
    const start = timeToMinutes(slot.start);
    const end = timeToMinutes(slot.end);
    return minute >= start && minute < end;
  });
}

export function isWorkingDay(day: string, settings: PlannerSettings): boolean {
  const date = fromIsoDate(day);
  const weekday = date.getDay();
  return settings.activeWeekdays.includes(weekday) && !settings.holidays.includes(day);
}

export function getBlockedMinutesForDay(day: string, blocks: TimeBlock[]): number {
  return blocks.filter((block) => block.day === day).reduce((total, block) => total + block.duration, 0);
}

export function getDailySaturation(
  day: string,
  blocks: TimeBlock[],
  settings: PlannerSettings,
  saturation: number,
): { capacity: number; target: number; planned: number; usedPercent: number; targetPercent: number } {
  const capacity = getCapacityMinutes(settings);
  const target = Math.round((capacity * saturation) / 100);
  const planned = getBlockedMinutesForDay(day, blocks);
  return {
    capacity,
    target,
    planned,
    usedPercent: capacity === 0 ? 0 : (planned / capacity) * 100,
    targetPercent: saturation,
  };
}

export function canPlaceBlock(
  candidate: TimeBlock,
  blocks: TimeBlock[],
  settings: PlannerSettings,
  ignoreBlockId?: string,
): boolean {
  if (!isWorkingDay(candidate.day, settings)) return false;
  const start = timeToMinutes(candidate.startTime);
  const end = start + candidate.duration;

  const insideRange = settings.workRanges.some((range) => {
    const rangeStart = timeToMinutes(range.start);
    const rangeEnd = timeToMinutes(range.end);
    return start >= rangeStart && end <= rangeEnd;
  });
  if (!insideRange) return false;

  const overlapsProtected = settings.protectedSlots.some((slot) => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    return start < slotEnd && end > slotStart;
  });
  if (overlapsProtected) return false;

  return !blocks.some((block) => {
    if (block.day !== candidate.day || block.id === ignoreBlockId) return false;
    const blockStart = timeToMinutes(block.startTime);
    const blockEnd = blockStart + block.duration;
    return start < blockEnd && end > blockStart;
  });
}

export function sortTasks(tasks: Task[], mode: TaskSortMode): Task[] {
  if (mode === 'manuale') {
    return [...tasks].sort((a, b) => a.manualOrder - b.manualOrder);
  }

  const priorityWeight: Record<TaskPriority, number> = { Alta: 0, Media: 1, Bassa: 2 };
  return [...tasks].sort((a, b) => {
    const weight = priorityWeight[a.priority] - priorityWeight[b.priority];
    if (weight !== 0) return weight;
    return a.manualOrder - b.manualOrder;
  });
}

export function normalizeSettings(raw?: Partial<PlannerSettings>): PlannerSettings {
  return {
    workRanges: raw?.workRanges?.length ? raw.workRanges : DEFAULT_SETTINGS.workRanges,
    protectedSlots: raw?.protectedSlots?.length ? raw.protectedSlots : DEFAULT_SETTINGS.protectedSlots,
    defaultDurations: raw?.defaultDurations?.length ? raw.defaultDurations : DEFAULT_SETTINGS.defaultDurations,
    categories: raw?.categories?.length ? raw.categories : DEFAULT_CATEGORIES,
    domains: raw?.domains?.length ? raw.domains : DEFAULT_DOMAINS,
    showWeekends: raw?.showWeekends ?? DEFAULT_SETTINGS.showWeekends,
    activeWeekdays: raw?.activeWeekdays?.length ? raw.activeWeekdays : DEFAULT_SETTINGS.activeWeekdays,
    holidays: raw?.holidays ?? [],
  };
}

export function normalizeTask(task: string | Partial<Task>, index: number, settings: PlannerSettings): Task {
  if (typeof task === 'string') {
    return {
      id: createId('task'),
      title: task,
      priority: 'Media',
      category: settings.categories[0] ?? DEFAULT_CATEGORIES[0],
      domain: settings.domains[0] ?? DEFAULT_DOMAINS[0],
      estimatedMinutes: 30,
      manualOrder: index,
      completed: false,
    };
  }

  return {
    id: task.id ?? createId('task'),
    title: task.title ?? '',
    priority: task.priority ?? 'Media',
    category: task.category ?? settings.categories[0] ?? DEFAULT_CATEGORIES[0],
    domain: task.domain ?? settings.domains[0] ?? DEFAULT_DOMAINS[0],
    estimatedMinutes: task.estimatedMinutes ?? 30,
    manualOrder: task.manualOrder ?? index,
    completed: task.completed ?? false,
  };
}

export function normalizeBlock(block: Partial<TimeBlock>, settings: PlannerSettings): TimeBlock {
  const normalizedDay = block.day
    ? block.day.includes('T')
      ? toIsoDate(new Date(block.day))
      : block.day
    : toIsoDate(new Date());

  return {
    id: block.id ?? createId('block'),
    taskId: block.taskId ?? createId('taskref'),
    title: block.title ?? block.taskId ?? 'Nuova attivita',
    day: normalizedDay,
    startTime: block.startTime ?? settings.workRanges[0]?.start ?? '08:30',
    duration: block.duration ?? 60,
    category: block.category ?? settings.categories[0] ?? DEFAULT_CATEGORIES[0],
    domain: block.domain ?? settings.domains[0] ?? DEFAULT_DOMAINS[0],
  };
}

function normalizeWeeklyPlan(raw?: Partial<WeeklyPlan>): WeeklyPlan {
  return {
    bigRockIds: raw?.bigRockIds ?? [],
    mitPoolIds: raw?.mitPoolIds ?? [],
    dailyMitAssignments: raw?.dailyMitAssignments ?? {},
  };
}

function dedupeTasks(tasks: Task[]): Task[] {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = task.title.trim().toLowerCase();
    if (!key || seen.has(key)) return !key ? false : false;
    seen.add(key);
    return true;
  });
}

function migrateLegacyWeeklyData(raw: LegacyPlannerData, settings: PlannerSettings): {
  tasks: Task[];
  weeklyPlans: Record<string, WeeklyPlan>;
} {
  const baseTasks = (raw.tasks ?? raw.nextActions ?? []).map((task, index) =>
    normalizeTask(task as string | Partial<Task>, index, settings),
  );
  const tasks = [...baseTasks];
  const weekKey = getWeekKey(new Date());
  const weeklyPlan = normalizeWeeklyPlan(raw.weeklyPlans?.[weekKey]);

  const ensureTaskId = (title: string, category: string): string => {
    const existing = tasks.find((task) => task.title.trim().toLowerCase() === title.trim().toLowerCase());
    if (existing) return existing.id;
    const task = normalizeTask(
      {
        id: createId('task'),
        title,
        category,
        domain: settings.domains[0] ?? DEFAULT_DOMAINS[0],
        priority: category === 'Big Rock' ? 'Alta' : 'Media',
        estimatedMinutes: category === 'Big Rock' ? 60 : 30,
      },
      tasks.length,
      settings,
    );
    tasks.push(task);
    return task.id;
  };

  const bigRockIds = raw.bigRocks?.filter(Boolean).map((title) => ensureTaskId(title, 'Big Rock')) ?? [];
  const mitTaskIds = raw.dailyMITs?.filter(Boolean).map((title) => ensureTaskId(title, 'MIT')) ?? [];

  if (!raw.weeklyPlans) {
    weeklyPlan.bigRockIds = bigRockIds;
    weeklyPlan.mitPoolIds = mitTaskIds;
    if (mitTaskIds.length > 0) {
      const weekDays = getWeekDays(new Date(), settings);
      weekDays.forEach((day, index) => {
        const assigned = mitTaskIds[index] ? [mitTaskIds[index]] : [];
        if (assigned.length > 0) {
          weeklyPlan.dailyMitAssignments[toIsoDate(day)] = assigned;
        }
      });
    }
  }

  return {
    tasks: dedupeTasks(tasks).map((task, index) => ({ ...task, manualOrder: index })),
    weeklyPlans: {
      ...(raw.weeklyPlans ?? {}),
      [weekKey]: weeklyPlan,
    },
  };
}

export function normalizeData(raw: LegacyPlannerData | undefined): PlannerData {
  const settings = normalizeSettings(raw?.settings);
  const migrated = migrateLegacyWeeklyData(raw ?? {}, settings);

  return {
    ...EMPTY_DATA,
    saturation: raw?.saturation ?? EMPTY_DATA.saturation,
    tasks: migrated.tasks,
    weeklyPlans: Object.fromEntries(
      Object.entries(migrated.weeklyPlans).map(([weekKey, plan]) => [weekKey, normalizeWeeklyPlan(plan)]),
    ),
    specialties: raw?.specialties ?? {},
    blocks: (raw?.blocks ?? []).map((block) => normalizeBlock(block as Partial<TimeBlock>, settings)),
    emergencyLogs: raw?.emergencyLogs ?? [],
    settings,
  };
}

export function ensureWeekPlan(weeklyPlans: Record<string, WeeklyPlan>, weekKey: string): WeeklyPlan {
  return normalizeWeeklyPlan(weeklyPlans[weekKey] ?? EMPTY_WEEKLY_PLAN);
}

export function createEmptyTask(settings: PlannerSettings, manualOrder: number): Task {
  return {
    id: createId('task'),
    title: '',
    priority: 'Media',
    category: settings.categories[0] ?? DEFAULT_CATEGORIES[0],
    domain: settings.domains[0] ?? DEFAULT_DOMAINS[0],
    estimatedMinutes: 30,
    manualOrder,
    completed: false,
  };
}

export function getDomainColor(domain: WorkDomain): string {
  const palette: Record<string, string> = {
    Operation: '#2563eb',
    Tecnica: '#dc2626',
    Formazione: '#059669',
    'Miglioramento Processo': '#7c3aed',
    Altro: '#64748b',
  };
  return palette[domain] ?? '#0f172a';
}

export function getWeekMetrics(blocks: TimeBlock[], settings: PlannerSettings): Record<WorkDomain, number> {
  return settings.domains.reduce(
    (acc, domain) => {
      acc[domain] = blocks
        .filter((block) => block.domain === domain)
        .reduce((sum, block) => sum + block.duration, 0);
      return acc;
    },
    {} as Record<WorkDomain, number>,
  );
}

export function describeDayState(day: string, settings: PlannerSettings): string {
  if (settings.holidays.includes(day)) return 'Ferie';
  if (!settings.activeWeekdays.includes(fromIsoDate(day).getDay())) {
    return isWeekend(fromIsoDate(day)) ? 'Weekend' : 'Non lavorativo';
  }
  return 'Lavorativo';
}

export function replaceEmergencyNote(
  day: string,
  note: string,
  entries: { id: string; day: string; note: string }[],
): { id: string; day: string; note: string }[] {
  const existing = entries.find((entry) => entry.day === day);
  if (existing) {
    return entries.map((entry) => (entry.day === day ? { ...entry, note } : entry));
  }
  return [...entries, { id: createId('emergency'), day, note }];
}

export function buildTimeSlots(settings: PlannerSettings): string[] {
  const slots: string[] = [];
  settings.workRanges.forEach((range) => {
    let current = parse(range.start, 'HH:mm', new Date());
    const end = parse(range.end, 'HH:mm', new Date());
    while (current < end) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, 15);
    }
  });
  return slots;
}

export function getTaskById(tasks: Task[], taskId: string): Task | undefined {
  return tasks.find((task) => task.id === taskId);
}

export function getTasksByIds(tasks: Task[], ids: string[]): Task[] {
  const index = new Map(tasks.map((task) => [task.id, task]));
  return ids.map((id) => index.get(id)).filter(Boolean) as Task[];
}

export function isTaskPlannedInWeek(taskId: string, blocks: TimeBlock[], weekKey: string): boolean {
  const weekStart = fromIsoDate(weekKey);
  return blocks.some((block) => block.taskId === taskId && isSameWeek(fromIsoDate(block.day), weekStart, { weekStartsOn: 1 }));
}

export function getTaskStatus(task: Task, blocks: TimeBlock[], weekKey: string): TaskStatus {
  if (task.completed) return 'done';
  return isTaskPlannedInWeek(task.id, blocks, weekKey) ? 'planned' : 'idle';
}

export function getTaskStatusClass(status: TaskStatus): string {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'planned') return 'border-blue-200 bg-blue-50 text-blue-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function setDailyMit(
  dailyAssignments: Record<string, string[]>,
  day: string,
  taskId: string,
): Record<string, string[]> {
  return {
    ...dailyAssignments,
    [day]: toggleId(dailyAssignments[day] ?? [], taskId),
  };
}

export function getVisibleDay(currentDate: Date, weekDays: Date[]): string {
  const todayInWeek = weekDays.find((day) => isSameWeek(day, currentDate, { weekStartsOn: 1 }) && toIsoDate(day) === toIsoDate(currentDate));
  return toIsoDate(todayInWeek ?? weekDays[0] ?? currentDate);
}
