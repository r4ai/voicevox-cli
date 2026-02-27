import type {
  AccentPhrase,
  AudioQuery,
  EngineSetting,
  EngineManifest,
  FrameAudioQuery,
  MorphableTargetInfo,
  ParseKanaBadRequest,
  Preset,
  Score,
  Speaker,
  SpeakerInfo,
  SpeakerSupportPermittedSynthesisMorphing,
  SupportedDevices,
  UserDictWord,
} from "./types.js"

export class VoiceVoxClient {
  constructor(private readonly baseUrl: string) {}

  async getSpeakerInfo(
    speakerUuid: string,
    resourceFormat?: "base64" | "url",
  ): Promise<SpeakerInfo> {
    const url = new URL(`${this.baseUrl}/speaker_info`)
    url.searchParams.set("speaker_uuid", speakerUuid)
    if (resourceFormat) url.searchParams.set("resource_format", resourceFormat)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GET /speaker_info failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<SpeakerInfo>
  }

  async initializeSpeaker(speaker: number, skipReinit?: boolean): Promise<void> {
    const url = new URL(`${this.baseUrl}/initialize_speaker`)
    url.searchParams.set("speaker", String(speaker))
    if (skipReinit !== undefined) url.searchParams.set("skip_reinit", String(skipReinit))
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) throw new Error(`POST /initialize_speaker failed: ${res.status} ${res.statusText}`)
  }

  async isInitializedSpeaker(speaker: number): Promise<boolean> {
    const url = new URL(`${this.baseUrl}/is_initialized_speaker`)
    url.searchParams.set("speaker", String(speaker))
    const res = await fetch(url)
    if (!res.ok)
      throw new Error(`GET /is_initialized_speaker failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<boolean>
  }

  async getSpeakers(): Promise<Speaker[]> {
    const res = await fetch(`${this.baseUrl}/speakers`)
    if (!res.ok) throw new Error(`GET /speakers failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<Speaker[]>
  }

  async getVersion(): Promise<string> {
    const res = await fetch(`${this.baseUrl}/version`)
    if (!res.ok) throw new Error(`GET /version failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<string>
  }

  async createAudioQuery(text: string, speaker: number): Promise<AudioQuery> {
    const url = new URL(`${this.baseUrl}/audio_query`)
    url.searchParams.set("text", text)
    url.searchParams.set("speaker", String(speaker))
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) throw new Error(`POST /audio_query failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<AudioQuery>
  }

  async synthesize(query: AudioQuery, speaker: number): Promise<ArrayBuffer> {
    const url = new URL(`${this.baseUrl}/synthesis`)
    url.searchParams.set("speaker", String(speaker))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    })
    if (!res.ok) throw new Error(`POST /synthesis failed: ${res.status} ${res.statusText}`)
    return res.arrayBuffer()
  }

  async getUserDict(): Promise<Record<string, UserDictWord>> {
    const res = await fetch(`${this.baseUrl}/user_dict`)
    if (!res.ok) throw new Error(`GET /user_dict failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<Record<string, UserDictWord>>
  }

  async addUserDictWord(params: {
    surface: string
    pronunciation: string
    accent_type: number
    word_type?: string
    priority?: number
  }): Promise<string> {
    const url = new URL(`${this.baseUrl}/user_dict_word`)
    url.searchParams.set("surface", params.surface)
    url.searchParams.set("pronunciation", params.pronunciation)
    url.searchParams.set("accent_type", String(params.accent_type))
    if (params.word_type) url.searchParams.set("word_type", params.word_type)
    if (params.priority !== undefined) url.searchParams.set("priority", String(params.priority))
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) throw new Error(`POST /user_dict_word failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<string>
  }

  async updateUserDictWord(
    wordUuid: string,
    params: {
      surface: string
      pronunciation: string
      accent_type: number
      word_type?: string
      priority?: number
    },
  ): Promise<void> {
    const url = new URL(`${this.baseUrl}/user_dict_word/${wordUuid}`)
    url.searchParams.set("surface", params.surface)
    url.searchParams.set("pronunciation", params.pronunciation)
    url.searchParams.set("accent_type", String(params.accent_type))
    if (params.word_type) url.searchParams.set("word_type", params.word_type)
    if (params.priority !== undefined) url.searchParams.set("priority", String(params.priority))
    const res = await fetch(url, { method: "PUT" })
    if (!res.ok)
      throw new Error(`PUT /user_dict_word/${wordUuid} failed: ${res.status} ${res.statusText}`)
  }

  async deleteUserDictWord(wordUuid: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/user_dict_word/${wordUuid}`, { method: "DELETE" })
    if (!res.ok)
      throw new Error(`DELETE /user_dict_word/${wordUuid} failed: ${res.status} ${res.statusText}`)
  }

  async getAccentPhrases(text: string, speaker: number, isKana = false): Promise<AccentPhrase[]> {
    const url = new URL(`${this.baseUrl}/accent_phrases`)
    url.searchParams.set("text", text)
    url.searchParams.set("speaker", String(speaker))
    url.searchParams.set("is_kana", String(isKana))
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) throw new Error(`POST /accent_phrases failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<AccentPhrase[]>
  }

  async getMoraData(accentPhrases: AccentPhrase[], speaker: number): Promise<AccentPhrase[]> {
    const url = new URL(`${this.baseUrl}/mora_data`)
    url.searchParams.set("speaker", String(speaker))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accentPhrases),
    })
    if (!res.ok) throw new Error(`POST /mora_data failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<AccentPhrase[]>
  }

  async getMoraLength(accentPhrases: AccentPhrase[], speaker: number): Promise<AccentPhrase[]> {
    const url = new URL(`${this.baseUrl}/mora_length`)
    url.searchParams.set("speaker", String(speaker))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accentPhrases),
    })
    if (!res.ok) throw new Error(`POST /mora_length failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<AccentPhrase[]>
  }

  async getMoraPitch(accentPhrases: AccentPhrase[], speaker: number): Promise<AccentPhrase[]> {
    const url = new URL(`${this.baseUrl}/mora_pitch`)
    url.searchParams.set("speaker", String(speaker))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accentPhrases),
    })
    if (!res.ok) throw new Error(`POST /mora_pitch failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<AccentPhrase[]>
  }

  async getPresets(): Promise<Preset[]> {
    const res = await fetch(`${this.baseUrl}/presets`)
    if (!res.ok) throw new Error(`GET /presets failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<Preset[]>
  }

  async addPreset(preset: Omit<Preset, "id">): Promise<number> {
    const res = await fetch(`${this.baseUrl}/add_preset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preset),
    })
    if (!res.ok) throw new Error(`POST /add_preset failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<number>
  }

  async updatePreset(preset: Preset): Promise<number> {
    const res = await fetch(`${this.baseUrl}/update_preset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preset),
    })
    if (!res.ok) throw new Error(`POST /update_preset failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<number>
  }

  async deletePreset(presetId: number): Promise<void> {
    const url = new URL(`${this.baseUrl}/delete_preset`)
    url.searchParams.set("id", String(presetId))
    const res = await fetch(url, { method: "POST" })
    if (!res.ok) throw new Error(`POST /delete_preset failed: ${res.status} ${res.statusText}`)
  }

  async createAudioQueryFromPreset(text: string, presetId: number): Promise<AudioQuery> {
    const url = new URL(`${this.baseUrl}/audio_query_from_preset`)
    url.searchParams.set("text", text)
    url.searchParams.set("preset_id", String(presetId))
    const res = await fetch(url, { method: "POST" })
    if (!res.ok)
      throw new Error(`POST /audio_query_from_preset failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<AudioQuery>
  }

  async validateKana(text: string): Promise<true | ParseKanaBadRequest> {
    const url = new URL(`${this.baseUrl}/validate_kana`)
    url.searchParams.set("text", text)
    const res = await fetch(url, { method: "POST" })
    if (res.status === 200) return true
    if (res.status === 400) return res.json() as Promise<ParseKanaBadRequest>
    throw new Error(`POST /validate_kana failed: ${res.status} ${res.statusText}`)
  }

  async getMorphableTargets(
    coreVersionSpeakers: SpeakerSupportPermittedSynthesisMorphing[][],
  ): Promise<Record<string, MorphableTargetInfo>[]> {
    const res = await fetch(`${this.baseUrl}/morphable_targets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coreVersionSpeakers),
    })
    if (!res.ok) throw new Error(`POST /morphable_targets failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<Record<string, MorphableTargetInfo>[]>
  }

  async importUserDict(dictData: Record<string, UserDictWord>, override: boolean): Promise<void> {
    const url = new URL(`${this.baseUrl}/import_user_dict`)
    url.searchParams.set("override", String(override))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dictData),
    })
    if (!res.ok) throw new Error(`POST /import_user_dict failed: ${res.status} ${res.statusText}`)
  }

  async getEngineManifest(): Promise<EngineManifest> {
    const res = await fetch(`${this.baseUrl}/engine_manifest`)
    if (!res.ok) throw new Error(`GET /engine_manifest failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<EngineManifest>
  }

  async getCoreVersions(): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/core_versions`)
    if (!res.ok) throw new Error(`GET /core_versions failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<string[]>
  }

  async getSupportedDevices(): Promise<SupportedDevices> {
    const res = await fetch(`${this.baseUrl}/supported_devices`)
    if (!res.ok) throw new Error(`GET /supported_devices failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<SupportedDevices>
  }

  async getSetting(): Promise<EngineSetting> {
    const res = await fetch(`${this.baseUrl}/setting`)
    if (!res.ok) throw new Error(`GET /setting failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<EngineSetting>
  }

  async updateSetting(setting: EngineSetting): Promise<void> {
    const res = await fetch(`${this.baseUrl}/setting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(setting),
    })
    if (!res.ok) throw new Error(`POST /setting failed: ${res.status} ${res.statusText}`)
  }

  async getSingers(): Promise<Speaker[]> {
    const res = await fetch(`${this.baseUrl}/singers`)
    if (!res.ok) throw new Error(`GET /singers failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<Speaker[]>
  }

  async getSingerInfo(
    speakerUuid: string,
    resourceFormat?: "base64" | "url",
  ): Promise<SpeakerInfo> {
    const url = new URL(`${this.baseUrl}/singer_info`)
    url.searchParams.set("speaker_uuid", speakerUuid)
    if (resourceFormat) url.searchParams.set("resource_format", resourceFormat)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GET /singer_info failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<SpeakerInfo>
  }

  async createSingFrameAudioQuery(score: Score, singer: number): Promise<FrameAudioQuery> {
    const url = new URL(`${this.baseUrl}/sing_frame_audio_query`)
    url.searchParams.set("speaker", String(singer))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score),
    })
    if (!res.ok)
      throw new Error(`POST /sing_frame_audio_query failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<FrameAudioQuery>
  }

  async getSingFrameF0(score: Score, singer: number): Promise<number[]> {
    const url = new URL(`${this.baseUrl}/sing_frame_f0`)
    url.searchParams.set("speaker", String(singer))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(score),
    })
    if (!res.ok) throw new Error(`POST /sing_frame_f0 failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<number[]>
  }

  async getSingFrameVolume(
    score: Score,
    singer: number,
    query: FrameAudioQuery,
  ): Promise<number[]> {
    const url = new URL(`${this.baseUrl}/sing_frame_volume`)
    url.searchParams.set("speaker", String(singer))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, frame_audio_query: query }),
    })
    if (!res.ok) throw new Error(`POST /sing_frame_volume failed: ${res.status} ${res.statusText}`)
    return res.json() as Promise<number[]>
  }

  async frameSynthesis(query: FrameAudioQuery, singer: number): Promise<ArrayBuffer> {
    const url = new URL(`${this.baseUrl}/frame_synthesis`)
    url.searchParams.set("speaker", String(singer))
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    })
    if (!res.ok) throw new Error(`POST /frame_synthesis failed: ${res.status} ${res.statusText}`)
    return res.arrayBuffer()
  }
}
