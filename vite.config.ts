import path from "node:path"
import { fileURLToPath } from "node:url"

import { cloudflare } from "@cloudflare/vite-plugin"
import { devtools } from "@tanstack/devtools-vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import tailwindcss from "@tailwindcss/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteTsConfigPaths from "vite-tsconfig-paths"

const projectRoot = path.dirname(fileURLToPath(import.meta.url))
const cloudflareTarget = process.env.MERIDIAN_CLOUDFLARE === "1"
const sqliteClientPath = path.join(projectRoot, "src/server/db/client.sqlite.ts")
const sqliteClientStub = path.join(projectRoot, "src/server/db/client.sqlite.stub.ts")
const d1ClientPath = path.join(projectRoot, "src/server/db/client.d1.ts")
const d1ClientStub = path.join(projectRoot, "src/server/db/client.d1.stub.ts")

const DB_D1_MODULE = "@meridian/db-d1"
const DB_SQLITE_MODULE = "@meridian/db-sqlite"

const config = defineConfig({
  define: {
    "process.env.MERIDIAN_DB_DRIVER": JSON.stringify(
      process.env.MERIDIAN_DB_DRIVER ?? "sqlite",
    ),
  },
  plugins: [
    devtools(),
    ...(cloudflareTarget
      ? [cloudflare({ viteEnvironment: { name: "ssr" } })]
      : []),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
  resolve: {
    alias: [
      {
        find: DB_D1_MODULE,
        replacement: cloudflareTarget ? d1ClientPath : d1ClientStub,
      },
      {
        find: DB_SQLITE_MODULE,
        replacement: cloudflareTarget ? sqliteClientStub : sqliteClientPath,
      },
    ],
  },
})

export default config
