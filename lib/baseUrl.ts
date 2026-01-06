export function getBaseUrl() {
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3001"
    : "https://www.bakr.com.au";
}
