// app/api/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

// Puppeteer needs Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// --- helper to inline remote image as data URL ---
async function toDataUrl(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch logo (${res.status})`);
  const ct = res.headers.get("content-type") || "image/svg+xml";
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${ct};base64,${buf.toString("base64")}`;
}

export async function POST(req: NextRequest) {
  let browser = null;
  let page = null;

  try {
    const { content, title, documentNumber } = await req.json();

    console.log("content", content);
    const logoUrl =
      "https://res.cloudinary.com/dmz8tsndt/image/upload/v1755063722/BAKR_New_Logo-01_fldmxk.svg";

    if (!content) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Inline the logo to make it render in the PDF footer
    let logoDataUrl = "";
    try {
      logoDataUrl = await toDataUrl(logoUrl);
    } catch (e) {
      console.warn("Logo fetch failed, continuing without logo:", e);
    }

    const scrubbedContent = content.replace(
      /<p>\s*<strong>\s*Useful\s*for:\s*<\/strong>[\s\S]*?<\/p>/i,
      ""
    );

    // Minimal browser configuration
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    page = await browser.newPage();

    // Full HTML (no external deps)
    const completeHTML = `
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <title>Document</title>
        <style>

        body, h1, h2, h3, h4, h5, h6, p, ul, ol, li, table, th, td, code, pre, blockquote, div, span {
        font-family: sans-serif;
        width: 100%;
        }

          h1 {
            font-size: 2rem;
            font-weight: 800;
            margin-bottom: 1rem;
            color: #008080;
            line-height: var(--tw-leading, var(--text-4xl--line-height) /* calc(2.5 / 2.25) ≈ 1.1111 */);
          }

          h2 {
            line-height: var(--tw-leading, var(--text-2xl--line-height) /* calc(2 / 1.5) ≈ 1.3333 */);
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 0.75rem;
            margin-top: 1.25rem;
            color: #008080;
          }

        h3 {
         font-size: 1rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          margin-top: 1.25rem;
          color: #008080;
        }

        p {
          margin-bottom: 0.5rem;
          margin-top: 0.5rem;
          font-weight: 400;
          font-size: 16px;
          line-height: var(--tw-leading, var(--text-base--line-height) /* calc(1.5 / 1) ≈ 1.5 */);
        }

        ul, ol {
          margin-bottom: 0.75rem;
          margin-top: 0.75rem;
          padding-left: 1.5rem;
          list-style-type: disc;
        }

        li {
           margin-bottom: 0.25rem;
          margin-top: 0.25rem;
        }

        code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
        }

        pre {
          background-color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }

        blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin-left: 0;
          font-style: italic;
          margin-bottom: 1rem;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
        }

        th, td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }

        th {
          background-color: #f9fafb;
          font-weight: 600;
        }

        /* Page margins + footer slot */
        @page {
          margin: 16mm 7mm 45mm 7mm;
          @bottom-center {
            content: element(footer);
          }
        }

        /* Make sure print keeps colors */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
          }
          .footer {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }

        /* Prevent splitting of heading + its first ~10 lines across pages */
        .keep-with-next {
          break-inside: avoid;
          page-break-inside: avoid;
          -webkit-column-break-inside: avoid;
          -webkit-region-break-inside: avoid;
        }
       </style>
  </head>
    <body>
      ${scrubbedContent}
    </body>
  </html>
`;

    // Load the content (wait for layout to be stable)
    await page.setContent(completeHTML, { waitUntil: "networkidle0" });

    // Group each heading with ~10 lines after it so the set won't split
    await page.evaluate(() => {
      const MIN_LINES = 10;

      // Approximate a "line" height from body styles
      const bodyStyle = window.getComputedStyle(document.body);
      const baseFontSize = parseFloat(bodyStyle.fontSize) || 16;
      let lineHeightPx = parseFloat(bodyStyle.lineHeight);

      if (!lineHeightPx || Number.isNaN(lineHeightPx) || lineHeightPx < 2) {
        lineHeightPx = 1.6 * baseFontSize; // fallback if 'normal'
      }
      const minHeight = MIN_LINES * lineHeightPx;

      const headings = Array.from(document.querySelectorAll("h1, h2, h3"));

      headings.forEach((h) => {
        // Skip if already wrapped
        if ((h as HTMLElement).closest(".keep-with-next")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "keep-with-next";

        const parent = h.parentNode!;
        parent.insertBefore(wrapper, h);
        wrapper.appendChild(h);

        // Accumulate height by moving subsequent siblings
        let acc = 0;
        let cursor: ChildNode | null = wrapper.nextSibling;

        while (cursor && acc < minHeight) {
          const next = cursor.nextSibling;

          // Move the node into the wrapper (preserves content order)
          wrapper.appendChild(cursor);

          // Count height for element nodes
          if (cursor.nodeType === Node.ELEMENT_NODE) {
            const el = cursor as HTMLElement;
            const rect = el.getBoundingClientRect();
            const hPx =
              rect && rect.height
                ? rect.height
                : parseFloat(getComputedStyle(el).height) || 0;
            acc += hPx;
          }

          cursor = next;
        }
      });
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "16mm",
        right: "7mm",
        bottom: "45mm",
        left: "7mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<div></div>", // empty header
      // Footer template uses inline styles only (Chromium requirement)
      footerTemplate: `
        <div style="
          width:100%;
          padding:0 7mm;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:6mm;
          font-size:12px;
          color:#666;
        ">
          <div style="display:flex; align-items:center; gap:10px;">
            ${
              logoDataUrl
                ? `<img src="${logoDataUrl}" alt="Logo" style="height:100px; width:auto;" />`
                : ""
            }
          </div>
          <h4 style="font-weight:600; color:#333; font-size:14px; text-align:center; max-width:300px; word-wrap:break-word; white-space:normal; line-height:1.2; margin:0;">
            ${title || "Document Title"}
          </h4>
          <div style="text-align:right;">
            <div style="font-weight:600; color:#333; margin-bottom:2px; font-size:12px; text-align:right;">
              Document Number: ${documentNumber || "####"}
            </div>
            <div style="font-size:10px; color:#888;">
              © Business and Accounts Knowledge Resource
            </div>
          </div>
        </div>
      `,
    });

    // Create filename from title (sanitize for file system)
    const sanitizeFilename = (filename: string) => {
      return filename
        .replace(/[^a-z0-9\\s\\-_]/gi, "") // Remove special characters
        .replace(/\\s+/g, "_") // Replace spaces with underscores
        .substring(0, 50) // Limit length
        .toLowerCase();
    };

    const filename = title ? `${sanitizeFilename(title)}.pdf` : "document.pdf";

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to generate PDF: ${errorMessage}` },
      { status: 500 }
    );
  } finally {
    // Always cleanup
    try {
      if (page) await page.close();
      if (browser) await browser.close();
      console.log("Browser closed");
    } catch (closeError) {
      console.error("Error during cleanup:", closeError);
    }
  }
}
