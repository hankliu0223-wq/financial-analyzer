import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ANALYSIS_PROMPT } from '@/lib/prompt';
import { FinancialAnalysis } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const apiKey = formData.get('apiKey') as string | null;
    const modelParam = formData.get('model') as string | null;

    const VALID_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-6'];
    const selectedModel = modelParam && VALID_MODELS.includes(modelParam) ? modelParam : 'claude-sonnet-4-6';

    if (!file) {
      return NextResponse.json({ success: false, error: '請上傳財報檔案' }, { status: 400 });
    }
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return NextResponse.json({ success: false, error: 'Claude API Key 格式不正確，請確認以 sk-ant- 開頭' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: `檔案大小超過 15MB 限制（目前：${(file.size / 1024 / 1024).toFixed(1)}MB）` }, { status: 400 });
    }
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPDF) {
      return NextResponse.json({ success: false, error: '僅支援 PDF 格式的財報' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64PDF = Buffer.from(arrayBuffer).toString('base64');

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: selectedModel,
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: ANALYSIS_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    let analysis: FinancialAnalysis;
    try {
      const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse error. Raw response:', responseText.slice(0, 500));
      return NextResponse.json(
        { success: false, error: 'AI 回傳格式解析失敗，請重試。若問題持續，財報可能過於複雜或格式特殊。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: analysis });
  } catch (error: unknown) {
    console.error('Analysis error:', error);

    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message?: string };
      if (apiError.status === 401) {
        return NextResponse.json({ success: false, error: 'API Key 無效，請確認金鑰是否正確且有效' }, { status: 401 });
      }
      if (apiError.status === 429) {
        return NextResponse.json({ success: false, error: 'API 使用額度超限，請稍後再試或確認帳戶額度' }, { status: 429 });
      }
      if (apiError.status === 413) {
        return NextResponse.json({ success: false, error: 'PDF 檔案過大，請嘗試上傳較小的版本' }, { status: 413 });
      }
    }

    const message = error instanceof Error ? error.message : '未知錯誤';
    return NextResponse.json({ success: false, error: `分析失敗：${message}` }, { status: 500 });
  }
}
