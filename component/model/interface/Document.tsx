export interface Document {
  id: number | string;
  title: string;
  url?: string;
  description: string;
  matchIndex?: number;
  storagePath?: string;
  category?: string;
  filePath?: string;
  documentNumber?: string;
  pdfID?: string;
  key?: string;
  fullLabel?: string; // <-- Add this
}
