"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { marked } from "marked";

const ContentPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const [content, setHtmlContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const linkId = params.linkId as string;
  const file = searchParams.get("file");

  useEffect(() => {
    if (!linkId || !file) {
      setError("Invalid link parameters");
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const res = await fetch(
          `/api/markdowns?url=${encodeURIComponent(file)}`
        );

        if (res.status === 200) {
          const mdText = await res.text();
          const htmlContent: string = await marked(mdText); // returns HTML

          setHtmlContent(htmlContent);
        } else {
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [linkId, file]);

  // Early return for invalid parameters
  if (!linkId || !file) {
    notFound();
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4">
              Error Loading Content
            </h1>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* PDF Generation Button */}
      <div className="flex justify-end mb-4">
        {/* <button
          onClick={generatePDF}
          disabled={pdfGenerating}
          className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded"
        >
          {pdfGenerating ? "Generating PDF..." : "Download PDF"}
        </button> */}
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

export default ContentPage;
