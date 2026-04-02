import { Plus, Trash2 } from 'lucide-react';
import type { PlannerSettings, ProtectedSlot, WorkRange } from '../planner/types';

interface SettingsViewProps {
  settings: PlannerSettings;
  setSettings: (value: PlannerSettings) => void;
}

function updateArray<T>(items: T[], index: number, value: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? value : item));
}

export function SettingsView({ settings, setSettings }: SettingsViewProps) {
  const weekdayLabels = [
    { id: 1, label: 'Lun' },
    { id: 2, label: 'Mar' },
    { id: 3, label: 'Mer' },
    { id: 4, label: 'Gio' },
    { id: 5, label: 'Ven' },
    { id: 6, label: 'Sab' },
    { id: 0, label: 'Dom' },
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-9">
      <div>
        <h2 className="text-lg font-bold">Configurazione planner</h2>
        <p className="mt-1 text-sm text-slate-500">Qui definisci turni, categorie, domini, ferie e blocchi protetti email o buffer.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Turni giornalieri</h3>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  workRanges: [...settings.workRanges, { id: `range-${Date.now()}`, start: '09:00', end: '10:00' }],
                })
              }
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="space-y-3">
            {settings.workRanges.map((range, index) => (
              <div key={range.id} className="flex items-center gap-2">
                <input
                  type="time"
                  value={range.start}
                  onChange={(event) =>
                    setSettings({ ...settings, workRanges: updateArray<WorkRange>(settings.workRanges, index, { ...range, start: event.target.value }) })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={range.end}
                  onChange={(event) =>
                    setSettings({ ...settings, workRanges: updateArray<WorkRange>(settings.workRanges, index, { ...range, end: event.target.value }) })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <button
                  onClick={() => setSettings({ ...settings, workRanges: settings.workRanges.filter((item) => item.id !== range.id) })}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Blocchi email e buffer</h3>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  protectedSlots: [
                    ...settings.protectedSlots,
                    { id: `slot-${Date.now()}`, start: '12:00', end: '12:15', label: 'Buffer', type: 'buffer' },
                  ],
                })
              }
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4 text-slate-500" />
            </button>
          </div>
          <div className="space-y-3">
            {settings.protectedSlots.map((slot, index) => (
              <div key={slot.id} className="grid grid-cols-[1fr,1fr,1fr,100px,44px] items-center gap-2">
                <input
                  value={slot.label}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      protectedSlots: updateArray<ProtectedSlot>(settings.protectedSlots, index, { ...slot, label: event.target.value }),
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={slot.start}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      protectedSlots: updateArray<ProtectedSlot>(settings.protectedSlots, index, { ...slot, start: event.target.value }),
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <input
                  type="time"
                  value={slot.end}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      protectedSlots: updateArray<ProtectedSlot>(settings.protectedSlots, index, { ...slot, end: event.target.value }),
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <select
                  value={slot.type}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      protectedSlots: updateArray<ProtectedSlot>(settings.protectedSlots, index, {
                        ...slot,
                        type: event.target.value as ProtectedSlot['type'],
                      }),
                    })
                  }
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <option value="email">Email</option>
                  <option value="buffer">Buffer</option>
                </select>
                <button
                  onClick={() => setSettings({ ...settings, protectedSlots: settings.protectedSlots.filter((item) => item.id !== slot.id) })}
                  className="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-3 font-semibold">Durate predefinite</h3>
          <input
            value={settings.defaultDurations.join(', ')}
            onChange={(event) =>
              setSettings({
                ...settings,
                defaultDurations: event.target.value
                  .split(',')
                  .map((value) => Number(value.trim()))
                  .filter((value) => Number.isFinite(value) && value > 0),
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            placeholder="15, 30, 45, 60"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-3 font-semibold">Categorie</h3>
          <textarea
            value={settings.categories.join('\n')}
            onChange={(event) => setSettings({ ...settings, categories: event.target.value.split('\n').filter(Boolean) })}
            className="h-40 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-3 font-semibold">Domini</h3>
          <textarea
            value={settings.domains.join('\n')}
            onChange={(event) => setSettings({ ...settings, domains: event.target.value.split('\n').filter(Boolean) })}
            className="h-40 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Weekend e giorni lavorativi</h3>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.showWeekends} onChange={(event) => setSettings({ ...settings, showWeekends: event.target.checked })} />
              Mostra sabato e domenica
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {weekdayLabels.map((day) => {
              const selected = settings.activeWeekdays.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      activeWeekdays: selected
                        ? settings.activeWeekdays.filter((value) => value !== day.id)
                        : [...settings.activeWeekdays, day.id].sort(),
                    })
                  }
                  className={`rounded-xl px-3 py-2 text-sm ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <h3 className="mb-3 font-semibold">Ferie e chiusure</h3>
          <textarea
            value={settings.holidays.join('\n')}
            onChange={(event) => setSettings({ ...settings, holidays: event.target.value.split('\n').map((value) => value.trim()).filter(Boolean) })}
            className="h-40 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
            placeholder="2026-08-10&#10;2026-08-11"
          />
        </div>
      </div>
    </section>
  );
}
