import { describe, expect, it } from "vitest"
import { runCli } from "./helpers.js"

const SUBCOMMANDS = [
  "speak",
  "speakers",
  "singers",
  "speaker-info",
  "initialize-speaker",
  "is-initialized-speaker",
  "query",
  "accent-phrases",
  "dict",
  "presets",
  "validate-kana",
  "morphable-targets",
  "version",
  "info",
  "setting",
  "mcp",
  "complete",
]

describe("voicevox complete", () => {
  describe("script generation", () => {
    it("generates bash completion script", async () => {
      const { stdout, exitCode } = await runCli("complete", "bash")
      expect(exitCode).toBe(0)
      expect(stdout).toMatch(/bash completion for voicevox/i)
    })

    it("generates zsh completion script", async () => {
      const { stdout, exitCode } = await runCli("complete", "zsh")
      expect(exitCode).toBe(0)
      expect(stdout).toMatch(/zsh completion for voicevox/i)
    })

    it("generates fish completion script", async () => {
      const { stdout, exitCode } = await runCli("complete", "fish")
      expect(exitCode).toBe(0)
      expect(stdout).toMatch(/fish completion for voicevox/i)
    })

    it("generates powershell completion script", async () => {
      const { stdout, exitCode } = await runCli("complete", "powershell")
      expect(exitCode).toBe(0)
      expect(stdout.length).toBeGreaterThan(0)
    })
  })

  describe("runtime completion candidates", () => {
    it("returns all subcommands when completing top-level", async () => {
      // The completion protocol is invoked via `complete --`
      const { stdout, exitCode } = await runCli("complete", "--")
      expect(exitCode).toBe(0)
      for (const cmd of SUBCOMMANDS.filter((c) => c !== "complete")) {
        expect(stdout).toContain(cmd)
      }
    })
  })
})
