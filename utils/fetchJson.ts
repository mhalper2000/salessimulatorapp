/**
 * Parse a fetch Response as JSON, with clear errors when the server returns
 * HTML (e.g. WAF block pages) instead of JSON — the root cause of
 * "JSON Parse error: Unexpected character: <" in the app.
 */
export async function parseJsonResponse<T = Record<string, unknown>>(
  res: Response,
  context: string,
): Promise<T> {
  const text = await res.text();
  const trimmed = text.trim();

  if (!trimmed) {
    throw new Error(`${context}: empty response from server`);
  }

  if (trimmed.startsWith("<")) {
    throw new Error(
      `${context}: server returned HTML instead of JSON (HTTP ${res.status})`,
    );
  }

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    throw new Error(
      `${context}: invalid JSON in response (HTTP ${res.status})`,
    );
  }
}

export function friendlyApiError(err: unknown, fallback: string): string {
  const message = err instanceof Error ? err.message : String(err);

  if (
    message.includes("Unexpected character") ||
    message.includes("invalid JSON") ||
    message.includes("HTML instead of JSON") ||
    message.includes("JSON Parse")
  ) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  if (message.includes("Network request failed") || message.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return message || fallback;
}
