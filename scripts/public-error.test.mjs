import assert from "node:assert/strict";
import { test } from "node:test";
import { publicErrorMessage, rethrowPublic } from "../src/lib/public-error.ts";

const fallback = "Ha ocurrido un error inesperado. Recarga la página.";

test("publicErrorMessage keeps product copy Operators already see", () => {
  assert.equal(publicErrorMessage("No autorizado"), "No autorizado");
  assert.equal(publicErrorMessage("No hay ubicaciones"), "No hay ubicaciones");
});

test("publicErrorMessage hides implementation details", () => {
  assert.equal(publicErrorMessage("DATABASE_URL is required"), fallback);
  assert.equal(
    publicErrorMessage("Can't reach database server at prisma"),
    fallback
  );
  assert.equal(publicErrorMessage(undefined), fallback);
});

test("rethrowPublic replaces a DATABASE_URL throw so SSR cannot serialize it", () => {
  assert.throws(() => rethrowPublic(new Error("DATABASE_URL is required")), {
    message: fallback,
  });
});
