import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Target, 
  Zap, 
  ListTodo, 
  Settings, 
  PieChart, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Trash2,
  Mail,
  Clock,
  BookOpen,
  Settings2,
  Briefcase
} from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  addMinutes, 
  isSameDay, 
  parse, 
  differenceInMinutes,
  isWithinInterval
} from 'date-fns';
import { it } from 'date-fns/locale';
import { 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Types ---

type WorkCategory = 'Big Rock' | 'MIT' | 'Emergenza' | 'Chore' | 'Altro';
type WorkDomain = 'Operation' | 'Tecnica' | 'Formazione' | 'Miglioramento Processo' | 'Altro';

interface TimeBlock {
  id: string;
  taskId: string;
  day: Date;
  startTime: string; // "HH:mm"
  duration: number;
  category: WorkCategory;
  domain: WorkDomain;
}

interface DaySpecialty {
  day: string; // ISO date string
  specialty: string;
}

interface EmergencyEntry {
  id: string;
  day: string;
  note: string;
}

// --- Constants ---

const WORK_HOURS = [
  { start: '08:30', end: '13:00' },
  { start: '15:00', end: '18:30' }
];

const EMAIL_SLOTS = [
  { start: '08:30', end: '08:45' },
  { start: '15:00', end: '15:15' },
  { start: '18:15', end: '18:30' }
];

const DOMAIN_COLORS: Record<WorkDomain, string> = {
  'Operation': '#3b82f6', // Blue
  'Tecnica': '#ef4444', // Red
  'Formazione': '#10b981', // Emerald
  'Miglioramento Processo': '#8b5cf6', // Violet
  'Altro': '#94a3b8' // Slate
};

const CATEGORY_ICONS: Record<WorkCategory, React.ReactNode> = {
  'Big Rock': <Target className="w-3 h-3" />,
  'MIT': <Zap className="w-3 h-3" />,
  'Emergenza': <AlertCircle className="w-3 h-3" />,
  'Chore': <ListTodo className="w-3 h-3" />,
  'Altro': <Clock className="w-3 h-3" />
};

// --- Main Component ---

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [saturation, setSaturation] = useState(75);
  const [bigRocks, setBigRocks] = useState<string[]>([]);
  const [dailyMITs, setDailyMITs] = useState<string[]>([]);
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<Record<string, string>>({});
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [emergencyLogs, setEmergencyLogs] = useState<EmergencyEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'calendar' | 'metrics' | 'emergencies'>('calendar');

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/data');
        const parsed = await response.json();
        if (parsed.saturation) setSaturation(parsed.saturation);
        if (parsed.bigRocks) setBigRocks(parsed.bigRocks);
        if (parsed.dailyMITs) setDailyMITs(parsed.dailyMITs);
        if (parsed.nextActions) setNextActions(parsed.nextActions);
        if (parsed.specialties) setSpecialties(parsed.specialties);
        if (parsed.emergencyLogs) setEmergencyLogs(parsed.emergencyLogs);
        if (parsed.blocks) {
          // Convert string dates back to Date objects
          const blocksWithDates = parsed.blocks.map((b: any) => ({
            ...b,
            day: new Date(b.day)
          }));
          setBlocks(blocksWithDates);
        }
      } catch (e) {
        console.error("Error loading data from API", e);
      }
    };
    loadData();
  }, []);

  // Save data to API whenever it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const dataToSave = {
        saturation,
        bigRocks,
        dailyMITs,
        nextActions,
        specialties,
        blocks,
        emergencyLogs
      };
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToSave)
        });
      } catch (e) {
        console.error("Error saving data to API", e);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [saturation, bigRocks, dailyMITs, nextActions, specialties, blocks, emergencyLogs]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ day: Date; time: string; title: string; category: WorkCategory } | null>(null);
  const [newBlockDuration, setNewBlockDuration] = useState(60);
  const [newBlockCategory, setNewBlockCategory] = useState<WorkCategory>('Altro');
  const [newBlockDomain, setNewBlockDomain] = useState<WorkDomain>('Tecnica');

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  // --- Calculations ---

  const totalDailyMinutes = useMemo(() => {
    return WORK_HOURS.reduce((acc, range) => {
      const start = parse(range.start, 'HH:mm', new Date());
      const end = parse(range.end, 'HH:mm', new Date());
      return acc + differenceInMinutes(end, start);
    }, 0);
  }, []);

  const plannedMinutes = useMemo(() => {
    return (totalDailyMinutes * saturation) / 100;
  }, [totalDailyMinutes, saturation]);

  const bufferMinutes = useMemo(() => {
    return totalDailyMinutes - plannedMinutes;
  }, [totalDailyMinutes, plannedMinutes]);

  const metricsData = useMemo(() => {
    const domainMinutes: Record<string, number> = {
      'Operation': 0,
      'Tecnica': 0,
      'Formazione': 0,
      'Miglioramento Processo': 0,
      'Altro': 0
    };

    blocks.forEach(b => {
      domainMinutes[b.domain] = (domainMinutes[b.domain] || 0) + b.duration;
    });

    const totalPlanned = Object.values(domainMinutes).reduce((a, b) => a + b, 0);
    const totalWeekMinutes = 40 * 60; // 40 hours
    const freeTime = Math.max(0, totalWeekMinutes - totalPlanned);

    const data = Object.entries(domainMinutes)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: DOMAIN_COLORS[name as WorkDomain]
      }));

    if (freeTime > 0) {
      data.push({
        name: 'Tempo Libero / Buffer',
        value: freeTime,
        color: '#f1f5f9' // Very light slate
      });
    }

    return data;
  }, [blocks]);

  const domainPercentages = useMemo(() => {
    const totalWeekMinutes = 40 * 60;
    const percentages: Record<string, number> = {};
    
    (['Operation', 'Tecnica', 'Formazione', 'Miglioramento Processo', 'Altro'] as WorkDomain[]).forEach(d => {
      const mins = blocks.filter(b => b.domain === d).reduce((acc, b) => acc + b.duration, 0);
      percentages[d] = (mins / totalWeekMinutes) * 100;
    });
    
    return percentages;
  }, [blocks]);

  // --- Handlers ---

  const handleOpenModal = (day: Date, time: string, title: string = "", category: WorkCategory = "Altro") => {
    setModalData({ day, time, title, category });
    setNewBlockCategory(category);
    setIsModalOpen(true);
  };

  const handleCreateBlock = () => {
    if (!modalData) return;
    
    const newBlock: TimeBlock = {
      id: Math.random().toString(36).substr(2, 9),
      taskId: modalData.title || "Nuova Attività",
      day: modalData.day,
      startTime: modalData.time,
      duration: newBlockDuration,
      category: newBlockCategory,
      domain: newBlockDomain
    };

    setBlocks([...blocks, newBlock]);
    setIsModalOpen(false);
    setModalData(null);
  };

  const handleDragStart = (e: React.DragEvent, title: string, category: WorkCategory) => {
    e.dataTransfer.setData('taskTitle', title);
    e.dataTransfer.setData('taskCategory', category);
  };

  const handleDrop = (e: React.DragEvent, day: Date, time: string) => {
    e.preventDefault();
    const title = e.dataTransfer.getData('taskTitle');
    const category = e.dataTransfer.getData('taskCategory') as WorkCategory;
    if (title) {
      handleOpenModal(day, time, title, category);
    }
  };

  // --- Render Helpers ---

  const renderTimeSlots = (day: Date) => {
    const slots = [];
    WORK_HOURS.forEach(range => {
      let current = parse(range.start, 'HH:mm', day);
      const end = parse(range.end, 'HH:mm', day);

      while (current < end) {
        const timeStr = format(current, 'HH:mm');
        const isEmail = EMAIL_SLOTS.some(s => s.start === timeStr);
        const hasBlock = blocks.some(b => isSameDay(b.day, day) && b.startTime === timeStr);
        
        slots.push(
          <div 
            key={timeStr} 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, day, timeStr)}
            className={cn(
              "h-10 border-b border-slate-100 relative group cursor-pointer hover:bg-slate-50 transition-colors",
              isEmail && "bg-amber-50/30"
            )}
            onClick={() => !isEmail && handleOpenModal(day, timeStr)}
          >
            {isEmail && (
              <div className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-amber-600/60">
                <Mail className="w-3 h-3 mr-1" /> Email & Buffer
              </div>
            )}
            {!isEmail && !hasBlock && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus className="w-4 h-4 text-slate-300" />
              </div>
            )}
            {/* Render existing blocks */}
            {blocks.filter(b => isSameDay(b.day, day) && b.startTime === timeStr).map(b => (
              <div 
                key={b.id}
                className="absolute inset-x-0.5 top-0.5 text-white text-[10px] p-2 rounded-lg shadow-md z-20 overflow-hidden border group/block"
                style={{ 
                  height: `${(b.duration / 15) * 40 - 4}px`,
                  backgroundColor: DOMAIN_COLORS[b.domain],
                  borderColor: `${DOMAIN_COLORS[b.domain]}33`
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1 font-bold leading-tight line-clamp-2">
                    {CATEGORY_ICONS[b.category]}
                    <span>{b.taskId}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlocks(blocks.filter(block => block.id !== b.id));
                    }}
                    className="opacity-0 group-hover/block:opacity-100 p-0.5 hover:bg-black/10 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-1 opacity-80 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {b.duration} min
                </div>
              </div>
            ))}
          </div>
        );
        current = addMinutes(current, 15);
      }
    });
    return slots;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800">Pianifica Attività</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {modalData && format(modalData.day, 'EEEE d MMMM', { locale: it })} alle {modalData?.time}
                </p>
              </div>
              
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Titolo</label>
                  <input 
                    type="text" 
                    value={modalData?.title || ''}
                    onChange={(e) => setModalData(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Cosa devi fare?"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Durata (min)</label>
                    <select 
                      value={newBlockDuration}
                      onChange={(e) => setNewBlockDuration(parseInt(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 ora</option>
                      <option value={90}>1.5 ore</option>
                      <option value={120}>2 ore</option>
                      <option value={180}>3 ore</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Categoria</label>
                    <select 
                      value={newBlockCategory}
                      onChange={(e) => setNewBlockCategory(e.target.value as WorkCategory)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all"
                    >
                      <option value="Big Rock">Big Rock</option>
                      <option value="MIT">MIT</option>
                      <option value="Emergenza">Emergenza</option>
                      <option value="Chore">Chore</option>
                      <option value="Altro">Altro</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Dominio di Lavoro</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Operation', 'Tecnica', 'Formazione', 'Miglioramento Processo', 'Altro'] as WorkDomain[]).map((domain) => (
                      <button
                        key={domain}
                        onClick={() => setNewBlockDomain(domain)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold border transition-all",
                          newBlockDomain === domain 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[domain] }} />
                        {domain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-200 transition-all"
                >
                  Annulla
                </button>
                <button 
                  onClick={handleCreateBlock}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Conferma
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ZenTime Architect</h1>
            <p className="text-xs text-slate-500 font-medium">Pianificazione Strategica Settimanale</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('calendar')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === 'calendar' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
            >
              Calendario
            </button>
            <button 
              onClick={() => setActiveTab('metrics')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === 'metrics' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
            >
              Metriche
            </button>
            <button 
              onClick={() => setActiveTab('emergencies')}
              className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-all", activeTab === 'emergencies' ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700")}
            >
              Emergenze
            </button>
          </div>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm font-semibold min-w-[140px] text-center">
              Settimana {format(weekDays[0], 'd MMM', { locale: it })} - {format(weekDays[4], 'd MMM yyyy', { locale: it })}
            </span>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/data');
                  const data = await response.json();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `zentime-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
                  a.click();
                } catch (e) {
                  console.error("Error exporting data", e);
                }
              }}
              title="Esporta Backup"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = async (re) => {
                      const content = re.target?.result as string;
                      try {
                        await fetch('/api/data', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: content
                        });
                        window.location.reload();
                      } catch (e) {
                        console.error("Error importing data", e);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                input.click();
              }}
              title="Importa Backup"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-emerald-600 transition-all"
            >
              <BookOpen className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 grid grid-cols-12 gap-6 max-w-[1600px] mx-auto">
        
        {/* Sidebar: Big Rocks & MITs */}
        <aside className="col-span-3 space-y-6">
          {/* Saturation Slider */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-500" /> Saturazione
              </h3>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                saturation > 85 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
              )}>
                {saturation}%
              </span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="100" 
              step="5"
              value={saturation}
              onChange={(e) => setSaturation(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="mt-3 flex justify-between text-[10px] text-slate-400 font-medium">
              <span>Flessibile (50%)</span>
              <span>Saturato (100%)</span>
            </div>
            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Hai <strong>{Math.round(bufferMinutes / 60)} ore</strong> di buffer giornaliero per le emergenze.
            </p>
          </section>

          {/* Big Rocks */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-red-500" /> Big Rocks Settimanali
            </h3>
            <div className="space-y-3">
              {bigRocks.map((rock, i) => (
                <div 
                  key={i} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, rock, 'Big Rock')}
                  className="relative group cursor-grab active:cursor-grabbing"
                >
                  <input 
                    type="text" 
                    value={rock}
                    onChange={(e) => {
                      const newRocks = [...bigRocks];
                      newRocks[i] = e.target.value;
                      setBigRocks(newRocks);
                    }}
                    placeholder={`Big Rock #${i+1}...`}
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-300"
                  />
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400 rounded-l-xl" />
                </div>
              ))}
            </div>
          </section>

          {/* MITs for Today */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-500" /> MIT Giornalieri
            </h3>
            <div className="space-y-3">
              {dailyMITs.map((mit, i) => (
                <div 
                  key={i} 
                  draggable={mit !== ''}
                  onDragStart={(e) => handleDragStart(e, mit, 'MIT')}
                  className={cn(
                    "flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-transparent hover:border-slate-200 transition-all",
                    mit !== '' && "cursor-grab active:cursor-grabbing"
                  )}
                >
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                  <input 
                    type="text" 
                    value={mit}
                    onChange={(e) => {
                      const newMITS = [...dailyMITs];
                      newMITS[i] = e.target.value;
                      setDailyMITs(newMITS);
                    }}
                    placeholder={`Compito Importante #${i+1}...`}
                    className="bg-transparent border-none p-0 text-sm w-full focus:ring-0 placeholder:text-slate-300"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Next Actions */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-blue-500" /> Next Actions
              </h3>
              <button 
                onClick={() => {
                  const action = prompt("Nuova azione:");
                  if (action) setNextActions([...nextActions, action]);
                }}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {nextActions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">Nessuna azione in lista</p>
              ) : (
                nextActions.map((action, i) => (
                  <div 
                    key={i} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, action, 'Altro')}
                    className="group flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg text-slate-600 border border-slate-100 cursor-grab active:cursor-grabbing"
                  >
                    <span>{action}</span>
                    <button 
                      onClick={() => setNextActions(nextActions.filter((_, index) => index !== i))}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-50 text-red-400 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>

        {/* Main Content: Calendar or Metrics */}
        <div className="col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'calendar' && (
              <motion.div 
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
              >
                {/* Header Row */}
                <div className="flex border-b border-slate-200 bg-slate-50/50">
                  <div className="w-16 border-r border-slate-200" /> {/* Time labels spacer */}
                  <div className="flex-1 grid grid-cols-5">
                    {weekDays.map((day, i) => (
                      <div key={i} className="p-4 border-r border-slate-200 last:border-r-0">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {format(day, 'EEEE', { locale: it })}
                        </div>
                        <div className="text-lg font-bold text-slate-700 mb-2">
                          {format(day, 'd')}
                        </div>
                        <input 
                          type="text"
                          placeholder="Specialità..."
                          value={specialties[format(day, 'yyyy-MM-dd')] || ''}
                          onChange={(e) => setSpecialties({
                            ...specialties,
                            [format(day, 'yyyy-MM-dd')]: e.target.value
                          })}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-medium text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex flex-1 h-[700px] overflow-y-auto custom-scrollbar">
                  {/* Time Labels Column */}
                  <div className="w-16 flex-shrink-0 border-r border-slate-200 bg-slate-50/30">
                    {WORK_HOURS.map((range, idx) => {
                      const slots = [];
                      let current = parse(range.start, 'HH:mm', new Date());
                      const end = parse(range.end, 'HH:mm', new Date());
                      while (current < end) {
                        slots.push(
                          <div key={format(current, 'HH:mm')} className="h-10 flex items-start justify-center pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {format(current, 'HH:mm')}
                            </span>
                          </div>
                        );
                        current = addMinutes(current, 15);
                      }
                      return <React.Fragment key={idx}>{slots}</React.Fragment>;
                    })}
                  </div>

                  {/* Days Columns */}
                  <div className="flex-1 grid grid-cols-5">
                    {weekDays.map((day, i) => (
                      <div key={i} className="border-r border-slate-100 last:border-r-0 relative">
                        {renderTimeSlots(day)}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'metrics' && (
              <motion.div 
                key="metrics"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="grid grid-cols-2 gap-6"
              >
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-blue-500" /> Distribuzione Pianificata
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={metricsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {metricsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10} ore`, 'Durata']}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" /> Obiettivi di Miglioramento
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Operazioni Tecniche</span>
                        <span className="text-slate-400">Target: 40-50% (Attuale: {Math.round(domainPercentages['Tecnica'])}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, domainPercentages['Tecnica'])}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-emerald-500" /> Aggiornamento/Formazione</span>
                        <span className="text-slate-400">Target: 15% (Attuale: {Math.round(domainPercentages['Formazione'])}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, domainPercentages['Formazione'])}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="flex items-center gap-2"><Settings className="w-4 h-4 text-violet-500" /> Miglioramento Processi</span>
                        <span className="text-slate-400">Target: 25-35% (Attuale: {Math.round(domainPercentages['Miglioramento Processo'])}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-violet-500 h-full transition-all duration-1000" 
                          style={{ width: `${Math.min(100, domainPercentages['Miglioramento Processo'])}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Nota Strategica:</strong> La tua pianificazione attuale è perfettamente bilanciata. Hai riservato abbastanza tempo per la delega e l'autonomia del team.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'emergencies' && (
              <motion.div 
                key="emergencies"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]"
              >
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" /> Registro Emergenze Giornaliero
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  {weekDays.map((day, i) => (
                    <div key={i} className="space-y-3">
                      <div className="text-xs font-bold text-slate-400 uppercase">{format(day, 'EEEE', { locale: it })}</div>
                      <textarea 
                        placeholder="Cosa è successo oggi?"
                        className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-amber-500/20 transition-all resize-none"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-start">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 mb-1">Analisi del Carico</h4>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Usa questo spazio per annotare le interruzioni. Se a fine settimana noti che le emergenze superano il tuo buffer del {100 - saturation}%, dovrai abbassare la saturazione per la prossima settimana.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
