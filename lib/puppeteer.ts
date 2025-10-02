// lib/puppeteer.ts
import type { Browser, LaunchOptions } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

/**
 * Prefer full 'puppeteer' locally (downloads its own Chromium),
 * fall back to 'puppeteer-core' (serverless) only when needed.
 */
async function getPuppeteer() {
  // Try full puppeteer FIRST
  try {
    const full = (await import("puppeteer"))
      .default as unknown as typeof import("puppeteer-core").default;
    return { mod: full, kind: "full" as const };
  } catch {
    // Then try puppeteer-core
    const core = (await import("puppeteer-core")).default;
    return { mod: core, kind: "core" as const };
  }
}

export async function launchBrowser(): Promise<Browser> {
  const { mod: puppeteer, kind } = await getPuppeteer();

  const isServerless =
    !!process.env.AWS_REGION ||
    !!process.env.VERCEL ||
    process.env.NEXT_RUNTIME === "edge" || // we won't run on edge, but this helps decide
    process.env.NODE_ENV === "production"; // most hosted cases

  // In serverless we ALWAYS use puppeteer-core + @sparticuz/chromium
  if (isServerless || kind === "core") {
    const options: LaunchOptions = {
      args: chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath: await chromium.executablePath(),
      headless: true, // cast not needed if literal
    };
    return puppeteer.launch(options);
  }

  // Local dev with full puppeteer (no executablePath needed)
  const options: LaunchOptions = {
    headless: true,
  };
  return puppeteer.launch(options);
}
