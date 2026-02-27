import { define } from "gunshi"
import { handleCommandError } from "../error.js"
import { VoiceVoxClient } from "../voicevox/client.js"
import type { CorsPolicyMode } from "../voicevox/types.js"

const HOST_ARG = {
  host: {
    type: "string" as const,
    default: "http://localhost:50021",
    description: "VoiceVox engine URL",
  },
}

const settingSetCommand = define({
  name: "set",
  description: "Update engine setting",
  args: {
    ...HOST_ARG,
    "cors-policy-mode": {
      type: "string" as const,
      description: "CORS policy mode: localapps or all",
    },
    "allow-origin": {
      type: "string" as const,
      description: "Allowed origin (empty string to clear)",
    },
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const client = new VoiceVoxClient(host)

    let current
    try {
      current = await client.getSetting()
    } catch (err) {
      handleCommandError(err, host)
    }

    const corsPolicyMode = ctx.values["cors-policy-mode"] as CorsPolicyMode | undefined
    const allowOriginRaw = ctx.values["allow-origin"]

    const updated = {
      cors_policy_mode: corsPolicyMode ?? current.cors_policy_mode,
      allow_origin:
        allowOriginRaw !== undefined
          ? allowOriginRaw === ""
            ? null
            : allowOriginRaw
          : current.allow_origin,
    }

    try {
      await client.updateSetting(updated)
    } catch (err) {
      handleCommandError(err, host)
    }

    console.log("Updated setting:")
    console.log(`  cors_policy_mode: ${updated.cors_policy_mode}`)
    console.log(`  allow_origin:     ${updated.allow_origin ?? "(none)"}`)
  },
})

export const settingCommand = define({
  name: "setting",
  description: "Show or update engine setting",
  args: {
    ...HOST_ARG,
    json: {
      type: "boolean" as const,
      default: false,
      description: "Output as JSON",
    },
  },
  subCommands: {
    set: settingSetCommand,
  },
  run: async (ctx) => {
    const host = ctx.values.host ?? "http://localhost:50021"
    const asJson = ctx.values.json ?? false
    const client = new VoiceVoxClient(host)

    let setting
    try {
      setting = await client.getSetting()
    } catch (err) {
      handleCommandError(err, host)
    }

    if (asJson) {
      console.log(JSON.stringify(setting, null, 2))
      return
    }

    console.log(`cors_policy_mode: ${setting.cors_policy_mode}`)
    console.log(`allow_origin:     ${setting.allow_origin ?? "(none)"}`)
  },
})
