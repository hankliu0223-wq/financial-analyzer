import { FinancialAnalysis, TargetPriceRange } from '@/lib/types';
import { formatNumber, formatMultiple, riskLevelColor, riskLevelLabel } from '@/utils/formatters';

interface Props {
  analysis: FinancialAnalysis;
}

export default function DecisionPanel({ analysis }: Props) {
  const inv = analysis.scenarios.investment;
  const cred = analysis.scenarios.credit;
  const rs = analysis.riskScores;
  const currency = analysis.companyInfo.currency;

  return (
    <div className="space-y-6">
      {/* Investment Scenario */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="flex items-center gap-2 font-semibold text-blue-800 mb-4">
          <span className="text-xl">📈</span>
          情境一：投資分析
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <Metric label="常態化 EBIT" value={inv.normalizedEbit !== null ? formatNumber(inv.normalizedEbit) : 'N/A'} unit={currency} />
          <Metric label="常態化 EBITDA" value={inv.normalizedEbitda !== null ? formatNumber(inv.normalizedEbitda) : 'N/A'} unit={currency} />
          <Metric label="淨負債" value={inv.netDebt !== null ? formatNumber(inv.netDebt) : 'N/A'} unit={currency} />
        </div>

        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="text-xs text-gray-500 mb-1">現金流品質評估</div>
          <p className="text-sm text-gray-800">{inv.cfoQuality}</p>
        </div>

        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="text-xs text-gray-500 mb-1">估值區間參考（同業 EV/EBITDA 7–12x）</div>
          <p className="text-sm text-gray-800">{inv.valuationRange}</p>
        </div>

        {inv.signals.length > 0 && (
          <div className="space-y-1 mb-3">
            {inv.signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 shrink-0">{signal.includes('正面') || signal.startsWith('✓') || signal.startsWith('✅') ? '✅' : '⚠️'}</span>
                <span>{signal}</span>
              </div>
            ))}
          </div>
        )}

        {inv.targetPriceRange && (
          <TargetPriceCard tp={inv.targetPriceRange} currency={currency} />
        )}

        <div className="bg-blue-100 rounded-lg p-3">
          <div className="text-xs text-blue-700 font-medium mb-1">綜合建議</div>
          <p className="text-sm text-blue-900">{inv.recommendation}</p>
        </div>
      </div>

      {/* Credit Scenario */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
        <h3 className="flex items-center gap-2 font-semibold text-purple-800 mb-4">
          <span className="text-xl">🏦</span>
          情境二：授信評估
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <Metric
            label="常態化利息保障"
            value={cred.interestCoverageNormalized !== null ? formatMultiple(cred.interestCoverageNormalized) : 'N/A'}
            highlight={cred.interestCoverageNormalized !== null && cred.interestCoverageNormalized < 1.5 ? 'red' : 'green'}
          />
          <Metric
            label="淨負債 / EBITDA"
            value={cred.netDebtEbitda !== null ? formatMultiple(cred.netDebtEbitda) : 'N/A'}
            highlight={cred.netDebtEbitda !== null && cred.netDebtEbitda > 4 ? 'red' : 'green'}
          />
          <div className="bg-white rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">風險等級</div>
            <div className={`font-bold ${riskLevelColor(cred.riskLevel)}`}>{riskLevelLabel(cred.riskLevel)}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="text-xs text-gray-500 mb-1">現金流覆蓋評估</div>
          <p className="text-sm text-gray-800">{cred.cashFlowCoverage}</p>
        </div>

        <div className="bg-purple-100 rounded-lg p-3">
          <div className="text-xs text-purple-700 font-medium mb-1">授信建議</div>
          <p className="text-sm text-purple-900">{cred.recommendation}</p>
        </div>
      </div>

      {/* Risk Scores */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <h3 className="flex items-center gap-2 font-semibold text-gray-700 mb-4">
          <span className="text-xl">🔬</span>
          量化風險模型
        </h3>
        <div className="space-y-3">
          <ScoreRow
            name="Beneish M-Score"
            description="盈餘操縱風險（> -1.78 有嫌疑）"
            score={rs.beneishMScore}
            interpretation={rs.beneishInterpretation}
            isHighBad
            threshold={-1.78}
            formatFn={(v) => v.toFixed(2)}
          />
          <ScoreRow
            name="Altman Z-Score"
            description="破產風險（< 1.81 危險，> 2.99 安全）"
            score={rs.altmanZScore}
            interpretation={rs.altmanInterpretation}
            isHighBad={false}
            threshold={2.99}
            formatFn={(v) => v.toFixed(2)}
          />
          <ScoreRow
            name="Piotroski F-Score"
            description="基本面強弱（7–9 強，0–3 弱）"
            score={rs.piotroskiFScore}
            interpretation={rs.piotroskiInterpretation}
            isHighBad={false}
            threshold={7}
            formatFn={(v) => `${v}/9`}
          />
        </div>
      </div>
    </div>
  );
}

function TargetPriceCard({ tp, currency }: { tp: TargetPriceRange; currency: string }) {
  const hasPrice = tp.low !== null || tp.base !== null || tp.high !== null;
  const fmt = (v: number | null) => v !== null ? v.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : 'N/A';

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-4 mb-3">
      <div className="text-xs text-gray-500 mb-3 font-medium">目標價區間分析</div>
      {hasPrice ? (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center rounded-lg bg-amber-50 border border-amber-200 p-2">
              <div className="text-xs text-amber-600 mb-1">保守</div>
              <div className="font-bold text-amber-700 text-lg">{fmt(tp.low)}</div>
            </div>
            <div className="text-center rounded-lg bg-emerald-50 border border-emerald-200 p-2 ring-2 ring-emerald-400">
              <div className="text-xs text-emerald-600 mb-1">基本</div>
              <div className="font-bold text-emerald-700 text-xl">{fmt(tp.base)}</div>
            </div>
            <div className="text-center rounded-lg bg-blue-50 border border-blue-200 p-2">
              <div className="text-xs text-blue-600 mb-1">樂觀</div>
              <div className="font-bold text-blue-700 text-lg">{fmt(tp.high)}</div>
            </div>
          </div>
          <div className="text-xs text-gray-400 mb-2 text-center">單位：{currency}（每股）</div>
        </>
      ) : (
        <div className="text-sm text-gray-400 mb-2">流通股數資料不足，無法計算每股目標價</div>
      )}
      {(tp.eps !== null || tp.bvps !== null) && (
        <div className="flex gap-4 mb-2">
          {tp.eps !== null && (
            <div className="text-xs text-gray-500">EPS：<span className="font-medium text-gray-700">{fmt(tp.eps)}</span></div>
          )}
          {tp.bvps !== null && (
            <div className="text-xs text-gray-500">每股淨值：<span className="font-medium text-gray-700">{fmt(tp.bvps)}</span></div>
          )}
          {tp.sharesOutstanding !== null && (
            <div className="text-xs text-gray-500">流通股數：<span className="font-medium text-gray-700">{tp.sharesOutstanding.toLocaleString('zh-TW')}</span></div>
          )}
        </div>
      )}
      {tp.methodology && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-2">{tp.methodology}</div>
      )}
    </div>
  );
}

function Metric({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: 'red' | 'green' }) {
  return (
    <div className="bg-white rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`font-bold ${highlight === 'red' ? 'text-red-600' : highlight === 'green' ? 'text-emerald-600' : 'text-gray-800'}`}>
        {value}
      </div>
      {unit && <div className="text-xs text-gray-400 mt-0.5">{unit}</div>}
    </div>
  );
}

function ScoreRow({
  name, description, score, interpretation, isHighBad, threshold, formatFn,
}: {
  name: string;
  description: string;
  score: number | null;
  interpretation: string;
  isHighBad: boolean;
  threshold: number;
  formatFn: (v: number) => string;
}) {
  const available = score !== null;
  const isConcerning = available && (isHighBad ? score > threshold : score < threshold);

  return (
    <div className={`flex items-start gap-3 rounded-lg p-3 ${available ? (isConcerning ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200') : 'bg-gray-100 border border-gray-200'}`}>
      <div className="shrink-0 text-center min-w-[60px]">
        <div className={`text-xl font-bold ${available ? (isConcerning ? 'text-red-600' : 'text-emerald-600') : 'text-gray-400'}`}>
          {available ? formatFn(score!) : 'N/A'}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{name}</div>
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{description}</p>
        {available && <p className="text-sm mt-1">{interpretation}</p>}
        {!available && <p className="text-xs text-gray-400 mt-1">資料不足，無法計算</p>}
      </div>
    </div>
  );
}
