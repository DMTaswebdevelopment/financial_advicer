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

export type PDFListType = {
  id: string;
  name: string;
  title: string;
  category: string;
  url?: string;
  keyQuestions?: string[];
  keywords?: string[];
}[];

// Trim the messages to manage conversation history
const trimmer = trimMessages({
  maxTokens: 1500,
  strategy: "last",
  tokenCounter: (msg) => msg.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// OPTIMIZATION 1: Use faster model for better speed
const FAST_MODEL = "claude-3-5-haiku-20241022"; // Much faster than Claude 3.7 Sonnet
const QUALITY_MODEL = "claude-3-7-sonnet-20250219";

// Define your tools to use pdfLists only
const createTools = (pdfLists: PDFListType): DynamicTool[] => [
  new DynamicTool({
    name: "getPDFFile",
    description: "Get the pdf documents from provided pdfLists",
    func: async () => {
      // Only use pdfLists from request, no Firebase fallback
      const listToUse = Array.isArray(pdfLists) ? pdfLists : [];

      return JSON.stringify({
        statusCode: 200,
        files: listToUse.map((file) => ({
          id: file.id || `pdf-${Math.random().toString(36).substr(2, 9)}`,
          title: file.name || file.title,
          url: file.url,
          category: file.category,
        })),
        total: listToUse.length,
      });
    },
  }),
  // Add more tools as needed
];

// Modified submitQuestion function with required pdfLists
export async function submitQuestion(
  messages: BaseMessage[],
  chatId: string,
  pdfLists: PDFListType = []
) {
  // Add caching headers to messages
  const cachedMessages = addCachingHeaders(messages);

  // Create workflow with the pdfLists
  const workflow = createWorkflow(pdfLists);

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
const createWorkflow = (pdfLists: PDFListType = []) => {
  // Create tools with pdfLists
  const tools = createTools(pdfLists);
  const toolNodes = new ToolNode(tools);

  const model = initialiseModel(tools);

  const stateGraph = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      // create the system message content
      const systemContent = SYSTEM_MESSAGE;

      // Create the prompt template with system message and messages placeholder
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          cache_control: { type: "ephemeral" }, // set a cache breakpoint (max number of breakpoints is 4)
        }),
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
    .addNode("processor", responseProcessor)
    .addNode("tools", toolNodes)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent")
    .addEdge("processor", END); // Process the final response before sending to user

  return stateGraph;
};

// Initialize model with tools
const initialiseModel = (tools: DynamicTool[], useQualityModel = true) => {
  const model = new ChatAnthropic({
    modelName: useQualityModel ? QUALITY_MODEL : FAST_MODEL,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.3,
    maxTokens: 1000,
    streaming: true,
    callbacks: [
      {
        handleLLMStart: async () => {
          // console.log("starting LLM call");
        },
        handleLLMEnd: async (output) => {
          const usage = output.llmOutput?.usage;

          console.log("usage", usage);
          output.generations.map((generation) => {
            generation.map((g) => {
              console.log("Generation", JSON.stringify(g));
            });
          });
        },
      },
    ],
  }).bindTools(tools);

  return model;
};

// Response processor to clean up AI messages
const responseProcessor = {
  invoke: async (state: typeof MessagesAnnotation.State) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    // Process the response to ensure ML/Missing Lessons isn't mentioned
    if (lastMessage._getType() === "ai") {
      let content = lastMessage.content;
      if (typeof content === "string") {
        // Remove any mentions of ML or Missing Lessons Series
        content = content.replace(
          /\bML\b|Missing Lessons Series|Missing Lessons/gi,
          ""
        );

        // Remove any URLs
        content = content.replace(/https?:\/\/[^\s]+/g, "");

        // Remove any JSON formatting
        content = content.replace(
          /\{(?:[^{}]|(\{(?:[^{}]|{[^{}]*})*\}))*\}/g,
          ""
        );

        return {
          messages: [new AIMessage(content)],
        };
      }
    }

    return { messages: [lastMessage] };
  },
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
