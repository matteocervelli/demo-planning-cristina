import type { PlannerData, PlannerSettings, WeeklyPlan } from './types';

export const DEFAULT_CATEGORIES = ['Big Rock', 'MIT', 'Emergenza', 'Chore', 'Altro'];
export const DEFAULT_DOMAINS = [
  'Operation',
  'Tecnica',
  'Formazione',
  'Miglioramento Processo',
  'Altro',
];

export const DEFAULT_SETTINGS: PlannerSettings = {
  workRanges: [
    { id: 'morning', start: '08:30', end: '13:00' },
    { id: 'afternoon', start: '15:00', end: '18:30' },
  ],
  protectedSlots: [
    { id: 'email-morning', start: '08:30', end: '08:45', label: 'Email', type: 'email' },
    { id: 'buffer-afternoon', start: '15:00', end: '15:15', label: 'Buffer', type: 'buffer' },
    { id: 'email-evening', start: '18:15', end: '18:30', label: 'Email', type: 'email' },
  ],
  defaultDurations: [15, 30, 45, 60, 90, 120],
  categories: DEFAULT_CATEGORIES,
  domains: DEFAULT_DOMAINS,
  showWeekends: false,
  activeWeekdays: [1, 2, 3, 4, 5],
  holidays: [],
};

export const EMPTY_WEEKLY_PLAN: WeeklyPlan = {
  bigRockIds: [],
  mitPoolIds: [],
  dailyMitAssignments: {},
};

export const EMPTY_DATA: PlannerData = {
  saturation: 75,
  tasks: [],
  weeklyPlans: {},
  specialties: {},
  blocks: [],
  emergencyLogs: [],
  settings: DEFAULT_SETTINGS,
};
