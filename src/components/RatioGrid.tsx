import { FinancialRatios } from '@/lib/types';
import { formatPercent, formatMultiple, formatDays, formatNumber } from '@/utils/formatters';

interface Props {
  ratios: FinancialRatios;
}

interface RatioItem {
  label: string;
  value: string;
  description: string;
  status: 'good' | 'warn' | 'bad' | 'neutral';
}

function getStatus(value: number | null, good: number, bad: number, higherIsBetter: boolean): 'good' | 'warn' | 'bad' | 'neutral' {
  if (value === null) return 'neutral';
  if (higherIsBetter) {
    if (value >= good) return 'good';
    if (value <= bad) return 'bad';
    return 'warn';
  } else {
    if (value <= good) return 'good';
    if (value >= bad) return 'bad';
    return 'warn';
  }
}

function statusBg(s: 'good' | 'warn' | 'bad' | 'neutral') {
  switch (s) {
    case 'good': return 'border-emerald-200 bg-emerald-50';
    case 'warn': return 'border-yellow-200 bg-yellow-50';
    case 'bad': return 'border-red-200 bg-red-50';
    default: return 'border-gray-200 bg-gray-50';
  }
}

function statusText(s: 'good' | 'warn' | 'bad' | 'neutral') {
  switch (s) {
    case 'good': return 'text-emerald-700';
    case 'warn': return 'text-yellow-700';
    case 'bad': return 'text-red-700';
    default: return 'text-gray-700';
  }
}

export default function RatioGrid({ ratios }: Props) {
  const p = ratios.profitability;
  const liq = ratios.liquidity;
  const lev = ratios.leverage;
  const eff = ratios.efficiency;
  const cf = ratios.cashFlow;
  const gr = ratios.growth;

  const sections: { title: string; icon: string; items: RatioItem[] }[] = [
    {
      title: '獲利能力',
      icon: '💰',
      items: [
        { label: '毛利率', value: formatPercent(p.grossMargin), description: '產品定價力與成本控管', status: getStatus(p.grossMargin, 0.3, 0.1, true) },
        { label: 'EBIT 利益率', value: formatPercent(p.ebitMargin), description: '核心營運獲利能力', status: getStatus(p.ebitMargin, 0.15, 0.05, true) },
        { label: 'EBITDA 利益率', value: formatPercent(p.ebitdaMargin), description: '近似營運現金產生能力', status: getStatus(p.ebitdaMargin, 0.2, 0.08, true) },
        { label: '淨利率', value: formatPercent(p.netMargin), description: '股東角度最終獲利', status: getStatus(p.netMargin, 0.1, 0.02, true) },
        { label: 'ROA', value: formatPercent(p.roa), description: '資產運用效率', status: getStatus(p.roa, 0.08, 0.02, true) },
        { label: 'ROE', value: formatPercent(p.roe), description: '股東報酬率', status: getStatus(p.roe, 0.15, 0.05, true) },
        { label: 'ROIC', value: formatPercent(p.roic), description: '投入資本報酬（價值創造指標）', status: getStatus(p.roic, 0.1, 0.04, true) },
      ],
    },
    {
      title: '成長性',
      icon: '📈',
      items: [
        { label: '營收成長率', value: formatPercent(gr.revenueGrowth), description: '年度營收變動幅度', status: getStatus(gr.revenueGrowth, 0.1, -0.05, true) },
      ],
    },
    {
      title: '流動性',
      icon: '💧',
      items: [
        { label: '流動比率', value: formatMultiple(liq.current), description: '短期償債緩衝（>1.5 較安全）', status: getStatus(liq.current, 1.5, 1.0, true) },
        { label: '速動比率', value: formatMultiple(liq.quick), description: '排除存貨後的短期償債力', status: getStatus(liq.quick, 1.0, 0.5, true) },
      ],
    },
    {
      title: '槓桿',
      icon: '⚖️',
      items: [
        { label: '負債比率', value: formatPercent(lev.debtRatio), description: '資產中靠負債支撐的比例', status: getStatus(lev.debtRatio, 0.4, 0.7, false) },
        { label: '淨負債 / EBITDA', value: formatMultiple(lev.netDebtEbitda), description: '用營運獲利衡量槓桿壓力', status: getStatus(lev.netDebtEbitda, 2, 4, false) },
        { label: '利息保障倍數', value: formatMultiple(lev.interestCoverage), description: '本業獲利覆蓋利息能力（>3 安全）', status: getStatus(lev.interestCoverage, 3, 1.5, true) },
      ],
    },
    {
      title: '營運效率',
      icon: '⚙️',
      items: [
        { label: 'DSO（應收天數）', value: formatDays(eff.dso), description: '收現速度，越短越好', status: getStatus(eff.dso, 30, 90, false) },
        { label: 'DIO（存貨天數）', value: formatDays(eff.dio), description: '庫存去化速度，越短越好', status: getStatus(eff.dio, 30, 120, false) },
        { label: 'DPO（應付天數）', value: formatDays(eff.dpo), description: '付款週期，越長議價力越強', status: getStatus(eff.dpo, 45, 15, true) },
        { label: 'CCC（現金轉換週期）', value: formatDays(eff.ccc), description: 'DSO＋DIO－DPO，越短越佳', status: getStatus(eff.ccc, 30, 90, false) },
      ],
    },
    {
      title: '現金流品質',
      icon: '🏦',
      items: [
        { label: 'CFO / 淨利', value: formatMultiple(cf.cfoToNetIncome), description: '獲利品質：是否有真實現金支撐（>0.9 理想）', status: getStatus(cf.cfoToNetIncome, 0.9, 0.5, true) },
        { label: '自由現金流 (FCF)', value: cf.fcff !== null ? formatNumber(cf.fcff) : 'N/A', description: 'CFO 扣除資本支出後可自由運用的現金', status: getStatus(cf.fcff, 0, -Infinity, true) },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
            <span>{section.icon}</span>
            {section.title}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {section.items.map((item) => (
              <div
                key={item.label}
                className={`border rounded-xl p-3 ${statusBg(item.status)}`}
              >
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className={`text-xl font-bold ${statusText(item.status)}`}>{item.value}</div>
                <div className="text-xs text-gray-400 mt-1 leading-tight">{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
