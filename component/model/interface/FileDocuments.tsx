interface Implicits {
  confidence: number;
  question: string;
  source: string;
  type: string;
}

interface DateInfo {
  actReferences: string[];
  dates: string;
  forClaudeAPI: string;
  financialYears: string[];
  isTimeSensitive: boolean;
  mostRecentYear: number;
  recency: string;
  years: string;
}

interface Misconception {
  confidence: number;
  context: string;
  text: string;
  topics: string[];
}

interface HasInstructionalElements {
  analogies: boolean;
  bulletPoints: boolean;
  definitions: boolean;
  examples: boolean;
  headings: boolean;
  realWorldScenarios: boolean;
  stepByStep: boolean;
}

interface Readability {
  audience: string;
  averageParagraphLength: number;
  averageSentenceLength: number;
  difficulty: string;
  explanationScore: number;
  forClaudeAPI: string;
  formatAccessibilityScore: number;
  hasInstructionalElements: HasInstructionalElements;
  paragraphCount: number;
  readerEngagement: number;
  score: number;
  sentenceCount: number;
  standardAudience: string;
  syllableCount: number;
  technicalTermPercentage: number;
  wordCount: number;
}

interface ContentAttributes {
  educationalContent: boolean;
  includesExample: boolean;
  includesRealWorldScenarios: boolean;
  includesStepByStep: boolean;
  practicalGuidance: boolean;
}

interface TextChunk {
  content: string;
  heading: string;
  index: number;
  isComplete: boolean;
  nextChunkHeading: string | null;
  prevChunkHeading: string | null;
}

interface Topic {
  confidence: number;
  topic: string;
}

interface KeyQuestions {
  all?: string[];
  explicit?: string[];
  forClaudeAPI: string;
  implicit: Implicits[];
}

export interface FileData {
  name: string;
  category: string;
  url?: string;
  claudeDocumentProfile: string;
  dateInfo: DateInfo;
  documentEmbedding: null;
  documentSeries: string;
  fullText: string;
  description: string;
  hasEmbeddings: boolean;

  isTimelyDocument: boolean;
  keyQuestions?: KeyQuestions;
  keywords?: string[];
  misconceptions: Misconception;
  pageCount: number;
  readability: Readability;
  relevanceSignals: {
    contentAttributes: ContentAttributes;
    documentType: string;
    financialContext: string[];
    formatSignals: string[];
    targetAudience: string[];
    timelinessSignals: string[];
  };
  searchMetadata: {
    addressesCommonMisconceptions: boolean;
    complexity: string;
    concernAreas: string[];
    documentType: string;
    hasEducationalContent: boolean;
    hasPracticalGuidance: boolean;
    lifeStages: string[];
    misconceptionTopics: string[];
    painPoints: string[];
    semanticTags: string[];
    recency: string;
    specificAudiences: string[];
    topicHierarchy: string[];
    searchTerms: string[];
    roleTargets: string[];
    relevantSituations: string[];
    targetAudience: string[];
    topicAreas: string[];
  };
  storagePath?: string;
  summary: string;
  documentNumber: string;
  textChunks: TextChunk[];
  title: string;
  topics: Topic[];
  uploadDate: string;
  usefulFor: string[];
  key: string;
}

export interface FileEntry extends FileData {
  id: string;
  url: string;
}
