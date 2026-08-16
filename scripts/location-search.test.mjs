import assert from "node:assert/strict";
import { test } from "node:test";
import { pickPublicLocationId } from "../src/lib/location-search.ts";

test("a requested Location that is not on the tablet is not replaced by another door", () => {
  assert.equal(pickPublicLocationId(["a", "b"], "retired-or-unknown"), null);
});

test("no requested Location still opens the first door on the tablet", () => {
  assert.equal(pickPublicLocationId(["a", "b"], undefined), "a");
});

test("a requested Location that is still on the tablet stays selected", () => {
  assert.equal(pickPublicLocationId(["a", "b"], "b"), "b");
});
