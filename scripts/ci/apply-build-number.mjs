import { readFileSync, writeFileSync } from "node:fs";

const [, , rawBuildNumber] = process.argv;

if (!rawBuildNumber) {
  console.error("usage: apply-build-number.mjs <buildNumber>");
  process.exit(1);
}

const buildNumber = Number(rawBuildNumber);

if (!Number.isInteger(buildNumber) || buildNumber < 1) {
  console.error(
    `build number must be a positive integer, got "${rawBuildNumber}"`,
  );
  process.exit(1);
}

const { expo } = JSON.parse(readFileSync("app.json", "utf8"));
const version = expo.version;

if (!version) {
  console.error("app.json has no expo.version");
  process.exit(1);
}

const file = "ios/Almari/Info.plist";
let contents = readFileSync(file, "utf8");

for (const [pattern, replacement] of [
  [
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${version}$2`,
  ],
  [
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/,
    `$1${buildNumber}$2`,
  ],
]) {
  if (!pattern.test(contents)) {
    console.error(`${file} does not match ${pattern}`);
    process.exit(1);
  }
  contents = contents.replace(pattern, replacement);
}

writeFileSync(file, contents);
console.log(
  `ios: CFBundleShortVersionString ${version}, CFBundleVersion ${buildNumber}`,
);
