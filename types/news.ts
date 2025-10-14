// types/news.ts

// ✅ KEEP only this
export interface NewsData {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string | null;
  video_url?: string | null;
  image_path?: string | null;
  video_path?: string | null;
  created_at: string;
}

export type NewsBase = Omit<NewsData, 'id' | 'created_at'>;
