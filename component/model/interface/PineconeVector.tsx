export interface PineconeVector {
  id: string;
  values: number[];
  metadata: {
    url: string;
    title: string;
    name: string;
    key: string;
    category: string;
    id: string;
    uploadDate: string[];
    pageCount?: number;
    summary?: string;
    description: string;
    documentSeries?: string;
    claudeDocumentProfile?: string;
    usefulFor?: string; // ✅ should be string, not string[]
    keywords: string[];
    keyQuestions: string[];
  };
}
