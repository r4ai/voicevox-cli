import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const queryCommand = define({
  name: "query",
  description: "Get audio query JSON for text",
  args: {
    speaker: {
      type: "number",
      short: "s",
      default: 1,
      description: "Speaker ID",
    },
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
  },
  run: async (ctx) => {
    const text = ctx.positionals[0]
    if (!text) {
      console.error("Error: text argument is required")
      console.error("Usage: voicevox query <text> [options]")
      process.exit(1)
    }

    const speaker = ctx.values.speaker ?? 1
    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let query
    try {
      query = await client.createAudioQuery(text, speaker)
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(JSON.stringify(query, null, 2))
  },
})
