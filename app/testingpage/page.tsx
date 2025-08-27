"use client";

import React, { useState, useEffect } from "react";
import { marked } from "marked";

const Page = () => {
  const [htmlContent, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        // Fetch the markdown file from public directory
        const response = await fetch("/mdfile/super-contributions-doc.md"); // Adjust filename as needed

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const markdownText = await response.text();

        // Convert markdown to HTML using marked
        const html: any = marked(markdownText);

        setHtmlContent(html);
      } catch (err: any) {
        setError(err.message);
        console.error("Error fetching or parsing markdown:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, []);

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
    <div className="container mx-auto p-4">
      <div
        id="markdown-contents"
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};

export default Page;
