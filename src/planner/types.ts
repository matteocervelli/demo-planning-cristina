export type WorkCategory = string;
export type WorkDomain = string;
export type TaskPriority = 'Alta' | 'Media' | 'Bassa';
export type TaskSortMode = 'manuale' | 'priorita';
export type TaskStatus = 'idle' | 'planned' | 'done';
export type ActiveTab =
  | 'calendar'
  | 'tasks'
  | 'metrics'
  | 'settings'
  | 'guide'
  | 'emergencies';

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  category: WorkCategory;
  domain: WorkDomain;
  estimatedMinutes: number;
  manualOrder: number;
  completed: boolean;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  title: string;
  day: string;
  startTime: string;
  duration: number;
  category: WorkCategory;
  domain: WorkDomain;
}

export interface EmergencyEntry {
  id: string;
  day: string;
  note: string;
}

export interface WeeklyPlan {
  bigRockIds: string[];
  mitPoolIds: string[];
  dailyMitAssignments: Record<string, string[]>;
}

export interface WorkRange {
  id: string;
  start: string;
  end: string;
}

export interface ProtectedSlot {
  id: string;
  start: string;
  end: string;
  label: string;
  type: 'email' | 'buffer';
}

export interface PlannerSettings {
  workRanges: WorkRange[];
  protectedSlots: ProtectedSlot[];
  defaultDurations: number[];
  categories: WorkCategory[];
  domains: WorkDomain[];
  showWeekends: boolean;
  activeWeekdays: number[];
  holidays: string[];
}

export interface PlannerData {
  saturation: number;
  tasks: Task[];
  weeklyPlans: Record<string, WeeklyPlan>;
  specialties: Record<string, string>;
  blocks: TimeBlock[];
  emergencyLogs: EmergencyEntry[];
  settings: PlannerSettings;
}

export interface ModalState {
  day: string;
  taskId?: string;
  title: string;
  startTime: string;
  duration: number;
  category: WorkCategory;
  domain: WorkDomain;
}
