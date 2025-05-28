import { ChatAnthropic } from "@langchain/anthropic";
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
import generateEmbedding from "./hugging-face";
import { PineconeMatch } from "@/component/model/interface/PineconeMatch";
import { FormattedResult } from "@/component/model/interface/FormattedResult";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

// Define allowed categories as const assertion for better type inference
const ALLOWED_CATEGORIES = [
  "Missing Lessons Series",
  "Checklist & Practical Guide Series",
  "Detailed Knowledge Series",
] as const;

// Create a type from the allowed categories
type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number];

async function querySimilarDocuments(
  queryText: string,
  topK = 10
): Promise<FormattedResult[]> {
  try {
    // Use Promise.all for parallel operations where possible
    const queryEmbedding = await generateEmbedding(queryText);

    const queryResponse = await index.query({
      topK: Math.max(topK, 10), // Increase for debugging
      vector: queryEmbedding,
      includeMetadata: true,
      includeValues: false, // We don't need the vector numbers back
      filter: {
        category: {
          $in: ALLOWED_CATEGORIES,
        },
      },
    });

    // Separate results by category
    const categorizedResults: Record<AllowedCategory, PineconeMatch[]> = {
      "Missing Lessons Series": [],
      "Checklist & Practical Guide Series": [],
      "Detailed Knowledge Series": [],
    };

    // Group matches by category with type safety
    queryResponse.matches.forEach((match) => {
      const category = match.metadata?.category as AllowedCategory;
      if (category && category in categorizedResults) {
        categorizedResults[category].push(match);
      }
    });

    // Limit Missing Lessons Series to 5, keep others as is
    const limitedResults = [
      ...categorizedResults["Missing Lessons Series"].slice(0, 5),
      ...categorizedResults["Checklist & Practical Guide Series"].slice(0, 2),
      ...categorizedResults["Detailed Knowledge Series"],
    ];

    // Sort by relevance score (highest first) and limit to topK
    const sortedResults = limitedResults
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, topK);

    // Map to your desired format
    return sortedResults.map((match) => {
      const title = match.metadata?.title || "Untitled Document";
      const id = match.id || "unknown-id";
      // const url = match.metadata?.url;

      return {
        title: title,
        // url: url,
        id: id,
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
const FAST_MODEL = "claude-haiku-3-5-20241022"; // Fastest for simple queries
// const BALANCED_MODEL = "claude-sonnet-4-20250514"; // Good balance uncomment this if we will use this
const QUALITY_MODEL = "claude-opus-4-20250514"; // Best quality

// Define your tools to use pdfLists only
const createTools = () => [
  new DynamicTool({
    name: "quickSearch",
    description: "Quickly search for relevant documents",
    func: async (input: string) => {
      const matches = await querySimilarDocuments(input, 10);

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
          title: doc.title,
          id: doc.id, // Use this instead of URL
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
            "\n\nUse quickSearch sparingly and only when document lookup is specifically needed.",
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
  const model = new ChatAnthropic({
    modelName: useQualityModel ? QUALITY_MODEL : FAST_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.1,
    maxTokens: 1000,
    streaming: true,
    callbacks: [
      {
        // handleLLMStart: async () => {
        //   // console.log("starting LLM call");
        // },
        // handleLLMEnd: async (output) => {
        //   const usage = output.llmOutput?.usage;
        //   console.log("usage", usage);
        //   output.generations.map((generation) => {
        //     generation.map((g) => {
        //       console.log("Generation", JSON.stringify(g));
        //     });
        //   });
        // },
      },
    ],
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
