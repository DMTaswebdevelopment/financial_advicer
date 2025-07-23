// import { ChatAnthropic } from "@langchain/anthropic";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  END,
  MemorySaver,
  MessagesAnnotation,
  START,
  StateGraph,
} from "@langchain/langgraph";

import SYSTEM_MESSAGE from "@/constants/system.Message";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeMatch } from "@/component/model/interface/PineconeMatch";
import { FormattedResult } from "@/component/model/interface/FormattedResult";
import embeddings from "./open-ai";
import { ChatOpenAI } from "@langchain/openai";
import { metadataToString } from "@/functions/metadataToString";
import { extractNumberPrefix } from "@/functions/extractNumberPrefix";

// Define allowed categories as const assertion for better type inference
const ALLOWED_CATEGORIES = [
  "Missing Lessons Series",
  "Checklist Series",
  "Detailed Knowledge Series",
  "Financial Fluency Series",
  "Advisory Essentials Series",
] as const;

// Create a type from the allowed categories
type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];

// Use faster models strategically
const FAST_MODEL = "gpt-4o-mini"; // Fastest for simple queries
// use this for claude faster = claude-haiku-3-5-20241022
// const BALANCED_MODEL = "claude-sonnet-4-20250514"; // Good balance uncomment this if we will use this
const QUALITY_MODEL = "gpt-4o"; // Best quality
// use this for claude quality = claude-opus-4-20250514

async function querySimilarDocuments(
  queryText: string,
  topK = 25,
  excludeIds: string[] = []
): Promise<FormattedResult[]> {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    // Check if queryText contains a 3-digit number
    const fourDigitMatch = queryText.match(/(?:^|\s)(\d{3})(?=\s|$)/);

    console.log("fourDigitMatch", fourDigitMatch);
    let finalResults: PineconeMatch[] = [];

    if (fourDigitMatch) {
      const specificNumber = fourDigitMatch[1];

      // Search specifically for the Missing Lessons document with this number
      const queryResponse = await index.query({
        topK: 100,
        vector: await embeddings.embedQuery(queryText),
        includeMetadata: true,
        includeValues: false,
        filter: {
          documentNumber: {
            $eq: fourDigitMatch[1],
          },
        },
      });

      // Sort matches based on category priority defined in ALLOWED_CATEGORIES
      const sortedMatches = queryResponse.matches.sort((a, b) => {
        const categoryA = metadataToString(a.metadata?.category);
        const categoryB = metadataToString(b.metadata?.category);
        const indexA = ALLOWED_CATEGORIES.indexOf(categoryA as AllowedCategory);
        const indexB = ALLOWED_CATEGORIES.indexOf(categoryB as AllowedCategory);

        // Unknown categories go to the end
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      // Filter for documents that match the specific 4-digit number
      finalResults = sortedMatches.filter((match) => {
        const matchId = metadataToString(match.metadata?.id);
        const documentNumber = metadataToString(match.metadata?.documentNumber);

        // Skip if this ID or documentNumber was already shown
        if (
          excludeIds.includes(matchId) ||
          excludeIds.includes(documentNumber)
        ) {
          return false;
        }

        const numberPrefix = extractNumberPrefix(documentNumber);
        return numberPrefix === specificNumber;
      });

      // console.log("finalResults.", finalResults);
    } else {
      const queryEmbedding = await embeddings.embedQuery(queryText);

      // Get more results to account for exclusions and ensure we have enough for all categories
      const queryResponse = await index.query({
        topK: 200, // Get more results to ensure we have enough for all categories
        vector: queryEmbedding,
        includeMetadata: true,
        includeValues: false,
        filter: {
          category: {
            $in: ALLOWED_CATEGORIES,
          },
        },
      });

      // Separate results by category
      const categorizedResults: Record<AllowedCategory, PineconeMatch[]> = {
        "Missing Lessons Series": [],
        "Checklist Series": [],
        "Detailed Knowledge Series": [],
        "Financial Fluency Series": [],
        "Advisory Essentials Series": [],
      };

      // Group matches by category and filter out excluded IDs
      queryResponse.matches.forEach((match) => {
        const category = match.metadata?.category as AllowedCategory;
        const matchId = metadataToString(match.metadata?.id);
        const documentNumber = metadataToString(match.metadata?.documentNumber);

        // Skip if this ID or documentNumber was already shown
        if (
          excludeIds.includes(matchId) ||
          excludeIds.includes(documentNumber)
        ) {
          return;
        }

        if (category && category in categorizedResults) {
          categorizedResults[category].push(match);
        }
      });

      // Sort each category by score (highest first)
      Object.keys(categorizedResults).forEach((category) => {
        categorizedResults[category as AllowedCategory].sort(
          (a, b) => (b.score || 0) - (a.score || 0)
        );
      });

      // const finalResults: PineconeMatch[] = [];

      // Step 1: Get exactly 5 unique Missing Lessons based on number prefix
      const usedNumberPrefixes: string[] = [];
      const missingLessonsResults: PineconeMatch[] = [];

      for (const match of categorizedResults["Missing Lessons Series"]) {
        // Stop if we already have 5 unique number prefixes
        if (usedNumberPrefixes.length >= 5) {
          break;
        }

        const documentNumber = metadataToString(match.metadata?.documentNumber);
        const numberPrefix = extractNumberPrefix(documentNumber);

        // Only add if we haven't seen this number prefix before
        if (numberPrefix && !usedNumberPrefixes.includes(numberPrefix)) {
          missingLessonsResults.push(match);
          usedNumberPrefixes.push(numberPrefix);
        }
      }

      // Add Missing Lessons to final results
      finalResults.push(...missingLessonsResults);

      // Step 2: For each number prefix, find corresponding documents in other categories
      const otherCategories: AllowedCategory[] = [
        "Checklist Series",
        "Detailed Knowledge Series",
        "Financial Fluency Series",
        "Advisory Essentials Series",
      ];

      for (const numberPrefix of usedNumberPrefixes) {
        for (const category of otherCategories) {
          // Find the best matching document in this category with the same number prefix
          const matchingDoc = categorizedResults[category].find((match) => {
            const documentNumber = metadataToString(
              match.metadata?.documentNumber
            );
            const docNumberPrefix = extractNumberPrefix(documentNumber);
            return docNumberPrefix === numberPrefix;
          });

          if (matchingDoc) {
            finalResults.push(matchingDoc);
          } else {
            console.log(
              `✗ No ${category} document found with prefix ${numberPrefix}`
            );
          }
        }
      }
    }

    // Map to your desired format
    return finalResults.map((match) => {
      const id = match.metadata?.id || "";
      const key = match.metadata?.key;
      const description = match.metadata?.description;
      const documentNumber = match.metadata?.documentNumber;

      return {
        key: key,
        id: id,
        documentNumber: documentNumber,
        description: description,
        category: match.metadata?.category,
      };
    });
  } catch (error) {
    console.error("Error querying Pinecone:", error);
    return [];
  }
}

// Trim the messages to manage conversation history
const trimmer = trimMessages({
  maxTokens: 2000,
  strategy: "last",
  tokenCounter: (msg) => msg.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// Define your tools to use pdfLists only
const createTools = () => [
  new DynamicTool({
    name: "quickSearch",
    description:
      "Search for the most relevant documents based on user query. Use only when specific document lookup is needed.",
    func: async (input: string) => {
      const matches = await querySimilarDocuments(input, 25);

      // console.log("matches", matches);
      if (matches.length === 0) {
        return JSON.stringify({
          message: "No relevant documents found for this query.",
          documents: [],
          searchQuery: input,
        });
      }

      const result = {
        searchQuery: input,
        totalResults: matches.length,

        allDocuments: matches.map((doc) => ({
          // title: doc.title,
          id: doc.id, // Use this instead of URL
          key: doc.key,
          description: doc.description,
          category: doc.category,
          documentNumber: doc.documentNumber,
          // url: doc.url,
        })),
      };

      return JSON.stringify(result);
    },
  }),
];

// Modified submitQuestion function with required pdfLists
export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  // Add caching headers to messages
  const cachedMessages = addCachingHeaders(messages);

  // Create workflow with the pdfLists
  const workflow = createWorkflow();

  // Create a checkpoint to save the state of the conversation
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  // Run the graph and stream
  const stream = await app.streamEvents(
    {
      messages: cachedMessages,
    },
    {
      version: "v2",
      configurable: {
        thread_id: chatId,
      },
      streamMode: "messages",
      runId: chatId,
    }
  );

  return stream;
}

// Create workflow with the pdfLists
const createWorkflow = () => {
  // Create tools with pdfLists
  const tools = createTools();
  const toolNodes = new ToolNode(tools);
  const model = initialiseModel(tools);

  const stateGraph = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      // create the system message content
      const systemContent = SYSTEM_MESSAGE;

      // Create the prompt template with system message and messages placeholder
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(
          systemContent +
            `
            === SEARCH RESULT DISPLAY RULES ===
            - When user asks for "another result", "another example", "more results", or similar:
              1. Use quickSearch with slightly different search terms if needed
              2. The system will automatically exclude previously shown results
              3. Focus on different aspects of their query
            - Always try to provide different results than previously shown
            - If no new results available, inform the user that all relevant documents have been shown
          `,
          {
            cache_control: { type: "ephemeral" }, // set a cache breakpoint (max number of breakpoints is 4)
          }
        ),
        new MessagesPlaceholder("messages"),
      ]);

      // Trim the messages to manage conversation history
      const trimmedMessages = await trimmer.invoke(state.messages);

      // Format the prompt with the current messages
      const prompt = await promptTemplate.invoke({ messages: trimmedMessages });

      // Get response from the model
      const response = await model.invoke(prompt);

      return { messages: [response] };
    })
    .addNode("tools", toolNodes)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");

  return stateGraph;
};

// Initialize model with tools
const initialiseModel = (tools: DynamicTool[], useQualityModel = true) => {
  const model = new ChatOpenAI({
    model: useQualityModel ? QUALITY_MODEL : FAST_MODEL, // Fixed logic
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.1,
    maxTokens: 4000,
    streaming: true,
  }).bindTools(tools);

  return model;
};

// Determine the next step in the workflow
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const latestMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (latestMessage.tool_calls?.length) {
    return "tools";
  }

  // If the last message is a tool message, route back to agent
  if (latestMessage.content && latestMessage._getType() === "tool") {
    return "agent";
  }

  // Otherwise, we stop (reply to the user)
  return END;
}

// Add caching headers to messages
function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  if (!messages.length) return messages;
  const cachedMessages = [...messages];

  // Helper to add cache control
  const addCache = (message: BaseMessage) => {
    const content = message.content;
    if (typeof content === "string") {
      message.content = [
        {
          type: "text",
          text: content,
          cache_control: { type: "ephemeral" },
        },
      ];
    }
  };

  // Cache the last message
  addCache(cachedMessages.at(-1)!);

  // Find and cache the second-to-last human message
  let humanCount = 0;
  for (let i = cachedMessages.length - 1; i >= 0; i--) {
    if (cachedMessages[i] instanceof HumanMessage) {
      humanCount++;
      if (humanCount === 2) {
        addCache(cachedMessages[i]);
        break;
      }
    }
  }

  return cachedMessages;
}
