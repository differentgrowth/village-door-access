export interface LocationSearch {
  location?: string;
}

export function parseLocationSearch(
  search: Record<string, unknown>
): LocationSearch {
  return {
    location: typeof search.location === "string" ? search.location : undefined,
  };
}

/** Public tablet: honor a requested Location only if it is still on the door list. */
export function pickPublicLocationId(
  activeIds: readonly string[],
  requestedId: string | undefined
): string | null {
  if (requestedId) {
    return activeIds.includes(requestedId) ? requestedId : null;
  }
  return activeIds[0] ?? null;
}
