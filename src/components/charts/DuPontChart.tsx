'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DuPontAnalysis } from '@/lib/types';
import { formatPercent, formatMultiple } from '@/utils/formatters';

interface Props {
  data: DuPontAnalysis;
}

export default function DuPontChart({ data }: Props) {
  const items = [
    { name: '淨利率', value: data.netMargin !== null ? +(data.netMargin * 100).toFixed(2) : null, unit: '%', color: '#3b82f6' },
    { name: '資產週轉', value: data.assetTurnover !== null ? +data.assetTurnover.toFixed(3) : null, unit: 'x', color: '#8b5cf6' },
    { name: '權益乘數', value: data.equityMultiplier !== null ? +data.equityMultiplier.toFixed(2) : null, unit: 'x', color: '#ec4899' },
  ];

  return (
    <div className="space-y-4">
      {/* Formula Display */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
        <div className="text-center bg-blue-50 px-3 py-2 rounded-lg">
          <div className="text-xs text-gray-500 mb-0.5">淨利率</div>
          <div className="font-bold text-blue-700">{formatPercent(data.netMargin)}</div>
        </div>
        <span className="text-gray-400 font-bold text-lg">×</span>
        <div className="text-center bg-purple-50 px-3 py-2 rounded-lg">
          <div className="text-xs text-gray-500 mb-0.5">資產週轉率</div>
          <div className="font-bold text-purple-700">{formatMultiple(data.assetTurnover, 3)}</div>
        </div>
        <span className="text-gray-400 font-bold text-lg">×</span>
        <div className="text-center bg-pink-50 px-3 py-2 rounded-lg">
          <div className="text-xs text-gray-500 mb-0.5">權益乘數</div>
          <div className="font-bold text-pink-700">{formatMultiple(data.equityMultiplier)}</div>
        </div>
        <span className="text-gray-400 font-bold text-lg">=</span>
        <div className="text-center bg-emerald-50 px-3 py-2 rounded-lg">
          <div className="text-xs text-gray-500 mb-0.5">ROE</div>
          <div className="font-bold text-emerald-700">{formatPercent(data.roe)}</div>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={items} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(value, _name, props) => [`${value}${props.payload.unit}`, props.payload.name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {items.map((item, index) => (
                <Cell key={index} fill={item.value !== null ? item.color : '#d1d5db'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-gray-400 text-center">
        ROE 杜邦分解：了解股東報酬是來自「賺錢能力」、「資產效率」還是「財務槓桿」
      </p>
    </div>
  );
}
