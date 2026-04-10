export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export type EbookTheme = 'classic' | 'modern' | 'minimal' | 'elegant' | 'technical';

export interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  chapters: Chapter[];
  coverImage?: string;
  coverLayout?: 'top' | 'middle' | 'bottom';
  introduction?: string;
  theme?: EbookTheme;
  createdAt: number;
}

export interface AISuggestion {
  type: 'text' | 'image';
  content: string;
  originalText?: string;
}
