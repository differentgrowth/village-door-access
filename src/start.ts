import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from "@tanstack/react-start";

/**
 * createStart replaces TanStack Start's default request middleware.
 * Keep CSRF on server functions or those RPCs become cross-site reachable.
 */
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const securityHeaders = createMiddleware({ type: "request" }).server(
  async ({ handlerType, next }) => {
    const result = await next();
    const { headers } = result.response;
    const contentType = headers.get("content-type") ?? "";
    if (
      handlerType === "router" ||
      handlerType === "serverFn" ||
      contentType.includes("text/html")
    ) {
      headers.set("Cache-Control", "private, no-store");
      headers.set("Pragma", "no-cache");
    }
    headers.set("Content-Security-Policy", "frame-ancestors 'none'");
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    headers.set("Referrer-Policy", "no-referrer");
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("X-Frame-Options", "DENY");
    return result;
  }
);

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders, csrfMiddleware],
}));
