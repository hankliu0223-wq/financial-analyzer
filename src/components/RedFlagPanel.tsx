import { RedFlag } from '@/lib/types';
import { severityColor, severityBadgeColor, severityLabel } from '@/utils/formatters';

interface Props {
  redFlags: RedFlag[];
}

export default function RedFlagPanel({ redFlags }: Props) {
  if (!redFlags || redFlags.length === 0) {
    return (
      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-emerald-700 font-medium">未偵測到明顯財務紅旗</p>
      </div>
    );
  }

  const highCount = redFlags.filter(f => f.severity === 'high').length;
  const midCount = redFlags.filter(f => f.severity === 'medium').length;

  return (
    <div className="space-y-3">
      {/* Summary Bar */}
      <div className="flex gap-3 text-sm">
        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">{highCount} 高風險</span>
        <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">{midCount} 中風險</span>
        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
          {redFlags.length - highCount - midCount} 低風險
        </span>
      </div>

      {/* Flags */}
      {redFlags.map((flag, index) => (
        <div
          key={index}
          className={`border rounded-xl p-4 ${severityColor(flag.severity)}`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {flag.severity === 'high' ? (
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : flag.severity === 'medium' ? (
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityBadgeColor(flag.severity)}`}>
                  {severityLabel(flag.severity)}
                </span>
                <span className="text-xs text-gray-500">{flag.category}</span>
              </div>
              <p className="font-medium text-sm">{flag.description}</p>
              {flag.evidence && (
                <p className="text-xs mt-1.5 opacity-75 leading-relaxed border-t border-current border-opacity-20 pt-1.5">
                  佐證：{flag.evidence}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
