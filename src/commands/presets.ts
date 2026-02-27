import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import { getPositionals } from "./positionals.js"

const HOST_ARG = {
  host: {
    type: "string" as const,
    default: "http://localhost:50021",
    description: "VoiceVox engine URL",
  },
}

const presetsAddCommand = define({
  name: "add",
  description: "Add a preset",
  args: {
    ...HOST_ARG,
    name: {
      type: "string" as const,
      short: "n",
      description: "Preset name",
    },
    "speaker-uuid": {
      type: "string" as const,
      short: "u",
      description: "Speaker UUID",
    },
    "style-id": {
      type: "number" as const,
      short: "s",
      default: 0,
      description: "Style ID",
    },
    speed: {
      type: "number" as const,
      default: 1.0,
      description: "Speed scale",
    },
    pitch: {
      type: "number" as const,
      default: 0.0,
      description: "Pitch scale",
    },
    intonation: {
      type: "number" as const,
      default: 1.0,
      description: "Intonation scale",
    },
    volume: {
      type: "number" as const,
      default: 1.0,
      description: "Volume scale",
    },
    "pre-phoneme-length": {
      type: "number" as const,
      default: 0.1,
      description: "Pre-phoneme length",
    },
    "post-phoneme-length": {
      type: "number" as const,
      default: 0.1,
      description: "Post-phoneme length",
    },
  },
  run: async (ctx) => {
    const name = ctx.values.name
    const speakerUuid = ctx.values["speaker-uuid"]
    if (!name || !speakerUuid) {
      console.error("Error: --name and --speaker-uuid are required")
      console.error("Usage: voicevox presets add --name <name> --speaker-uuid <uuid> [options]")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let id
    try {
      id = await client.addPreset({
        name,
        speaker_uuid: speakerUuid,
        style_id: ctx.values["style-id"] ?? 0,
        speedScale: ctx.values.speed ?? 1.0,
        pitchScale: ctx.values.pitch ?? 0.0,
        intonationScale: ctx.values.intonation ?? 1.0,
        volumeScale: ctx.values.volume ?? 1.0,
        prePhonemeLength: ctx.values["pre-phoneme-length"] ?? 0.1,
        postPhonemeLength: ctx.values["post-phoneme-length"] ?? 0.1,
      })
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Added preset: id=${id}`)
  },
})

const presetsUpdateCommand = define({
  name: "update",
  description: "Update a preset",
  args: {
    ...HOST_ARG,
    name: {
      type: "string" as const,
      short: "n",
      description: "Preset name",
    },
    "speaker-uuid": {
      type: "string" as const,
      short: "u",
      description: "Speaker UUID",
    },
    "style-id": {
      type: "number" as const,
      short: "s",
      description: "Style ID",
    },
    speed: {
      type: "number" as const,
      description: "Speed scale",
    },
    pitch: {
      type: "number" as const,
      description: "Pitch scale",
    },
    intonation: {
      type: "number" as const,
      description: "Intonation scale",
    },
    volume: {
      type: "number" as const,
      description: "Volume scale",
    },
    "pre-phoneme-length": {
      type: "number" as const,
      description: "Pre-phoneme length",
    },
    "post-phoneme-length": {
      type: "number" as const,
      description: "Post-phoneme length",
    },
  },
  run: async (ctx) => {
    const idStr = getPositionals(ctx)[0]
    if (!idStr) {
      console.error("Error: id argument is required")
      console.error("Usage: voicevox presets update <id> [options]")
      process.exit(1)
    }
    const id = Number(idStr)

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let presets
    try {
      presets = await client.getPresets()
    } catch (err) {
      handleCommandError(err, host)
    }

    const existing = presets.find((p) => p.id === id)
    if (!existing) {
      console.error(`Error: preset with id ${id} not found`)
      process.exit(1)
    }

    try {
      await client.updatePreset({
        id,
        name: ctx.values.name ?? existing.name,
        speaker_uuid: ctx.values["speaker-uuid"] ?? existing.speaker_uuid,
        style_id: ctx.values["style-id"] ?? existing.style_id,
        speedScale: ctx.values.speed ?? existing.speedScale,
        pitchScale: ctx.values.pitch ?? existing.pitchScale,
        intonationScale: ctx.values.intonation ?? existing.intonationScale,
        volumeScale: ctx.values.volume ?? existing.volumeScale,
        prePhonemeLength: ctx.values["pre-phoneme-length"] ?? existing.prePhonemeLength,
        postPhonemeLength: ctx.values["post-phoneme-length"] ?? existing.postPhonemeLength,
      })
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Updated preset: id=${id}`)
  },
})

const presetsDeleteCommand = define({
  name: "delete",
  description: "Delete a preset",
  args: {
    ...HOST_ARG,
  },
  run: async (ctx) => {
    const idStr = getPositionals(ctx)[0]
    if (!idStr) {
      console.error("Error: id argument is required")
      console.error("Usage: voicevox presets delete <id>")
      process.exit(1)
    }
    const id = Number(idStr)

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    try {
      await client.deletePreset(id)
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log(`Deleted preset: id=${id}`)
  },
})

export const presetsCommand = define({
  name: "presets",
  description: "Manage presets",
  args: {
    ...HOST_ARG,
    json: {
      type: "boolean" as const,
      default: false,
      description: "Output as JSON",
    },
  },
  subCommands: {
    add: presetsAddCommand,
    update: presetsUpdateCommand,
    delete: presetsDeleteCommand,
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const asJson = ctx.values.json ?? false
    const client = new VoiceVoxClient(host)

    let presets
    try {
      presets = await client.getPresets()
    } catch (err) {
      handleCommandError(err, host)
    }

    if (asJson) {
      console.log(JSON.stringify(presets, null, 2))
      return
    }

    if (presets.length === 0) {
      console.log("No presets.")
      return
    }

    for (const preset of presets) {
      console.log(`[${preset.id}] ${preset.name}`)
      console.log(`  speaker_uuid:       ${preset.speaker_uuid}`)
      console.log(`  style_id:           ${preset.style_id}`)
      console.log(`  speedScale:         ${preset.speedScale}`)
      console.log(`  pitchScale:         ${preset.pitchScale}`)
      console.log(`  intonationScale:    ${preset.intonationScale}`)
      console.log(`  volumeScale:        ${preset.volumeScale}`)
      console.log(`  prePhonemeLength:   ${preset.prePhonemeLength}`)
      console.log(`  postPhonemeLength:  ${preset.postPhonemeLength}`)
    }
  },
})
