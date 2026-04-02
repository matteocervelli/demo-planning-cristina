import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { AnimatePresence, motion } from 'motion/react';
import type { ModalState, PlannerSettings } from '../planner/types';

interface PlannerModalProps {
  isOpen: boolean;
  modal: ModalState | null;
  settings: PlannerSettings;
  onClose: () => void;
  onChange: (patch: Partial<ModalState>) => void;
  onConfirm: () => void;
  timeOptions: string[];
}

export function PlannerModal({
  isOpen,
  modal,
  settings,
  onClose,
  onChange,
  onConfirm,
  timeOptions,
}: PlannerModalProps) {
  return (
    <AnimatePresence>
      {isOpen && modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <h2 className="text-xl font-bold text-slate-900">Pianifica attivita</h2>
              <p className="mt-1 text-sm text-slate-500">
                {format(new Date(modal.day), 'EEEE d MMMM yyyy', { locale: it })}
              </p>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Titolo</label>
                <input
                  autoFocus
                  value={modal.title}
                  onChange={(event) => onChange({ title: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  placeholder="Cosa devi fare?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Orario inizio</label>
                  <select
                    value={modal.startTime}
                    onChange={(event) => onChange({ startTime: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {timeOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Durata</label>
                  <select
                    value={modal.duration}
                    onChange={(event) => onChange({ duration: Number(event.target.value) })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {settings.defaultDurations.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration} min
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Categoria</label>
                  <select
                    value={modal.category}
                    onChange={(event) => onChange({ category: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {settings.categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase text-slate-400">Dominio</label>
                  <select
                    value={modal.domain}
                    onChange={(event) => onChange({ domain: event.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                  >
                    {settings.domains.map((domain) => (
                      <option key={domain} value={domain}>
                        {domain}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 bg-slate-50 px-6 py-5">
              <button onClick={onClose} className="flex-1 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-500">
                Annulla
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Conferma
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
