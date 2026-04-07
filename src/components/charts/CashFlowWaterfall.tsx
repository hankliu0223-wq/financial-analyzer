'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

interface Props {
  ebitda: number | null;
  cfo: number | null;
  capex: number | null;
  currency: string;
}

export default function CashFlowWaterfall({ ebitda, cfo, capex, currency }: Props) {
  if (ebitda === null && cfo === null) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        現金流資料不足，無法繪製
      </div>
    );
  }

  const fcff = cfo !== null && capex !== null ? cfo - capex : null;

  const data = [
    { name: 'EBITDA', value: ebitda, fill: '#3b82f6' },
    { name: '營業現金流 (CFO)', value: cfo, fill: '#8b5cf6' },
    { name: '自由現金流 (FCF)', value: fcff, fill: fcff !== null && fcff >= 0 ? '#10b981' : '#ef4444' },
  ].filter(d => d.value !== null);

  const minVal = Math.min(...data.map(d => d.value as number), 0);
  const maxVal = Math.max(...data.map(d => d.value as number), 0);

  return (
    <div className="space-y-3">
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis
              domain={[minVal * 1.1, maxVal * 1.1]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1.5} />
            <Tooltip
              formatter={(value) => [`${(value as number).toLocaleString()} ${currency.includes('百萬') ? '百萬' : ''}`, '金額']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
              {data.map((item, index) => (
                <Cell key={index} fill={item.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>EBITDA（稅折前獲利）</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span>CFO（實際收到現金）</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block"></span>FCF = CFO − Capex</span>
      </div>
    </div>
  );
}
