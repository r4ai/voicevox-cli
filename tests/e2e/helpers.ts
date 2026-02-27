import { execFile } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const CLI_PATH = join(import.meta.dirname, "../../dist/cli.js")

export const VOICEVOX_HOST = process.env.VOICEVOX_HOST ?? "http://localhost:50021"

export interface CliResult {
  stdout: string
  stderr: string
  exitCode: number
}

export function runCli(...args: string[]): Promise<CliResult> {
  return new Promise((resolve) => {
    execFile(
      process.execPath,
      [CLI_PATH, ...args],
      { timeout: 30_000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode: error ? ((error as { code?: number }).code ?? 1) : 0,
        })
      },
    )
  })
}

export async function makeTmpDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "voicevox-e2e-"))
}

export async function cleanDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true })
}
