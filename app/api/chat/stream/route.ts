import { Document } from "@/component/model/interface/Document";
import { ChatRequestBody } from "@/component/model/types/ChatRequestBody";
import {
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
} from "@/component/model/types/SSEConstantsType";
import {
  StreamMessage,
  StreamMessageType,
} from "@/component/model/types/StreamMessage";
import { submitQuestion } from "@/lib/langgraph";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";

function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const { messages, newMessage, chatId } = body;

    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-buffering": "no", // disable buffering for nginx which is required for SSE to work properly
      },
    });

    const startStream = async () => {
      try {
        // stream will be implemented here
        // send initial connection established message
        await sendSSEMessage(writer, { type: StreamMessageType.Connected });

        // Convert messages to LangChain format
        const langchainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
        ];

        try {
          // Create the event stream
          const eventStream = await submitQuestion(langchainMessages, chatId);

          // Process the events
          for await (const event of eventStream) {
            if (event.event === "on_chat_model_stream") {
              // Claude sometimes wraps in an AIMessageChunk with array of content blocks
              const token = event.data.chunk;

              if (token) {
                // Access the text property from the AIMessageChunk
                const text = token.content;

                /**
                 * use this if we will use claudeai
                 * text?.text
                 */

                if (text) {
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.Token,
                    token: text,
                  });
                }
              }
            } else if (event.event === "on_tool_start") {
              // Extract file information from the tool input if available

              await sendSSEMessage(writer, {
                type: StreamMessageType.ToolStart,
                tool: event?.name || "unknown",
                input: event.data?.input,
              });
            } else if (event.event === "on_tool_end") {
              const toolOutput = event.data?.output;

              try {
                const parsedOutput =
                  typeof toolOutput === "string"
                    ? JSON.parse(toolOutput)
                    : toolOutput;

                // Extract matches/documents from the search results
                if (parsedOutput?.allDocuments) {
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.MLDocuments, // New message type
                    matches: parsedOutput.allDocuments.map((doc: Document) => ({
                      id: doc.id,
                      key: doc.key,
                      description: doc.description,
                      documentNumber: doc.documentNumber,
                      url: doc.url,
                      category: doc.category,
                    })),
                  });
                } else {
                  // Send the tool end event
                  await sendSSEMessage(writer, {
                    type: StreamMessageType.ToolEnd,
                    tool: event.name || "unknown",
                    input: event.data?.input,
                    output: toolOutput,
                  });
                }
              } catch (parseError) {
                // If not JSON, just send the raw output
                console.log("parseError", parseError);
                await sendSSEMessage(writer, {
                  type: StreamMessageType.ToolEnd,
                  tool: event.name || "unknown",
                  input: event.data?.input,
                  output: toolOutput,
                });
              }
            }
          }

          // Send completion message after processing all events
          await sendSSEMessage(writer, { type: StreamMessageType.Done });
        } catch (streamError) {
          console.log("Error in event stream", streamError);
          await sendSSEMessage(writer, {
            type: StreamMessageType.Error,
            error:
              streamError instanceof Error
                ? streamError.message
                : "Stream processing failed",
          });
        }
      } catch (error) {
        console.error("Error in stream", error);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: error instanceof Error ? error.message : "Unknown error", // Fixed: was using StreamMessageType.Error instead of error.message
        });
      } finally {
        try {
          await writer.close();
        } catch (closeError) {
          console.error("Error closing writer: ", closeError);
        }
      }
    };

    startStream();

    return response;
  } catch (error) {
    console.error("Error in chat API: ", error);
    return NextResponse.json(
      { error: "Failed to process chat request" } as const,
      { status: 500 }
    );
  }
}
