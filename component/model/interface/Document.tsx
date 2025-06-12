export interface Document {
  id: number | string;
  title: string;
  url?: string;
  description: string;
  matchIndex?: number;
  storagePath?: string;
  category?: string;
  filePath?: string;
  pdfID?: string;
  key?: string;
  fullLabel?: string; // <-- Add this
}
