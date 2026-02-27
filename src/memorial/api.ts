const DEFAULT_API_BASE_URL = 'http://localhost:3001';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') || DEFAULT_API_BASE_URL;

export interface CreateDeceasedPayload {
  full_name: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  death_date?: string;
  biography?: string;
  photos?: string[];
  videos?: string[];
  access_password?: string;
  is_public?: boolean;
}

export interface CreateDeceasedResult {
  id: number;
  qr_code_id: string;
  full_name: string;
  created_at: string;
}

interface CreateDeceasedResponse {
  code: number;
  message?: string;
  data?: CreateDeceasedResult;
}

export interface DeceasedDetail {
  id: number;
  qr_code_id: string;
  full_name: string;
  gender: 'male' | 'female' | 'other' | null;
  birth_date: string | null;
  death_date: string | null;
  biography: string | null;
  photos: string[];
  videos: string[];
  is_public: boolean;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

interface GetDeceasedResponse {
  code: number;
  message?: string;
  data?: DeceasedDetail;
}

export async function createDeceased(
  payload: CreateDeceasedPayload,
): Promise<CreateDeceasedResult> {
  const res = await fetch(`${API_BASE_URL}/api/deceased`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let parsed: CreateDeceasedResponse;
  try {
    parsed = (await res.json()) as CreateDeceasedResponse;
  } catch {
    throw new Error('创建纪念页失败：服务器返回格式不正确');
  }

  if (!res.ok || parsed.code !== 200 || !parsed.data) {
    throw new Error(parsed.message || '创建纪念页失败，请稍后重试');
  }

  return parsed.data;
}

export async function getDeceased(qrCodeId: string): Promise<DeceasedDetail> {
  const res = await fetch(`${API_BASE_URL}/api/deceased/${encodeURIComponent(qrCodeId)}`);

  let parsed: GetDeceasedResponse;
  try {
    parsed = (await res.json()) as GetDeceasedResponse;
  } catch {
    throw new Error('获取纪念页失败：服务器返回格式不正确');
  }

  if (!res.ok || parsed.code !== 200 || !parsed.data) {
    throw new Error(parsed.message || '获取纪念页失败，请稍后重试');
  }

  return parsed.data;
}

