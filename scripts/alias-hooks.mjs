import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const knownSpecifierExtension = /\.(ts|tsx|js|mjs|cjs|json)$/i;

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    let rel = specifier.slice(2);
    if (!knownSpecifierExtension.test(rel)) {
      rel = `${rel}.ts`;
    }
    return nextResolve(pathToFileURL(join(srcRoot, rel)).href, context);
  }
  return nextResolve(specifier, context);
}
