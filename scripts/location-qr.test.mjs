import assert from "node:assert/strict";
import { test } from "node:test";
import { locationVisitUrl, stickerFilename } from "../src/lib/location-qr.ts";

const fourDigitPng = /^\d{4}\.png$/;

test("locationVisitUrl focuses a Location and does not carry an Access Code", () => {
  const url = locationVisitUrl(
    "https://acceso.example",
    "00000000-0000-4000-8000-000000000001"
  );
  const parsed = new URL(url);
  assert.equal(parsed.origin, "https://acceso.example");
  assert.equal(parsed.pathname, "/");
  assert.equal(
    parsed.searchParams.get("location"),
    "00000000-0000-4000-8000-000000000001"
  );
  assert.deepEqual([...parsed.searchParams.keys()], ["location"]);
});

test("stickerFilename is a download name, not an Access Code", () => {
  assert.equal(stickerFilename("Acceso 1"), "qr-acceso-1.png");
  assert.doesNotMatch(stickerFilename("Pabellón"), fourDigitPng);
});
