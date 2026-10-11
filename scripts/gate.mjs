import { spawnSync } from "node:child_process";

const salta = process.argv.includes("--no-e2e");
const passi = ["lint", "validate", "test", ...(salta ? [] : ["e2e"])];
let ko = 0;
for (const p of passi) {
  const r = spawnSync("pnpm", [p], { shell: true, encoding: "utf8" });
  const righe = `${r.stdout}${r.stderr}`.trim().split("\n");
  console.log(`${p}=${r.status}`);
  if (r.status !== 0) {
    ko = 1;
    console.log(righe.slice(-25).join("\n"));
    break;
  }
}
process.exit(ko);
