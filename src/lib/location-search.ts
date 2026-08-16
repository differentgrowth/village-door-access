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

/** Admin: honor a requested Location if it exists, including archived. */
export function pickAdminLocationId(
  rows: readonly { archived: boolean; id: string }[],
  requestedId: string | undefined
): string | null {
  if (requestedId) {
    const match = rows.find((row) => row.id === requestedId);
    if (match) {
      return match.id;
    }
  }
  return rows.find((row) => !row.archived)?.id ?? rows[0]?.id ?? null;
}
