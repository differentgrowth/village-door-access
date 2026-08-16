import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { sendVisitEmail } from "../src/lib/email.server.ts";

const savedEmail = process.env.NOTIFY_EMAIL;
const savedKey = process.env.RESEND_API_KEY;

afterEach(() => {
  if (savedEmail === undefined) {
    delete process.env.NOTIFY_EMAIL;
  } else {
    process.env.NOTIFY_EMAIL = savedEmail;
  }
  if (savedKey === undefined) {
    delete process.env.RESEND_API_KEY;
  } else {
    process.env.RESEND_API_KEY = savedKey;
  }
});

test("failed Notice stores only the Resend status, not the response body", async () => {
  process.env.NOTIFY_EMAIL = "operador@example.com";
  process.env.RESEND_API_KEY = "re_test_key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ message: "re_test_key leaked" }), {
      status: 403,
    });

  let result;
  try {
    result = await sendVisitEmail({
      code: "1234",
      locationName: "Acceso 1",
      name: "Ana",
      visitedAt: new Date().toISOString(),
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, { error: "resend_403", sent: false });
});

test("a transport failure does not persist the thrown message", async () => {
  process.env.NOTIFY_EMAIL = "operador@example.com";
  process.env.RESEND_API_KEY = "re_test_key";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:443");
  };

  let result;
  try {
    result = await sendVisitEmail({
      code: "1234",
      locationName: "Acceso 1",
      name: "Ana",
      visitedAt: new Date().toISOString(),
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  assert.deepEqual(result, { error: "send_failed", sent: false });
});
