import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { SiteFooter } from "@/components/site-footer";
import { getAdminSession } from "@/lib/access.functions";
import appCss from "../styles.css?url";

const APP_NAME = "Acceso";

export const Route = createRootRoute({
  staleTime: 60_000,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Acceso — código de puerta" },
      {
        name: "description",
        content: "Código de acceso de la puerta y registro de visitas.",
      },
      { name: "apple-mobile-web-app-title", content: APP_NAME },
      { name: "theme-color", content: "#efe8de" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-180.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600&display=swap",
      },
    ],
  }),
  loader: () => getAdminSession(),
  component: RootDocument,
});

function RootDocument() {
  const session = Route.useLoaderData();
  return (
    <html className="antialiased" lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="paper-grain min-h-dvh bg-bg text-fg">
        <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-6 pb-6 sm:px-6 lg:max-w-4xl">
          <header className="mb-8 flex items-center justify-between gap-4">
            <Link className="block min-w-0" to="/">
              <p className="font-display font-medium text-2xl text-fg leading-tight tracking-tight">
                Acceso
              </p>
            </Link>
            <Link
              className="inline-flex min-h-11 shrink-0 items-center font-medium text-muted-foreground text-sm transition-colors hover:text-fg"
              to={session.ok ? "/admin" : "/login"}
            >
              Gestión
            </Link>
          </header>
          <Outlet />
          <SiteFooter />
        </div>
        <Toaster
          offset={16}
          position="top-center"
          toastOptions={{
            className:
              "!bg-surface !text-fg !border-border !shadow-[var(--shadow-paper)] font-sans",
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
