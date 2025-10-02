export function getBaseUrl() {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : process.env.NEXT_LIVE_URL || "http://localhost:3001";
}
