import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/cli.ts"],
  format: ["esm"],
  target: "node22",
  clean: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  define: {
    "process.env.PKG_VERSION": JSON.stringify(process.env.npm_package_version ?? "0.1.0"),
  },
})
