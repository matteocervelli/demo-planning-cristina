import { BookOpen, ChevronLeft, ChevronRight, PlayCircle, Settings, Square, Table2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '../lib/utils';
import type { ActiveTab } from '../planner/types';

const TAB_LABELS: { id: ActiveTab; label: string }[] = [
  { id: 'calendar', label: 'Calendario' },
  { id: 'tasks', label: 'Attivita' },
  { id: 'metrics', label: 'Metriche' },
  { id: 'settings', label: 'Configurazione' },
  { id: 'guide', label: 'Guida' },
  { id: 'emergencies', label: 'Emergenze' },
];

interface TopBarProps {
  appName: string;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  weekLabel: { start: Date; end: Date };
  onWeekChange: (delta: number) => void;
  onExport: () => void;
  onImport: () => void;
  onShutdown: () => void;
}

export function TopBar({
  appName,
  activeTab,
  onTabChange,
  weekLabel,
  onWeekChange,
  onExport,
  onImport,
  onShutdown,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-200">
          <Table2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{appName}</h1>
          <p className="text-xs font-medium text-slate-500">Planner locale per uso personale, senza login</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl bg-slate-100 p-1">
          {TAB_LABELS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1">
          <button onClick={() => onWeekChange(-7)} className="rounded-full p-2 hover:bg-slate-100">
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <span className="min-w-[190px] text-center text-sm font-semibold">
            {format(weekLabel.start, 'd MMM', { locale: it })} - {format(weekLabel.end, 'd MMM yyyy', { locale: it })}
          </span>
          <button onClick={() => onWeekChange(7)} className="rounded-full p-2 hover:bg-slate-100">
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => onTabChange('settings')} title="Configurazione" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <Settings className="h-5 w-5" />
          </button>
          <button onClick={() => onTabChange('guide')} title="Guida" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <BookOpen className="h-5 w-5" />
          </button>
          <button onClick={onExport} title="Esporta backup" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <PlayCircle className="h-5 w-5" />
          </button>
          <button onClick={onImport} title="Importa backup" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <PlayCircle className="h-5 w-5 rotate-180" />
          </button>
          <button onClick={onShutdown} title="Ferma applicazione" className="rounded-xl bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
            <Square className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
