import {
  appendFileSync,
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";

function patchLine(file, pattern, replacement) {
  const contents = readFileSync(file, "utf8");

  if (!pattern.test(contents)) {
    console.error(`${file} does not match ${pattern}`);
    process.exit(1);
  }

  writeFileSync(file, contents.replace(pattern, replacement));
}

const NEXT_NOTES = "store/release-notes/next.md";

const appConfig = JSON.parse(readFileSync("app.json", "utf8"));
const previous = appConfig.expo?.version;
const parts = previous?.split(".").map(Number);

if (
  !parts ||
  parts.length !== 3 ||
  parts.some((part) => !Number.isInteger(part))
) {
  console.error(`app.json version "${previous}" is not major.minor.patch`);
  process.exit(1);
}

const version = `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
const notes = `store/release-notes/${version}.md`;

if (!existsSync(notes)) {
  const draft = existsSync(NEXT_NOTES)
    ? readFileSync(NEXT_NOTES, "utf8").trim()
    : "";

  if (!draft || draft.split("\n").every((line) => line.startsWith("#"))) {
    console.error(`write ${NEXT_NOTES} before releasing. It becomes ${notes}.`);
    process.exit(1);
  }

  renameSync(NEXT_NOTES, notes);
  writeFileSync(NEXT_NOTES, "# What goes out next. Bullets only.\n");
  console.log(`${NEXT_NOTES} -> ${notes}`);
}

patchLine("app.json", /"version":\s*"[^"]*"/, `"version": "${version}"`);

console.log(`release ${version}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `version=${version}\n`);
}
