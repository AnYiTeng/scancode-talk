/**
 * 阿里云百炼 API（OpenAI 兼容模式）封装，用于纪念页「与TA对话」功能。
 * 需在 .env.local 中配置 REACT_APP_BAILIAN_API_KEY。
 */

import type { MemorialData } from './types';
import dayjs from 'dayjs';

const BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const MODEL = 'qwen-turbo'; // 更快；可改为 qwen-plus 提高质量
const MAX_HISTORY_MESSAGES = 10; // 保留最近 N 条消息用于上下文

function getApiKey(): string {
  const key = process.env.REACT_APP_BAILIAN_API_KEY;
  if (!key || !key.trim()) {
    throw new Error('未配置 REACT_APP_BAILIAN_API_KEY，请在 .env.local 中设置');
  }
  return key.trim();
}

/**
 * 根据纪念页数据生成系统 prompt，让 AI 模拟逝者身份与语气。
 */
export function buildSystemPrompt(data: MemorialData): string {
  const name = data.name ?? '逝者';
  const birthStr = data.birthDate
    ? dayjs(data.birthDate).format('YYYY年MM月DD日')
    : '未知';
  const deathStr = data.deathDate
    ? dayjs(data.deathDate).format('YYYY年MM月DD日')
    : '未知';
  const bio = (data.biography ?? '').trim() || '（暂无详细生平）';
  return `你现在是【${name}】，生于【${birthStr}】，逝于【${deathStr}】。以下是关于你的生平介绍：${bio}。
请以第一人称的口吻，用温和、怀念的语气回答用户的问题。你是逝者的亲人/朋友，回答要亲切、有温度。`;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 调用百炼 /chat/completions（流式），携带系统 prompt 与最近若干轮对话历史。
 * 每收到一段内容会调用 onChunk(delta)，全部结束后返回完整回复文本。
 * @param onChunk 收到一段增量内容时回调（可用来做打字机效果）
 * @returns 助手完整回复文本；失败时抛出带 message 的 Error
 */
export async function sendChatStream(
  systemPrompt: string,
  history: ChatMessage[],
  userContent: string,
  onChunk: (delta: string) => void
): Promise<string> {
  const apiKey = getApiKey();
  const recent = history.slice(-MAX_HISTORY_MESSAGES);
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...recent.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent },
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 1000,
      stream: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let errMsg = `请求失败 (${res.status})`;
    try {
      const json = JSON.parse(text);
      if (json.error?.message) errMsg = json.error.message;
    } catch {
      if (text) errMsg = text.slice(0, 200);
    }
    throw new Error(errMsg);
  }

  const reader = res.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error('无法读取响应流');

  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed !== line) continue;
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') continue;
        try {
          const json = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = json.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) {
            fullContent += delta;
            onChunk(delta);
          }
        } catch {
          // 忽略单条解析失败
        }
      }
    }
  }
  if (buffer.trim().startsWith('data:')) {
    const data = buffer.trim().slice(5).trim();
    if (data !== '[DONE]') {
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const delta = json.choices?.[0]?.delta?.content;
        if (typeof delta === 'string' && delta) {
          fullContent += delta;
          onChunk(delta);
        }
      } catch {
        // ignore
      }
    }
  }

  return fullContent.trim() || '（暂无回复）';
}
