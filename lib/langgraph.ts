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

// Define allowed categories as const assertion for better type inference
const ALLOWED_CATEGORIES = [
  "Missing Lessons Series",
  "Checklist Series",
  "Detailed Knowledge Series",
] as const;

// Create a type from the allowed categories
type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];

async function querySimilarDocuments(
  queryText: string,
  topK = 10
): Promise<FormattedResult[]> {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    const queryEmbedding = await embeddings.embedQuery(queryText);

    const queryResponse = await index.query({
      topK: Math.max(topK * 3, 40), // Get more results to ensure we have enough for grouping
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
    };

    // Helper function to extract number prefix from ID
    function extractNumberPrefix(id: string): string | null {
      if (!id) return null;
      // Extract number at the beginning of the ID (before ML, CL, or DK)
      const match = id.match(/^(\d+)/);
      return match ? match[1] : null;
    }

    // Helper function to check if ID starts with number and category
    function matchesNumberAndCategory(
      id: string,
      number: string,
      category: string
    ): boolean {
      if (!id || !number) return false;
      const categoryCode =
        category === "Missing Lessons Series"
          ? "ML"
          : category === "Checklist Series"
          ? "CL"
          : "DK";
      return id.startsWith(`${number}${categoryCode}`);
    }

    // Helper function to truncate description to 1-2 sentences
    // function truncateDescription(
    //   description: string,
    //   maxSentences: number
    // ): string {
    //   if (!description) return "";

    //   // Split by sentence endings (., !, ?)
    //   const sentences = description
    //     .split(/[.!?]+/)
    //     .filter((s) => s.trim().length > 0);

    //   // Take first 1-2 sentences and add period if needed
    //   const truncated = sentences.slice(0, maxSentences).join(". ").trim();

    //   // Add period if it doesn't end with punctuation
    //   return truncated.endsWith(".") ||
    //     truncated.endsWith("!") ||
    //     truncated.endsWith("?")
    //     ? truncated
    //     : truncated + ".";
    // }

    // Group matches by category
    queryResponse.matches.forEach((match) => {
      const category = match.metadata?.category as AllowedCategory;

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

    const finalResults: PineconeMatch[] = [];
    const usedNumberPrefixes = new Set<string>();

    // Step 1: Get maximum of 5 unique Missing Lessons based on number prefix
    const uniqueMissingLessons: PineconeMatch[] = [];

    for (const match of categorizedResults["Missing Lessons Series"]) {
      // const id = match.metadata?.id;
      const id = match.metadata?.documentNumber;
      const numberPrefix = id || "";

      // Only add if we haven't seen this number prefix before and we haven't reached max 5
      if (
        numberPrefix &&
        !usedNumberPrefixes.has(numberPrefix) &&
        uniqueMissingLessons.length < 5
      ) {
        uniqueMissingLessons.push(match);
        usedNumberPrefixes.add(numberPrefix);
      }
    }

    // Add the Missing Lessons to final results
    finalResults.push(...uniqueMissingLessons);

    // Step 2: For each Missing Lesson number prefix, find corresponding CL and DK
    const numberPrefixesToFind = Array.from(usedNumberPrefixes);

    for (const numberPrefix of numberPrefixesToFind) {
      // Find corresponding Checklist with same number prefix (e.g., "635CL...")
      const checklistMatch = categorizedResults["Checklist Series"].find(
        (match) => {
          const matchId = match.metadata?.id;
          const isMatch = matchesNumberAndCategory(
            matchId || "",
            numberPrefix,
            "Checklist Series"
          );

          return isMatch;
        }
      );

      if (checklistMatch) {
        finalResults.push(checklistMatch);
      } else {
        console.log(`No Checklist match found for prefix ${numberPrefix}`);
      }

      // Find corresponding Detailed Knowledge with same number prefix (e.g., "635DK...")
      const detailedMatch = categorizedResults[
        "Detailed Knowledge Series"
      ].find((match) => {
        const matchId = match.metadata?.id;
        const isMatch = matchesNumberAndCategory(
          matchId || "",
          numberPrefix,
          "Detailed Knowledge Series"
        );

        return isMatch;
      });

      if (detailedMatch) {
        finalResults.push(detailedMatch);
      } else {
        console.log(
          `No Detailed Knowledge match found for prefix ${numberPrefix}`
        );
      }

      // Stop if we've reached the desired topK
      if (finalResults.length >= topK) break;
    }

    // Step 3: If we still need more results, add remaining high-scoring matches
    // that don't have number prefixes we've already used
    if (finalResults.length < topK) {
      const remainingMatches = [
        // Get remaining Missing Lessons (after the first 5 unique ones)
        ...categorizedResults["Missing Lessons Series"].filter((match) => {
          const id = match.metadata?.id;
          const numberPrefix = extractNumberPrefix(id || "");
          return numberPrefix && !usedNumberPrefixes.has(numberPrefix);
        }),
        // Get remaining Checklist items that don't match our used prefixes
        ...categorizedResults["Checklist Series"].filter((match) => {
          const id = match.metadata?.id;
          const numberPrefix = extractNumberPrefix(id || "");
          return !numberPrefix || !usedNumberPrefixes.has(numberPrefix);
        }),
        // Get remaining Detailed Knowledge items that don't match our used prefixes
        ...categorizedResults["Detailed Knowledge Series"].filter((match) => {
          const id = match.metadata?.id;
          const numberPrefix = extractNumberPrefix(id || "");
          return !numberPrefix || !usedNumberPrefixes.has(numberPrefix);
        }),
      ]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, topK - finalResults.length);

      finalResults.push(...remainingMatches);
    }

    // Map to your desired format
    return finalResults.slice(0, topK).map((match) => {
      const id = match.metadata?.id || "";
      const key = match.metadata?.key;
      const description = match.metadata?.description;
      const documentNumber = match.metadata?.documentNumber;

      return {
        key: key,
        id: id,
        documentNumber: documentNumber,
        // description: truncateDescription(description || "", 1),
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

// Use faster models strategically
const FAST_MODEL = "gpt-4o-mini"; // Fastest for simple queries
// use this for claude faster = claude-haiku-3-5-20241022
// const BALANCED_MODEL = "claude-sonnet-4-20250514"; // Good balance uncomment this if we will use this
const QUALITY_MODEL = "gpt-4o"; // Best quality
// use this for claude quality = claude-opus-4-20250514

// Define your tools to use pdfLists only
const createTools = () => [
  new DynamicTool({
    name: "quickSearch",
    description:
      "Search for the most relevant documents based on user query. Use only when specific document lookup is needed.",
    func: async (input: string) => {
      const matches = await querySimilarDocuments(input, 15);

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
            "\n\n=== SEARCH RESULT DISPLAY RULES ===\n" +
            "Use quickSearch sparingly and only when document lookup is specifically needed.",
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
