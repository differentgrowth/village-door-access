import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8080";
const revealedCodeLabel = /aria-label="Código \d \d \d \d"/;
const todayVisitCount = /Hoy: \d+ visitas?/;
const lifetimeVisitCount = /Total: \d+/;
const todayVisitLine = /Hoy:[^\n]+/;
const shotDir = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "screenshots"
);
const shot = (name) => join(shotDir, name);

await mkdir(shotDir, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const errors = [];

async function run(label, viewport, fn) {
  const page = await browser.newPage({ viewport });
  page.on("pageerror", (err) =>
    errors.push(`${label} pageerror: ${err.message}`)
  );
  page.on("console", (msg) => {
    if (msg.type() !== "error") {
      return;
    }
    const text = msg.text();
    if (text.includes("hydrated but some attributes")) {
      return;
    }
    errors.push(`${label} console: ${text}`);
  });
  await fn(page);
  await page.close();
}

await run("desktop-flow", { height: 800, width: 1280 }, async (page) => {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.locator('[aria-label="Código oculto"]').waitFor();
  const homeText = await page.locator("body").innerText();
  if (!homeText.includes("se borra a los 90 días")) {
    throw new Error("missing visit retention notice");
  }
  const html = await page.content();
  if (revealedCodeLabel.test(html)) {
    throw new Error("door code leaked on public page before register");
  }
  await page.getByRole("tab", { name: "Acceso 1" }).click();
  await page.screenshot({ path: shot("app-preview.png") });

  const visitor = `María ${Date.now().toString(36).replace(/\d/g, "n")}`;
  await page.getByLabel("Nombre y apellidos").fill(visitor);
  await page.getByRole("button", { name: "Registrar visita" }).click();
  await page
    .locator('[aria-label^="Código "]:not([aria-label="Código oculto"])')
    .waitFor({ timeout: 8000 });
  await page.screenshot({ fullPage: true, path: shot("visit-registered.png") });

  await page.getByRole("link", { name: "Gestión" }).click();
  await page.getByLabel("Contraseña").waitFor();
  await page.getByLabel("Contraseña").fill("acceso1a");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page
    .getByRole("heading", { exact: true, name: "Gestión" })
    .waitFor({ timeout: 8000 });
  const adminText = await page.locator("body").innerText();
  if (
    !(todayVisitCount.test(adminText) && lifetimeVisitCount.test(adminText))
  ) {
    throw new Error(
      `missing visit counts: ${adminText.match(todayVisitLine)?.[0]}`
    );
  }
  await page.getByRole("tab", { name: "Acceso 1" }).click();
  await page.getByText("Pegatina QR").click();
  await page.getByLabel("QR de Acceso 1").waitFor();
  await page.getByText(visitor).first().waitFor({ timeout: 8000 });
  await page.getByText("Vigente").first().waitFor({ timeout: 8000 });
  await page.screenshot({ fullPage: true, path: shot("admin-dashboard.png") });

  const before = await page
    .locator("[aria-label^='Código']")
    .first()
    .innerText();
  const rotate = page.getByRole("button", { name: "Rotar código" });
  await rotate.click();
  await rotate.click();
  await page.getByText("Código nuevo generado").waitFor({ timeout: 8000 });
  const after = await page
    .locator("[aria-label^='Código']")
    .first()
    .innerText();
  if (before === after) {
    throw new Error(`code did not rotate: ${before}`);
  }
  const historyCodes = await page
    .locator("section")
    .filter({ hasText: "Códigos" })
    .locator("li")
    .count();
  if (historyCodes < 2) {
    throw new Error(`expected code history, got ${historyCodes}`);
  }

  const locationName = `Pista ${Date.now().toString().slice(-4)}`;
  await page.locator("#new-location").fill(locationName);
  await page.getByRole("button", { name: "Añadir ubicación" }).click();
  await page.getByText("Ubicación creada").waitFor({ timeout: 8000 });
  await page.getByRole("tab", { name: locationName }).waitFor();
  await page.screenshot({ fullPage: true, path: shot("admin-rotated.png") });
});

await run("mobile", { height: 844, width: 390 }, async (page) => {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { clientWidth: doc.clientWidth, scrollWidth: doc.scrollWidth };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 1) {
    throw new Error(
      `horizontal overflow ${overflow.scrollWidth} > ${overflow.clientWidth}`
    );
  }
  await page.screenshot({ fullPage: true, path: shot("mobile-home.png") });
});

await browser.close();
if (errors.length) {
  console.error(JSON.stringify(errors, null, 2));
  process.exit(1);
}
console.log("flow ok");
