import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.ts"],
    setupFiles: ["./test/integration/setup.ts"],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    // Evita corrida acidental entre arquivos de teste que não seja a do
    // teste de concorrência proposital (cadeia é por escola, mas cada
    // arquivo cria/apaga suas próprias escolas de teste via pool migrador).
    fileParallelism: false,
  },
});
