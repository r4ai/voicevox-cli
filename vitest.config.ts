import { defineConfig } from "vitest/config"

const runE2E = process.env.VOICEVOX_E2E === "1"

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: runE2E ? [] : ["tests/e2e/**/*.test.ts"],
  },
})
