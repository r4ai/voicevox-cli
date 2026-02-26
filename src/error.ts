export function handleCommandError(err: unknown, host: string): never {
  const cause = err instanceof Error ? (err.cause as NodeJS.ErrnoException | undefined) : undefined
  if (cause?.code === "ECONNREFUSED") {
    console.error(`Error: Cannot connect to VoiceVox Engine at ${host}`)
    console.error("Make sure VoiceVox Engine is running.")
  } else {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`)
  }
  process.exit(1)
}
