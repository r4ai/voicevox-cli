#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs"
import { execSync } from "node:child_process"

const version = process.argv[2]

if (!version) {
  console.error("Usage: node scripts/release.mjs <version>")
  console.error("Example: node scripts/release.mjs 0.1.1")
  process.exit(1)
}

if (!/^[0-9]+\.[0-9]+\.[0-9]+(-.+)?$/.test(version)) {
  console.error(`Invalid version: '${version}' (expected <semver> like 1.2.3 or 1.2.3-beta.1)`)
  process.exit(1)
}

const tag = `v${version}`

try {
  execSync(`git rev-parse -q --verify refs/tags/${tag}`, { stdio: "ignore" })
  console.error(`Tag already exists: ${tag}`)
  process.exit(1)
} catch {
  // Tag does not exist.
}

const packageJsonPath = new URL("../package.json", import.meta.url)
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
packageJson.version = version
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")

execSync(`git tag ${tag}`, { stdio: "inherit" })

console.log(`Updated package.json version to ${version}`)
console.log(`Created git tag ${tag}`)
console.log("Next steps:")
console.log("  git add package.json")
console.log(`  git commit -m "chore: release ${tag}"`)
console.log("  git push && git push --tags")
