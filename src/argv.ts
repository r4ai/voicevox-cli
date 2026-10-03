import type { Command } from "gunshi"

/** Bind option values before Gunshi resolves nested command names. */
export function normalizeCliArgs(argv: string[], commands: Record<string, Command>): string[] {
  const valueOptions = new Map<string, { name: string; type: string }>()
  let subCommands: Record<string, Command> | Map<string, Command> = commands
  let routing = true

  const result: string[] = []
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i]
    if (token === "--") {
      result.push(...argv.slice(i))
      break
    }
    if (routing && !token.startsWith("-")) {
      const command: Command | undefined =
        subCommands instanceof Map ? subCommands.get(token) : subCommands[token]
      if (command) {
        valueOptions.clear()
        for (const [name, schema] of Object.entries(command.args ?? {})) {
          if (schema.type !== "string" && schema.type !== "number") continue
          const option = { name, type: schema.type }
          valueOptions.set(`--${name}`, option)
          if (schema.short) valueOptions.set(`-${schema.short}`, option)
        }
        subCommands = (command.subCommands ?? {}) as Record<string, Command>
      } else {
        routing = false
      }
    }
    const option = valueOptions.get(token)
    const next = argv[i + 1]
    if (
      option &&
      next !== undefined &&
      (!next.startsWith("-") || (option.type === "number" && /^-\d/.test(next)))
    ) {
      result.push(`--${option.name}=${next}`)
      i++
    } else {
      result.push(token)
    }
  }
  return result
}
