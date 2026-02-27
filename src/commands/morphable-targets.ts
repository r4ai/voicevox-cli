import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"

export const morphableTargetsCommand = define({
  name: "morphable-targets",
  description:
    "Show which styles can be used as morphing targets. Fetches style IDs from the engine and returns morphable target information.",
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
      return
    }

    const baseStyleIds = [
      ...new Set(speakers.flatMap((speaker) => speaker.styles.map((s) => s.id))),
    ]

    let results
    try {
      results = await client.getMorphableTargets(baseStyleIds)
    } catch (err) {
      handleCommandError(err, host)
      return
    }

    if (asJson) {
      console.log(
        JSON.stringify(
          {
            base_style_ids: baseStyleIds,
            targets: results,
          },
          null,
          2,
        ),
      )
      return
    }

    for (const [index, baseStyleId] of baseStyleIds.entries()) {
      console.log(`base style ${baseStyleId}:`)
      const targetMap = results[index] ?? {}
      for (const [styleId, info] of Object.entries(targetMap)) {
        const morphable = info.is_morphable ? "morphable" : "not morphable"
        console.log(`  style ${styleId}: ${morphable}`)
      }
    }
  },
})
