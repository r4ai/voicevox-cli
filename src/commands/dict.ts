import { readFile } from "node:fs/promises"
import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import { getPositionals } from "./positionals.js"

const HOST_ARG = {
  host: {
    type: "string" as const,
    default: "http://localhost:50021",
    description: "VoiceVox engine URL",
  },
}

const dictAddCommand = define({
  name: "add",
  description: "Add a word to the user dictionary",
  args: {
    ...HOST_ARG,
    "accent-type": {
      type: "number" as const,
      short: "a",
      default: 0,
      description: "Accent type",
    },
    "word-type": {
      type: "string" as const,
      short: "t",
      default: "COMMON_NOUN",
      description: "Word type (PROPER_NOUN, COMMON_NOUN, VERB, ADJECTIVE, SUFFIX)",
    },
    priority: {
      type: "number" as const,
      short: "p",
      default: 5,
      description: "Priority (0-10)",
    },
  },
  run: async (ctx) => {
    const surface = getPositionals(ctx)[0]
    const pronunciation = getPositionals(ctx)[1]
    if (!surface || !pronunciation) {
      console.error("Error: surface and pronunciation arguments are required")
      console.error("Usage: voicevox dict add <surface> <pronunciation> [options]")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let uuid
    try {
      uuid = await client.addUserDictWord({
        surface,
        pronunciation,
        accent_type: ctx.values["accent-type"] ?? 0,
        word_type: ctx.values["word-type"] ?? "COMMON_NOUN",
        priority: ctx.values.priority ?? 5,
      })
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Added: ${uuid}`)
  },
})

const dictUpdateCommand = define({
  name: "update",
  description: "Update a word in the user dictionary",
  args: {
    ...HOST_ARG,
    surface: {
      type: "string" as const,
      short: "s",
      description: "Surface form",
    },
    pronunciation: {
      type: "string" as const,
      short: "r",
      description: "Pronunciation (katakana)",
    },
    "accent-type": {
      type: "number" as const,
      short: "a",
      description: "Accent type",
    },
    "word-type": {
      type: "string" as const,
      short: "t",
      description: "Word type (PROPER_NOUN, COMMON_NOUN, VERB, ADJECTIVE, SUFFIX)",
    },
    priority: {
      type: "number" as const,
      short: "p",
      description: "Priority (0-10)",
    },
  },
  run: async (ctx) => {
    const wordUuid = getPositionals(ctx)[0]
    if (!wordUuid) {
      console.error("Error: uuid argument is required")
      console.error("Usage: voicevox dict update <uuid> [options]")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let dict
    try {
      dict = await client.getUserDict()
    } catch (err) {
      handleCommandError(err, host)
    }

    const existing = dict[wordUuid]
    if (!existing) {
      console.error(`Error: word with uuid "${wordUuid}" not found`)
      process.exit(1)
    }

    try {
      await client.updateUserDictWord(wordUuid, {
        surface: ctx.values.surface ?? existing.surface,
        pronunciation: ctx.values.pronunciation ?? existing.pronunciation,
        accent_type: ctx.values["accent-type"] ?? existing.accent_type,
        word_type: ctx.values["word-type"] ?? existing.word_type,
        priority: ctx.values.priority ?? existing.priority,
      })
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Updated: ${wordUuid}`)
  },
})

const dictDeleteCommand = define({
  name: "delete",
  description: "Delete a word from the user dictionary",
  args: {
    ...HOST_ARG,
  },
  run: async (ctx) => {
    const wordUuid = getPositionals(ctx)[0]
    if (!wordUuid) {
      console.error("Error: uuid argument is required")
      console.error("Usage: voicevox dict delete <uuid>")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    try {
      await client.deleteUserDictWord(wordUuid)
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Deleted: ${wordUuid}`)
  },
})

const dictImportCommand = define({
  name: "import",
  description: "Import a user dictionary from a JSON file",
  args: {
    ...HOST_ARG,
    override: {
      type: "boolean" as const,
      short: "f",
      default: false,
      description: "Override existing dictionary entries",
    },
  },
  run: async (ctx) => {
    const file = getPositionals(ctx)[0]
    if (!file) {
      console.error("Error: file argument is required")
      console.error("Usage: voicevox dict import <file> [options]")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const override = ctx.values.override ?? false
    const client = new VoiceVoxClient(host)

    let dictData
    try {
      const raw = await readFile(file, "utf-8")
      dictData = JSON.parse(raw)
    } catch (err) {
      console.error(
        `Error: Failed to read file: ${err instanceof Error ? err.message : String(err)}`,
      )
      process.exit(1)
    }

    try {
      await client.importUserDict(dictData, override)
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Imported from: ${file}`)
  },
})

export const dictCommand = define({
  name: "dict",
  description: "Manage user dictionary",
  args: {
    ...HOST_ARG,
    json: {
      type: "boolean" as const,
      default: false,
      description: "Output as JSON",
    },
  },
  subCommands: {
    add: dictAddCommand,
    update: dictUpdateCommand,
    delete: dictDeleteCommand,
    import: dictImportCommand,
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const asJson = ctx.values.json ?? false
    const client = new VoiceVoxClient(host)

    let dict
    try {
      dict = await client.getUserDict()
    } catch (err) {
      handleCommandError(err, host)
    }

    if (asJson) {
      console.log(JSON.stringify(dict, null, 2))
      return
    }

    const entries = Object.entries(dict)
    if (entries.length === 0) {
      console.log("No words in user dictionary.")
      return
    }

    for (const [uuid, word] of entries) {
      console.log(`[${uuid}]`)
      console.log(`  surface:       ${word.surface}`)
      console.log(`  pronunciation: ${word.pronunciation}`)
      console.log(`  accent_type:   ${word.accent_type}`)
      console.log(`  word_type:     ${word.word_type}`)
      console.log(`  priority:      ${word.priority}`)
    }
  },
})
