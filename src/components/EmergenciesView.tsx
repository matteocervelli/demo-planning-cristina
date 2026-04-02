import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { replaceEmergencyNote, toIsoDate } from '../planner/utils';
import type { EmergencyEntry } from '../planner/types';

interface EmergenciesViewProps {
  weekDays: Date[];
  emergencyLogs: EmergencyEntry[];
  setEmergencyLogs: (value: EmergencyEntry[]) => void;
}

export function EmergenciesView({ weekDays, emergencyLogs, setEmergencyLogs }: EmergenciesViewProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm xl:col-span-9">
      <h2 className="mb-6 text-lg font-bold">Registro emergenze giornaliero</h2>
      <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}>
        {weekDays.map((day) => {
          const isoDay = toIsoDate(day);
          const note = emergencyLogs.find((entry) => entry.day === isoDay)?.note ?? '';
          return (
            <div key={isoDay} className="space-y-2">
              <div className="text-xs font-bold uppercase text-slate-400">{format(day, 'EEEE d', { locale: it })}</div>
              <textarea
                value={note}
                onChange={(event) => setEmergencyLogs(replaceEmergencyNote(isoDay, event.target.value, emergencyLogs) as EmergencyEntry[])}
                className="h-48 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm"
                placeholder="Interruzioni, urgenze, imprevisti"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
