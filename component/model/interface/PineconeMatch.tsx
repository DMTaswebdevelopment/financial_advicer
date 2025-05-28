export interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: {
    title?: string;
    url?: string;
    category?: string;
  };
}
