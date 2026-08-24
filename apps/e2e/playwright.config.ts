import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

const AQUI = fileURLToPath(new URL(".", import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");

/**
 * PRD §17 — E2E adaptado ao que é testável no M3 (sem M4/M5): INCOMPLETO
 * → BLOQUEADO (R-07, tabela não aprovada) → LIBERADO (após aprovação) →
 * emissão real com stub honesto → trilha íntegra.
 */
export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5183",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter api run dev",
      cwd: RAIZ,
      url: "http://localhost:3000/healthz",
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "pnpm --filter web run dev",
      cwd: RAIZ,
      port: 5183,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
