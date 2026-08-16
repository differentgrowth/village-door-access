import { createServerFn } from "@tanstack/react-start";
import {
  locationIdInput,
  locationNameInput,
  optionalLocationInput,
  passwordInput,
  registerVisitInput,
  renameLocationInput,
} from "./access.input";
import type {
  AccessCodeRow,
  AdminAccessState,
  LocationRow,
  PublicAccessState,
  VisitRow,
} from "./access.types";

export type {
  AccessCodeRow,
  AdminAccessState,
  LocationRow,
  PublicAccessState,
  VisitRow,
} from "./access.types";

export const getPublicState = createServerFn({ method: "GET" })
  .validator(optionalLocationInput)
  .handler(async ({ data }): Promise<PublicAccessState> => {
    const { getPublicStateImpl } = await import("./access.server");
    return getPublicStateImpl(data);
  });

export const getAdminState = createServerFn({ method: "GET" })
  .validator(optionalLocationInput)
  .handler(async ({ data }): Promise<AdminAccessState> => {
    const { getAdminStateImpl } = await import("./access.server");
    return getAdminStateImpl(data);
  });

export const registerVisit = createServerFn({ method: "POST" })
  .validator(registerVisitInput)
  .handler(async ({ data }) => {
    const { registerVisitImpl } = await import("./access.server");
    return registerVisitImpl(data);
  });

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const { getAdminSessionImpl } = await import("./access.server");
    return getAdminSessionImpl();
  }
);

export const adminLogin = createServerFn({ method: "POST" })
  .validator(passwordInput)
  .handler(async ({ data }) => {
    const { adminLoginImpl } = await import("./access.server");
    return adminLoginImpl(data);
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    const { adminLogoutImpl } = await import("./access.server");
    return adminLogoutImpl();
  }
);

export const rotateCode = createServerFn({ method: "POST" })
  .validator(locationIdInput)
  .handler(async ({ data }) => {
    const { rotateCodeImpl } = await import("./access.server");
    return rotateCodeImpl(data);
  });

export const listVisits = createServerFn({ method: "GET" })
  .validator(locationIdInput)
  .handler(
    async ({
      data,
    }): Promise<{
      visits: VisitRow[];
      todayCount: number;
      totalCount: number;
    }> => {
      const { listVisitsImpl } = await import("./access.server");
      return listVisitsImpl(data);
    }
  );

export const listAccessCodes = createServerFn({ method: "GET" })
  .validator(locationIdInput)
  .handler(async ({ data }): Promise<{ codes: AccessCodeRow[] }> => {
    const { listAccessCodesImpl } = await import("./access.server");
    return listAccessCodesImpl(data);
  });

export const createLocation = createServerFn({ method: "POST" })
  .validator(locationNameInput)
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; location: LocationRow } | { ok: false; error: string }
    > => {
      const { createLocationImpl } = await import("./access.server");
      return createLocationImpl(data);
    }
  );

export const renameLocation = createServerFn({ method: "POST" })
  .validator(renameLocationInput)
  .handler(
    async ({
      data,
    }): Promise<
      { ok: true; location: LocationRow } | { ok: false; error: string }
    > => {
      const { renameLocationImpl } = await import("./access.server");
      return renameLocationImpl(data);
    }
  );

export const archiveLocation = createServerFn({ method: "POST" })
  .validator(locationIdInput)
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const { archiveLocationImpl } = await import("./access.server");
      return archiveLocationImpl(data);
    }
  );

export const restoreLocation = createServerFn({ method: "POST" })
  .validator(locationIdInput)
  .handler(
    async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
      const { restoreLocationImpl } = await import("./access.server");
      return restoreLocationImpl(data);
    }
  );
