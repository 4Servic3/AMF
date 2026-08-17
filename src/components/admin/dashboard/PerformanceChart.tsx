'use client';
import React, { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const mockData7 = [
  { name: 'Seg', active: 400, completions: 240 },
  { name: 'Ter', active: 300, completions: 139 },
  { name: 'Qua', active: 200, completions: 980 },
  { name: 'Qui', active: 278, completions: 390 },
  { name: 'Sex', active: 189, completions: 480 },
  { name: 'Sáb', active: 239, completions: 380 },
  { name: 'Dom', active: 349, completions: 430 },
];

const mockData30 = [
  { name: '1-5', active: 4000, completions: 2400 },
  { name: '6-10', active: 3000, completions: 1398 },
  { name: '11-15', active: 2000, completions: 9800 },
  { name: '16-20', active: 2780, completions: 3908 },
  { name: '21-25', active: 1890, completions: 4800 },
  { name: '26-30', active: 2390, completions: 3800 },
];

const mockData12m = [
  { name: 'Jan', active: 4000, completions: 2400 },
  { name: 'Fev', active: 3000, completions: 1398 },
  { name: 'Mar', active: 2000, completions: 9800 },
  { name: 'Abr', active: 2780, completions: 3908 },
  { name: 'Mai', active: 1890, completions: 4800 },
  { name: 'Jun', active: 2390, completions: 3800 },
  { name: 'Jul', active: 3490, completions: 4300 },
  { name: 'Ago', active: 4000, completions: 2400 },
  { name: 'Set', active: 3000, completions: 1398 },
  { name: 'Out', active: 2000, completions: 9800 },
  { name: 'Nov', active: 2780, completions: 3908 },
  { name: 'Dez', active: 1890, completions: 4800 },
];

export default function PerformanceChart() {
  const [period, setPeriod] = useState<'7 dias' | '30 dias' | '12 meses'>('30 dias');

  const data = period === '7 dias' ? mockData7 : period === '30 dias' ? mockData30 : mockData12m;

  return (
    <div className="bg-white p-5 rounded-xl border border-[#EBE3D5] shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-amf-ink-900">Desempenho da plataforma</h3>
          <p className="text-xs text-amf-muted-600 mt-1">Aprendizes ativos / Conclusões</p>
        </div>
        <div className="flex bg-[#FBF7F0] rounded-lg p-1 border border-[#EBE3D5]">
          {(['7 dias', '30 dias', '12 meses'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors ${
                period === p 
                  ? 'bg-white text-amf-ink-900 shadow-sm' 
                  : 'text-amf-muted-600 hover:text-amf-ink-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE3D5" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8C8273', fontSize: 11 }} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#8C8273', fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#8C8273', fontSize: 11 }} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #EBE3D5', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontSize: '12px' }}
            />
            <Bar yAxisId="right" dataKey="completions" name="Conclusões" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={30} />
            <Line yAxisId="left" type="monotone" dataKey="active" name="Aprendizes ativos" stroke="#0F766E" strokeWidth={2.5} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
