const FALLBACK = "Ha ocurrido un error inesperado. Recarga la página.";

const INTERNAL = /prisma|database_url|econn|password|secret|stack|errno/i;

/** Visitor-facing copy. Hide implementation details from thrown Error messages. */
export function publicErrorMessage(message: string | undefined): string {
  if (!message || INTERNAL.test(message)) {
    return FALLBACK;
  }
  return message;
}

/** Rethrow so SSR does not serialize Prisma / env details into the HTML stream. */
export function rethrowPublic(err: unknown): never {
  throw new Error(
    publicErrorMessage(err instanceof Error ? err.message : undefined)
  );
}
