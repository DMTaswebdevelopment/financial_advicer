import { ChatAnthropic } from "@langchain/anthropic";
import { DynamicTool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { collection, getDocs } from "firebase/firestore";
import { db, getDownloadURL, ref, storage } from "./firebase";
import { FirebaseError } from "firebase/app";
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

// Trim the messages to manage conversation history
const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msg) => msg.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// const tools = await toolCLient.lcTools;
// const toolNode = new ToolNode(tools);
interface FileData {
  name: string;
  url?: string;
  storagePath?: string;
}

interface FileEntry extends FileData {
  id: string;
  url: string;
}

// Define your tools first
const tools = [
  new DynamicTool({
    name: "getPDFFile",
    description: "Get the pdf documents in database",
    func: async () => {
      const filesCollection = collection(db, "pdfDocuments");
      const filesSnapshot = await getDocs(filesCollection);

      const validFiles: FileEntry[] = [];

      for (const doc of filesSnapshot.docs) {
        const fileData = doc.data() as FileData;
        const fileId = doc.id;

        let url = fileData.url ?? "";
        const storagePath = fileData.storagePath;

        try {
          if (
            !url &&
            typeof storagePath === "string" &&
            storagePath.trim() &&
            storagePath !== "/" &&
            storagePath !== ""
          ) {
            const fileRef = ref(storage, storagePath);

            if (/\.\w{2,5}$/.test(storagePath)) {
              url = await getDownloadURL(fileRef);
            } else {
              console.warn(
                `⚠️ Skipping ${storagePath} — appears to be a folder or root path.`
              );
            }
          }
        } catch (storageError) {
          if (storageError instanceof FirebaseError) {
            if (storageError.code !== "storage/invalid-root-operation") {
              console.warn(
                `⚠️ Skipping ${storagePath} (cannot generate URL):`,
                storageError.message
              );
            }
          } else {
            console.warn(
              `⚠️ Unknown error while fetching ${storagePath}:`,
              String(storageError)
            );
          }
        }

        if (url) {
          const fileEntry: FileEntry = {
            ...fileData,
            id: fileId,
            url,
          };
          validFiles.push(fileEntry);
        }
      }

      // Format the tool output with ML documents without showing them to the user
      return JSON.stringify({
        statusCode: 200,
        files: validFiles.map((file) => ({
          id: file.id,
          title: file.name,
          url: file.url,
        })),
        total: validFiles.length,
      });
    },
  }),
  // Add more tools as needed
];

const toolNodes = new ToolNode(tools);
const initialiseModel = () => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.9, // Higher temperature for more creative responses
    maxTokens: 3000, // Higher max tokens for longer responses
    streaming: true, // Enable streaming for SSE
    // clientOptions: {
    //   defaultHeaders: {
    //     "anthropic-beta": "prompt-caching-2025-05-09",
    //   },
    // },
    callbacks: [
      {
        handleLLMStart: async () => {
          // console.log("starting LLM call");
        },
        handleLLMEnd: async (output) => {
          // console.log("end LLM call", output);

          const usage = output.llmOutput?.usage;

          // console.log("Generation: ", JSON.stringify(output.generations[0][0]));

          output.generations.map((generation) => {
            generation.map((g) => {
              // console.log("Generation", JSON.stringify(g));
              // // Process the generation to extract ML documents
              // if (g.text) {
              //   const { plainText, mlDocuments } = parseMLDocuments(g.text);
              //   console.log("Plain Text:", plainText);
              //   console.log(
              //     "ML Documents:",
              //     JSON.stringify(mlDocuments, null, 2)
              //   );
              //   // You can store these separately or use them as needed
              //   // For example, you could add them to your application state
              // }
            });
          });
          if (usage) {
            // console.log("Token Usage": {
            // input_tokens: usage.input_tokens,
            // output_tokens: usage.output_tokens,
            // total_tokens: usage.input_tokens + usage.output_tokens,
            // cache_creation_input_tokens:
            // usage.cache_creation_input_tokens || 0,
            // cache_read_input_tokens: usage.cache_read_input_tokens || 0,
            //})
          }
        },
        // handleLLMToken: async (token: string) => {
        // console.log("New Token", token)
        //}
      },
    ],
  }).bindTools(tools);

  return model;
};

// Define the function that determines whether to continue or not
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

// Define a response processing node with proper typing
const responseProcessor = {
  invoke: async (state: typeof MessagesAnnotation.State) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    // Process the response to ensure ML/Missing Lessons isn't mentioned
    // This is a fallback in case the system message doesn't handle it
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

// create work flow
const createWorkflow = () => {
  const model = initialiseModel();

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

function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  // Rules of caching headers for turn-by-turn conversations
  // 1. Cache the first SYSTEM message
  // 2. Cache the LAST Message
  // 3. Cache the second to last HUMAN message

  if (!messages.length) return messages;
  // Create a copy of messages to avoid mutating the original
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
  // console.log("Caching last message")
  addCache(cachedMessages.at(-1)!);

  // Find and cache the second-to-last human message
  let humanCount = 0;
  for (let i = cachedMessages.length - 1; i >= 0; i--) {
    if (cachedMessages[i] instanceof HumanMessage) {
      humanCount++;
      if (humanCount === 2) {
        // console.log("caching second-to-last human message");
        addCache(cachedMessages[i]);
        break;
      }
    }
  }

  return cachedMessages;
}

export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  // Add caching headers to messages
  const cachedMessages = addCachingHeaders(messages);

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
