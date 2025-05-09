import { NextRequest } from "next/server";
import { Anthropic } from "@anthropic-ai/sdk";
import { ref, storage, getDownloadURL } from "@/lib/firebase";

interface FileContent {
  name: string;
  url: string;
  title: string;
  filePath: string;
  category: string;
  id: string;
  fullText: string;
}

// POST method to handle user question analysis with streaming response
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await req.json();
    const { messages, pdf } = body;
    const latestMessage = messages[messages.length - 1]?.content || "";

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    console.log("pdf", pdf);
    // Get the URLs of all PDF files
    const fileContents: {
      name: string;
      url: string;
      path: string;
      category: string;
      id: string;
      fullText: string;
    }[] = pdf;
    const contentList = fileContents
      .map(
        (file) =>
          `- ${file.name} (${file.path}) (Category: ${file.category}) (ID: ${file.id})`
      )
      .join("\n\n");

    const analysisPrompt = `
You are FinAdvisor AI, a helpful financial assistant.

Your job is to understand the user's needs based on their latest message, and then:
1. If their message is a greeting, general question, or not related to document retrieval, respond with: {"intent": "general", "message": "your conversational response", "files": {"ML": [], "DK": []}}
2. If their intent is unclear but seems document-related, respond with: {"intent": "unclear", "message": "your follow-up question", "files": {"ML": [], "DK": []}}
3. If their intent is clear and document-related, respond with: {"intent": "clear", "message": "your document recommendation", "files": {"ML": [relevant Missing Lessons files array], "FF": [relevant Financial Fluency files array]}}

IMPORTANT: When the user has a clear document-related intent, you MUST include relevant document recommendations in your response. For each category:
- ML (Missing Lessons): Include up to 5 most relevant documents
- FF (Financial Fluency): Include up to 5 most relevant documents
- If fewer than 5 documents seem directly relevant in either category, include the most related ones you can find to reach the requested number.
- Always remember the previous question of user's

For each file in the files array, include these exact properties: "title", "filePath", "id", "category", "url" - make sure these match the properties of the available documents. For the "url" property, you should use the download URL from Firebase storage associated with the file path.

6. For each relevant file, write:

- Series: [Series Name: either "Missing Lessons" or "Detailed Knowledge"]
- Title: [PDF title]
- URL: [Direct PDF link]

Use this format for each relevant file, and list multiple files if needed.


For "clear" intent with document recommendations:
- Make your message concise and explain why these documents are relevant
- Use a thoughtful ranking to list the most relevant files first
- Always aim to provide a diverse set of documents that cover different aspects of the user's query
- Try to include documents from both categories when relevant to the query
- IMPORTANT: Do NOT list the file names in your message field - they will be displayed separately only in files.

<user_message>{${latestMessage}}</user_message>

<documents>
${contentList}
</documents>

Please prioritize these documents in your recommendations if relevant, and find additional semantically related documents to reach the requested number in each category.
- Ensure that your response is clear, concise, and easily readable for the user. Use proper formatting, such as line breaks and bullet points, to enhance readability when appropriate.
Respond as FinAdvisor.
    `;

    // Create a new stream
    const stream = new ReadableStream({
      async start(controller) {
        // Initial loading state
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "loading",
              message: "Thinking...",
            }) + "\n"
          )
        );

        try {
          // Call Claude API with the analysis prompt
          const stream = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 3000,
            messages: [
              {
                role: "user",
                content: analysisPrompt,
              },
            ],
            stream: true,
          });

          let accumulatedText = "";

          // Process the stream
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              "text" in chunk.delta &&
              typeof chunk.delta.text === "string"
            ) {
              accumulatedText += chunk.delta.text;

              // Send intermediate chunks for streaming effect
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "partial",
                    message: chunk.delta.text,
                  }) + "\n"
                )
              );
            }
          }
          // Process the complete response
          const cleanedText = accumulatedText
            .replace(/```(?:json)?\n?/g, "")
            .trim();

          console.log("cleanedText", cleanedText);
          try {
            const parsed = JSON.parse(cleanedText);

            if (parsed.intent === "general") {
              // Handle general conversation
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "complete",
                    message: parsed.message,
                    isRelated: false,
                  }) + "\n"
                )
              );
            } else if (parsed.intent === "unclear") {
              // Handle unclear intent
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "complete",
                    message: parsed.message,
                    isRelated: false,
                  }) + "\n"
                )
              );
            } else if (
              parsed.intent === "clear" &&
              parsed.files &&
              ((Array.isArray(parsed.files.ML) && parsed.files.ML.length > 0) ||
                (Array.isArray(parsed.files.FF) && parsed.files.FF.length > 0))
            ) {
              console.log("parsed", parsed.message);
              // Handle clear intent with relevant documents

              // Process Missing Lessons files with Firebase URL retrieval
              const mlFiles = Array.isArray(parsed.files.ML)
                ? await Promise.all(
                    parsed.files.ML.slice(0, 5).map(
                      async (file: FileContent, idx: number) => {
                        const matched = fileContents.find(
                          (original) =>
                            original.path === file.filePath ||
                            original.name === file.title ||
                            original.id === file.id
                        );

                        // If we have the matched file but no URL, fetch it from Firebase
                        let fileUrl = matched?.url || "";
                        if (!fileUrl && matched?.path) {
                          try {
                            // Get the file reference from storage using the path
                            const fileRef = ref(storage, matched.path);
                            // Get the download URL
                            fileUrl = await getDownloadURL(fileRef);
                          } catch (error) {
                            console.error(
                              `Error fetching URL for ${matched.path}:`,
                              error
                            );
                          }
                        }

                        return {
                          id: matched?.id || file.id || `ml-${idx + 1}`,
                          title: matched?.name || file.title || "Untitled",
                          url: fileUrl,
                          filePath: matched?.path || file.filePath || "",
                          category: "Missing Lessons",
                        };
                      }
                    )
                  )
                : [];

              // Process Financial Fluency files with Firebase URL retrieval
              const ffFiles = Array.isArray(parsed.files.FF)
                ? await Promise.all(
                    parsed.files.FF.slice(0, 5).map(
                      async (file: FileContent, idx: number) => {
                        const matched = fileContents.find(
                          (original) =>
                            original.path === file.filePath ||
                            original.name === file.title ||
                            original.id === file.id
                        );

                        // If we have the matched file but no URL, fetch it from Firebase
                        let fileUrl = matched?.url || "";
                        if (!fileUrl && matched?.path) {
                          try {
                            // Get the file reference from storage using the path
                            const fileRef = ref(storage, matched.path);
                            // Get the download URL
                            fileUrl = await getDownloadURL(fileRef);
                          } catch (error) {
                            console.error(
                              `Error fetching URL for ${matched.path}:`,
                              error
                            );
                          }
                        }

                        return {
                          id: matched?.id || file.id || `ff-${idx + 1}`,
                          title: matched?.name || file.title || "Untitled",
                          url: fileUrl,
                          filePath: matched?.path || file.filePath || "",
                          category: "Financial Fluency",
                        };
                      }
                    )
                  )
                : [];

              // Combine both categories
              const allRelevantFiles = {
                ML: mlFiles,
                FF: ffFiles,
              };

              const baseMessage =
                parsed.message ||
                "Here are the relevant documents related to your query.";
              const enhancedMessage = `${baseMessage} Is there anything else I can help you with?`;

              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "complete",
                    message: enhancedMessage,
                    aiResponse: allRelevantFiles,
                    isRelated: true,
                  }) + "\n"
                )
              );
            } else {
              // No relevant documents found
              controller.enqueue(
                encoder.encode(
                  JSON.stringify({
                    type: "complete",
                    message:
                      parsed.message ||
                      "I couldn't find any relevant documents for your query. Could you please rephrase or provide more details?",
                    isRelated: false,
                  }) + "\n"
                )
              );
            }
          } catch (error) {
            // Error parsing the JSON response
            console.error("Error parsing JSON:", error);
            controller.enqueue(
              encoder.encode(
                JSON.stringify({
                  type: "error",
                  message:
                    "I'm having trouble understanding your request. Could you please try again?",
                  isRelated: false,
                }) + "\n"
              )
            );
          }
        } catch (error) {
          // API error
          console.error("API error:", error);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: "error",
                message: "Sorry, I encountered an error. Please try again.",
                isRelated: false,
              }) + "\n"
            )
          );
        }

        controller.close();
      },
    });

    return new Response(stream);
  } catch (error) {
    console.error("Request error:", error);
    return new Response(
      encoder.encode(
        JSON.stringify({
          type: "error",
          message: "Failed to generate content",
        })
      ),
      { status: 500 }
    );
  }
}
