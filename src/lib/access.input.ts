function asRecord(input: unknown): Record<string, unknown> {
  if (input === undefined || input === null) {
    return {};
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid input");
  }
  return input as Record<string, unknown>;
}

function optionalString(
  record: Record<string, unknown>,
  field: string
): string | undefined {
  const value = record[field];
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function requiredString(
  record: Record<string, unknown>,
  field: string
): string {
  const value = optionalString(record, field);
  if (value === undefined) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

export function optionalLocationInput(input: unknown): { locationId?: string } {
  const locationId = optionalString(asRecord(input), "locationId");
  return locationId === undefined ? {} : { locationId };
}

export function locationIdInput(input: unknown): { locationId: string } {
  return { locationId: requiredString(asRecord(input), "locationId") };
}

export function registerVisitInput(input: unknown): {
  name: string;
  locationId: string;
  website?: string;
} {
  const record = asRecord(input);
  const website = optionalString(record, "website");
  return {
    locationId: requiredString(record, "locationId"),
    name: requiredString(record, "name"),
    ...(website === undefined ? {} : { website }),
  };
}

export function passwordInput(input: unknown): { password: string } {
  return { password: requiredString(asRecord(input), "password") };
}

export function locationNameInput(input: unknown): { name: string } {
  return { name: requiredString(asRecord(input), "name") };
}

export function renameLocationInput(input: unknown): {
  locationId: string;
  name: string;
} {
  const record = asRecord(input);
  return {
    locationId: requiredString(record, "locationId"),
    name: requiredString(record, "name"),
  };
}
