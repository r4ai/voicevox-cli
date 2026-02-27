import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import { getPositionals } from "./positionals.js"

export const validateKanaCommand = define({
  name: "validate-kana",
  description: "Validate whether text follows AquesTalk-style kana notation",
  args: {
    host: {
      type: "string",
      default: "http://localhost:50021",
      description: "VoiceVox engine URL",
    },
  },
  run: async (ctx) => {
    const text = getPositionals(ctx)[0]
    if (!text) {
      console.error("Error: text argument is required")
      console.error("Usage: voicevox validate-kana <text>")
      process.exit(1)
    }

    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let result
    try {
      result = await client.validateKana(text)
    } catch (err) {
      handleCommandError(err, host)
    }

    if (result === true) {
      console.log("Valid AquesTalk-style kana notation.")
    } else {
      console.error(`Invalid kana: ${result.error_name}`)
      console.error(JSON.stringify(result.error_args, null, 2))
      process.exit(1)
    }
  },
})
