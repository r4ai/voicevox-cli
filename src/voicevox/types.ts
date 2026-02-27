export interface Style {
  name: string
  id: number
  type?: string
}

export type PermittedSynthesisMorphing = "ALL" | "SELF_ONLY" | "NOTHING"

export interface SpeakerSupportedFeatures {
  permitted_synthesis_morphing: PermittedSynthesisMorphing
}

export interface Speaker {
  name: string
  speaker_uuid: string
  styles: Style[]
  version?: string
  supported_features?: SpeakerSupportedFeatures
}

export interface SpeakerSupportPermittedSynthesisMorphing {
  name: string
  speaker_uuid: string
  styles: Style[]
  version?: string
  supported_features: SpeakerSupportedFeatures
}

export interface MorphableTargetInfo {
  is_morphable: boolean
}

export interface ParseKanaBadRequest {
  error_name: string
  error_args: Record<string, unknown>
}

export interface Mora {
  text: string
  consonant?: string
  consonant_length?: number
  vowel: string
  vowel_length: number
  pitch: number
}

export interface AccentPhrase {
  moras: Mora[]
  accent: number
  pause_mora?: Mora | null
  is_interrogative?: boolean
}

export interface AudioQuery {
  accent_phrases: AccentPhrase[]
  speedScale: number
  pitchScale: number
  intonationScale: number
  volumeScale: number
  prePhonemeLength: number
  postPhonemeLength: number
  outputSamplingRate: number
  outputStereo: boolean
  kana?: string
}

export interface Preset {
  id: number
  name: string
  speaker_uuid: string
  style_id: number
  speedScale: number
  pitchScale: number
  intonationScale: number
  volumeScale: number
  prePhonemeLength: number
  postPhonemeLength: number
}

export type WordType = "PROPER_NOUN" | "COMMON_NOUN" | "VERB" | "ADJECTIVE" | "SUFFIX"

export interface UserDictWord {
  surface: string
  pronunciation: string
  accent_type: number
  word_type: WordType
  priority: number
  mora_count?: number
}
