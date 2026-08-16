import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getAdminPassword,
  issueAdminToken,
  sessionSecret,
  signAdminToken,
  verifyAdminToken,
} from "../src/lib/admin-session-token.ts";

const savedPassword = process.env.ADMIN_PASSWORD;
const savedSecret = process.env.ADMIN_SESSION_SECRET;
const missingSessionSecret = /ADMIN_SESSION_SECRET/;
const invalidAdminPassword = /ADMIN_PASSWORD/;

afterEach(() => {
  if (savedPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = savedPassword;
  }
  if (savedSecret === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = savedSecret;
  }
});

test("demo preview signs without a committed access-preview-session-key", () => {
  delete process.env.ADMIN_PASSWORD;
  delete process.env.ADMIN_SESSION_SECRET;
  const secret = sessionSecret();
  assert.notEqual(secret, "access-preview-session-key");
  const token = issueAdminToken();
  assert.equal(verifyAdminToken(token, getAdminPassword(), secret), true);
});

test("production-unset session secret does not sign with a committed default", () => {
  process.env.ADMIN_PASSWORD = "operator1";
  delete process.env.ADMIN_SESSION_SECRET;
  assert.throws(() => sessionSecret(), missingSessionSecret);
  assert.throws(() => issueAdminToken(), missingSessionSecret);
});

test("invalid ADMIN_PASSWORD fails loud instead of locking Operators out", () => {
  process.env.ADMIN_PASSWORD = "short";
  process.env.ADMIN_SESSION_SECRET = "unit-test-session-secret";
  assert.throws(() => getAdminPassword(), invalidAdminPassword);
});

test("ADMIN_PASSWORD may include symbols", () => {
  process.env.ADMIN_PASSWORD = "acceso1!";
  process.env.ADMIN_SESSION_SECRET = "unit-test-session-secret";
  assert.equal(getAdminPassword(), "acceso1!");
});

test("cookie issued under one Password does not verify after it changes", () => {
  const secret = "unit-test-session-secret";
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const token = signAdminToken(exp, "oldpass01", secret);
  assert.equal(verifyAdminToken(token, "oldpass01", secret), true);
  assert.equal(verifyAdminToken(token, "newpass01", secret), false);
});
