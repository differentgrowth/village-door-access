import assert from "node:assert/strict";
import { test } from "node:test";
import { registerVisitInput } from "../src/lib/access.input.ts";

const invalidLocationId = /Invalid locationId/;
const invalidName = /Invalid name/;

test("registerVisitInput rejects missing fields", () => {
  assert.throws(() => registerVisitInput({}), invalidLocationId);
  assert.throws(() => registerVisitInput({ name: "Ana" }), invalidLocationId);
  assert.throws(
    () => registerVisitInput({ locationId: "x", name: 1 }),
    invalidName
  );
});

test("registerVisitInput accepts a Visit payload", () => {
  assert.deepEqual(registerVisitInput({ locationId: "loc-1", name: "Ana" }), {
    locationId: "loc-1",
    name: "Ana",
  });
});
