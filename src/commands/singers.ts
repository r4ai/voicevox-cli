import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const singersCommand = define({
  name: "singers",
  description: "List available singers for song synthesis",
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

    let singers
    try {
      singers = await client.getSingers()
    } catch (err) {
      handleCommandError(err, host)
      return
    }

    if (asJson) {
      console.log(JSON.stringify(singers, null, 2))
      return
    }

    for (const singer of singers) {
      const versionStr = singer.version ? ` v${singer.version}` : ""
      console.log(`${singer.name}${versionStr} (uuid: ${singer.speaker_uuid})`)
      for (const style of singer.styles) {
        console.log(`  - [${style.id}] ${style.name}`)
      }
    }
  },
})
