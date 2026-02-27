#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs"
import { execFileSync } from "node:child_process"
import { createInterface } from "node:readline"

const args = process.argv.slice(2)
const yesAll = args.includes("--yes") || args.includes("-y")
const version = args.find((a) => !a.startsWith("-"))

if (!version) {
  console.error("Usage: node scripts/release.mjs <version> [--yes|-y]")
  console.error("Example: node scripts/release.mjs 0.1.1")
  console.error("         node scripts/release.mjs 0.1.1 --yes")
  process.exit(1)
}

const confirm = async (message) => {
  if (yesAll) return true
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === "y")
    })
  })
}

if (
  !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/.test(
    version,
  )
) {
  console.error(`Invalid version: '${version}' (expected semver like 1.2.3 or 1.2.3-beta.1)`)
  process.exit(1)
}

const run = (command, args, options = {}) =>
  execFileSync(command, args, { stdio: "inherit", ...options })
const tag = `v${version}`
const branch = `chore/release-${tag}`
let branchCreated = false
let packageVersionUpdated = false
let tagCreated = false

const packageJsonPath = new URL("../package.json", import.meta.url)
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"))

if (packageJson.version === version) {
  console.error(`package.json is already at version ${version}`)
  process.exit(1)
}

const currentBranch = execFileSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
  encoding: "utf8",
}).trim()
if (currentBranch !== "main") {
  console.error(
    `Current branch is '${currentBranch}'. Please switch to 'main' before running the release script.`,
  )
  process.exit(1)
}

try {
  execFileSync("git", ["rev-parse", "-q", "--verify", `refs/tags/${tag}`], { stdio: "ignore" })
  console.error(`Tag already exists: ${tag}`)
  process.exit(1)
} catch {
  // Tag does not exist.
}

// ブランチを作成してチェックアウト
try {
  run("git", ["switch", "-c", branch])
  branchCreated = true

  // package.json のバージョンを更新
  packageJson.version = version
  writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf8")
  packageVersionUpdated = true
  console.log(`Updated package.json version to ${version}`)

  // コミット
  run("git", ["add", "package.json"])
  run("git", ["commit", "-m", `chore: release ${tag}`])
  packageVersionUpdated = false
  console.log(`Committed package.json`)

  // タグを作成
  run("git", ["tag", tag])
  tagCreated = true
  console.log(`Created git tag ${tag}`)

  // プッシュ確認
  const doPush = await confirm(`Push branch '${branch}' and tag '${tag}' to origin?`)
  if (!doPush) {
    console.log("Aborted. You can push manually:")
    console.log(`  git push origin ${branch}`)
    console.log(`  git push origin refs/tags/${tag}`)
    console.log("To rerun this script, clean up the local release artifacts first:")
    console.log(`  git tag -d ${tag}`)
    console.log(`  git switch main && git branch -D ${branch}`)
    process.exit(0)
  }

  run("git", ["push", "origin", branch])
  run("git", ["push", "origin", `refs/tags/${tag}`])
  console.log(`Pushed branch ${branch} and tag ${tag}`)

  // PR 作成確認
  const doPR = await confirm(`Create a pull request for '${branch}' into main?`)
  if (!doPR) {
    console.log("Aborted. You can create the PR manually:")
    console.log(`  gh pr create --base main --head ${branch} --title "chore: release ${tag}"`)
    process.exit(0)
  }

  run("gh", [
    "pr",
    "create",
    "--base",
    "main",
    "--title",
    `chore: release ${tag}`,
    "--body",
    `## Release ${tag}`,
    "--head",
    branch,
  ])
  console.log(`Created pull request for ${tag}`)
} catch {
  console.error("Release process failed. Please review the error output above.")
  console.error("If you want to retry, clean up any partially created artifacts:")
  if (packageVersionUpdated) {
    console.error("  git restore package.json")
  }
  if (tagCreated) {
    console.error(`  git tag -d ${tag}`)
  }
  if (branchCreated) {
    console.error(`  git switch main && git branch -D ${branch}`)
  }
  process.exit(1)
}
