import { cli, define } from "gunshi"
import { accentPhrasesCommand } from "./commands/accent-phrases.js"
import { dictCommand } from "./commands/dict.js"
import { mcpCommand } from "./commands/mcp.js"
import { presetsCommand } from "./commands/presets.js"
import { queryCommand } from "./commands/query.js"
import { speakCommand } from "./commands/speak.js"
import { speakersCommand } from "./commands/speakers.js"

const entryCommand = define({
  name: "voicevox",
  description: "VoiceVox CLI — synthesize Japanese text to speech",
})

await cli(process.argv.slice(2), entryCommand, {
  name: "voicevox",
  version: process.env.PKG_VERSION ?? "0.0.0",
  description: "VoiceVox CLI — synthesize Japanese text to speech",
  subCommands: {
    speak: speakCommand,
    speakers: speakersCommand,
    query: queryCommand,
    "accent-phrases": accentPhrasesCommand,
    dict: dictCommand,
    presets: presetsCommand,
    mcp: mcpCommand,
  },
})
