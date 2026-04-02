import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getCapacityMinutes, getDomainColor, getWeekMetrics } from '../planner/utils';
import type { PlannerSettings, TimeBlock } from '../planner/types';

interface MetricsViewProps {
  blocks: TimeBlock[];
  settings: PlannerSettings;
}

export function MetricsView({ blocks, settings }: MetricsViewProps) {
  const domainMinutes = getWeekMetrics(blocks, settings);
  const planned = Object.values(domainMinutes).reduce((sum, value) => sum + value, 0);
  const weeklyCapacity = getCapacityMinutes(settings) * Math.max(5, settings.showWeekends ? settings.activeWeekdays.length : 5);
  const chartData = settings.domains
    .map((domain) => ({ name: domain, value: domainMinutes[domain] ?? 0, color: getDomainColor(domain) }))
    .filter((entry) => entry.value > 0);

  if (weeklyCapacity > planned) {
    chartData.push({ name: 'Buffer libero', value: weeklyCapacity - planned, color: '#e2e8f0' });
  }

  return (
    <section className="grid gap-6 xl:col-span-9 xl:grid-cols-2">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-bold">Distribuzione settimanale</h2>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie data={chartData} innerRadius={70} outerRadius={120} paddingAngle={4} dataKey="value">
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${Math.round((value / 60) * 10) / 10} ore`, 'Tempo']} />
              <Legend verticalAlign="bottom" />
            </RePieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-bold">Carico reale per dominio</h2>
        <div className="space-y-5">
          {settings.domains.map((domain) => {
            const value = domainMinutes[domain] ?? 0;
            const percent = weeklyCapacity === 0 ? 0 : (value / weeklyCapacity) * 100;
            return (
              <div key={domain}>
                <div className="mb-2 flex items-center justify-between text-sm font-medium">
                  <span>{domain}</span>
                  <span className="text-slate-500">
                    {Math.round((value / 60) * 10) / 10}h ({Math.round(percent)}%)
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full" style={{ width: `${Math.min(100, percent)}%`, backgroundColor: getDomainColor(domain) }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
