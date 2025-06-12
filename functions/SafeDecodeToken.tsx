import { jwtDecode } from "jwt-decode";

export function safeDecodeToken<T>(token: string): T | null {
  if (!token || token.split(".").length !== 3) return null;
  try {
    return jwtDecode<T>(token);
  } catch (e) {
    console.error("Failed to decode token", e);
    return null;
  }
}
