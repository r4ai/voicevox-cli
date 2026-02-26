import type { AudioQuery, Speaker } from "./types.js"

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
}
