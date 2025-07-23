export function metadataToString(
  value: string | number | boolean | string[] | undefined
): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (typeof value === "boolean") return value.toString();
  if (Array.isArray(value)) return value.join(",");
  return "";
}
