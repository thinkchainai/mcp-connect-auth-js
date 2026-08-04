import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const constantsPath = join(root, "src", "constants.ts");
const constants = readFileSync(constantsPath, "utf8");
const versionPattern = /export const VERSION = "[^"]+";/;
if (!versionPattern.test(constants)) {
  throw new Error("VERSION export not found in src/constants.ts");
}

const updated = constants.replace(
  versionPattern,
  `export const VERSION = "${packageJson.version}";`,
);

writeFileSync(constantsPath, updated);
