import type { AccentPhrase, AudioQuery, Speaker, UserDictWord } from "./types.js"

export class VoiceVoxClient {
  constructor(private readonly baseUrl: string) {}

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
      throw new Error(
        `DELETE /user_dict_word/${wordUuid} failed: ${res.status} ${res.statusText}`,
      )
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
}
