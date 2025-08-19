export interface GroupedDocument {
  title: string;
  key: string[];
  description: string;
  id: string | number;
  category: string[];
  documentNumber?: string;
  mostUsefulFor?: string[];
}
