import { execSync } from "node:child_process"
import { writeFile } from "node:fs/promises"
import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const speakCommand = define({
  name: "speak",
  description: "Synthesize text to speech and save to a WAV file",
  args: {
    speaker: {
      type: "number",
      short: "s",
      default: 1,
      description: "Speaker ID",
    },
    output: {
      type: "string",
      short: "o",
      default: "output.wav",
      description: "Output WAV file path",
    },
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
    play: {
      type: "boolean",
      short: "p",
      default: false,
      description: "Play audio after synthesis",
    },
    preset: {
      type: "number",
      description: "Preset ID (use preset instead of --speaker)",
    },
  },
  run: async (ctx) => {
    const text = ctx.positionals[0]
    if (!text) {
      console.error("Error: text argument is required")
      console.error("Usage: voicevox speak <text> [options]")
      process.exit(1)
    }

    const speaker = ctx.values.speaker ?? 1
    const output = ctx.values.output ?? "output.wav"
    const host = ctx.values.host ?? "http://localhost:50021"
    const shouldPlay = ctx.values.play ?? false
    const presetId = ctx.values.preset

    const client = new VoiceVoxClient(host)

    let wav
    try {
      if (presetId !== undefined) {
        const presets = await client.getPresets()
        const preset = presets.find((p) => p.id === presetId)
        if (!preset) {
          console.error(`Error: preset with id ${presetId} not found`)
          process.exit(1)
        }
        const query = await client.createAudioQueryFromPreset(text, presetId)
        wav = await client.synthesize(query, preset.style_id)
      } else {
        const query = await client.createAudioQuery(text, speaker)
        wav = await client.synthesize(query, speaker)
      }
    } catch (err) {
      handleCommandError(err, host)
    }

    await writeFile(output, Buffer.from(wav))
    console.log(`Saved: ${output}`)

    if (shouldPlay) {
      const player =
        process.platform === "darwin" ? "afplay" : process.platform === "win32" ? "start" : "aplay"
      execSync(`${player} "${output}"`)
    }
  },
})
