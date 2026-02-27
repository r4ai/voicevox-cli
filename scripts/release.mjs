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

const branch = `chore/release-${tag}`

// ブランチを作成してチェックアウト
execSync(`git switch -c ${branch}`, { stdio: "inherit" })

// package.json のバージョンを更新
const packageJsonPath = new URL("../package.json", import.meta.url)
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))
packageJson.version = version
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")
console.log(`Updated package.json version to ${version}`)

// コミット
execSync(`git add package.json`, { stdio: "inherit" })
execSync(`git commit -m "chore: release ${tag}"`, { stdio: "inherit" })
console.log(`Committed package.json`)

// タグを作成
execSync(`git tag ${tag}`, { stdio: "inherit" })
console.log(`Created git tag ${tag}`)

// プッシュ
execSync(`git push origin ${branch}`, { stdio: "inherit" })
execSync(`git push origin ${tag}`, { stdio: "inherit" })
console.log(`Pushed branch ${branch} and tag ${tag}`)

// PR を作成
execSync(
  `gh pr create --base main --title "chore: release ${tag}" --body "## Release ${tag}" --head ${branch}`,
  { stdio: "inherit" },
)
console.log(`Created pull request for ${tag}`)
