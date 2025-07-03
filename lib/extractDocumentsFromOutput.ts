import { Document } from "@/component/model/interface/Document";

// Updated return type interface
interface ExtractDocumentsResult {
  updatedDocs: Document[] | null;
  error?: string;
}

// Define proper interfaces for the MLDocuments message structure
interface MLDocumentsKwargs {
  content: string;
  // Add other properties if they exist
}

interface MLDocumentsMessage {
  kwargs?: MLDocumentsKwargs;
  output?: MLDocumentsKwargs;
}

// Function to extract allDocuments from tool output
export const extractDocumentsFromOutput = (
  output: MLDocumentsMessage
): ExtractDocumentsResult => {
  try {
    let parsedContent;

    // First, try to get the content from different possible paths
    const content = output?.kwargs?.content || output;

    // If content is a string, try to parse it as JSON
    if (typeof content === "string") {
      try {
        parsedContent = JSON.parse(content);
      } catch (parseError) {
        console.error("Failed to parse content as JSON:", parseError);
        return {
          updatedDocs: null,
          error: "Failed to parse content as JSON",
        };
      }
    } else if (typeof content === "object" && content !== null) {
      parsedContent = content;
    } else {
      return {
        updatedDocs: null,
        error: "No valid content found",
      };
    }

    // Extract allDocuments from the parsed content
    const allDocuments = parsedContent?.allDocuments;
    if (allDocuments && Array.isArray(allDocuments)) {
      const updatedDocs: Document[] = allDocuments.map((doc) => {
        let categoryCode = "ML";
        switch (doc.category) {
          case "Missing Lessons Series":
            categoryCode = "ML";
            break;
          case "Checklist Series":
            categoryCode = "CL";
            break;
          case "Detailed Knowledge Series":
            categoryCode = "DK";
            break;
        }

        const id = String(doc.id); // Convert to string if number
        const cleanTitle = id.replace(/^\d+(ML|CL|DK)[-\s]?/, "");

        return {
          id,
          key: doc.key,
          title: cleanTitle,
          description: doc.description,
          documentNumber: doc.documentNumber ?? "",
          category: categoryCode,
        };
      });

      return { updatedDocs };
    }

    return {
      updatedDocs: null,
      error: "No documents found in allDocuments array",
    };
  } catch (error) {
    console.error("Error extracting documents:", error);
    return {
      updatedDocs: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
