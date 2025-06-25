import { UserNameListType } from "@/component/model/types/UserNameListType";

export function generateKey(id: string) {
  return `${id}_${new Date().getTime()}_${Math.random()}`;
}

// JR: created a function for saving the token to local storage
export function saveTokenToLocalStorage(token: string) {
  if (typeof window !== "undefined") {
    // Save only the combined data under accessToken key
    localStorage.setItem("accessToken", token);
  }
}

// JR: created a function for getting the token from local storage
export function getUserLocalStorage(): UserNameListType | null {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("userDatas");

    if (stored) {
      try {
        return JSON.parse(stored) as UserNameListType;
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        return null;
      }
    }
  }

  return null;
}

export function saveUserToLocalStorage(userPayload: UserNameListType) {
  if (typeof window !== "undefined") {
    const combinedData = {
      ...userPayload,
    };

    localStorage.setItem("userDatas", JSON.stringify(combinedData));
  }
}
// JR: created a function for getting the token from local storage
export function getTokenFromLocalStorage() {
  return localStorage.getItem("accessToken");
}

// JR: created a function for getting the token from local storage
export function destoryTokenFromLocalStorage() {
  return localStorage.removeItem("_token");
}

// created a function for manipulating our classess
export function classNames(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}
