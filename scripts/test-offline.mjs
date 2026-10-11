import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const guard = new URL("./tests/no-network.mjs", import.meta.url).href;
const env = {
  ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ""} --import=${guard}`,
};

for (const args of [
  process.argv.includes("--coverage") ? ["run", "test:coverage"] : ["test"],
  ["test", "--prefix", "worker/studio"],
]) {
  const result = spawnSync("npm", args, { cwd: root, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
