import { execFileSync } from "node:child_process";

const mode = process.argv[2];
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function git(...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function tryGit(...args) {
  try {
    return git(...args);
  } catch {
    return null;
  }
}

function state() {
  const branch = tryGit("rev-parse", "--abbrev-ref", "HEAD");
  const upstream = tryGit("rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}");
  const dirty = (tryGit("status", "--porcelain") ?? "").length > 0;
  let ahead = 0;
  let behind = 0;
  if (upstream) {
    const counts = tryGit("rev-list", "--left-right", "--count", `HEAD...${upstream}`);
    if (counts) [ahead, behind] = counts.split(/\s+/).map(Number);
  }
  return { branch, upstream, dirty, ahead, behind };
}

function start() {
  if (tryGit("fetch", "--quiet", "origin") === null) {
    return "git-sync: fetch da origin non riuscito, allineamento non verificato.";
  }
  const s = state();
  if (!s.upstream)
    return `git-sync: la branch ${s.branch ?? "corrente"} non ha upstream, nessun pull.`;
  if (s.behind === 0) {
    return `git-sync: ${s.branch} allineata a ${s.upstream}${s.ahead ? `, ${s.ahead} commit locali da pushare` : ""}.`;
  }
  if (s.dirty) {
    return `git-sync: ${s.branch} è indietro di ${s.behind} commit rispetto a ${s.upstream}, ma ci sono modifiche non committate: nessun pull automatico.`;
  }
  if (s.ahead > 0) {
    return `git-sync: ${s.branch} e ${s.upstream} sono divergenti (${s.ahead} locali, ${s.behind} remoti): nessun pull automatico.`;
  }
  if (tryGit("merge", "--ff-only", "--quiet", s.upstream) === null) {
    return `git-sync: pull fast-forward da ${s.upstream} non riuscito.`;
  }
  return `git-sync: ${s.branch} aggiornata da ${s.upstream} (${s.behind} commit).`;
}

function stop() {
  const s = state();
  const open = [];
  if (s.dirty) open.push("modifiche non committate");
  if (s.ahead > 0) open.push(`${s.ahead} commit non pushati su ${s.upstream}`);
  if (!s.upstream && s.branch && s.branch !== "HEAD")
    open.push(`branch ${s.branch} senza upstream`);
  if (open.length === 0) return null;
  return `git-sync: ${open.join("; ")}. GitHub non è allineato.`;
}

if (mode === "start") {
  console.log(start());
} else if (mode === "stop") {
  const message = stop();
  if (message) console.log(JSON.stringify({ systemMessage: message }));
}
