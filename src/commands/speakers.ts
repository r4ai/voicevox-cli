import { define } from "gunshi"
import { handleCommandError } from "../error.js"
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
    info: {
      type: "boolean",
      default: false,
      description: "Show extended info (version, morphing support, style type)",
    },
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const asJson = ctx.values.json ?? false
    const showInfo = ctx.values.info ?? false
    const client = new VoiceVoxClient(host)

    let speakers
    try {
      speakers = await client.getSpeakers()
    } catch (err) {
      handleCommandError(err, host)
      return
    }

    if (asJson) {
      console.log(JSON.stringify(speakers, null, 2))
      return
    }

    for (const speaker of speakers) {
      const versionStr = showInfo && speaker.version ? ` v${speaker.version}` : ""
      console.log(`${speaker.name}${versionStr} (uuid: ${speaker.speaker_uuid})`)
      if (showInfo && speaker.supported_features) {
        console.log(`  morphing: ${speaker.supported_features.permitted_synthesis_morphing}`)
      }
      for (const style of speaker.styles) {
        const typeStr = showInfo && style.type ? ` [${style.type}]` : ""
        console.log(`  - [${style.id}] ${style.name}${typeStr}`)
      }
    }
  },
})
