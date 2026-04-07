export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatMultiple(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(decimals)}x`;
}

export function formatNumber(value: number | null, decimals = 0): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDays(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return `${Math.round(value)} 天`;
}

export function getRatioColor(value: number | null, thresholds: { good: number; bad: number }, higherIsBetter = true): string {
  if (value === null) return 'text-gray-400';
  if (higherIsBetter) {
    if (value >= thresholds.good) return 'text-emerald-600';
    if (value <= thresholds.bad) return 'text-red-600';
    return 'text-yellow-600';
  } else {
    if (value <= thresholds.good) return 'text-emerald-600';
    if (value >= thresholds.bad) return 'text-red-600';
    return 'text-yellow-600';
  }
}

export function severityColor(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high': return 'bg-red-50 border-red-300 text-red-800';
    case 'medium': return 'bg-yellow-50 border-yellow-300 text-yellow-800';
    case 'low': return 'bg-blue-50 border-blue-300 text-blue-800';
  }
}

export function severityBadgeColor(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high': return 'bg-red-100 text-red-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-blue-100 text-blue-700';
  }
}

export function severityLabel(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high': return '高風險';
    case 'medium': return '中風險';
    case 'low': return '低風險';
  }
}

export function riskLevelColor(level: string): string {
  switch (level) {
    case 'low': return 'text-emerald-600';
    case 'medium': return 'text-yellow-600';
    case 'high': return 'text-orange-600';
    case 'very-high': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

export function riskLevelLabel(level: string): string {
  switch (level) {
    case 'low': return '低風險';
    case 'medium': return '中風險';
    case 'high': return '高風險';
    case 'very-high': return '極高風險';
    default: return '不確定';
  }
}

export function auditOpinionColor(type: string): string {
  switch (type) {
    case '無保留意見': return 'text-emerald-700 bg-emerald-50';
    case '保留意見': return 'text-yellow-700 bg-yellow-50';
    case '否定意見': return 'text-red-700 bg-red-50';
    case '無法表示意見': return 'text-red-700 bg-red-50';
    default: return 'text-gray-700 bg-gray-50';
  }
}
