// utils/fetchDocumentURL.ts
export const fetchDocumentURL = async (pdfId: string) => {
  try {
    const res = await fetch(`/api/documents/${encodeURIComponent(pdfId)}`);
    const response = await res.json();

    if (response.statusCode === 200) {
      return { url: response.documentURL, error: null };
    } else {
      return { url: null, error: response };
    }
  } catch (err) {
    console.error("API error:", err);
    return { url: null, error: err };
  }
};
