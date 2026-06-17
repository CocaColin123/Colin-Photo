export interface JournalEntry {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  body: string;
  status: 'draft' | 'published';
  coverImage?: string;
  location?: string;
  relatedAlbumId?: string;
}
