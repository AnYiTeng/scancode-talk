/** 纪念页表单/展示用数据结构 */
export interface MemorialData {
  name?: string;
  gender?: 'male' | 'female';
  birthDate?: number;
  deathDate?: number;
  biography?: string;
  photoUrls?: string[];
}

/** 用于 MemorialCard 展示的派生数据（含 photoList） */
export interface MemorialCardData {
  name?: string;
  gender?: 'male' | 'female';
  birthDate?: number;
  deathDate?: number;
  biography?: string;
  photoList?: string[];
}
