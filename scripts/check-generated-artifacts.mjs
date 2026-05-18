import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const blockedPaths = [
  "apps/api/.test-dist/",
  "apps/web/.test-dist/",
  "packages/db/generated/",
];

const blockedSegments = new Set([".next", "dist"]);

function isBlockedPath(filePath) {
  if (blockedPaths.some((blockedPath) => filePath.startsWith(blockedPath))) {
    return true;
  }

  return filePath.split("/").some((segment) => blockedSegments.has(segment));
}

const generatedArtifacts = trackedFiles.filter(isBlockedPath);

if (generatedArtifacts.length > 0) {
  console.error("Generated output is tracked by git:");
  for (const filePath of generatedArtifacts) {
    console.error(`- ${filePath}`);
  }
  console.error("Remove generated output from git before committing.");
  process.exit(1);
}

console.log("No tracked generated output found.");
