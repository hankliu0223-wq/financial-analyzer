'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FinancialAnalysis } from '@/lib/types';
import RatioGrid from '@/components/RatioGrid';
import RedFlagPanel from '@/components/RedFlagPanel';
import DecisionPanel from '@/components/DecisionPanel';
import DuPontChart from '@/components/charts/DuPontChart';
import CashFlowWaterfall from '@/components/charts/CashFlowWaterfall';
import { auditOpinionColor, formatNumber, formatPercent } from '@/utils/formatters';

type Tab = 'overview' | 'ratios' | 'cashflow' | 'redflags' | 'decision';

function generateMarkdownReport(analysis: FinancialAnalysis): string {
  const { companyInfo, auditOpinion, keyFinancials, ratios, dupontAnalysis, redFlags, riskScores, scenarios, executiveSummary, detailedAnalysis } = analysis;
  const today = new Date().toLocaleDateString('zh-TW');

  const n = (v: number | null | undefined, d = 2): string => v != null ? v.toFixed(d) : 'N/A';
  const pct = (v: number | null | undefined): string => v != null ? `${v.toFixed(1)}%` : 'N/A';
  const num = (v: number | null | undefined): string => {
    if (v == null) return 'N/A';
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(2);
  };

  let md = `# ${companyInfo.name} 財報深度分析報告\n\n`;
  md += `**分析期間：** ${companyInfo.period}　**報告類型：** ${companyInfo.reportType}　**幣別：** ${companyInfo.currency}\n`;
  md += `**分析日期：** ${today}\n\n---\n\n`;

  md += `## 📋 執行摘要\n\n${executiveSummary}\n\n---\n\n`;

  md += `## ✅ 審計意見\n\n**意見類型：** ${auditOpinion.type}\n\n`;
  if (auditOpinion.goingConcern) {
    md += `> ⚠️ **繼續經營重大不確定性**\n`;
    if (auditOpinion.goingConcernDetails) md += `> ${auditOpinion.goingConcernDetails}\n`;
    md += '\n';
  }
  if (auditOpinion.keyAuditMatters?.length > 0) {
    md += `**關鍵查核事項（KAM）：**\n`;
    auditOpinion.keyAuditMatters.forEach(k => { md += `- ${k}\n`; });
    md += '\n';
  }
  md += '---\n\n';

  md += `## 💰 關鍵財務數字\n\n| 項目 | 金額 |\n|------|------|\n`;
  const kf = keyFinancials;
  const fcf = kf.cfo != null && kf.capex != null ? kf.cfo - kf.capex : null;
  ([
    ['營收', kf.revenue], ['毛利', kf.grossProfit], ['EBIT', kf.ebit], ['EBITDA', kf.ebitda],
    ['稅後淨利', kf.netIncome], ['營業現金流 (CFO)', kf.cfo], ['資本支出 (Capex)', kf.capex],
    ['自由現金流 (FCF)', fcf], ['現金及約當現金', kf.cash],
    ['總資產', kf.totalAssets], ['股東權益', kf.totalEquity], ['有息負債', kf.interestBearingDebt],
  ] as [string, number | null][]).forEach(([label, v]) => { md += `| ${label} | ${num(v)} |\n`; });
  md += '\n---\n\n';

  md += `## 📊 財務比率\n\n### 獲利能力\n\n| 指標 | 數值 |\n|------|------|\n`;
  const p = ratios.profitability;
  ([['毛利率', pct(p.grossMargin)], ['EBIT 利潤率', pct(p.ebitMargin)], ['EBITDA 利潤率', pct(p.ebitdaMargin)],
    ['淨利率', pct(p.netMargin)], ['ROE', pct(p.roe)], ['ROA', pct(p.roa)], ['ROIC', pct(p.roic)],
  ] as [string, string][]).forEach(([k, v]) => { md += `| ${k} | ${v} |\n`; });

  md += `\n### 成長率\n\n| 指標 | 數值 |\n|------|------|\n`;
  md += `| 營收成長 | ${pct(ratios.growth.revenueGrowth)} |\n`;

  md += `\n### 流動性\n\n| 指標 | 數值 |\n|------|------|\n`;
  const liq = ratios.liquidity;
  ([['流動比率', n(liq.current)], ['速動比率', n(liq.quick)],
  ] as [string, string][]).forEach(([k, v]) => { md += `| ${k} | ${v} |\n`; });

  md += `\n### 槓桿/負債\n\n| 指標 | 數值 |\n|------|------|\n`;
  const lev = ratios.leverage;
  ([['負債比率', pct(lev.debtRatio)],
    ['淨負債/EBITDA', lev.netDebtEbitda != null ? `${lev.netDebtEbitda.toFixed(1)}x` : 'N/A'],
    ['利息保障倍數', lev.interestCoverage != null ? `${lev.interestCoverage.toFixed(1)}x` : 'N/A'],
  ] as [string, string][]).forEach(([k, v]) => { md += `| ${k} | ${v} |\n`; });

  md += `\n### 效率\n\n| 指標 | 數值 |\n|------|------|\n`;
  const eff = ratios.efficiency;
  ([['應收帳款天數 (DSO)', eff.dso != null ? `${eff.dso.toFixed(1)} 天` : 'N/A'],
    ['存貨天數 (DIO)', eff.dio != null ? `${eff.dio.toFixed(1)} 天` : 'N/A'],
    ['應付帳款天數 (DPO)', eff.dpo != null ? `${eff.dpo.toFixed(1)} 天` : 'N/A'],
    ['現金轉換週期 (CCC)', eff.ccc != null ? `${eff.ccc.toFixed(1)} 天` : 'N/A'],
  ] as [string, string][]).forEach(([k, v]) => { md += `| ${k} | ${v} |\n`; });

  md += `\n### 現金流品質\n\n| 指標 | 數值 |\n|------|------|\n`;
  const cf = ratios.cashFlow;
  md += `| CFO/淨利 | ${cf.cfoToNetIncome != null ? `${cf.cfoToNetIncome.toFixed(2)}x` : 'N/A'} |\n`;
  md += `| FCFF | ${num(cf.fcff)} |\n`;
  md += '\n---\n\n';

  md += `## 🔬 杜邦 ROE 拆解\n\n| 指標 | 數值 |\n|------|------|\n`;
  ([['淨利率', pct(dupontAnalysis.netMargin)], ['資產周轉率', n(dupontAnalysis.assetTurnover)],
    ['權益乘數', n(dupontAnalysis.equityMultiplier)], ['ROE', pct(dupontAnalysis.roe)],
  ] as [string, string][]).forEach(([k, v]) => { md += `| ${k} | ${v} |\n`; });
  md += '\n---\n\n';

  md += `## ⚠️ 風險評分模型\n\n| 模型 | 分數 | 評級 |\n|------|------|------|\n`;
  md += `| Beneish M-Score（盈餘管理） | ${n(riskScores.beneishMScore)} | ${riskScores.beneishInterpretation} |\n`;
  md += `| Altman Z-Score（破產風險） | ${n(riskScores.altmanZScore)} | ${riskScores.altmanInterpretation} |\n`;
  md += `| Piotroski F-Score（財務健全） | ${n(riskScores.piotroskiFScore, 0)}/9 | ${riskScores.piotroskiInterpretation} |\n`;
  md += '\n---\n\n';

  if (redFlags?.length > 0) {
    md += `## 🚩 財務紅旗警示（共 ${redFlags.length} 項）\n\n`;
    (['high', 'medium', 'low'] as const).forEach(sev => {
      const flags = redFlags.filter(f => f.severity === sev);
      if (flags.length === 0) return;
      const label = sev === 'high' ? '高嚴重性' : sev === 'medium' ? '中嚴重性' : '低嚴重性';
      md += `### ${label}（${flags.length} 項）\n\n`;
      flags.forEach(f => {
        md += `**[${f.category}]** ${f.description}\n`;
        if (f.evidence) md += `\n> *依據：${f.evidence}*\n`;
        md += '\n';
      });
    });
    md += '---\n\n';
  }

  md += `## 💡 決策情境分析\n\n### 投資情境\n\n`;
  const inv = scenarios.investment;
  md += `**建議：** ${inv.recommendation}\n`;
  md += `**CFO 品質：** ${inv.cfoQuality}\n`;
  md += `**估值區間：** ${inv.valuationRange}\n\n`;
  if (inv.targetPriceRange) {
    const tp = inv.targetPriceRange;
    const fmtP = (v: number | null) => v !== null ? v.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : 'N/A';
    const basisLabel = tp.isQuarterlyAnnualized ? `全年預估（前${tp.quartersReported}季 + Q4估算）` : '全年實際數';
    md += `**目標價區間（每股）【${basisLabel}】：** 保守 ${fmtP(tp.low)} ／ 基本 ${fmtP(tp.base)} ／ 樂觀 ${fmtP(tp.high)}\n`;
    if (tp.eps !== null) md += `**報告期EPS：** ${fmtP(tp.eps)}`;
    if (tp.annualizedEps !== null) md += `　**全年預估EPS：** ${fmtP(tp.annualizedEps)}`;
    if (tp.annualizedEbitda !== null) md += `　**全年預估EBITDA：** ${fmtP(tp.annualizedEbitda)}`;
    if (tp.eps !== null || tp.annualizedEps !== null) md += '\n';
    if (tp.annualizationNote) md += `**年化說明：** ${tp.annualizationNote}\n`;
    if (tp.methodology) md += `**估值方法：** ${tp.methodology}\n`;
    md += '\n';
  }
  if (inv.signals?.length > 0) {
    md += `**關鍵訊號：**\n`;
    inv.signals.forEach(s => { md += `- ${s}\n`; });
    md += '\n';
  }
  const crd = scenarios.credit;
  md += `### 授信情境\n\n`;
  md += `**風險等級：** ${crd.riskLevel}\n`;
  md += `**建議：** ${crd.recommendation}\n`;
  md += `**現金流覆蓋：** ${crd.cashFlowCoverage}\n\n`;
  md += '---\n\n';

  md += `## 🔍 深度分析\n\n${detailedAnalysis}\n\n`;
  md += `---\n*本報告由 AI 財報分析工具自動生成，僅供教育研究用途，不構成投資建議。*\n`;
  return md;
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function generateHtmlForPdf(analysis: FinancialAnalysis): string {
  const { companyInfo, auditOpinion, keyFinancials, ratios, dupontAnalysis, redFlags, riskScores, scenarios, executiveSummary, detailedAnalysis } = analysis;
  const today = new Date().toLocaleDateString('zh-TW');

  const pct = (v: number | null | undefined): string => v != null ? `${(v * 100).toFixed(1)}%` : 'N/A';
  const mult = (v: number | null | undefined, d = 1): string => v != null ? `${v.toFixed(d)}x` : 'N/A';
  const num = (v: number | null | undefined): string => {
    if (v == null) return 'N/A';
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toFixed(2);
  };
  const fixed = (v: number | null | undefined, d = 2): string => v != null ? v.toFixed(d) : 'N/A';

  const s = {
    section: 'margin-top:24px; border-top:2px solid #e5e7eb; padding-top:16px; page-break-inside:avoid;',
    h2: 'font-size:16px; font-weight:700; color:#111827; margin:0 0 12px 0;',
    h3: 'font-size:14px; font-weight:600; color:#374151; margin:12px 0 8px 0;',
    table: 'width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed;',
    th: 'background:#f3f4f6; padding:6px 10px; text-align:left; font-weight:600; color:#374151; border:1px solid #e5e7eb; word-break:break-word;',
    td: 'padding:5px 10px; border:1px solid #e5e7eb; color:#374151; word-break:break-word;',
    td2: 'padding:5px 10px; border:1px solid #e5e7eb; color:#374151; font-weight:600; word-break:break-word;',
    badge: (color: string) => `display:inline-block; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; background:${color};`,
  };

  const tableRow = (label: string, value: string) =>
    `<tr><td style="${s.td}">${label}</td><td style="${s.td2}">${value}</td></tr>`;

  const severityStyle = (sev: string) => {
    const base = 'word-break:break-word; overflow-wrap:break-word; padding:10px 12px; margin-bottom:8px; border-radius:4px; page-break-inside:avoid;';
    if (sev === 'high') return `border-left:4px solid #ef4444; background:#fef2f2; ${base}`;
    if (sev === 'medium') return `border-left:4px solid #f59e0b; background:#fffbeb; ${base}`;
    return `border-left:4px solid #3b82f6; background:#eff6ff; ${base}`;
  };

  const fcf = keyFinancials.cfo != null && keyFinancials.capex != null ? keyFinancials.cfo - keyFinancials.capex : null;

  return `
    <div style="font-family:Arial,'Microsoft JhengHei',sans-serif; font-size:13px; line-height:1.6; color:#1f2937; word-break:break-word; overflow-wrap:break-word;">
      <!-- Header -->
      <div style="border-bottom:3px solid #2563eb; padding-bottom:12px; margin-bottom:20px;">
        <div style="font-size:22px; font-weight:800; color:#111827;">${companyInfo.name}</div>
        <div style="font-size:13px; color:#6b7280; margin-top:4px;">
          ${companyInfo.period} &nbsp;·&nbsp; ${companyInfo.reportType} &nbsp;·&nbsp; 幣別: ${companyInfo.currency} &nbsp;·&nbsp; 分析日期: ${today}
        </div>
      </div>

      <!-- Audit Opinion -->
      <div style="${auditOpinion.type === '無保留意見' ? 'background:#f0fdf4; border:1px solid #86efac;' : 'background:#fef2f2; border:1px solid #fca5a5;'} border-radius:8px; padding:12px 16px; margin-bottom:20px;">
        <div style="font-weight:700; color:${auditOpinion.type === '無保留意見' ? '#15803d' : '#b91c1c'};">
          審計意見：${auditOpinion.type}
        </div>
        ${auditOpinion.goingConcern ? `<div style="color:#b91c1c; font-size:12px; margin-top:4px;">⚠ 存在繼續經營重大不確定性：${auditOpinion.goingConcernDetails}</div>` : ''}
        ${auditOpinion.keyAuditMatters?.length > 0 ? `<div style="font-size:12px; color:#374151; margin-top:6px;"><strong>關鍵查核事項：</strong>${auditOpinion.keyAuditMatters.join('、')}</div>` : ''}
      </div>

      <!-- Executive Summary -->
      <div style="${s.section}">
        <div style="${s.h2}">執行摘要</div>
        <p style="color:#374151; margin:0;">${executiveSummary}</p>
      </div>

      <!-- Key Financials -->
      <div style="${s.section}">
        <div style="${s.h2}">關鍵財務數字</div>
        <table style="${s.table}">
          <colgroup><col style="width:30%"><col style="width:20%"><col style="width:30%"><col style="width:20%"></colgroup>
          <tr><th style="${s.th}">項目</th><th style="${s.th}">金額 (${companyInfo.currency})</th><th style="${s.th}">項目</th><th style="${s.th}">金額 (${companyInfo.currency})</th></tr>
          <tr>
            <td style="${s.td}">營收</td><td style="${s.td2}">${num(keyFinancials.revenue)}</td>
            <td style="${s.td}">毛利</td><td style="${s.td2}">${num(keyFinancials.grossProfit)}</td>
          </tr>
          <tr>
            <td style="${s.td}">EBIT</td><td style="${s.td2}">${num(keyFinancials.ebit)}</td>
            <td style="${s.td}">EBITDA</td><td style="${s.td2}">${num(keyFinancials.ebitda)}</td>
          </tr>
          <tr>
            <td style="${s.td}">稅後淨利</td><td style="${s.td2}">${num(keyFinancials.netIncome)}</td>
            <td style="${s.td}">營業現金流 (CFO)</td><td style="${s.td2}">${num(keyFinancials.cfo)}</td>
          </tr>
          <tr>
            <td style="${s.td}">資本支出 (Capex)</td><td style="${s.td2}">${num(keyFinancials.capex)}</td>
            <td style="${s.td}">自由現金流 (FCF)</td><td style="${s.td2}">${num(fcf)}</td>
          </tr>
          <tr>
            <td style="${s.td}">現金及約當現金</td><td style="${s.td2}">${num(keyFinancials.cash)}</td>
            <td style="${s.td}">總資產</td><td style="${s.td2}">${num(keyFinancials.totalAssets)}</td>
          </tr>
          <tr>
            <td style="${s.td}">股東權益</td><td style="${s.td2}">${num(keyFinancials.totalEquity)}</td>
            <td style="${s.td}">有息負債</td><td style="${s.td2}">${num(keyFinancials.interestBearingDebt)}</td>
          </tr>
        </table>
      </div>

      <!-- Financial Ratios -->
      <div style="${s.section}">
        <div style="${s.h2}">財務比率</div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <tr>
            <td style="width:50%; vertical-align:top; padding-right:8px;">
              <div style="${s.h3}">獲利能力</div>
              <table style="${s.table}">
                <colgroup><col style="width:65%"><col style="width:35%"></colgroup>
                <tr><th style="${s.th}">指標</th><th style="${s.th}">數值</th></tr>
                ${tableRow('毛利率', pct(ratios.profitability.grossMargin))}
                ${tableRow('EBIT 利潤率', pct(ratios.profitability.ebitMargin))}
                ${tableRow('EBITDA 利潤率', pct(ratios.profitability.ebitdaMargin))}
                ${tableRow('淨利率', pct(ratios.profitability.netMargin))}
                ${tableRow('ROE', pct(ratios.profitability.roe))}
                ${tableRow('ROA', pct(ratios.profitability.roa))}
                ${tableRow('ROIC', pct(ratios.profitability.roic))}
                ${tableRow('營收成長率', pct(ratios.growth.revenueGrowth))}
              </table>
            </td>
            <td style="width:50%; vertical-align:top; padding-left:8px;">
              <div style="${s.h3}">流動性 / 槓桿 / 效率</div>
              <table style="${s.table}">
                <colgroup><col style="width:65%"><col style="width:35%"></colgroup>
                <tr><th style="${s.th}">指標</th><th style="${s.th}">數值</th></tr>
                ${tableRow('流動比率', mult(ratios.liquidity.current))}
                ${tableRow('速動比率', mult(ratios.liquidity.quick))}
                ${tableRow('負債比率', pct(ratios.leverage.debtRatio))}
                ${tableRow('淨負債 / EBITDA', mult(ratios.leverage.netDebtEbitda))}
                ${tableRow('利息保障倍數', mult(ratios.leverage.interestCoverage))}
                ${tableRow('DSO（應收天數）', ratios.efficiency.dso != null ? `${ratios.efficiency.dso.toFixed(1)} 天` : 'N/A')}
                ${tableRow('DIO（存貨天數）', ratios.efficiency.dio != null ? `${ratios.efficiency.dio.toFixed(1)} 天` : 'N/A')}
                ${tableRow('DPO（應付天數）', ratios.efficiency.dpo != null ? `${ratios.efficiency.dpo.toFixed(1)} 天` : 'N/A')}
                ${tableRow('CCC（現金轉換週期）', ratios.efficiency.ccc != null ? `${ratios.efficiency.ccc.toFixed(1)} 天` : 'N/A')}
                ${tableRow('CFO / 淨利', mult(ratios.cashFlow.cfoToNetIncome, 2))}
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- DuPont -->
      <div style="${s.section}">
        <div style="${s.h2}">杜邦 ROE 拆解</div>
        <table style="${s.table}">
          <colgroup><col style="width:25%"><col style="width:25%"><col style="width:25%"><col style="width:25%"></colgroup>
          <tr><th style="${s.th}">淨利率</th><th style="${s.th}">資產周轉率</th><th style="${s.th}">權益乘數</th><th style="${s.th}">ROE</th></tr>
          <tr>
            <td style="${s.td2} text-align:center;">${pct(dupontAnalysis.netMargin)}</td>
            <td style="${s.td2} text-align:center;">${fixed(dupontAnalysis.assetTurnover)}</td>
            <td style="${s.td2} text-align:center;">${fixed(dupontAnalysis.equityMultiplier)}</td>
            <td style="${s.td2} text-align:center;">${pct(dupontAnalysis.roe)}</td>
          </tr>
        </table>
      </div>

      <!-- Risk Scores -->
      <div style="${s.section}">
        <div style="${s.h2}">量化風險模型</div>
        <table style="${s.table}">
          <colgroup><col style="width:18%"><col style="width:27%"><col style="width:10%"><col style="width:45%"></colgroup>
          <tr><th style="${s.th}">模型</th><th style="${s.th}">說明</th><th style="${s.th}">分數</th><th style="${s.th}">評級</th></tr>
          <tr>
            <td style="${s.td}">Beneish M-Score</td>
            <td style="${s.td}">盈餘操縱風險（> -1.78 有嫌疑）</td>
            <td style="${s.td2}">${fixed(riskScores.beneishMScore)}</td>
            <td style="${s.td}">${riskScores.beneishInterpretation}</td>
          </tr>
          <tr>
            <td style="${s.td}">Altman Z-Score</td>
            <td style="${s.td}">破產風險（< 1.81 危險，> 2.99 安全）</td>
            <td style="${s.td2}">${fixed(riskScores.altmanZScore)}</td>
            <td style="${s.td}">${riskScores.altmanInterpretation}</td>
          </tr>
          <tr>
            <td style="${s.td}">Piotroski F-Score</td>
            <td style="${s.td}">基本面強弱（7–9 強，0–3 弱）</td>
            <td style="${s.td2}">${riskScores.piotroskiFScore != null ? `${riskScores.piotroskiFScore}/9` : 'N/A'}</td>
            <td style="${s.td}">${riskScores.piotroskiInterpretation}</td>
          </tr>
        </table>
      </div>

      <!-- Red Flags -->
      ${redFlags?.length > 0 ? `
      <div style="${s.section}">
        <div style="${s.h2}">財務紅旗警示（共 ${redFlags.length} 項）</div>
        ${(['high', 'medium', 'low'] as const).map(sev => {
          const flags = redFlags.filter(f => f.severity === sev);
          if (flags.length === 0) return '';
          const label = sev === 'high' ? '高嚴重性' : sev === 'medium' ? '中嚴重性' : '低嚴重性';
          return `<div style="${s.h3}">${label}（${flags.length} 項）</div>` +
            flags.map(f => `<div style="${severityStyle(sev)}">
              <div style="font-weight:600; font-size:12px;">[${f.category}] ${f.description}</div>
              ${f.evidence ? `<div style="font-size:11px; color:#6b7280; margin-top:4px;">依據：${f.evidence}</div>` : ''}
            </div>`).join('');
        }).join('')}
      </div>` : ''}

      <!-- Decision Scenarios -->
      <div style="${s.section}">
        <div style="${s.h2}">決策情境分析</div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <tr>
            <td style="width:50%; vertical-align:top; padding-right:8px;">
              <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:12px; page-break-inside:avoid;">
                <div style="${s.h3} color:#1d4ed8;">情境一：投資分析</div>
                <table style="${s.table}">
                  <colgroup><col style="width:60%"><col style="width:40%"></colgroup>
                  <tr><th style="${s.th}">項目</th><th style="${s.th}">數值</th></tr>
                  ${tableRow('常態化 EBIT', num(scenarios.investment.normalizedEbit))}
                  ${tableRow('常態化 EBITDA', num(scenarios.investment.normalizedEbitda))}
                  ${tableRow('淨負債', num(scenarios.investment.netDebt))}
                  ${tableRow('估值區間', scenarios.investment.valuationRange)}
                </table>
                <div style="font-size:12px; margin-top:8px; color:#374151;"><strong>CFO 品質：</strong>${scenarios.investment.cfoQuality}</div>
                ${scenarios.investment.targetPriceRange ? (() => {
                  const tp = scenarios.investment.targetPriceRange!;
                  const fmt = (v: number | null) => v !== null ? v.toLocaleString('zh-TW', { maximumFractionDigits: 2 }) : 'N/A';
                  const hasPrice = tp.low !== null || tp.base !== null || tp.high !== null;
                  return `<div style="margin-top:8px; border:1px solid #bfdbfe; border-radius:6px; padding:8px; background:#f0f9ff;">
                    <div style="font-size:11px; color:#6b7280; font-weight:600; margin-bottom:6px;">目標價區間（每股，${companyInfo.currency}）</div>
                    ${hasPrice ? `<table style="width:100%; border-collapse:collapse; font-size:12px; table-layout:fixed;">
                      <colgroup><col style="width:33%"><col style="width:34%"><col style="width:33%"></colgroup>
                      <tr>
                        <td style="text-align:center; padding:6px 4px; background:#fffbeb; border:1px solid #fde68a; border-radius:4px;">
                          <div style="font-size:10px; color:#92400e;">保守</div>
                          <div style="font-size:14px; font-weight:700; color:#b45309;">${fmt(tp.low)}</div>
                        </td>
                        <td style="text-align:center; padding:6px 4px; background:#f0fdf4; border:2px solid #4ade80; border-radius:4px;">
                          <div style="font-size:10px; color:#166534;">基本</div>
                          <div style="font-size:16px; font-weight:700; color:#15803d;">${fmt(tp.base)}</div>
                        </td>
                        <td style="text-align:center; padding:6px 4px; background:#eff6ff; border:1px solid #93c5fd; border-radius:4px;">
                          <div style="font-size:10px; color:#1e40af;">樂觀</div>
                          <div style="font-size:14px; font-weight:700; color:#1d4ed8;">${fmt(tp.high)}</div>
                        </td>
                      </tr>
                    </table>` : '<div style="font-size:11px; color:#9ca3af;">流通股數資料不足，無法計算每股目標價</div>'}
                    ${(tp.annualizedEps !== null || tp.eps !== null) ? `<div style="font-size:10px; color:#6b7280; margin-top:4px;">
                      ${tp.eps !== null ? `報告期EPS：${fmt(tp.eps)}` : ''}
                      ${tp.annualizedEps !== null ? `　全年預估EPS：<strong>${fmt(tp.annualizedEps)}</strong>` : ''}
                      ${tp.annualizedEbitda !== null ? `　全年預估EBITDA：<strong>${fmt(tp.annualizedEbitda)}</strong>` : ''}
                    </div>` : ''}
                    ${tp.annualizationNote ? `<div style="font-size:10px; color:#92400e; background:#fffbeb; border:1px solid #fde68a; border-radius:3px; padding:3px 6px; margin-top:3px;">${tp.annualizationNote}</div>` : ''}
                    ${tp.methodology ? `<div style="font-size:10px; color:#9ca3af; margin-top:4px;">${tp.methodology}</div>` : ''}
                  </div>`;
                })() : ''}
                <div style="font-size:12px; margin-top:6px; background:#dbeafe; border-radius:4px; padding:8px;"><strong>建議：</strong>${scenarios.investment.recommendation}</div>
              </div>
            </td>
            <td style="width:50%; vertical-align:top; padding-left:8px;">
              <div style="background:#faf5ff; border:1px solid #ddd6fe; border-radius:8px; padding:12px; page-break-inside:avoid;">
                <div style="${s.h3} color:#6d28d9;">情境二：授信評估</div>
                <table style="${s.table}">
                  <colgroup><col style="width:60%"><col style="width:40%"></colgroup>
                  <tr><th style="${s.th}">項目</th><th style="${s.th}">數值</th></tr>
                  ${tableRow('利息保障（常態化）', mult(scenarios.credit.interestCoverageNormalized))}
                  ${tableRow('淨負債 / EBITDA', mult(scenarios.credit.netDebtEbitda))}
                  ${tableRow('風險等級', scenarios.credit.riskLevel === 'low' ? '低風險' : scenarios.credit.riskLevel === 'medium' ? '中風險' : scenarios.credit.riskLevel === 'high' ? '高風險' : '極高風險')}
                </table>
                <div style="font-size:12px; margin-top:8px; color:#374151;"><strong>現金流覆蓋：</strong>${scenarios.credit.cashFlowCoverage}</div>
                <div style="font-size:12px; margin-top:6px; background:#ede9fe; border-radius:4px; padding:8px;"><strong>授信建議：</strong>${scenarios.credit.recommendation}</div>
              </div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Detailed Analysis -->
      <div style="${s.section}">
        <div style="${s.h2}">深度分析</div>
        <p style="color:#374151; white-space:pre-wrap; margin:0;">${detailedAnalysis}</p>
      </div>

      <!-- Footer -->
      <div style="margin-top:32px; border-top:1px solid #e5e7eb; padding-top:10px; font-size:11px; color:#9ca3af; text-align:center;">
        本報告由 AI 財報分析工具自動生成，僅供教育研究用途，不構成投資建議。
      </div>
    </div>
  `;
}

export default function ResultsPage() {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('analysisResult');
    if (!stored) { router.replace('/'); return; }
    setAnalysis(JSON.parse(stored));
  }, [router]);

  const handleDownloadMd = () => {
    if (!analysis) return;
    const slug = `${analysis.companyInfo.name}_${analysis.companyInfo.period}`;
    downloadFile(generateMarkdownReport(analysis), `${slug}_財報分析.md`, 'text/markdown');
  };

  const handleDownloadJson = () => {
    if (!analysis) return;
    const slug = `${analysis.companyInfo.name}_${analysis.companyInfo.period}`;
    downloadFile(JSON.stringify(analysis, null, 2), `${slug}_財報分析.json`, 'application/json');
  };

  const handleDownloadPdf = async () => {
    if (!analysis) return;
    setIsPdfLoading(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const container = document.createElement('div');
      container.style.cssText = 'background: white;';
      container.innerHTML = generateHtmlForPdf(analysis);
      document.body.appendChild(container);
      const slug = `${analysis.companyInfo.name}_${analysis.companyInfo.period}`;
      await html2pdf().set({
        margin: [12, 12],
        filename: `${slug}_財報分析.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(container).save();
      document.body.removeChild(container);
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (!analysis) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { companyInfo, auditOpinion, keyFinancials, ratios, dupontAnalysis, redFlags } = analysis;
  const highFlags = redFlags?.filter(f => f.severity === 'high').length ?? 0;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: '概覽', icon: '🏠' },
    { id: 'ratios', label: '財務比率', icon: '📊' },
    { id: 'cashflow', label: '現金流', icon: '💧' },
    { id: 'redflags', label: `紅旗 ${redFlags?.length ? `(${redFlags.length})` : ''}`, icon: '🚩' },
    { id: 'decision', label: '決策建議', icon: '💡' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-gray-900">{companyInfo.name}</h1>
              {highFlags > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  {highFlags} 高風險紅旗
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">{companyInfo.period} · {companyInfo.reportType} · {companyInfo.currency}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isPdfLoading}
              className="text-sm bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
              title="下載 PDF 格式報告"
            >
              {isPdfLoading ? '產生中...' : '📥 PDF'}
            </button>
            <button
              onClick={handleDownloadMd}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
              title="下載 Markdown 格式報告"
            >
              📄 下載報告
            </button>
            <button
              onClick={handleDownloadJson}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition-colors"
              title="下載原始 JSON 資料"
            >
              { } JSON
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              ← 重新分析
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-100 px-4 sticky top-[57px] z-10">
        <div className="max-w-5xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">

          {/* ── 概覽 ── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Audit Opinion */}
              <div className={`flex items-start gap-4 rounded-xl p-4 border ${auditOpinionColor(auditOpinion.type)}`}>
                <div className="shrink-0 text-3xl">
                  {auditOpinion.type === '無保留意見' ? '✅' : '⚠️'}
                </div>
                <div>
                  <div className="font-semibold">審計意見：{auditOpinion.type}</div>
                  {auditOpinion.goingConcern && (
                    <div className="text-sm mt-1 font-medium text-red-700">⚠️ 存在繼續經營重大不確定性</div>
                  )}
                  {auditOpinion.keyAuditMatters?.length > 0 && (
                    <div className="text-sm mt-2">
                      <span className="font-medium">關鍵查核事項（KAM）：</span>
                      {auditOpinion.keyAuditMatters.join('、')}
                    </div>
                  )}
                  {auditOpinion.goingConcernDetails && (
                    <p className="text-sm mt-1 opacity-80">{auditOpinion.goingConcernDetails}</p>
                  )}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📋</span> 執行摘要
                </h2>
                <p className="text-gray-700 leading-relaxed">{analysis.executiveSummary}</p>
              </div>

              {/* Key Numbers */}
              <div>
                <h2 className="font-semibold text-gray-800 mb-3">關鍵財務數字</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[
                    { label: '營收', value: keyFinancials.revenue },
                    { label: '毛利', value: keyFinancials.grossProfit },
                    { label: 'EBIT', value: keyFinancials.ebit },
                    { label: 'EBITDA', value: keyFinancials.ebitda },
                    { label: '稅後淨利', value: keyFinancials.netIncome },
                    { label: '營業現金流(CFO)', value: keyFinancials.cfo },
                    { label: '資本支出(Capex)', value: keyFinancials.capex },
                    { label: '現金及約當現金', value: keyFinancials.cash },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-gray-200 rounded-xl p-3">
                      <div className="text-xs text-gray-400 mb-1">{label}</div>
                      <div className="font-bold text-gray-800">
                        {value !== null ? formatNumber(value) : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Ratios */}
              <div>
                <h2 className="font-semibold text-gray-800 mb-3">核心指標一覽</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'ROE', value: formatPercent(ratios.profitability.roe) },
                    { label: 'ROIC', value: formatPercent(ratios.profitability.roic) },
                    { label: 'CFO/淨利', value: ratios.cashFlow.cfoToNetIncome !== null ? `${ratios.cashFlow.cfoToNetIncome.toFixed(2)}x` : 'N/A' },
                    { label: '淨負債/EBITDA', value: ratios.leverage.netDebtEbitda !== null ? `${ratios.leverage.netDebtEbitda.toFixed(1)}x` : 'N/A' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">{label}</div>
                      <div className="font-bold text-blue-700 text-lg">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Analysis */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🔍</span> 深度分析
                </h2>
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.detailedAnalysis}</div>
              </div>
            </div>
          )}

          {/* ── 財務比率 ── */}
          {activeTab === 'ratios' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-5">財務比率完整分析</h2>
              <RatioGrid ratios={ratios} />
            </div>
          )}

          {/* ── 現金流 ── */}
          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <span>💧</span> 現金流瀑布圖
                </h2>
                <CashFlowWaterfall
                  ebitda={keyFinancials.ebitda}
                  cfo={keyFinancials.cfo}
                  capex={keyFinancials.capex}
                  currency={companyInfo.currency}
                />
                <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <strong>解讀重點：</strong>
                  CFO 應接近或超過 EBITDA（差距反映營運資金變動）；FCF = CFO − Capex，若長期為負需釐清是「成長投資」還是「本業失血」。
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                  <span>📊</span> 杜邦 ROE 拆解
                </h2>
                <DuPontChart data={dupontAnalysis} />
              </div>
            </div>
          )}

          {/* ── 紅旗 ── */}
          {activeTab === 'redflags' && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <span>🚩</span> 財務紅旗警示
              </h2>
              <RedFlagPanel redFlags={redFlags} />
            </div>
          )}

          {/* ── 決策建議 ── */}
          {activeTab === 'decision' && (
            <div>
              <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <span>💡</span> 決策情境分析
              </h2>
              <DecisionPanel analysis={analysis} />
            </div>
          )}

        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-100">
        本工具僅供教育與研究用途，不構成投資建議。分析結果應搭配專業判斷使用。
      </footer>
    </div>
  );
}
