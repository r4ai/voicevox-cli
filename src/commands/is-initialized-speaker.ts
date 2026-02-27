import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const isInitializedSpeakerCommand = define({
  name: "is-initialized-speaker",
  description: "Check whether a speaker is initialized (voice model loaded)",
  args: {
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
  },
  run: async (ctx) => {
    const speakerStr = ctx.positionals[0]
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
    const client = new VoiceVoxClient(host)

    let result
    try {
      result = await client.isInitializedSpeaker(speaker)
    } catch (err) {
      handleCommandError(err, host)
      return
    }

    console.log(String(result))
  },
})
