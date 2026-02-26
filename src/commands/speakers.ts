import { define } from "gunshi"
import { VoiceVoxClient } from "../voicevox/client.js"

export const speakersCommand = define({
  name: "speakers",
  description: "List available speakers",
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
    const host = ctx.values.host ?? "http://localhost:50021"
    const asJson = ctx.values.json ?? false
    const client = new VoiceVoxClient(host)
    const speakers = await client.getSpeakers()

    if (asJson) {
      console.log(JSON.stringify(speakers, null, 2))
      return
    }

    for (const speaker of speakers) {
      console.log(`${speaker.name} (uuid: ${speaker.speaker_uuid})`)
      for (const style of speaker.styles) {
        console.log(`  - [${style.id}] ${style.name}`)
      }
    }
  },
})
