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
    summary?: string;
    description: string;
    forClaudeAPI: string;
    documentSeries?: string;
    documentNumber: string;
    claudeDocumentProfile?: string;
    keywords: string[];
    keyQuestions?: string[];
    keyQuestionsImplicit?: string[];
    misconceptions?: string[];
    relevanceSignals_contentAttributes?: string[];
    relevanceSignals_financialContext?: string[];
    relevanceSignals_targetAudience?: string[];
    relevanceSignals_timelinessSignals?: string[];
    searchMetadata_concernAreas?: string[];
    searchMetadata_relevantSituations?: string[];
    searchMetadata_roleTargets?: string[];
    searchMetadata_searchTerms?: string[];
    searchMetadata_semanticTags?: string[];
    searchMetadata_specificAudiences?: string[];
    searchMetadata_targetAudiences?: string[];
    searchMetadata_topicAreas?: string[];
    searchMetadata_topicHierarchy?: string[];
    textChunks?: string[];
    // topics?: string[];
  };
}
