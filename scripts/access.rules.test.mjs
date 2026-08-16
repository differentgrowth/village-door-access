import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePassword } from "../src/lib/access.rules.ts";

test("parsePassword rejects a 7-character value", () => {
  const result = parsePassword("abc12xy");
  assert.equal(typeof result, "object");
  assert.ok("error" in result);
});

test("parsePassword accepts symbols in a standard Password", () => {
  const result = parsePassword("acceso1!");
  assert.equal(result, "acceso1!");
});

test("parsePassword accepts eight letters and digits", () => {
  const result = parsePassword("acceso1a");
  assert.equal(result, "acceso1a");
});

test("parsePassword rejects a value longer than 128 characters", () => {
  const result = parsePassword(`${"a".repeat(128)}!`);
  assert.equal(typeof result, "object");
  assert.ok("error" in result);
});
