'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { FinancialRatios } from '@/lib/types';

interface Props {
  ratios: FinancialRatios;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981'];

export default function ProfitabilityChart({ ratios }: Props) {
  const p = ratios.profitability;

  const data = [
    { name: '毛利率', value: p.grossMargin !== null ? +(p.grossMargin * 100).toFixed(1) : null },
    { name: 'EBIT 利益率', value: p.ebitMargin !== null ? +(p.ebitMargin * 100).toFixed(1) : null },
    { name: 'EBITDA 利益率', value: p.ebitdaMargin !== null ? +(p.ebitdaMargin * 100).toFixed(1) : null },
    { name: '淨利率', value: p.netMargin !== null ? +(p.netMargin * 100).toFixed(1) : null },
  ].filter(d => d.value !== null) as { name: string; value: number }[];

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        獲利率資料不足，無法繪製
      </div>
    );
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={90} />
          <Tooltip
            formatter={(value) => [`${value}%`, '利潤率']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={30}>
            {data.map((_item, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
