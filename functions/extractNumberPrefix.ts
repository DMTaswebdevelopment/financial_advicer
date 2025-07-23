// Helper function to extract number prefix from documentNumber
export function extractNumberPrefix(documentNumber: string): string | null {
  if (!documentNumber) return null;
  const match = documentNumber.match(/^(\d+)/);
  return match ? match[1] : null;
}
