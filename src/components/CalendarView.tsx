import { isToday } from 'date-fns';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CheckSquare, GripVertical, Mail, Plus, Square, StretchHorizontal, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import type { PlannerSettings, Task, TimeBlock } from '../planner/types';
import {
  buildTimeSlots,
  describeDayState,
  getDomainColor,
  getTaskById,
  isProtectedTime,
  isWorkingDay,
  toIsoDate,
} from '../planner/utils';

interface CalendarViewProps {
  weekDays: Date[];
  selectedDay: string;
  specialties: Record<string, string>;
  setSpecialties: (value: Record<string, string>) => void;
  blocks: TimeBlock[];
  tasks: Task[];
  settings: PlannerSettings;
  onSelectDay: (day: string) => void;
  onOpenModal: (day: string, startTime: string, taskId?: string, title?: string, category?: string, domain?: string, duration?: number) => void;
  onRemoveBlock: (id: string) => void;
  onResizeBlock: (id: string, delta: number) => void;
  onTaskDrop: (day: string, startTime: string) => void;
  onBlockDrag: (id: string) => void;
  onToggleTaskDone: (id: string) => void;
}

export function CalendarView(props: CalendarViewProps) {
  const {
    weekDays,
    selectedDay,
    specialties,
    setSpecialties,
    blocks,
    tasks,
    settings,
    onSelectDay,
    onOpenModal,
    onRemoveBlock,
    onResizeBlock,
    onTaskDrop,
    onBlockDrag,
    onToggleTaskDone,
  } = props;
  const timeSlots = buildTimeSlots(settings);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm xl:col-span-9">
      <div className="grid border-b border-slate-200 bg-slate-50/70" style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
        <div />
        {weekDays.map((day) => {
          const isoDay = toIsoDate(day);
          const workingDay = isWorkingDay(isoDay, settings);
          return (
            <button
              key={isoDay}
              onClick={() => onSelectDay(isoDay)}
              className={cn(
                'border-l border-slate-200 p-4 text-left transition-colors',
                isoDay === selectedDay && 'bg-blue-50',
                isToday(day) && 'ring-1 ring-inset ring-blue-200',
              )}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {format(day, 'EEEE', { locale: it })}
              </div>
              <div className="text-lg font-bold text-slate-800">{format(day, 'd')}</div>
              <div className={cn('mt-1 text-xs font-semibold', workingDay ? 'text-emerald-600' : 'text-amber-600')}>
                {describeDayState(isoDay, settings)}
              </div>
              <input
                value={specialties[isoDay] ?? ''}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => setSpecialties({ ...specialties, [isoDay]: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs"
                placeholder="Focus del giorno"
              />
            </button>
          );
        })}
      </div>

      <div className="max-h-[760px] overflow-auto">
        <div style={{ gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(0, 1fr))` }} className="grid">
          <div className="border-r border-slate-200 bg-slate-50/40">
            {timeSlots.map((time) => (
              <div key={time} className="flex h-10 items-start justify-center border-b border-slate-100 pt-1 text-[10px] font-mono text-slate-400">
                {time}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const isoDay = toIsoDate(day);
            const isOffDay = !isWorkingDay(isoDay, settings);
            return (
              <div key={isoDay} className={cn('relative border-r border-slate-100 last:border-r-0', isoDay === selectedDay && 'bg-blue-50/20')}>
                {timeSlots.map((time) => {
                  const slotBlock = blocks.find((block) => block.day === isoDay && block.startTime === time);
                  const protectedSlot = isProtectedTime(time, settings);
                  const linkedTask = slotBlock ? getTaskById(tasks, slotBlock.taskId) : undefined;
                  return (
                    <div
                      key={`${isoDay}-${time}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (!protectedSlot && !isOffDay) onTaskDrop(isoDay, time);
                      }}
                      onClick={() => {
                        if (!protectedSlot && !isOffDay && !slotBlock) onOpenModal(isoDay, time);
                      }}
                      className={cn(
                        'group relative h-10 border-b border-slate-100 transition-colors',
                        protectedSlot ? 'bg-amber-50/70' : 'hover:bg-slate-50',
                        isOffDay && 'bg-slate-50/70',
                      )}
                    >
                      {protectedSlot && (
                        <div className="absolute inset-0 flex items-center gap-1 px-2 text-[10px] font-semibold text-amber-700">
                          <Mail className="h-3 w-3" /> {protectedSlot.label}
                        </div>
                      )}
                      {!protectedSlot && !isOffDay && !slotBlock && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <Plus className="h-4 w-4 text-slate-300" />
                        </div>
                      )}
                      {slotBlock && (
                        <div
                          draggable
                          onDragStart={() => onBlockDrag(slotBlock.id)}
                          className="absolute inset-x-1 top-1 z-20 overflow-hidden rounded-2xl p-2 text-white shadow-lg"
                          style={{
                            backgroundColor: getDomainColor(slotBlock.domain),
                            height: `${(slotBlock.duration / 15) * 40 - 6}px`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider opacity-80">
                                <GripVertical className="h-3 w-3" /> {slotBlock.category}
                              </div>
                              <div className="line-clamp-2 text-xs font-bold">{slotBlock.title}</div>
                            </div>
                            <div className="flex items-center gap-1">
                              {linkedTask && (
                                <button onClick={() => onToggleTaskDone(linkedTask.id)} className="rounded-lg p-1 hover:bg-black/10">
                                  {linkedTask.completed ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                                </button>
                              )}
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onRemoveBlock(slotBlock.id);
                                }}
                                className="rounded-lg p-1 hover:bg-black/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px] opacity-90">
                            <span>{slotBlock.startTime}</span>
                            <span>{slotBlock.duration} min</span>
                          </div>
                          <div className="mt-2 flex gap-1">
                            <button onClick={() => onResizeBlock(slotBlock.id, -15)} className="rounded-lg bg-black/10 px-2 py-1 text-[10px]">
                              -15
                            </button>
                            <button onClick={() => onResizeBlock(slotBlock.id, 15)} className="rounded-lg bg-black/10 px-2 py-1 text-[10px]">
                              <StretchHorizontal className="mr-1 inline h-3 w-3" />
                              +15
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
