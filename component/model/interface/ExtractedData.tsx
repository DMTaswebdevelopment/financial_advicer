export interface ExtractedData {
  id: string;
  title: string;
  category: string;
  description: string;
  keyQuestion: string;
  usefulFor: string;
  key: string;
}

export interface UploadedFile {
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  extractedData?: ExtractedData;
  error?: string;
  rawText?: string;
}
