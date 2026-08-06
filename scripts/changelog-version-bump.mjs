#!/usr/bin/env node
/**
 * Pre-commit / CLI: when CHANGELOG.md is staged, prompt for SemVer bump
 * (major|minor|patch|skip), update frontend/package.json (+ lockfile),
 * and cut [Unreleased] → ## [X.Y.Z] - YYYY-MM-DD.
 *
 * Non-interactive: set CHANGELOG_VERSION_BUMP=major|minor|patch|skip
 * Escape hatch: HUSKY=0
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CHANGELOG_PATH = path.join(ROOT, "CHANGELOG.md");
const FRONTEND_DIR = path.join(ROOT, "frontend");
const PACKAGE_JSON_PATH = path.join(FRONTEND_DIR, "package.json");

const BUMP_LEVELS = new Set(["major", "minor", "patch", "skip"]);

function git(args, opts = {}) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    ...opts,
  });
  if (result.error) throw result.error;
  return result;
}

function stagedFiles() {
  const result = git(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]);
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "git diff --cached failed\n");
    process.exit(1);
  }
  return (result.stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function findUnreleasedRange(changelog) {
  const match = changelog.match(/^## \[Unreleased\][ \t]*\r?\n/m);
  if (!match || match.index === undefined) {
    return null;
  }
  const start = match.index;
  const bodyStart = start + match[0].length;
  const rest = changelog.slice(bodyStart);
  const nextRel = rest.search(/^## \[/m);
  const bodyEnd = nextRel === -1 ? changelog.length : bodyStart + nextRel;
  return { start, bodyStart, bodyEnd };
}

/** Prefer scanning current Unreleased body (avoids matching historical sections). */
function unreleasedBodyFromFile() {
  if (!fs.existsSync(CHANGELOG_PATH)) return "";
  const changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const range = findUnreleasedRange(changelog);
  if (!range) return "";
  return changelog.slice(range.bodyStart, range.bodyEnd);
}

function hintFromUnreleased(body) {
  const ranks = [
    { level: "major", re: /###\s+(Removed|Deprecated)\b/i },
    { level: "major", re: /\bbreaking\b/i },
    { level: "minor", re: /###\s+Added\b/i },
    { level: "patch", re: /###\s+(Fixed|Security|Changed)\b/i },
  ];
  for (const { level, re } of ranks) {
    if (re.test(body)) return level;
  }
  return "patch";
}

function hintReasons(body) {
  const found = [];
  if (
    /###\s+Removed\b/i.test(body) ||
    /###\s+Deprecated\b/i.test(body) ||
    /\bbreaking\b/i.test(body)
  ) {
    found.push("Removed/Deprecated/breaking → major");
  }
  if (/###\s+Added\b/i.test(body)) found.push("Added → minor");
  if (/###\s+Fixed\b/i.test(body)) found.push("Fixed → patch");
  if (/###\s+Security\b/i.test(body)) found.push("Security → patch");
  if (/###\s+Changed\b/i.test(body)) {
    found.push("Changed → patch (หรือ minor ถ้าเป็นฟีเจอร์)");
  }
  return found;
}

function readPackageVersion() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
  return String(pkg.version || "0.0.0");
}

function bumpSemver(version, level) {
  const match = String(version).trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    throw new Error(`Invalid semver in frontend/package.json: ${version}`);
  }
  let major = Number(match[1]);
  let minor = Number(match[2]);
  let patch = Number(match[3]);
  if (level === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (level === "minor") {
    minor += 1;
    patch = 0;
  } else if (level === "patch") {
    patch += 1;
  }
  return `${major}.${minor}.${patch}`;
}

function todayYmd() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function cutUnreleased(changelog, version, dateYmd) {
  const range = findUnreleasedRange(changelog);
  if (!range) {
    return { text: changelog, moved: false };
  }

  const body = changelog
    .slice(range.bodyStart, range.bodyEnd)
    .replace(/\r?\n---\s*$/u, "")
    .trim();

  if (!body) {
    return { text: changelog, moved: false };
  }

  const before = changelog.slice(0, range.start);
  let after = changelog.slice(range.bodyEnd);
  after = after.replace(/^\s*---\s*\r?\n?/u, "");

  const text =
    `${before}## [Unreleased]\n\n---\n\n` +
    `## [${version}] - ${dateYmd}\n\n${body}\n\n---\n\n` +
    after;
  return { text, moved: true };
}

function applyNpmVersion(level) {
  const result = spawnSync(
    "npm",
    ["version", level, "--no-git-tag-version"],
    {
      cwd: FRONTEND_DIR,
      encoding: "utf8",
      shell: true,
    },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || "npm version failed\n");
    process.exit(1);
  }
}

function stagePaths(paths) {
  const result = git(["add", "--", ...paths]);
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "git add failed\n");
    process.exit(1);
  }
}

function isTty() {
  return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}

function askInteractive(hint) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    process.stdout.write(
      `\nCHANGELOG.md staged — bump app version? [major|minor|patch|skip]\n` +
        `  hint: ${hint}\n` +
        `> `,
    );
    rl.question("", (answer) => {
      rl.close();
      resolve(String(answer || "").trim().toLowerCase());
    });
  });
}

async function resolveBumpLevel(hint) {
  const fromEnv = String(process.env.CHANGELOG_VERSION_BUMP || "")
    .trim()
    .toLowerCase();
  if (fromEnv) {
    if (!BUMP_LEVELS.has(fromEnv)) {
      process.stderr.write(
        `Invalid CHANGELOG_VERSION_BUMP="${fromEnv}". Use major|minor|patch|skip.\n`,
      );
      process.exit(1);
    }
    return fromEnv;
  }

  if (!isTty()) {
    process.stderr.write(
      "CHANGELOG.md is staged but no TTY for version prompt.\n" +
        "Set CHANGELOG_VERSION_BUMP=major|minor|patch|skip and retry.\n" +
        `Suggested (from diff): ${hint}\n`,
    );
    process.exit(1);
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const answer = await askInteractive(hint);
    if (BUMP_LEVELS.has(answer)) return answer;
    process.stdout.write(`Invalid: "${answer}". Choose major|minor|patch|skip.\n`);
  }
  process.stderr.write("Too many invalid answers; aborting commit.\n");
  process.exit(1);
}

async function main() {
  const files = stagedFiles();
  const changelogStaged = files.some(
    (f) => f === "CHANGELOG.md" || f.replace(/\\/g, "/") === "CHANGELOG.md",
  );
  if (!changelogStaged) {
    process.exit(0);
  }

  const unreleasedBody = unreleasedBodyFromFile();
  const hint = hintFromUnreleased(unreleasedBody);
  const reasons = hintReasons(unreleasedBody);
  if (reasons.length) {
    process.stdout.write(`Changelog hint:\n  - ${reasons.join("\n  - ")}\n`);
  }

  const level = await resolveBumpLevel(hint);
  if (level === "skip") {
    process.stdout.write("Version bump skipped.\n");
    process.exit(0);
  }

  const before = readPackageVersion();
  applyNpmVersion(level);
  const after = readPackageVersion();
  const expected = bumpSemver(before, level);
  if (after !== expected) {
    process.stderr.write(
      `Warning: expected ${expected} after ${level} bump from ${before}, got ${after}\n`,
    );
  }

  const changelog = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const { text, moved } = cutUnreleased(changelog, after, todayYmd());
  if (moved) {
    fs.writeFileSync(CHANGELOG_PATH, text, "utf8");
  }

  stagePaths([
    "frontend/package.json",
    "frontend/package-lock.json",
    "CHANGELOG.md",
  ]);

  process.stdout.write(
    `Bumped frontend ${before} → ${after} (${level})` +
      (moved ? `; cut [Unreleased] → [${after}] - ${todayYmd()}` : "") +
      "\n",
  );
}

main().catch((err) => {
  process.stderr.write(`${err?.stack || err}\n`);
  process.exit(1);
});
