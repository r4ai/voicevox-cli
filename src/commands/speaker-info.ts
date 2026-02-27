import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const speakerInfoCommand = define({
  name: "speaker-info",
  description: "Show detailed info for a speaker (policy, portrait, style icons)",
  args: {
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
    json: {
      type: "boolean",
      default: false,
      description: "Output as JSON",
    },
  },
  run: async (ctx) => {
    const uuid = ctx.positionals[0]
    if (!uuid) {
      console.error("Error: speaker UUID is required")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const asJson = ctx.values.json ?? false
    const client = new VoiceVoxClient(host)

    let info
    try {
      info = await client.getSpeakerInfo(uuid)
    } catch (err) {
      handleCommandError(err, host)
    }

    if (asJson) {
      console.log(JSON.stringify(info, null, 2))
      return
    }

    console.log(`Policy:\n${info.policy}`)
    console.log(`Styles:`)
    for (const style of info.style_infos) {
      console.log(`  - ID ${style.id}: ${style.voice_samples.length} voice sample(s)`)
    }
  },
})
