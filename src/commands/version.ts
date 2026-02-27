import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const versionCommand = define({
  name: "version",
  description: "Show engine version and available core versions",
  args: {
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let engineVersion: string
    let coreVersions: string[]
    try {
      ;[engineVersion, coreVersions] = await Promise.all([
        client.getVersion(),
        client.getCoreVersions(),
      ])
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Engine version: ${engineVersion}`)
    console.log(`Core versions: ${coreVersions.join(", ")}`)
  },
})
