import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import { getPositionals } from "./positionals.js"

export const initializeSpeakerCommand = define({
  name: "initialize-speaker",
  description: "Initialize a speaker (load voice model into memory before synthesis)",
  args: {
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
    "skip-reinit": {
      type: "boolean",
      default: false,
      description: "Skip re-initialization if already initialized",
    },
  },
  run: async (ctx) => {
    const speakerStr = getPositionals(ctx)[0]
    if (!speakerStr) {
      console.error("Error: speaker ID is required")
      process.exit(1)
    }

    const speaker = Number(speakerStr)
    if (!Number.isInteger(speaker)) {
      console.error("Error: speaker ID must be an integer")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const skipReinit = ctx.values["skip-reinit"] ?? false
    const client = new VoiceVoxClient(host)

    try {
      await client.initializeSpeaker(speaker, skipReinit || undefined)
    } catch (err) {
      handleCommandError(err, host)
      return
    }

    console.log(`Speaker ${speaker} initialized.`)
  },
})
