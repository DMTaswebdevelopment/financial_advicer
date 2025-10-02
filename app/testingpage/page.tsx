"use client";

import React, { useState, useEffect } from "react";
import { marked } from "marked";

const Page = () => {
  const [content, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  interface ErrorModel {
    message: string;
  }

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        // Fetch the markdown file from public directory
        const response = await fetch(
          "/mdfile/1025FF-Tax-Deductions-for-Nurses-in-Australia.md"
        ); // Adjust filename as needed

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
          const markdownText = await response.text();

          // Convert markdown to HTML using marked (returns string)
          const html = await marked(markdownText);

          setHtmlContent(html);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
          console.error("Error fetching or parsing markdown:", err.message);
        } else {
          // fallback for non-Error throw (string, number, etc.)
          setError("An unexpected error occurred");
          console.error("Unexpected error fetching markdown:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMarkdown();
  }, []);

  const generatePDF = async () => {
    setPdfGenerating(true);
    try {
      const response = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          title: "testing",
          documentNumber: "466",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the PDF as a blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "super-contributions-doc.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert(`Error generating PDF: ${err}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading markdown content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Error loading markdown: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* PDF Generation Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={generatePDF}
          disabled={pdfGenerating}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          {pdfGenerating ? "Generating PDF..." : "Download PDF"}
        </button>
      </div>

      {/* On-screen MD preview */}
      <div
        id="markdown-contents"
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default Page;
