import assert from "node:assert/strict";
import { test } from "node:test";
import {
  pickAdminLocationId,
  pickPublicLocationId,
} from "../src/lib/location-search.ts";

test("a requested Location that is not on the tablet is not replaced by another door", () => {
  assert.equal(pickPublicLocationId(["a", "b"], "retired-or-unknown"), null);
});

test("no requested Location still opens the first door on the tablet", () => {
  assert.equal(pickPublicLocationId(["a", "b"], undefined), "a");
});

test("a requested Location that is still on the tablet stays selected", () => {
  assert.equal(pickPublicLocationId(["a", "b"], "b"), "b");
});

const adminDoors = [
  { archived: false, id: "active-1" },
  { archived: false, id: "active-2" },
  { archived: true, id: "archived-1" },
];

test("Admin honors a requested archived Location instead of swapping to an active door", () => {
  assert.equal(pickAdminLocationId(adminDoors, "archived-1"), "archived-1");
});

test("Admin without a request still opens the first active door", () => {
  assert.equal(pickAdminLocationId(adminDoors, undefined), "active-1");
});

test("Admin with an unknown request still opens the first active door", () => {
  assert.equal(
    pickAdminLocationId(adminDoors, "retired-or-unknown"),
    "active-1"
  );
});
