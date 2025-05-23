export function generateKey(id: string) {
  return `${id}_${new Date().getTime()}_${Math.random()}`;
}

// JR: created a function for saving the token to local storage
export function saveTokenToLocalStorage(token: string) {
  localStorage.setItem("_token", token);
}

// JR: created a function for getting the token from local storage
export function getTokenFromLocalStorage() {
  return localStorage.getItem("_token");
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
