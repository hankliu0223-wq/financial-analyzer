'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FinancialAnalysis } from '@/lib/types';

const MODELS = [
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Haiku',
    tag: '推薦',
    tagStyle: 'bg-emerald-100 text-emerald-700',
    desc: '快速省費，適合一般分析',
    inputPrice: 0.80,
    outputPrice: 4,
  },
  {
    id: 'claude-sonnet-4-6',
    name: 'Sonnet',
    tag: '高品質',
    tagStyle: 'bg-blue-100 text-blue-700',
    desc: '品質與費用的最佳平衡',
    inputPrice: 3,
    outputPrice: 15,
  },
  {
    id: 'claude-opus-4-6',
    name: 'Opus',
    tag: '頂級',
    tagStyle: 'bg-purple-100 text-purple-700',
    desc: '最深入精確，適合重要決策',
    inputPrice: 15,
    outputPrice: 75,
  },
];

// 估算費用：根據實測 9.4MB ≈ $1 (Sonnet) 推算 ~33,000 tokens/MB
function estimateCost(fileSizeMB: number, inputPrice: number, outputPrice: number): string {
  const inputTokens = fileSizeMB * 33000;
  const outputTokens = 5000;
  const cost = (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000;
  if (cost < 0.005) return '<$0.01';
  return `~$${cost.toFixed(2)}`;
}

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('claude-haiku-4-5-20251001');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFile = (f: File) => {
    setError('');
    const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      setError('僅支援 PDF 格式');
      return;
    }
    if (f.size > 15 * 1024 * 1024) {
      setError(`檔案過大（${(f.size / 1024 / 1024).toFixed(1)}MB），請上傳 15MB 以下的 PDF`);
      return;
    }
    setFile(f);
  };

  // 用原生 DOM 事件取代 React synthetic event（已確認原生方式可運作）
  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    const onFileChange = () => {
      const f = input.files?.[0];
      if (f) {
        setError('');
        const isPDF = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
        if (!isPDF) { setError('僅支援 PDF 格式'); return; }
        if (f.size > 15 * 1024 * 1024) { setError(`檔案過大（${(f.size / 1024 / 1024).toFixed(1)}MB）`); return; }
        setFile(f);
      }
    };
    input.addEventListener('change', onFileChange);
    return () => input.removeEventListener('change', onFileChange);
  }, []);

  // 拖曳事件也用原生方式
  useEffect(() => {
    const zone = dropZoneRef.current;
    if (!zone) return;

    const onDragEnter = (e: DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const onDragOver  = (e: DragEvent) => { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'; setIsDragging(true); };
    const onDragLeave = (e: DragEvent) => { if (!zone.contains(e.relatedTarget as Node)) setIsDragging(false); };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer?.files[0];
      if (f) handleFile(f);
    };

    zone.addEventListener('dragenter', onDragEnter);
    zone.addEventListener('dragover',  onDragOver);
    zone.addEventListener('dragleave', onDragLeave);
    zone.addEventListener('drop',      onDrop);
    return () => {
      zone.removeEventListener('dragenter', onDragEnter);
      zone.removeEventListener('dragover',  onDragOver);
      zone.removeEventListener('dragleave', onDragLeave);
      zone.removeEventListener('drop',      onDrop);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    if (!file) { setError('請選擇要分析的財報 PDF'); return; }
    if (!apiKey.trim()) { setError('請輸入 Claude API Key'); return; }
    if (!apiKey.startsWith('sk-ant-')) { setError('API Key 格式不正確，應以 sk-ant- 開頭'); return; }

    setIsAnalyzing(true);
    setError('');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(p => p < 85 ? p + Math.random() * 8 : p);
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', apiKey.trim());
      formData.append('model', model);

      const response = await fetch('/api/analyze', { method: 'POST', body: formData });

      clearInterval(progressInterval);

      let result;
      try {
        result = await response.json();
      } catch {
        setProgress(0);
        setIsAnalyzing(false);
        if (response.status === 504 || response.status === 524) {
          setError('請求逾時（Vercel 免費方案限制 60 秒）。請升級至 Vercel Pro，或改用 Haiku 加快速度。');
        } else {
          setError(`伺服器回傳非預期格式（HTTP ${response.status}），請稍後重試`);
        }
        return;
      }

      setProgress(100);

      if (!result.success) {
        setError(result.error || '分析失敗，請重試');
        setIsAnalyzing(false);
        setProgress(0);
        return;
      }

      const analysis: FinancialAnalysis = result.data;
      sessionStorage.setItem('analysisResult', JSON.stringify(analysis));
      router.push('/results');
    } catch (err) {
      clearInterval(progressInterval);
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError('網路連線異常，請確認網路後重試');
      } else {
        setError('連線失敗，可能是 Vercel 免費方案逾時（60s 上限）。請改用 Haiku 或升級 Vercel Pro。');
      }
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
          <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
          IFRS 框架 · AI 驅動分析
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">財報深度分析工具</h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          上傳年報或季報 PDF，AI 自動計算 24+ 財務比率、偵測紅旗警訊，並提供投資與授信決策建議
        </p>
      </div>

      {/* Upload Card */}
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Drop Zone */}
          <div
            ref={dropZoneRef}
            className={[
              'relative border-2 border-dashed rounded-xl transition-colors overflow-hidden',
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50',
              isAnalyzing ? 'opacity-60' : '',
              file ? 'border-emerald-400 bg-emerald-50' : '',
            ].join(' ')}
          >
            {/* 透明 input 覆蓋整個區域，用原生 change 事件接聽 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              disabled={isAnalyzing}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              style={{ zIndex: 10 }}
              title="點擊選擇或拖曳 PDF 到此處"
            />
            {/* 視覺內容 */}
            <div className="pointer-events-none p-8 text-center">
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB · 點擊重新選擇</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">拖曳財報 PDF 到此處，或點擊選擇</p>
                    <p className="text-sm text-gray-400 mt-1">支援年報、季報 PDF · 最大 15MB</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">選擇分析模型</label>
            <div className="grid grid-cols-3 gap-2">
              {MODELS.map((m) => {
                const cost = file ? estimateCost(file.size / 1024 / 1024, m.inputPrice, m.outputPrice) : null;
                const selected = model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => setModel(m.id)}
                    className={[
                      'relative text-left px-3 py-2.5 rounded-lg border-2 transition-colors',
                      selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white',
                      'disabled:opacity-50',
                    ].join(' ')}
                  >
                    <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mb-1 ${m.tagStyle}`}>
                      {m.tag}
                    </span>
                    <div className="font-semibold text-sm text-gray-900">{m.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 leading-tight">{m.desc}</div>
                    {cost && (
                      <div className="text-xs font-semibold text-gray-700 mt-1.5">{cost}</div>
                    )}
                  </button>
                );
              })}
            </div>
            {file && (
              <p className="text-xs text-gray-400 mt-1.5">
                預估費用依 PDF 大小（{(file.size / 1024 / 1024).toFixed(1)} MB）估算，實際可能有差異
              </p>
            )}
            {file && model === 'claude-haiku-4-5-20251001' && file.size > 1.5 * 1024 * 1024 && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-1.5">
                ⚠ 此 PDF 較大，可能超出 Haiku 的 200K token 上限而失敗。建議改用 Sonnet。
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Claude API Key
              <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer"
                className="ml-2 text-blue-500 hover:text-blue-700 font-normal text-xs">
                還沒有？點此申請 →
              </a>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              disabled={isAnalyzing}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">API Key 僅在本次請求中使用，不會儲存在伺服器上</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Progress */}
          {isAnalyzing && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>AI 正在分析財報中...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 text-center">通常需要 30–60 秒，請耐心等候</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isAnalyzing || !file || !apiKey}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
          >
            {isAnalyzing ? '分析中...' : !file ? '請先選擇財報 PDF' : !apiKey ? '請先輸入 Claude API Key' : '開始分析'}
          </button>
        </form>
      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl w-full">
        {[
          { icon: '📊', title: '24+ 財務比率', desc: '獲利、槓桿、效率、現金流全覆蓋' },
          { icon: '🚩', title: '紅旗偵測', desc: '自動找出盈餘管理與流動性風險' },
          { icon: '💡', title: '決策建議', desc: '投資買入/授信/併購三種情境分析' },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-2">{f.icon}</div>
            <div className="font-medium text-sm text-gray-800">{f.title}</div>
            <div className="text-xs text-gray-400 mt-1">{f.desc}</div>
          </div>
        ))}
      </div>

    </main>
  );
}
