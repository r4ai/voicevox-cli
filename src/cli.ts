import { cli, define } from "gunshi"
import { accentPhrasesCommand } from "./commands/accent-phrases.js"
import { dictCommand } from "./commands/dict.js"
import { infoCommand } from "./commands/info.js"
import { initializeSpeakerCommand } from "./commands/initialize-speaker.js"
import { isInitializedSpeakerCommand } from "./commands/is-initialized-speaker.js"
import { mcpCommand } from "./commands/mcp.js"
import { morphableTargetsCommand } from "./commands/morphable-targets.js"
import { presetsCommand } from "./commands/presets.js"
import { queryCommand } from "./commands/query.js"
import { settingCommand } from "./commands/setting.js"
import { singersCommand } from "./commands/singers.js"
import { speakCommand } from "./commands/speak.js"
import { speakerInfoCommand } from "./commands/speaker-info.js"
import { speakersCommand } from "./commands/speakers.js"
import { validateKanaCommand } from "./commands/validate-kana.js"
import { versionCommand } from "./commands/version.js"

const entryCommand = define({
  name: "voicevox",
  description: "VoiceVox CLI — synthesize Japanese text to speech",
})

await cli(process.argv.slice(2), entryCommand, {
  name: "voicevox",
  version: process.env.PKG_VERSION ?? "0.0.0",
  description: "VoiceVox CLI — synthesize Japanese text to speech",
  renderHeader: null,
  subCommands: {
    speak: speakCommand,
    speakers: speakersCommand,
    singers: singersCommand,
    "speaker-info": speakerInfoCommand,
    "initialize-speaker": initializeSpeakerCommand,
    "is-initialized-speaker": isInitializedSpeakerCommand,
    query: queryCommand,
    "accent-phrases": accentPhrasesCommand,
    dict: dictCommand,
    presets: presetsCommand,
    "validate-kana": validateKanaCommand,
    "morphable-targets": morphableTargetsCommand,
    version: versionCommand,
    info: infoCommand,
    setting: settingCommand,
    mcp: mcpCommand,
  },
})
