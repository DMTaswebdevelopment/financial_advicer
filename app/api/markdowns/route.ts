// app/api/markdown/[...slug]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get the full URL from the request
    const requestUrl = request.url;

    // Extract the 'url' query parameter
    const url = new URL(requestUrl);
    const fileUrl = url.searchParams.get("url");

    if (!fileUrl) {
      return NextResponse.json(
        {
          error:
            "URL parameter is required. Usage: /api/markdown?url=<file-url>",
        },
        { status: 400 }
      );
    }

    // Fetch the markdown file from the provided URL
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch file: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const markdownContent = await response.text();

    // Return the markdown content as plain text
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // Optional: cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error fetching markdown file:", error);
    return NextResponse.json(
      { error: "Failed to fetch markdown file" },
      { status: 500 }
    );
  }
}
