export interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: {
    title?: string;
    url?: string;
    category?: string;
    documentSeries?: string;
    id?: string;
    key?: string;
  };
}
