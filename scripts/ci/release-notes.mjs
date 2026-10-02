import { readFileSync } from "node:fs";

const APP_STORE_LIMIT = 4000;

export function appVersion() {
  const { expo } = JSON.parse(readFileSync("app.json", "utf8"));

  if (!expo?.version) {
    throw new Error("app.json has no expo.version");
  }

  return expo.version;
}

export function releaseNotes(version = appVersion()) {
  const path = `store/release-notes/${version}.md`;
  let raw;

  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(
      `no release notes for ${version}. Write ${path} and commit it.`,
    );
  }

  const text = raw
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, "- ").trimEnd())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .join("\n")
    .trim();

  if (!text) {
    throw new Error(`${path} is empty`);
  }

  if (text.length > APP_STORE_LIMIT) {
    throw new Error(
      `${path} is ${text.length} characters, App Store Connect allows ${APP_STORE_LIMIT}`,
    );
  }

  return text;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(releaseNotes());
}
