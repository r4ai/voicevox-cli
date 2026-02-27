import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import type { SpeakerSupportPermittedSynthesisMorphing } from "../voicevox/types.js"

export const morphableTargetsCommand = define({
  name: "morphable-targets",
  description:
    "Show which styles can be used as morphing targets. Fetches speakers from the engine and returns morphable target information.",
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

    let speakers
    try {
      speakers = await client.getSpeakers()
    } catch (err) {
      handleCommandError(err, host)
    }

    const speakersWithFeatures: SpeakerSupportPermittedSynthesisMorphing[] = speakers.map((s) => ({
      name: s.name,
      speaker_uuid: s.speaker_uuid,
      styles: s.styles,
      version: s.version,
      supported_features: s.supported_features ?? { permitted_synthesis_morphing: "ALL" as const },
    }))

    let results
    try {
      results = await client.getMorphableTargets([speakersWithFeatures])
    } catch (err) {
      handleCommandError(err, host)
    }

    if (asJson) {
      console.log(JSON.stringify(results, null, 2))
      return
    }

    const targetMap = results[0] ?? {}
    for (const [styleId, info] of Object.entries(targetMap)) {
      const morphable = info.is_morphable ? "morphable" : "not morphable"
      console.log(`  style ${styleId}: ${morphable}`)
    }
  },
})
