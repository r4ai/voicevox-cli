import { define } from "gunshi"
import { describe, expect, it } from "vitest"
import { normalizeCliArgs } from "./argv.js"

const commands = {
  dict: define({
    args: {
      host: { type: "string" },
      json: { type: "boolean" },
    },
    subCommands: {
      add: define({ args: { priority: { type: "number", short: "p" } } }),
    },
  }),
  speak: define({
    args: {
      speaker: { type: "number", short: "s" },
      play: { type: "boolean", short: "p" },
    },
  }),
  presets: define({
    subCommands: {
      add: define({ args: { "style-id": { type: "number", short: "s" } } }),
    },
  }),
}

describe("normalizeCliArgs", () => {
  it("keeps URL and command-like option values out of command routing", () => {
    expect(
      normalizeCliArgs(["dict", "--host", "http://localhost:50021", "--json"], commands),
    ).toEqual(["dict", "--host=http://localhost:50021", "--json"])
    expect(normalizeCliArgs(["dict", "--host", "add"], commands)).toEqual(["dict", "--host=add"])
  })

  it("preserves nested commands, positionals, and negative short option values", () => {
    expect(normalizeCliArgs(["dict", "add", "単語", "タンゴ", "-p", "-1"], commands)).toEqual([
      "dict",
      "add",
      "単語",
      "タンゴ",
      "--priority=-1",
    ])
  })

  it("preserves boolean flags, unknown options, and missing values for validation", () => {
    const argv = ["dict", "--json", "unknown", "--unknown", "value", "--host", "--json"]
    expect(normalizeCliArgs(argv, commands)).toEqual(argv)
    expect(normalizeCliArgs(["dict", "--host"], commands)).toEqual(["dict", "--host"])
  })

  it("preserves the end-of-options separator and already bound values", () => {
    const argv = ["dict", "--host=http://localhost:50021", "--", "--host", "literal"]
    expect(normalizeCliArgs(argv, commands)).toEqual(argv)
  })

  it("resolves aliases using the active command rather than unrelated commands", () => {
    expect(normalizeCliArgs(["speak", "こんにちは", "-s", "1", "-p"], commands)).toEqual([
      "speak",
      "こんにちは",
      "--speaker=1",
      "-p",
    ])
    expect(normalizeCliArgs(["speak", "-p", "こんにちは"], commands)).toEqual([
      "speak",
      "-p",
      "こんにちは",
    ])
    expect(normalizeCliArgs(["presets", "add", "-s", "1"], commands)).toEqual([
      "presets",
      "add",
      "--style-id=1",
    ])
  })
})
