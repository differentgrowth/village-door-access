export interface LocationRow {
  archived: boolean;
  id: string;
  name: string;
}

export interface PublicAccessState {
  emailConfigured: boolean;
  locations: LocationRow[];
  selectedLocationId: string | null;
}

export interface AdminAccessState {
  archived: boolean;
  code: string;
  emailConfigured: boolean;
  locations: LocationRow[];
  rotatedAt: string;
  selectedLocationId: string | null;
}

export interface VisitRow {
  code: string;
  emailSent: boolean;
  id: string;
  name: string;
  visitedAt: string;
}

export interface AccessCodeRow {
  code: string;
  endedAt: string | null;
  id: string;
  startedAt: string;
}
