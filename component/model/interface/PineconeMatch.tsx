export interface PineconeMatch {
  id: string;
  score?: number;
  metadata?: {
    score?: string | number;
    title?: string;
    url?: string;
    description?: string;
    category?: string;
    usefulFor?: string[];
    documentSeries?: string;
    documentNumber?: string;
    mostHelpfulFor?: string[];
    id?: string;
    key?: string;
  };
}
