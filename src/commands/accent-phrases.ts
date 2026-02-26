import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const accentPhrasesCommand = define({
  name: "accent-phrases",
  description: "Get accent phrases JSON for text",
  args: {
    speaker: {
      type: "number",
      short: "s",
      default: 1,
      description: "Speaker ID",
    },
    "is-kana": {
      type: "boolean",
      default: false,
      description: "Whether text is in kana",
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
      console.error("Usage: voicevox accent-phrases <text> [options]")
      process.exit(1)
    }

    const speaker = ctx.values.speaker ?? 1
    const isKana = ctx.values["is-kana"] ?? false
    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let accentPhrases
    try {
      accentPhrases = await client.getAccentPhrases(text, speaker, isKana)
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(JSON.stringify(accentPhrases, null, 2))
  },
})
