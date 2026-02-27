import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import type { EngineManifest, SupportedDevices } from "../voicevox/types.js"

export const infoCommand = define({
  name: "info",
  description: "Show engine manifest and supported devices",
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

    let manifest: EngineManifest
    let devices: SupportedDevices
    try {
      ;[manifest, devices] = await Promise.all([
        client.getEngineManifest(),
        client.getSupportedDevices(),
      ])
    } catch (err) {
      handleCommandError(err, host)
    }

    if (asJson) {
      console.log(JSON.stringify({ manifest, supported_devices: devices }, null, 2))
      return
    }

    console.log(`Engine: ${manifest.name} (${manifest.brand_name})`)
    console.log(`UUID: ${manifest.uuid}`)
    console.log(`URL: ${manifest.url}`)
    console.log(`Default sampling rate: ${manifest.default_sampling_rate} Hz`)
    console.log(`Frame rate: ${manifest.frame_rate} fps`)
    console.log("Supported devices:")
    console.log(`  CPU: ${devices.cpu}`)
    console.log(`  CUDA: ${devices.cuda}`)
    console.log(`  DirectML: ${devices.dml}`)
    console.log("Supported features:")
    for (const [feature, enabled] of Object.entries(manifest.supported_features)) {
      console.log(`  ${feature}: ${enabled}`)
    }
  },
})
