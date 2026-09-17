#!/usr/bin/env node
// Generates .github/copilot-instructions.md from CLAUDE.md (the canonical source of shared
// agent instructions). See docs/adr/0010-dual-ai-agent-tooling-compatibility.md.
//
// Usage:
//   node scripts/sync-agent-instructions.mjs          # write the generated file
//   node scripts/sync-agent-instructions.mjs --check  # exit 1 if out of sync (used in CI)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = join(rootDir, "CLAUDE.md");
const targetPath = join(rootDir, ".github", "copilot-instructions.md");

const BANNER = [
  "<!--",
  "  GENERATED FILE — do not edit directly.",
  "  Source: CLAUDE.md (repo root). After editing CLAUDE.md, regenerate this file with:",
  "    node scripts/sync-agent-instructions.mjs",
  "  See docs/adr/0010-dual-ai-agent-tooling-compatibility.md.",
  "-->",
  "",
].join("\n");

function generate() {
  if (!existsSync(sourcePath)) {
    throw new Error(`Missing canonical source: ${sourcePath}`);
  }
  return `${BANNER}${readFileSync(sourcePath, "utf8")}`;
}

function main() {
  const check = process.argv.includes("--check");
  const generated = generate();

  if (check) {
    const current = existsSync(targetPath)
      ? readFileSync(targetPath, "utf8")
      : null;
    if (current !== generated) {
      console.error(
        "[sync-agent-instructions] .github/copilot-instructions.md is out of sync with CLAUDE.md.\n" +
          "Run `node scripts/sync-agent-instructions.mjs` and commit the result.",
      );
      process.exitCode = 1;
      return;
    }
    console.log(
      "[sync-agent-instructions] .github/copilot-instructions.md is in sync.",
    );
    return;
  }

  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, generated);
  console.log(`[sync-agent-instructions] wrote ${targetPath}`);
}

main();
