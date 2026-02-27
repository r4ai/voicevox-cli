interface Context {
  positionals: string[]
  commandPath?: string[]
}

export function getPositionals(ctx: Context): string[] {
  const offset = ctx.commandPath?.length ?? 0
  return ctx.positionals.slice(offset)
}
